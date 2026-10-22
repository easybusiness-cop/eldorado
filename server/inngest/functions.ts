import { getSupabaseAdmin } from '../../src/utils/supabaseAdmin.ts';
import { VectorDatabaseService } from '../engineering/ml/vector-database.service.ts';
import { inngest } from './client.ts';

type IndexEvent = {
  jobId: string;
  organizationId: string;
  documentKey: string;
};

export const indexKnowledgeDocument = inngest.createFunction(
  {
    id: 'index-knowledge-document',
    retries: 2,
    concurrency: { limit: 1, key: 'event.data.documentKey' },
    triggers: [{ event: 'rufflo/knowledge.index.requested' }],
  },
  async ({ event, step }) => {
    const { jobId, organizationId } = event.data as IndexEvent;
    const supabase = getSupabaseAdmin();

    const current = await supabase
      .from('knowledge_ingestion_jobs')
      .select('status')
      .eq('id', jobId)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (current.error) throw new Error(`Could not load knowledge job: ${current.error.message}`);
    if (!current.data) throw new Error('Knowledge ingestion job was not found for this organization.');
    if (current.data.status === 'completed') return { jobId, status: 'completed' };

    const startedAt = new Date().toISOString();
    const started = await step.run('mark-job-running', async () => {
      const result = await supabase
        .from('knowledge_ingestion_jobs')
        .update({ status: 'running', started_at: startedAt, error: null })
        .eq('id', jobId)
        .eq('organization_id', organizationId)
        .neq('status', 'completed')
        .select('id')
        .maybeSingle();
      if (result.error) throw new Error(`Could not start knowledge job: ${result.error.message}`);
      return Boolean(result.data);
    });

    if (!started) return { jobId, status: 'completed' };

    try {
      // The event and step result contain IDs and counts only. Document text is
      // loaded inside the step and is never returned to Inngest's event store.
      const chunksIngested = await step.run('embed-and-upsert-document', async () => {
        const { data: job, error } = await supabase
          .from('knowledge_ingestion_jobs')
          .select('document_id, document_content, metadata')
          .eq('id', jobId)
          .eq('organization_id', organizationId)
          .single();

        if (error || !job) {
          throw new Error(`Could not load knowledge document: ${error?.message || 'job payload is missing'}`);
        }
        if (!job.document_content) throw new Error('Knowledge document content is unavailable.');

        const chunks = await VectorDatabaseService.ingestDocument(
          organizationId,
          job.document_id,
          job.document_content,
          job.metadata ?? {},
        );
        return chunks.length;
      });

      await step.run('mark-job-completed', async () => {
        const { error } = await supabase
          .from('knowledge_ingestion_jobs')
          .update({
            status: 'completed',
            chunks_ingested: chunksIngested,
            document_content: null,
            completed_at: new Date().toISOString(),
            error: null,
          })
          .eq('id', jobId)
          .eq('organization_id', organizationId);
        if (error) throw new Error(`Could not complete knowledge job: ${error.message}`);
      });

      return { jobId, status: 'completed', chunksIngested };
    } catch (error: any) {
      const message = String(error?.message || error).slice(0, 1000);
      await step.run('mark-job-failed', async () => {
        const { error: updateError } = await supabase
          .from('knowledge_ingestion_jobs')
          .update({ status: 'failed', error: message, completed_at: new Date().toISOString() })
          .eq('id', jobId)
          .eq('organization_id', organizationId)
          .neq('status', 'completed');
        if (updateError) throw new Error(`Could not record knowledge job failure: ${updateError.message}`);
      });
      throw error;
    }
  },
);

export const inngestFunctions = [indexKnowledgeDocument];
