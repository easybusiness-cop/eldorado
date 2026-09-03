// Safe Supabase client stub / fallback
export const supabase = {
  from: (table: string) => ({
    select: (columns: string = '*') => ({
      order: (col: string, options?: { ascending?: boolean }) => ({
        limit: (n: number) => {
          // Return safe default analytics data if table is queried
          if (table === 'active_tasks') {
            return Promise.resolve({
              data: [
                { id: 't-1', department: 'Engineering', status: 'completed', title: 'Automated CI/CD Fix', created_at: new Date().toISOString() },
                { id: 't-2', department: 'Product', status: 'completed', title: 'Roadmap Generation', created_at: new Date().toISOString() },
                { id: 't-3', department: 'Operations', status: 'in_progress', title: 'Fleet Health Audit', created_at: new Date().toISOString() },
                { id: 't-4', department: 'Marketing', status: 'completed', title: 'Social Campaign Launch', created_at: new Date().toISOString() },
              ],
              error: null,
            });
          }
          if (table === 'agent_logs') {
            return Promise.resolve({
              data: [
                { id: 'l-1', agent: 'CTO Agent', message: 'Optimized compute resource allocations', level: 'info', created_at: new Date().toISOString() },
                { id: 'l-2', agent: 'CEO Agent', message: 'Executed executive synchronization protocol', level: 'info', created_at: new Date().toISOString() },
                { id: 'l-3', agent: 'Bug Hunter', message: 'Scanned repository for security vulnerabilities', level: 'info', created_at: new Date().toISOString() },
              ],
              error: null,
            });
          }
          return Promise.resolve({ data: [], error: null });
        }
      })
    })
  })
};
