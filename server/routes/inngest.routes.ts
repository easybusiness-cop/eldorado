import { Router } from 'express';
import { serve } from 'inngest/express';
import { inngest } from '../inngest/client.ts';
import { inngestFunctions } from '../inngest/functions.ts';

export const inngestRouter = Router();

// Inngest's handler verifies signed production requests. Fail closed rather
// than exposing an unsigned function endpoint if the signing key is absent.
inngestRouter.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !process.env.INNGEST_SIGNING_KEY) {
    return res.status(503).json({
      success: false,
      error: 'INNGEST_SIGNING_KEY is required to receive production workflow events.',
    });
  }
  next();
});

inngestRouter.use(serve({ client: inngest, functions: inngestFunctions }));
