const fs = require('fs');

const file = 'src/services/agentExecutionLoop.ts';
let code = fs.readFileSync(file, 'utf8');

const importStr = 'import { isSoftwareEngineerAgent } from "../../apps/control-plane/integrations/gateway/tool.gateway";';
const newImportStr = importStr + '\nimport { repositoryEngineer } from "../../server/agents/repository/repository-engineer.ts";\n';
code = code.replace(importStr, newImportStr);

const originalExecutionBlockRegex = /const ai = this\.getGeminiClient\(\);[\s\S]+?catch \(fsWriteErr\) \{\s*console\.warn\("\[Workspace Write Error\].*?;\s*\}\s*\}/;

const replacementBlock = `companyDb.updateTaskStatus(task.id, "running", 60);

      if (isSoftwareEngineerAgent(agent)) {
        const devResult = await repositoryEngineer.develop({
          id: task.id,
          agentId: agent.id,
          organizationId: "org-munderdifflin",
          workspace: workspaceRoot,
          objective: \`\${task.title}\\n\\n\${task.description}\`,
        });
        
        finalOutput = devResult.summary;
        
        if (!devResult.success) {
          throw new Error(\`RepositoryEngineer failed: \${devResult.summary}\`);
        }

        tokensUsed = 15000;
        costUsed = 0.05;
        codeSnippet = "// Code modified automatically by RepositoryEngineer";
      } else {
        const ai = this.getGeminiClient();
        if (ai) {
          const resultText = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: prompt,
            config: {
              systemInstruction: \`You are \${agent.name}, executing your specialized role as \${agent.role} under corporate guidelines. Be highly specific, technical, and aligned with your department's goals.\`,
              temperature: 0.6,
            },
          });
          finalOutput = resultText?.text || "Task completed successfully.";
          const chars = prompt.length + finalOutput.length;
          tokensUsed = Math.ceil(chars / 3.8);
          costUsed = (tokensUsed / 1000000) * 0.075;
        } else {
          throw new Error("Gemini API Client unavailable");
        }
      }`;

code = code.replace(originalExecutionBlockRegex, replacementBlock);
fs.writeFileSync(file, code);
console.log('done');
