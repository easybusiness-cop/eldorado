import { Router } from "express";
import {
  selfImprovementEngine,
  type ImprovementProposal,
} from "../core/learning/self-improvement.engine.ts";

export const evolutionRouter = Router();

evolutionRouter.post("/evaluate", async (req, res) => {
  try {
    const proposal = req.body as ImprovementProposal;

    const promotable = selfImprovementEngine.canPromote(proposal);

    return res.json({
      success: true,
      promotable,
      proposalId: proposal.id,
      status: promotable ? "APPROVED" : "REJECTED",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);

    return res.status(400).json({
      success: false,
      error: message,
    });
  }
});

export default evolutionRouter;
