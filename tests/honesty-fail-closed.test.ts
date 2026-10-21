import assert from "node:assert/strict";
import { test } from "node:test";
import { AlgorithmBenchmarkUnavailableError, AlgorithmBenchmarker } from "../server/engineering/cse/algorithm-benchmarker.ts";
import { ModelEvaluationUnavailableError, ModelEvaluator } from "../server/engineering/ml/model-evaluator.ts";
import { MlPipelineService, MlTrainingUnavailableError } from "../server/engineering/ml/ml-pipeline.service.ts";
import { AgentTrainingUnavailableError, MasterTrainer } from "../server/training/master/master-trainer.ts";

test("ML training reports unavailable instead of returning synthetic metrics", async () => {
  await assert.rejects(
    MlPipelineService.trainModel({
      modelName: "test-model",
      taskType: "classification",
      epochs: 1,
      batchSize: 1,
      learningRate: 0.001,
      features: ["input"],
      targetLabel: "label",
    }),
    (error: unknown) => error instanceof MlTrainingUnavailableError && error.code === "ML_TRAINING_UNAVAILABLE",
  );
});

test("model evaluation reports unavailable without a model artifact and dataset", () => {
  assert.throws(
    () => ModelEvaluator.evaluateModel("missing-model"),
    (error: unknown) => error instanceof ModelEvaluationUnavailableError && error.code === "MODEL_EVALUATION_UNAVAILABLE",
  );
});

test("algorithm benchmark reports unavailable instead of returning fabricated measurements", () => {
  assert.throws(
    () => AlgorithmBenchmarker.runBenchmark("quick_sort", 100),
    (error: unknown) => error instanceof AlgorithmBenchmarkUnavailableError && error.code === "ALGORITHM_BENCHMARK_UNAVAILABLE",
  );
});

test("agent training reports unavailable without modifying capability state", async () => {
  await assert.rejects(
    new MasterTrainer().train("test-agent"),
    (error: unknown) => error instanceof AgentTrainingUnavailableError && error.code === "AGENT_TRAINING_UNAVAILABLE",
  );
});
