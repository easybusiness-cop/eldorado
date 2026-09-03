import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { MlPipelineService } from './ml-pipeline.service.ts';
import { ModelEvaluator } from './model-evaluator.ts';
import { VectorDatabaseService } from './vector-database.service.ts';
import { DatasetManager } from './dataset-manager.ts';

export const trainMlModelTool = createTool({
  id: 'train_ml_model',
  description: 'Train a machine learning model or fine-tune LLM parameters on target features',
  inputSchema: z.object({
    modelName: z.string().describe('Name of the model being trained'),
    taskType: z.enum(['classification', 'regression', 'embedding', 'llm_tuning']),
    epochs: z.number().default(10),
    batchSize: z.number().default(32),
    learningRate: z.number().default(0.001),
    features: z.array(z.string()).describe('List of input feature columns'),
    targetLabel: z.string().describe('Target classification label or regression output'),
  }),
  execute: async ({ modelName, taskType, epochs, batchSize, learningRate, features, targetLabel }) => {
    return await MlPipelineService.trainModel({
      modelName,
      taskType,
      epochs,
      batchSize,
      learningRate,
      features,
      targetLabel,
    });
  },
});

export const evaluateModelTool = createTool({
  id: 'evaluate_ml_model',
  description: 'Evaluate a trained model against validation/test benchmark dataset',
  inputSchema: z.object({
    modelId: z.string().describe('ID of the target model'),
    testDatasetSize: z.number().default(500),
  }),
  execute: async ({ modelId, testDatasetSize }) => {
    return ModelEvaluator.evaluateModel(modelId, testDatasetSize);
  },
});

export const ingestVectorDocumentTool = createTool({
  id: 'ingest_vector_document',
  description: 'Ingest text document into semantic RAG vector embeddings database',
  inputSchema: z.object({
    documentId: z.string().describe('Unique ID for the document'),
    content: z.string().describe('Text content to chunk and embed'),
  }),
  execute: async ({ documentId, content }) => {
    const chunks = await VectorDatabaseService.ingestDocument(documentId, content);
    return {
      success: true,
      chunksIngested: chunks.length,
      totalVectorStoreSize: VectorDatabaseService.getStoreCount(),
    };
  },
});

export const queryVectorStoreTool = createTool({
  id: 'query_vector_store',
  description: 'Perform semantic cosine similarity search over vector store',
  inputSchema: z.object({
    query: z.string().describe('Natural language search query'),
    topK: z.number().default(3),
  }),
  execute: async ({ query, topK }) => {
    const results = await VectorDatabaseService.searchSimilar(query, topK);
    return {
      query,
      topK,
      results,
    };
  },
});

export const generateDatasetSplitTool = createTool({
  id: 'generate_dataset_split',
  description: 'Generate synthetic machine learning dataset and perform train/validation/test split',
  inputSchema: z.object({
    datasetName: z.string().describe('Name of dataset'),
    recordCount: z.number().default(100),
    trainRatio: z.number().default(0.8),
  }),
  execute: async ({ datasetName, recordCount, trainRatio }) => {
    const dataset = DatasetManager.generateSyntheticDataset(datasetName, recordCount);
    const split = DatasetManager.createSplit(dataset, trainRatio);
    return {
      datasetName,
      splitStats: split.stats,
      sampleTrainRecord: split.train[0],
    };
  },
});
