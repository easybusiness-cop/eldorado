const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');
const searchStr = "tokensProcessed: dbEmp.kpis.tokensProcessed || 0,";
const replacement = "tokensProcessed: dbEmp.kpis.tokensProcessed || 0,\n                      trainingRecord: dbEmp.trainingRecord,";
content = content.replace(searchStr, replacement);
fs.writeFileSync('src/App.tsx', content, 'utf-8');
