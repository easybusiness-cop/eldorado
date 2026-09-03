function evaluateAgentPromotion(agentId, projectId, taskId) {
    const agent = this.getAgentById(agentId);
    if (!agent) return;
    
    if (!agent.trainingRecord) {
        agent.trainingRecord = {
            completedLevels: [],
            currentLevel: 1,
            competencyScore: 50,
            competencyGrade: 'L2',
            certifications: [],
            practicalProjectsCompleted: [],
            hoursTrained: 0,
            skillsMatrix: {}
        };
    }
    
    agent.trainingRecord.practicalProjectsCompleted.push(taskId);
    agent.trainingRecord.competencyScore += 5; // 5 points per task
    agent.trainingRecord.hoursTrained += 2; // Simulate hours
    
    let promoted = false;
    let oldGrade = agent.trainingRecord.competencyGrade;
    let newLevel = agent.trainingRecord.currentLevel;
    
    // Grade Logic
    if (agent.trainingRecord.competencyScore >= 95) agent.trainingRecord.competencyGrade = 'L5';
    else if (agent.trainingRecord.competencyScore >= 85) agent.trainingRecord.competencyGrade = 'L4';
    else if (agent.trainingRecord.competencyScore >= 75) agent.trainingRecord.competencyGrade = 'L3';
    
    // Level up Logic
    if (agent.trainingRecord.competencyScore >= agent.trainingRecord.currentLevel * 20) {
        newLevel = Math.min(9, agent.trainingRecord.currentLevel + 1);
        if (newLevel > agent.trainingRecord.currentLevel) {
            agent.trainingRecord.currentLevel = newLevel;
            if (!agent.trainingRecord.completedLevels.includes(newLevel - 1)) {
                 agent.trainingRecord.completedLevels.push(newLevel - 1);
            }
            promoted = true;
        }
    }
    
    if (promoted || oldGrade !== agent.trainingRecord.competencyGrade) {
        // Log celebratory event
        this.logAudit({
            id: `aud-prom-${Date.now()}`,
            agentId: agent.id,
            projectId: projectId,
            taskId: taskId,
            tool: 'cse_academy',
            action: `Agent Promotion: ${agent.name}`,
            inputHash: 'CERT-GEN-AUTO',
            result: `🎉 PROMOTION UNLOCKED! Agent ${agent.name} has advanced to CSE Level ${agent.trainingRecord.currentLevel} (Grade ${agent.trainingRecord.competencyGrade}) after completing project task.`,
            timestamp: new Date().toISOString(),
            riskLevel: 'low',
            approvalRequired: false,
            executionId: `prom-${Date.now()}`
        });
        
        // Add to persistent memory
        this.addMemory({
            id: `mem-prom-${Date.now()}`,
            employeeId: agent.id,
            type: 'episodic',
            content: `Earned promotion to CSE Academy Level ${agent.trainingRecord.currentLevel} and Grade ${agent.trainingRecord.competencyGrade} by completing practical project task.`,
            projectId: projectId,
            importance: 9,
            confidence: 100,
            createdAt: Date.now()
        });
        
        // Slightly bump authority based on level if they are low
        if (agent.trainingRecord.currentLevel > 3 && agent.authorityLevel < 5) {
            agent.authorityLevel = 5;
        }
    }
    
    this.save();
}
