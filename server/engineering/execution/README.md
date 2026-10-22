# Rufflo coding runtimes

Rufflo remains the control plane. The Engineering Manager, Backend Engineer,
Frontend Engineer, DevOps Engineer, and QA Engineer can call
`engineering.run_code_task`; they choose exactly one coding engine for a task.
The runtime writes only to a disposable clone of the configured Git repository.
Rufflo returns a bounded patch and the agent's summary; it does not apply the
patch to the working repository, push a branch, or claim verification.

The task workspace manager uses `RUFFLO_CODING_REPOSITORY_ROOT` (default:
Rufflo's current Git repository) and creates:

```text
<runtime-visible-root>/<sha256(organizationId)>/<random-task-id>
```

The clone is detached from the source branch and has no `origin` remote. It is
removed after the diff has been collected. Uncommitted changes in the source
checkout are not included in a task clone.

## Install pinned software

From PowerShell at the repository root:

```powershell
./workers/openhands/install.ps1
```

This runs `npm ci`, installs OpenHands Agent Server, SDK, tools, and workspace
packages from the pinned Python lock, then checks the installed versions.
When Docker is installed, the script also builds the OpenCode worker image and
prepares the pinned OpenHands images. This workspace currently has no Docker
Engine or WSL, so it can install the libraries and CLI but cannot start the
isolated task containers.

The npm lock pins `opencode-ai` and `@opencode-ai/sdk` at `1.19.4`.
`workers/opencode/Dockerfile` builds the per-task worker image
`rufflo/opencode-worker:1.19.4`. The OpenHands Python dependency versions are
pinned in `workers/openhands/requirements.txt` and the transitive lock is
`workers/openhands/requirements.lock.txt`.

## OpenHands Agent Server

The adapter checks `/server_info` and refuses to execute unless the server
reports `conversation_runtime: "docker"`. Configure the outer Agent Server
with:

```text
OH_SESSION_API_KEYS_0=<strong stable random key>
OH_SECRET_KEY=<separate stable 256-bit random secret>
OH_CONVERSATION_RUNTIME=docker
OH_CONVERSATION_IMAGE=ghcr.io/openhands/agent-server:1.55.1-python
OH_CONVERSATION_CONTAINER_MEMORY=4g
OH_CONVERSATION_CONTAINER_CPUS=2
OH_CONVERSATION_CONTAINER_PIDS_LIMIT=512
```

Set `OPENHANDS_SESSION_API_KEY` in Rufflo to the same value as
`OH_SESSION_API_KEYS_0`. The outer Agent Server needs access to a dedicated
Docker Engine because OpenHands provisions one container per conversation.
Use an isolated Engine or VM for this workload. Do not expose its unauthenticated
Docker API, mount a general-purpose host Docker socket into tenant-facing code,
or expose the OpenHands HTTP API publicly. Bind the API to a private interface
and require its session API key.

Workspace configuration in Rufflo:

- `OPENHANDS_WORKSPACE_HOST_ROOT`: absolute checkout root as seen by the Rufflo
  process.
- `OPENHANDS_WORKSPACE_ROOT`: same shared volume's absolute path as seen by the
  outer OpenHands Agent Server. Mount the shared workspace volume at this same
  path in the OpenHands controller and Docker Engine that provisions
  conversations.
- `OPENHANDS_WORKSPACE_ISOLATION=per-task-container`: required marker; in
  addition, `/server_info` must confirm the real Docker runtime.
- `OPENHANDS_AGENT_SERVER_URL`: private authenticated Agent Server URL.
- `OPENHANDS_MODEL`: model string accepted by OpenHands, for example
  `google/gemini-2.5-flash`.
- `OPENHANDS_LLM_API_KEY`: optional key if the Agent Server does not use a
  configured provider profile.
- `OPENHANDS_LLM_BASE_URL`: optional compatible provider endpoint.
- `OPENHANDS_MAX_ITERATIONS`: optional run limit (default 100).

The adapter starts a conversation with the official `LocalWorkspace` request
shape, polls its terminal state, and collects the diff through the Agent Server
Git endpoints. OpenHands' Docker runtime then mounts only the specified task
checkout into that conversation's container. Each checkout is isolated from
other tasks at the filesystem level.

## OpenCode

Rufflo builds and starts a fresh OpenCode worker container per task. The worker
receives only that task's checkout at `/workspace`; it has no Docker socket,
credentials files, or access to the Rufflo checkout. The adapter sets container
CPU, memory, and PID limits, drops Linux capabilities, uses a read-only root
filesystem, and removes the worker on completion, timeout, or cancellation.

Configure Rufflo with:

- `OPENCODE_WORKSPACE_ROOT`: absolute writable root for disposable checkout
  directories.
- `OPENCODE_WORKSPACE_ISOLATION=per-task-container`.
- `OPENCODE_WORKER_IMAGE=rufflo/opencode-worker:1.19.4`.
- `OPENCODE_DOCKER_NETWORK`: an existing private network with operator-managed
  egress controls. The adapter rejects Docker's `host`, `bridge`, and `none`
  networks. Network membership itself is not an egress policy; configure the
  Docker host/firewall to allow model-provider traffic only.
- `OPENCODE_MODEL`: required `provider/model` selection.
- `OPENCODE_PROVIDER_API_KEY`: optional credential for the selected provider.
  When unset for Rufflo's default Google model, the adapter reuses
  `GOOGLE_GENERATIVE_AI_API_KEY`, `GEMINI_API_KEY`, or
  `OPENHANDS_LLM_API_KEY` (in that order).
- `OPENCODE_CONTAINER_MEMORY`, `OPENCODE_CONTAINER_CPUS`, and
  `OPENCODE_CONTAINER_PIDS_LIMIT`: optional worker limits.

Only the selected provider API key is passed to the task container. It is not
placed in the image, task
prompt, project files, or returned result. The worker process can still read
the provider key it needs for inference, so restrict network egress and use
short-lived or budget-limited provider credentials where possible.

The Docker CLI used by Rufflo must reach the dedicated Engine and its published
loopback ports. Running the Node server inside a container may require a
deployment-specific port gateway; do not change the worker to publish its API
on every host interface to make that connection work.

## Agent access and verification

- The Mastra coding tool accepts only an authenticated organization context;
  `POST /api/agents/:id/execute` and the runtime health route require
  `task:run`.
- Agent tool input cannot set Docker options, volume mounts, runtime URLs, API
  credentials, or another organization's filesystem path.
- The runtime result always sets `verified: false`. A completed session and a
  diff are not proof that tests pass.
- The caller receives a patch; the disposable checkout is cleaned up after
  collection. Rufflo does not apply it automatically to the live checkout.
- Independent QA should apply the patch in a separate review workspace and run
  the repository's actual lint, tests, and build before any human-approved
  merge or deployment.
- `GET /api/v2/engineering/runtimes` reports authenticated runtime health for
  callers with `task:run`.
