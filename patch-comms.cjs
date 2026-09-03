const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const injection = `
  // Autonomous Agent-to-Agent Communication Module
  useEffect(() => {
    if (!autoMode) return;

    const commsInterval = setInterval(() => {
      setAgents((prevAgents) => {
        const available = prevAgents.filter((a) => a.status === 'idle');
        if (available.length < 2) return prevAgents;

        const sender = available[Math.floor(Math.random() * available.length)];
        let receiver = available[Math.floor(Math.random() * available.length)];
        let tries = 0;
        while (receiver.id === sender.id && tries < 5) {
          receiver = available[Math.floor(Math.random() * available.length)];
          tries++;
        }
        if (receiver.id === sender.id) return prevAgents;

        const topics = [
          \`Hey @\${receiver.nickname}, the cross-department workflow parameters look solid. Merging now.\`,
          \`@\${receiver.nickname}, can you review the latest resource allocation for our project?\`,
          \`Pinging @\${receiver.nickname} to confirm the dependency audits are green.\`,
          \`@\${receiver.nickname} I've updated the shared knowledge base with my findings.\`,
          \`Syncing with @\${receiver.nickname} on the latest telemetry reports.\`,
          \`@\${receiver.nickname}, just pushed the automated patches. Please verify on your end.\`
        ];
        const message = topics[Math.floor(Math.random() * topics.length)];

        const commLog = {
          id: \`comm-\${Date.now()}\`,
          timestamp: new Date().toLocaleTimeString(),
          level: 'info',
          agentId: sender.id,
          message: \`[Inter-Department Sync] \${message}\`
        };

        setLogs((prev) => [commLog, ...prev]);

        return prevAgents.map((a) => {
          if (a.id === sender.id) {
            return { ...a, speechBubble: { text: \`Messaging \${receiver.nickname}...\`, expiresAt: Date.now() + 8000 } };
          }
          if (a.id === receiver.id) {
            return { ...a, speechBubble: { text: \`Receiving sync from \${sender.nickname}...\`, expiresAt: Date.now() + 8000 } };
          }
          return a;
        });
      });
    }, 18000);

    return () => clearInterval(commsInterval);
  }, [autoMode]);
`;

const searchStr = "  const selectedAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];";
content = content.replace(searchStr, injection + "\n" + searchStr);
fs.writeFileSync('src/App.tsx', content, 'utf-8');
