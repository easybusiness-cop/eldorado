const fs = require('fs');
let content = fs.readFileSync('src/components/AdminEngineDashboard.tsx', 'utf-8');

content = content.replace(
  "d3.extent<{ time: number; heap: number; health: number }, number>(data, d => d.time) as [number, number]",
  "d3.extent(data, (d) => d.time) as [number, number]"
);
content = content.replace(
  "Math.max(100, d3.max(data, d => d.heap) || 100)",
  "Math.max(100, d3.max(data, (d) => d.heap) ?? 100)"
);
fs.writeFileSync('src/components/AdminEngineDashboard.tsx', content, 'utf-8');
