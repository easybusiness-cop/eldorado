import React, { useState, useEffect } from 'react';
import { Database, Search, Activity, RefreshCw } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

interface CompanyDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CompanyDatabaseModal({ isOpen, onClose }: CompanyDatabaseModalProps) {
  const [activeTab, setActiveTab] = useState<'tasks' | 'logs'>('tasks');
  const [tasks, setTasks] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'tasks') {
        const { data, error } = await supabase
          .from('active_tasks')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);
        if (error) throw error;
        setTasks(data || []);
      } else {
        const { data, error } = await supabase
          .from('agent_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);
        if (error) throw error;
        setLogs(data || []);
      }
    } catch (err) {
      console.error('Error fetching Supabase data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ width: '900px', maxWidth: '95vw', height: '80vh' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Database className="modal-icon" size={24} style={{ color: '#3b82f6' }} />
            <div>
              <h2>Company Database (Supabase)</h2>
              <div className="modal-subtitle">Live permanent memory and active agent records</div>
            </div>
          </div>
          <button className="icon-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 70px)', padding: 0 }}>
          
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '0 20px', background: 'rgba(0,0,0,0.2)' }}>
            <button 
              onClick={() => setActiveTab('tasks')}
              style={{ 
                padding: '16px 20px', background: 'none', border: 'none', color: activeTab === 'tasks' ? '#fff' : '#888',
                borderBottom: activeTab === 'tasks' ? '2px solid #3b82f6' : '2px solid transparent', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600
              }}>
              <Activity size={16} /> Active Tasks
            </button>
            <button 
              onClick={() => setActiveTab('logs')}
              style={{ 
                padding: '16px 20px', background: 'none', border: 'none', color: activeTab === 'logs' ? '#fff' : '#888',
                borderBottom: activeTab === 'logs' ? '2px solid #3b82f6' : '2px solid transparent', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600
              }}>
              <Database size={16} /> Agent Logs
            </button>
            
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
               <button onClick={fetchData} className="secondary-button" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px' }}>
                 <RefreshCw size={14} className={loading ? 'spinning' : ''} /> Refresh Data
               </button>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: '#0a0a0a' }}>
            {loading ? (
               <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Querying Supabase...</div>
            ) : activeTab === 'tasks' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {tasks.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#888', border: '1px dashed #333', borderRadius: '8px' }}>
                    No tasks found in Supabase. Assign a task in an Agent Workstation first!
                  </div>
                ) : tasks.map((task) => (
                  <div key={task.id} style={{ background: '#111', border: '1px solid #222', borderRadius: '8px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <h4 style={{ margin: 0, color: '#fff', fontSize: '15px' }}>{task.title}</h4>
                      <span style={{ fontSize: '12px', background: '#1c1c1c', padding: '2px 8px', borderRadius: '12px', border: '1px solid #333' }}>
                        {task.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#888', marginBottom: '12px' }}>{task.description}</div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#666' }}>
                      <span><strong>Assigned To:</strong> {task.assigned_to}</span>
                      <span><strong>Department:</strong> {task.department}</span>
                      <span><strong>Created:</strong> {new Date(task.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {logs.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#888', border: '1px dashed #333', borderRadius: '8px' }}>
                    No logs found. Run a workflow first.
                  </div>
                ) : logs.map((log) => (
                  <div key={log.id} style={{ background: '#111', border: '1px solid #222', borderRadius: '8px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <h4 style={{ margin: 0, color: '#4ade80', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        [{log.action}] {log.agent_name}
                      </h4>
                      <span style={{ fontSize: '12px', color: '#666' }}>{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#bbb', background: '#000', padding: '12px', borderRadius: '6px', border: '1px solid #1a1a1a', fontFamily: 'monospace', whiteSpace: 'pre-wrap', maxHeight: '200px', overflowY: 'auto' }}>
                      {JSON.stringify(log.details, null, 2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
