export interface LearnedSkill {
  id: string;
  name: string;
  description: string;
  procedure: string[];
  evidence: string[];
  successRate: number;
  uses: number;
  createdAt: string;
  updatedAt: string;
}

export class SkillMemory {
  private skills = new Map<string, LearnedSkill>();

  promote(skill: LearnedSkill) {
    this.skills.set(skill.id, skill);
  }

  get(id: string) {
    return this.skills.get(id);
  }

  search(query: string) {
    const q = query.toLowerCase();
    return [...this.skills.values()].filter(
      (skill) =>
        skill.name.toLowerCase().includes(q) ||
        skill.description.toLowerCase().includes(q)
    );
  }

  all() {
    return [...this.skills.values()];
  }
}

export const skillMemory = new SkillMemory();
