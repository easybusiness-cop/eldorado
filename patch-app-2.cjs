const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');
const searchStr = "tokensProcessed: dbEmp.kpis.tokensProcessed,";
// wait I need to find the else block return statement
