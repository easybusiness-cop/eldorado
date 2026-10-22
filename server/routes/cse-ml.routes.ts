import { Router } from 'express';
import { MlPipelineService, MlTrainingUnavailableError } from '../engineering/ml/ml-pipeline.service.ts';
import { ModelEvaluationUnavailableError, ModelEvaluator } from '../engineering/ml/model-evaluator.ts';
import { VectorDatabaseService } from '../engineering/ml/vector-database.service.ts';
import { DatasetManager } from '../engineering/ml/dataset-manager.ts';
import { AlgorithmBenchmarkUnavailableError, AlgorithmBenchmarker } from '../engineering/cse/algorithm-benchmarker.ts';

export const cseMlRouter = Router();

// POST /api/v2/engineering/algorithm/benchmark - Run algorithm time & space complexity benchmark
cseMlRouter.post('/engineering/algorithm/benchmark', (req, res) => {
  try {
    const { algorithm = 'quick_sort', inputSize = 10000 } = req.body;
    const report = AlgorithmBenchmarker.runBenchmark(algorithm as any, Number(inputSize));
    res.json({ success: true, report });
  } catch (err: any) {
    if (err instanceof AlgorithmBenchmarkUnavailableError) {
      return res.status(501).json({ success: false, status: 'blocked', code: err.code, error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// MACHINE LEARNING ENGINEERING (ML) ROUTES
// ==========================================

// POST /api/v2/ml/train - Run Machine Learning Model Training pipeline
cseMlRouter.post('/ml/train', async (req, res) => {
  try {
    const {
      modelName = 'Gemini-Classifier-V1',
      taskType = 'classification',
      epochs = 5,
      batchSize = 32,
      learningRate = 0.001,
      features = ['input_embeddings', 'attention_weights', 'user_context'],
      targetLabel = 'intent_category',
    } = req.body;

    const result = await MlPipelineService.trainModel({
      modelName,
      taskType,
      epochs: Number(epochs),
      batchSize: Number(batchSize),
      learningRate: Number(learningRate),
      features,
      targetLabel,
    });

    res.json({ success: true, training: result });
  } catch (err: any) {
    if (err instanceof MlTrainingUnavailableError) {
      return res.status(501).json({ success: false, status: 'blocked', code: err.code, error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v2/ml/evaluate - Evaluate model accuracy, drift & confusion matrix
cseMlRouter.post('/ml/evaluate', (req, res) => {
  try {
    const { modelId = 'ml-model-v1', testDatasetSize = 500 } = req.body;
    const report = ModelEvaluator.evaluateModel(modelId, Number(testDatasetSize));
    res.json({ success: true, evaluation: report });
  } catch (err: any) {
    if (err instanceof ModelEvaluationUnavailableError) {
      return res.status(501).json({ success: false, status: 'blocked', code: err.code, error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v2/ml/vector/ingest - Ingest document into semantic RAG vector store
cseMlRouter.post('/ml/vector/ingest', async (req, res) => {
  try {
    const { documentId = `doc-${Date.now()}`, content, metadata = {} } = req.body;
    if (!content) return res.status(400).json({ error: 'content is required' });
    const organizationId = (req as any).identity?.organizationId;
    if (!organizationId) return res.status(401).json({ error: 'Authenticated organization context is required.' });

    const chunks = await VectorDatabaseService.ingestDocument(organizationId, documentId, content, metadata);
    res.json({
      success: true,
      documentId,
      chunksIngested: chunks.length,
      storage: 'supabase-pgvector',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v2/ml/vector/search - Perform semantic cosine search
cseMlRouter.post('/ml/vector/search', async (req, res) => {
  try {
    const { query, topK = 3 } = req.body;
    if (!query) return res.status(400).json({ error: 'query is required' });
    const organizationId = (req as any).identity?.organizationId;
    if (!organizationId) return res.status(401).json({ error: 'Authenticated organization context is required.' });

    const results = await VectorDatabaseService.searchSimilar(organizationId, query, Number(topK));
    res.json({ success: true, query, results });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v2/ml/dataset/split - Generate synthetic ML dataset and split
cseMlRouter.post('/ml/dataset/split', (req, res) => {
  try {
    const { datasetName = 'customer_churn_v1', recordCount = 100, trainRatio = 0.8 } = req.body;
    const dataset = DatasetManager.generateSyntheticDataset(datasetName, Number(recordCount));
    const split = DatasetManager.createSplit(dataset, Number(trainRatio));

    res.json({
      success: true,
      datasetName,
      stats: split.stats,
      trainSample: split.train.slice(0, 3),
      valSample: split.validation.slice(0, 3),
      testSample: split.test.slice(0, 3),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
