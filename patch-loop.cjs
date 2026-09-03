const fs = require('fs');
let content = fs.readFileSync('src/services/agentExecutionLoop.ts', 'utf-8');
const searchStr = "companyDb.updateAgentKPIs(agent.id, tokensUsed, costUsed, 1);";
const replacement = "companyDb.updateAgentKPIs(agent.id, tokensUsed, costUsed, 1);\n      companyDb.evaluateAgentPromotion(agent.id, project.id, task.id);";
content = content.replace(searchStr, replacement);
fs.writeFileSync('src/services/agentExecutionLoop.ts', content, 'utf-8');
