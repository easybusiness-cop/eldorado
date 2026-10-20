# Rufflo Model Development Plan

## Current status

Rufflo does not currently contain a trained-from-scratch foundation model, a dataset-backed training runtime, or a reproducible model-evaluation pipeline. The ML training, model evaluation, agent certification, algorithm benchmark, and quantum-evaluation endpoints now report unavailable instead of returning synthetic success metrics. Chat and task-planning responses require a configured real provider, but a model response alone does not execute work or prove correctness.

This document is a feasibility and implementation plan, not evidence that training has started. Compute capacity, budget, training data, and data rights have not been provided or verified.

## Define a measurable first model

“Know everything” is not a trainable acceptance criterion. Models can be useful specialists, but no model can guarantee complete or always-current knowledge. Start with a bounded target, for example:

- **Task:** repository-aware TypeScript coding assistant.
- **Users:** Rufflo developers.
- **Inputs:** approved repository snapshots, task instructions, and explicitly licensed coding material.
- **Outputs:** code proposals and explanations; file edits and command execution remain separate, permissioned tools.
- **Evaluation:** held-out tasks with executable tests, security checks, and human-reviewed quality criteria.

The first milestone should be a small experimental model whose performance can be measured. General-purpose reasoning and broad world knowledge would require substantially more data, compute, evaluation, and safety work.

## Decisions and inputs required

Before choosing model size or scheduling a training run, collect:

1. **Compute:** accelerator make/model, accelerator count, per-device VRAM, host RAM, local disk bandwidth/capacity, and whether machines can be reserved for multi-day runs.
2. **Budget and operations:** maximum spend, target completion window, electricity/cloud constraints, and who will maintain checkpoints and training jobs.
3. **Data:** corpus inventory, size, languages, provenance, license/consent, exclusions, retention rules, and whether any proprietary or personal data is present.
4. **Product target:** coding languages, supported repository size, context length, latency target, deployment hardware, and intended number of concurrent users.
5. **Risk controls:** allowed tool permissions, human-approval boundaries, prohibited outputs, threat model, and incident response owner.

No training data should be collected, uploaded, or used until its rights and handling requirements are reviewed.

## Proposed work phases

### 1. Requirements and data governance

- Define the target task and quantitative acceptance thresholds.
- Inventory data sources and record provenance, license, consent, and permitted use.
- Remove secrets, personal data, malware, duplicate material, and content outside the approved scope.
- Produce deterministic train/validation/test splits. Keep the test set isolated from training and prompt tuning.
- Record dataset versions and hashes so results can be reproduced.

**Gate:** no-go if data rights, privacy handling, or a credible evaluation set are unresolved.

### 2. Baseline and architecture

- Establish a non-trained baseline using existing approved tooling, measured on the same held-out tests.
- Select tokenizer, model architecture, parameter count, context length, and precision only after compute inventory and throughput tests.
- For genuine from-scratch training, initialize new weights and train a tokenizer/model on approved data. Fine-tuning or prompting a downloaded model is not “training from scratch.”
- Implement checkpointing, resumable jobs, deterministic configuration capture, resource monitoring, and failure recovery.

**Planning estimate:** dense-transformer training compute is often approximated as roughly `6 × parameter_count × training_token_count` floating-point operations. This is only a rough compute model; it is not a wall-clock estimate. Measure achieved throughput on the actual hardware before committing to a schedule.

### 3. Training pipeline

- Build versioned preprocessing and deduplication jobs with auditable logs.
- Add data-quality tests, tokenization checks, and a small end-to-end dry run.
- Run a short pilot and verify loss behavior, checkpoint restore, and hardware stability before scaling.
- Track training loss and validation loss; stop on divergence, data leakage, rights violations, or unsafe regressions.
- Store checkpoints in access-controlled storage and do not deploy them automatically.

**Gate:** the pilot must resume successfully and produce repeatable validation results before a larger run is authorized.

### 4. Evaluation and release

- Evaluate on held-out coding tasks, exact unit/integration tests, language coverage, robustness, latency, memory use, and security regressions.
- Compare against the measured baseline; do not convert model self-reports into accuracy or safety metrics.
- Require independent review of benchmark design, data leakage controls, and release artifacts.
- Publish model card, dataset manifest, training configuration, known limitations, and rollback procedure.
- Release behind an explicit version and approval gate. Keep tool permissions separate from model weights.

**Gate:** no production release unless predeclared thresholds pass and test evidence can be reproduced from stored artifacts.

## Rufflo integration requirements

The application must keep these concepts distinct:

- **Model response:** text returned by an available provider.
- **Proposal:** suggested task plan or code that has not been applied.
- **Tool execution:** a specific operation with structured inputs, result, exit/error status, and provenance.
- **Verified completion:** a task whose required operations and checks completed and whose evidence was persisted.

An unavailable provider, malformed output, failed command, missing evidence, or incomplete approval must never be converted into a completed task. Model-generated plans must not directly execute arbitrary terminal commands or apply code. External side effects require explicit authorization and auditable execution results.

## Current configuration and blockers

- `GEMINI_API_KEY` enables the Gemini provider; `GEMINI_MODEL` selects the requested model. Verify the selected model is available to the configured account before use.
- Ollama must be installed, running, and reachable for its provider to be used.
- When no real provider can generate a response, the model router returns an unavailable error.
- Current training/evaluation endpoints deliberately return blocked/unavailable responses because there is no dataset-backed runtime or evidence store.
- No GPU inventory, licensed training corpus, training budget, or model target has been confirmed.

