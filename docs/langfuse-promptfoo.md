# Langfuse tracing and Promptfoo evaluations

Rufflo can optionally send model-provider generation observations to Langfuse and run a small grounding-focused Promptfoo evaluation against a local Ollama model. These integrations are separate: Promptfoo validation is local and does not require Langfuse credentials.

## Dependencies

The application dependency set needs:

- `@langfuse/tracing`
- `@langfuse/otel`
- `@opentelemetry/sdk-node`
- `promptfoo` as a development dependency for the evaluation CLI

Use matching Langfuse SDK package majors. The current Langfuse JS/TS SDK v6 supports Node.js 22+, which matches the repository's Docker runtime. No Langfuse client package is needed for this tracing-only integration.

## Langfuse setup

Create a Langfuse project, then configure its keys in the server environment:

```text
LANGFUSE_TRACING_ENABLED=true
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
```

For a non-default region or self-hosted instance, also set `LANGFUSE_BASE_URL` to its base URL. Tracing remains off unless `LANGFUSE_TRACING_ENABLED` is explicitly `true`, and missing keys cause the router to continue without tracing.

By default, observations include provider/model metadata, token usage when the provider returns it, and a generic failure status. Prompts, system instructions, and model responses are omitted. Capturing that content requires a separate explicit opt-in:

```text
LANGFUSE_CAPTURE_CONTENT=true
```

Only enable content capture when the data sent through the model is permitted to leave the application. The capture flag records the complete input and output for each provider attempt, including calls that are later followed by a fallback provider.

The server host should call `shutdownLangfuseTracing()` during graceful shutdown to flush buffered observations. The helper exposes this function, but the current model-router integration does not bind it to a process signal handler.

## Promptfoo setup and usage

The starter suite in `evals/rufflo-quality/tests.yaml` contains four deterministic checks: arithmetic, citation of supplied evidence, explicit uncertainty when evidence is missing, and disclosure of conflicting sources. It runs against `ollama:chat:llama3.2`, matching the application's default local Ollama model. No cloud API key is required.

Start Ollama, ensure `llama3.2` is available (`ollama pull llama3.2` if needed), then run:

```sh
npx promptfoo validate config -c promptfooconfig.yaml
npx promptfoo eval -c promptfooconfig.yaml
```

Configuration validation checks the YAML and referenced test data without calling a model or requiring provider credentials. The evaluation itself calls the local Ollama server at `OLLAMA_BASE_URL` (default `http://localhost:11434`) and fails with a provider/model connection error if the server or model is unavailable. It does not silently substitute canned model outputs or assign a pass score when inference cannot run.

These cases are a small regression starter set, not a broad quality benchmark. Add reviewed examples from real Rufflo workflows and expected evidence before treating aggregate scores as a release gate.

## References

- [Langfuse TypeScript instrumentation](https://langfuse.com/docs/observability/sdk/instrumentation)
- [Langfuse JS/TS SDK overview](https://langfuse.com/docs/observability/sdk/overview)
- [Promptfoo configuration guide](https://www.promptfoo.dev/docs/configuration/guide/)
- [Promptfoo Ollama provider](https://www.promptfoo.dev/docs/providers/ollama/)
