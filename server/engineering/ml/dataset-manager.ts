export interface DatasetRecord {
  id: string;
  features: Record<string, any>;
  label: string;
}

export interface DatasetSplit {
  train: DatasetRecord[];
  validation: DatasetRecord[];
  test: DatasetRecord[];
  stats: {
    totalRecords: number;
    trainRatio: number;
    valRatio: number;
    testRatio: number;
    featureCount: number;
  };
}

export class DatasetManager {
  public static generateSyntheticDataset(name: string, count = 100): DatasetRecord[] {
    const dataset: DatasetRecord[] = [];
    const labels = ['class_a', 'class_b', 'class_c'];

    for (let i = 0; i < count; i++) {
      const featureA = Number((Math.random() * 100).toFixed(2));
      const featureB = Number((Math.random() * 50).toFixed(2));
      const featureC = Math.random() > 0.5 ? 1 : 0;
      const label = labels[Math.floor(Math.random() * labels.length)];

      dataset.push({
        id: `ds-${name}-${i + 1}`,
        features: { featureA, featureB, featureC },
        label,
      });
    }

    return dataset;
  }

  public static createSplit(data: DatasetRecord[], trainRatio = 0.8, valRatio = 0.1): DatasetSplit {
    const shuffled = [...data].sort(() => 0.5 - Math.random());
    const total = shuffled.length;
    const trainCount = Math.floor(total * trainRatio);
    const valCount = Math.floor(total * valRatio);

    const train = shuffled.slice(0, trainCount);
    const validation = shuffled.slice(trainCount, trainCount + valCount);
    const test = shuffled.slice(trainCount + valCount);

    const sampleFeatures = data[0] ? Object.keys(data[0].features).length : 0;

    return {
      train,
      validation,
      test,
      stats: {
        totalRecords: total,
        trainRatio,
        valRatio,
        testRatio: Number((1 - trainRatio - valRatio).toFixed(2)),
        featureCount: sampleFeatures,
      },
    };
  }
}
