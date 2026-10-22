export class AlgorithmBenchmarkUnavailableError extends Error {
  readonly code = 'ALGORITHM_BENCHMARK_UNAVAILABLE';

  constructor() {
    super('No benchmark implementations or reproducible measurement harness are configured; no benchmark was run.');
    this.name = 'AlgorithmBenchmarkUnavailableError';
  }
}

export class AlgorithmBenchmarker {
  public static runBenchmark(
    _algorithm: 'quick_sort' | 'binary_search' | 'hash_map_lookup' | 'graph_bfs' | 'dynamic_programming_knapsack',
    _inputSize = 10_000,
  ): never {
    throw new AlgorithmBenchmarkUnavailableError();
  }
}
