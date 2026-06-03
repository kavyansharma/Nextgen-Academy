export interface Resource {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  type: "free" | "paid";
  price?: number;
  fileUrl: string;
  tags: string[];
  downloadCount: number;
}

export const resources: Resource[] = [
  {
    id: "lean-six-sigma-handbook",
    slug: "lean-six-sigma-handbook",
    title: "Lean Six Sigma Handbook",
    description: "A comprehensive guide to process optimization, quality management, statistical tools, and waste reduction methodologies in modern manufacturing.",
    category: "Lean Six Sigma",
    type: "free",
    fileUrl: "/resources/lean-six-sigma.pdf",
    tags: ["Lean Six Sigma", "Quality Management"],
    downloadCount: 1242
  },
  {
    id: "industry-4-playbook",
    slug: "industry-4-playbook",
    title: "Industry 4.0 Playbook",
    description: "An actionable playbook detailing automation, IoT integration, cyber-physical systems, smart factories, and digital transformation for industrial engineering.",
    category: "Automation",
    type: "paid",
    price: 49.99,
    fileUrl: "/api/resources?id=industry-4-playbook",
    tags: ["Automation", "Industrial Engineering"],
    downloadCount: 684
  },
  {
    id: "exec-leadership-guide",
    slug: "exec-leadership-guide",
    title: "Executive Leadership Guide",
    description: "Strategic leadership frameworks, organizational communication, change management, and team building models for industrial executives and plant operations managers.",
    category: "Leadership",
    type: "paid",
    price: 79.99,
    fileUrl: "/api/resources?id=exec-leadership-guide",
    tags: ["Leadership", "Career Development"],
    downloadCount: 435
  },
  {
    id: "industrial-eng-foundations",
    slug: "industrial-eng-foundations",
    title: "Industrial Engineering Foundations",
    description: "Core principles of plant layout design, workflow optimization, capacity planning, and time-and-motion study guidelines.",
    category: "Industrial Engineering",
    type: "free",
    fileUrl: "/resources/industrial-eng-foundations.pdf",
    tags: ["Industrial Engineering", "Automation"],
    downloadCount: 812
  },
  {
    id: "total-quality-mgmt",
    slug: "total-quality-mgmt",
    title: "Total Quality Management (TQM) Framework",
    description: "In-depth reference manual for continuous improvement, customer satisfaction focus, process mapping, and quality assurance auditing.",
    category: "Quality Management",
    type: "free",
    fileUrl: "/resources/total-quality-mgmt.pdf",
    tags: ["Quality Management", "Lean Six Sigma"],
    downloadCount: 518
  },
  {
    id: "career-development-roadmap",
    slug: "career-development-roadmap",
    title: "Engineering Career Development Roadmap",
    description: "A comprehensive guide mapping career progression pathways from junior engineer to engineering director, detailing key skills and certificates required.",
    category: "Career Development",
    type: "free",
    fileUrl: "/resources/career-development-roadmap.pdf",
    tags: ["Career Development", "Leadership"],
    downloadCount: 932
  },
  {
    id: "engineering-interview-prep",
    slug: "engineering-interview-prep",
    title: "Technical Engineering Interview Prep Guide",
    description: "Crucial case study solutions, behavioral interview strategies, problem-solving frameworks, and checklist for major engineering recruiter screens.",
    category: "Interview Preparation",
    type: "paid",
    price: 39.99,
    fileUrl: "/api/resources?id=engineering-interview-prep",
    tags: ["Interview Preparation", "Career Development"],
    downloadCount: 287
  }
];
