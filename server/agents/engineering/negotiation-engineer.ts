export class NegotiationEngineer {
  async assignTeams(tasks: any[]) {
    return tasks.map((task) => ({
      ...task,
      team: task.owner.includes('Repo') ? 'Model' : task.owner.includes('Infra') ? 'Infrastructure' : 'Safety',
      assignee: `${task.owner}-lead`,
    }));
  }
}

export const negotiationEngineer = new NegotiationEngineer();
