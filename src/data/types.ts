export interface Metric {
  label: string;
  value: string;
  numericValue?: number;
}

export interface SkillDomain {
  id: string;
  number: string;
  title: string;
  summary: string;
  skills: string[];
  proof: string;
  tone: "teal" | "blue" | "brass" | "violet";
}

export interface Project {
  id: string;
  number: string;
  title: string;
  category: string;
  summary: string;
  challenge: string;
  response: string;
  outcome: string;
  skills: string[];
  metrics: Metric[];
}

export interface ExperienceRole {
  id: string;
  company: string;
  role: string;
  period: string;
  location: string;
  description: string;
  highlights: string[];
  skills: string[];
  logo?: string;
}

export interface PortfolioData {
  profile: {
    name: string;
    title: string;
    location: string;
    email: string;
    linkedin: string;
    publication: { title: string; url: string; cover: string };
    portrait: string;
  };
  projects: Project[];
  experience: ExperienceRole[];
  skillDomains: SkillDomain[];
}
