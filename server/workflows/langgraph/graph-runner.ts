export interface GraphNode {
  id: string;
  name: string;
  run: (state: Record<string, any>) => Promise<Record<string, any>>;
}

export interface GraphEdge {
  from: string;
  to: string;
  condition?: (state: Record<string, any>) => boolean;
}

export class StatefulGraphRunner {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: GraphEdge[] = [];
  private entryNodeId: string = '';

  public addNode(node: GraphNode): this {
    this.nodes.set(node.id, node);
    if (!this.entryNodeId) {
      this.entryNodeId = node.id;
    }
    return this;
  }

  public addEdge(from: string, to: string, condition?: (state: Record<string, any>) => boolean): this {
    this.edges.push({ from, to, condition });
    return this;
  }

  public async run(initialState: Record<string, any> = {}): Promise<Record<string, any>> {
    let currentState = { ...initialState };
    let currentNodeId: string | null = this.entryNodeId;
    let stepCount = 0;
    const maxSteps = 50;

    while (currentNodeId && stepCount < maxSteps) {
      stepCount++;
      const node = this.nodes.get(currentNodeId);
      if (!node) break;

      currentState = await node.run(currentState);

      // Find next edge
      const candidateEdges = this.edges.filter(e => e.from === currentNodeId);
      let nextNodeId: string | null = null;
      for (const edge of candidateEdges) {
        if (!edge.condition || edge.condition(currentState)) {
          nextNodeId = edge.to;
          break;
        }
      }
      currentNodeId = nextNodeId;
    }

    return currentState;
  }
}
