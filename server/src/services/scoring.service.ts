interface UserProfile {
  frontendSkills: string[];
  backendSkills: string[];
  fullstackSkills: string[];
  experienceYears: number;
  expectedSalaryMin: number;
  expectedSalaryMax: number;
}

interface JobForScoring {
  skillsRequired: string[];
  experienceMin?: number;
  experienceMax?: number;
  salaryMin?: number;
  salaryMax?: number;
  category?: "frontend" | "backend" | "fullstack";
}

export const USER_PROFILE: UserProfile = {
  frontendSkills: ["React", "React.js", "Next.js", "TypeScript", "JavaScript", "Tailwind", "Zustand"],
  backendSkills: ["Node.js", "Node", "Express.js", "Express", "MongoDB", "MySQL", "TypeScript"],
  fullstackSkills: ["React", "React.js", "Next.js", "Node.js", "Express.js", "MongoDB", "MySQL", "TypeScript"],
  experienceYears: 3,
  expectedSalaryMin: 7,
  expectedSalaryMax: 10,
};

function getRelevantSkills(category?: string): string[] {
  if (category === "frontend") return USER_PROFILE.frontendSkills;
  if (category === "backend") return USER_PROFILE.backendSkills;
  return USER_PROFILE.fullstackSkills; // default fullstack
}

function calculateSkillMatch(jobSkills: string[], userSkills: string[]): number {
  if (!jobSkills || jobSkills.length === 0) return 50;

  const normalizedUserSkills = userSkills.map(s => s.toLowerCase());
  const matchedSkills = jobSkills.filter(skill =>
    normalizedUserSkills.includes(skill.toLowerCase())
  );

  return (matchedSkills.length / jobSkills.length) * 100;
}

function calculateExperienceMatch(expMin?: number, expMax?: number, userExp = USER_PROFILE.experienceYears): number {
  if (expMin === undefined && expMax === undefined) return 70;

  const min = expMin ?? 0;
  const max = expMax ?? min + 2;

  if (userExp >= min && userExp <= max) return 100;
  if (userExp < min) return Math.max(0, 100 - (min - userExp) * 25);
  return Math.max(0, 100 - (userExp - max) * 15);
}

function calculateSalaryMatch(salMin?: number, salMax?: number): number {
  if (salMin === undefined && salMax === undefined) return 50;

  const jobMin = salMin ?? 0;
  const jobMax = salMax ?? jobMin;

  const overlap = Math.min(jobMax, USER_PROFILE.expectedSalaryMax) - Math.max(jobMin, USER_PROFILE.expectedSalaryMin);
  if (overlap > 0) return 100;
  if (jobMax >= USER_PROFILE.expectedSalaryMin) return 70;
  return 30;
}

export function calculateMatchScore(job: JobForScoring): number {
  const relevantSkills = getRelevantSkills(job.category);
  const skillScore = calculateSkillMatch(job.skillsRequired, relevantSkills);
  const expScore = calculateExperienceMatch(job.experienceMin, job.experienceMax);
  const salaryScore = calculateSalaryMatch(job.salaryMin, job.salaryMax);

  const finalScore = (skillScore * 0.5) + (expScore * 0.3) + (salaryScore * 0.2);
  return Math.round(finalScore);
}