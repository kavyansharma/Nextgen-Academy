export interface Resource {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  type: "free" | "paid";
  price?: number;
  fileUrl: string;
}

export const resources: Resource[] = [
  {
    id: "lean-six-sigma",
    slug: "lean-six-sigma-handbook",
    title: "Lean Six Sigma Handbook",
    description: "A comprehensive guide to process optimization, quality management, and waste reduction methodologies in modern manufacturing.",
    category: "Strategy",
    type: "free",
    fileUrl: "/resources/lean-six-sigma.pdf"
  },
  {
    id: "industry-4-playbook",
    slug: "industry-4-playbook",
    title: "Industry 4.0 Playbook",
    description: "An actionable playbook detailing automation, IoT integration, smart factories, and digital transformation for industrial engineering.",
    category: "Automation",
    type: "paid",
    price: 49.99,
    fileUrl: "/resources/industry-4-playbook.pdf"
  },
  {
    id: "exec-leadership-guide",
    slug: "exec-leadership-guide",
    title: "Executive Leadership Guide",
    description: "Strategic frameworks for industrial executives, plant operation managers, and talent search professionals.",
    category: "Leadership",
    type: "paid",
    price: 79.99,
    fileUrl: "/resources/exec-leadership-guide.pdf"
  }
];
