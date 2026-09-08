import { CascadeRunData } from '../components/ExecutiveSummaryModal';

/**
 * Automatically generates a summarized Markdown document from an executed Corporate Cascade Run.
 * It synthesizes all tier activities (CEO, Executive/COO, Departments, Tasks, and Metrics).
 */
export const generateExecutiveSummaryMarkdown = (run: CascadeRunData): string => {
  if (!run) return '';

  const timestamp = run.startedAt ? new Date(run.startedAt).toLocaleString() : new Date().toLocaleString();
  const completedTimestamp = run.completedAt ? new Date(run.completedAt).toLocaleString() : new Date().toLocaleString();

  let md = `# EXECUTIVE OPERATIONS REPORT: AUTONOMOUS CASCADE SEQUENCE\n\n`;
  
  md += `> **Report Metadata**\n`;
  md += `> - **Cascade Sequence ID**: \`${run.id || 'N/A'}\`\n`;
  md += `> - **Initiation Timestamp**: ${timestamp}\n`;
  md += `> - **Completion Timestamp**: ${completedTimestamp}\n`;
  md += `> - **Global Operational Status**: \`${run.status?.toUpperCase() || 'COMPLETED'}\`\n\n`;

  md += `---\n\n`;

  // Original User Directive
  md += `## 📥 OPERATOR COMMAND INPUT\n\n`;
  md += `> "${run.userCommand || 'No command entered.'}"\n\n`;

  // CEO Directive Section
  if (run.ceoDirective) {
    md += `## 👑 TIER 1: CEO DISPATCH & STRATEGIC MANDATE\n\n`;
    md += `* **Executive Dispatcher**: **${run.ceoDirective.agentName || 'Michael Scott'}** (Chief Executive Officer)\n`;
    md += `* **Mandate Priority Level**: \`${run.ceoDirective.priority?.toUpperCase() || 'HIGH'}\`\n\n`;
    md += `### CEO Address to the Fleet:\n`;
    md += `> "${run.ceoDirective.speech || 'All right, everybody, listen up. We need to focus. Directives are flowing down.'}"\n\n`;
    md += `### Executed Command Breakdown:\n`;
    md += `* **Formulated Corporate Mandate**: ${run.ceoDirective.mandate || 'Execute task allocations concurrently.'}\n\n`;
  }

  // Executive Plan / COO Section
  if (run.executivePlan) {
    md += `## 💼 TIER 2: COO DECONSTRUCTION & WORKFORCE DISPATCH\n\n`;
    md += `* **Strategic planner**: **${run.executivePlan.agentName || 'Dwight Schrute'}** (Assistant to the Regional Manager / COO)\n`;
    md += `* **Activated Functional Units**: ${run.executivePlan.activatedDepartments?.map(d => `\`${d}\``).join(', ') || 'All Departments'}\n\n`;
    md += `### Operational Feasibility Analysis:\n`;
    md += `> "${run.executivePlan.analysis || 'Analyzing structural dependencies. Deploying agents in parallel across all core modules.'}"\n\n`;
  }

  // Department Missions & Tasks Section
  if (run.departmentMissions) {
    md += `## 🏢 TIER 3 & 4: DEPARTMENT LEVEL ALLOCATIONS & EXECUTION LOGS\n\n`;
    
    const missions = Object.values(run.departmentMissions);
    if (missions.length === 0) {
      md += `*No departments were activated during this cascade sequence.*\n\n`;
    } else {
      missions.forEach((mission) => {
        md += `### 🏷️ Department: ${mission.department}\n`;
        md += `* **Head of Department**: **${mission.hodName}** (${mission.hodRole})\n`;
        md += `* **Strategic Departmental Objective**: *${mission.strategicObjective}*\n`;
        md += `* **Departmental Operation Status**: \`${mission.status?.toUpperCase() || 'COMPLETED'}\`\n\n`;

        if (mission.departmentSummary) {
          md += `> **Operational Summary**: ${mission.departmentSummary}\n\n`;
        }

        md += `#### Executed Sub-Tasks:\n`;
        
        if (!mission.assignedTasks || mission.assignedTasks.length === 0) {
          md += `*   No sub-tasks assigned under this division.\n\n`;
        } else {
          mission.assignedTasks.forEach((task) => {
            const duration = task.executionTimeMs ? `${(task.executionTimeMs / 1000).toFixed(2)}s` : 'N/A';
            md += `##### ⚡ Task: ${task.taskTitle}\n`;
            md += `*   **Assigned Agent / Employee**: \`${task.assignedAgentName}\`\n`;
            md += `*   **Process Execution Time**: \`${duration}\`\n`;
            md += `*   **Operational Sub-Prompt**: \`${task.taskPrompt}\`\n`;
            md += `*   **Result / Output Summary**:\n`;
            
            if (task.output) {
              const formattedOutput = task.output.length > 400 
                ? `${task.output.slice(0, 400).trim()}... [truncated]` 
                : task.output;
              md += `    \`\`\`text\n    ${formattedOutput.split('\n').join('\n    ')}\n    \`\`\`\n`;
            } else {
              md += `    *Task executed successfully with no direct return text.*\n`;
            }
            md += `\n`;
          });
        }
        md += `---\n\n`;
      });
    }
  }

  // Final Briefing Syntheses
  if (run.finalExecutiveBriefing) {
    md += `## 📊 TIER 5: EXECUTIVE BOARD BRIEFING & SYNTHESIS\n\n`;
    md += `> ${run.finalExecutiveBriefing}\n\n`;
  }

  if (run.ceoFinalResponse) {
    md += `## 🎓 CEO CLOSING ACTION MEMO\n\n`;
    md += `**Michael Scott closing address:**\n`;
    md += `> "${run.ceoFinalResponse}"\n\n`;
    md += `---\n\n`;
  }

  // Metrics Dashboard Recap
  if (run.metrics) {
    md += `## 📈 HARD ANALYTICS REPORT\n\n`;
    md += `*   **Activated Corporate Departments**: \`${run.metrics.totalDepartments}\` divisions\n`;
    md += `*   **Autonomous Employee Resources Mobilized**: \`${run.metrics.totalEmployeesInvolved}\` agents\n`;
    md += `*   **Dynamic Specialist Workers Spawned**: \`${run.metrics.dynamicEmployeesSpawned}\` instances\n`;
    md += `*   **Isolated Tasks Executed**: \`${run.metrics.totalTasksExecuted}\` completed instructions\n`;
    md += `*   **Total Sequence Duration**: \`${(run.metrics.durationMs / 1000).toFixed(3)} seconds\`\n\n`;
  }

  md += `*Report compiled automatically by **Rufflo Agent Fleet Command Center**.*`;

  return md;
};
