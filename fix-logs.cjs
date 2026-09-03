const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Fix setLogs((prev) => [commLog, ...prev]);
content = content.replace(
  "setLogs((prev) => [commLog, ...prev]);",
  "setLogs((prev) => prev.some(l => l.id === commLog.id) ? prev : [commLog, ...prev]);"
);

// Fix userLog
content = content.replace(
  "setLogs((prev) => [...prev, userLog]);",
  "setLogs((prev) => prev.some(l => l.id === userLog.id) ? prev : [...prev, userLog]);"
);

// Fix agentLog
content = content.replace(
  "setLogs((prev) => [...prev, agentLog]);",
  "setLogs((prev) => prev.some(l => l.id === agentLog.id) ? prev : [...prev, agentLog]);"
);

// Fix errorLog
content = content.replace(
  "setLogs((prev) => [...prev, errorLog]);",
  "setLogs((prev) => prev.some(l => l.id === errorLog.id) ? prev : [...prev, errorLog]);"
);

// Fix onLogCreated
content = content.replace(
  "onLogCreated={(log) => setLogs((prev) => [log, ...prev])}",
  "onLogCreated={(log) => setLogs((prev) => prev.some(l => l.id === log.id) ? prev : [log, ...prev])}"
);

// Fix setLogs around 345, 690, 702
// We can use a regex for setLogs((prev) => [ { id: ... } ])
content = content.replace(/setLogs\(\(prev\) => \[\s*\{\s*id:\s*(`[^`]+`)([\s\S]*?)\}\s*,\s*\.\.\.prev\s*\]\)/g, (match, idStr, rest) => {
  return `setLogs((prev) => {\n  const newId = ${idStr};\n  if (prev.some(l => l.id === newId)) return prev;\n  return [{ id: newId${rest} }, ...prev];\n})`;
});

fs.writeFileSync('src/App.tsx', content, 'utf-8');
