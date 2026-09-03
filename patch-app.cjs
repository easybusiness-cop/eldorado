const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');
const searchStr = "tokensProcessed: dbEmp.kpis.tokensProcessed,";
const replacement = "tokensProcessed: dbEmp.kpis.tokensProcessed,\n                      trainingRecord: dbEmp.trainingRecord || initialAgent.trainingRecord,";
content = content.replace(searchStr, replacement);
fs.writeFileSync('src/App.tsx', content, 'utf-8');
