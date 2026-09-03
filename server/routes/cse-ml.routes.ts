import { Router } from 'express';
import { MlPipelineService } from '../engineering/ml/ml-pipeline.service.ts';
import { ModelEvaluator } from '../engineering/ml/model-evaluator.ts';
import { VectorDatabaseService } from '../engineering/ml/vector-database.service.ts';
import { DatasetManager } from '../engineering/ml/dataset-manager.ts';
import { CseCurriculumRunner } from '../engineering/cse/cse-curriculum-runner.ts';
import { AlgorithmBenchmarker } from '../engineering/cse/algorithm-benchmarker.ts';
import { CseSpecializationService } from '../engineering/cse/cse-specialization.service.ts';
import { CSE_TRAINING_LEVELS, CSE_SPECIALIZATION_SPECS, generateInitialTrainingRecord } from '../../src/constants/cseCurriculum.ts';

export const cseMlRouter = Router();

// ==========================================
// COMPUTER SCIENCE ENGINEERING (CSE) ROUTES
// ==========================================

// GET /api/v2/cse/curriculum - Returns CSE curriculum levels and specialization tracks
cseMlRouter.get('/cse/curriculum', (req, res) => {
  res.json({
    success: true,
    levels: CSE_TRAINING_LEVELS,
    specializations: CSE_SPECIALIZATION_SPECS,
  });
});

// POST /api/v2/cse/assess - Run CSE competency challenge assessment for an agent
cseMlRouter.post('/cse/assess', async (req, res) => {
  try {
    const { agentId = 'ruflo-coder', targetLevel = 1, currentRecord } = req.body;
    const baseRecord = currentRecord || generateInitialTrainingRecord('Software Engineer', 'eng');
    const result = await CseCurriculumRunner.assessAgent(agentId, Number(targetLevel), baseRecord);
    res.json({ success: true, assessment: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v2/cse/benchmark - Run algorithm time & space complexity benchmark
cseMlRouter.post('/cse/benchmark', (req, res) => {
  try {
    const { algorithm = 'quick_sort', inputSize = 10000 } = req.body;
    const report = AlgorithmBenchmarker.runBenchmark(algorithm as any, Number(inputSize));
    res.json({ success: true, report });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/v2/cse/specializations/:specId - Inspect specialization details
cseMlRouter.get('/cse/specializations/:specId', (req, res) => {
  const spec = CseSpecializationService.getSpecialization(req.params.specId);
  if (!spec) return res.status(404).json({ error: 'Specialization not found' });
  res.json({ success: true, specialization: spec });
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
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v2/ml/vector/ingest - Ingest document into semantic RAG vector store
cseMlRouter.post('/ml/vector/ingest', async (req, res) => {
  try {
    const { documentId = `doc-${Date.now()}`, content, metadata = {} } = req.body;
    if (!content) return res.status(400).json({ error: 'content is required' });

    const chunks = await VectorDatabaseService.ingestDocument(documentId, content, metadata);
    res.json({
      success: true,
      documentId,
      chunksIngested: chunks.length,
      totalVectorStoreCount: VectorDatabaseService.getStoreCount(),
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

    const results = await VectorDatabaseService.searchSimilar(query, Number(topK));
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
