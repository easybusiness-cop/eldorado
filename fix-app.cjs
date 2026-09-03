const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// There are multiple "telemetry={telemetry}" lines that were added.
// We need to keep the ones that are valid, or just remove ALL of them and only add back the right one.
// Let's remove ALL "        telemetry={telemetry}\n"
content = content.replace(/\s+telemetry=\{telemetry\}/g, '');

// Now we need to add telemetry={telemetry} to HQMainContainer, CommandCenter, SystemModulesModal (maybe?), and AdministratorOrchestratorModal
content = content.replace(
  /<HQMainContainer([^>]*?)userProfile=\{userProfile\}/g,
  '<HQMainContainer$1userProfile={userProfile}\n            telemetry={telemetry}'
);

content = content.replace(
  /<CommandCenter([^>]*?)userProfile=\{userProfile\}/g,
  '<CommandCenter$1userProfile={userProfile}\n              telemetry={telemetry}'
);

content = content.replace(
  /<AdministratorOrchestratorModal([^>]*?)userProfile=\{userProfile\}/g,
  '<AdministratorOrchestratorModal$1userProfile={userProfile}\n        telemetry={telemetry}'
);

fs.writeFileSync('src/App.tsx', content, 'utf-8');
