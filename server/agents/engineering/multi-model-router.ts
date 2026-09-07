import { modelRouter } from '../../ai/models/model-router.ts';

export class MultiModelRouter {
  async routeTask(task: any) {
    return await modelRouter.routeTask(task);
  }
}

export const multiModelRouter = new MultiModelRouter();

