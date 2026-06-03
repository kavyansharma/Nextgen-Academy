import React from "react";
import { Metadata } from "next";
import { Calendar, User, BookOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "Industrial & Manufacturing Blog | NextGen Academy",
  description: "Read the latest industrial insights, Lean Six Sigma methodologies, supply chain engineering articles, and executive recruiting guides from NextGen Consulting.",
  openGraph: {
    title: "Industrial & Manufacturing Blog | NextGen Academy",
    description: "Read the latest industrial insights and Lean Six Sigma articles from NextGen Consulting.",
    type: "website",
  },
};

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  slug: string;
}

const BLOG_POSTS: BlogPost[] = [
  {
    id: "post-1",
    title: "Implementing Lean Six Sigma in Modern EV Battery Production",
    excerpt: "Discover how manufacturing conglomerates are adapting standard DMAIC cycles to accelerate electric vehicle cell yields while maintaining strict safety profiles.",
    category: "Lean Six Sigma",
    author: "Dr. Anirudh Mehta",
    date: "May 28, 2026",
    readTime: "8 min read",
    slug: "lean-six-sigma-ev-production",
  },
  {
    id: "post-2",
    title: "The Industrial AI Revolution: Automation & Predictive Maintenance",
    excerpt: "A deep dive into industrial IoT edge devices, cloud analytics, and machine learning models reducing unplanned downtime in heavy steel refineries by 34%.",
    category: "Automation",
    author: "Sarah Jenkins, P.E.",
    date: "May 15, 2026",
    readTime: "6 min read",
    slug: "industrial-ai-predictive-maintenance",
  },
  {
    id: "post-3",
    title: "Recruiting for the Plant of the Future: CXO Leadership Trends",
    excerpt: "As smart manufacturing matures, what competencies are industrial giants prioritizing when hiring Plant Directors, VP of Operations, and Supply Chain Executives?",
    category: "Leadership",
    author: "Vikram Sharma",
    date: "April 29, 2026",
    readTime: "5 min read",
    slug: "recruiting-plant-of-the-future-cxo",
  },
];

export default function BlogPage() {
  return (
    <div className="relative min-h-screen bg-brand-dark flex flex-col justify-between overflow-hidden">
      {/* Background Glow effects */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-orange/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[600px] h-[600px] bg-brand-blue/5 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10 w-full">
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-orange/10 border border-brand-orange/20 text-brand-orange text-xs font-semibold uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5" />
            NextGen Insights
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-none">
            Industrial Strategy & <span className="bg-gradient-to-r from-brand-orange to-amber-500 bg-clip-text text-transparent">Operations Blog</span>
          </h1>
          <p className="text-sm sm:text-md text-brand-text-muted max-w-2xl mx-auto">
            Stay up to date with manufacturing technology trends, Lean management practices, process automation consulting, and executive workforce planning.
          </p>
        </div>

        {/* Blog Post Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {BLOG_POSTS.map((post) => (
            <div
              key={post.id}
              className="p-6 rounded-3xl bg-slate-900/60 border border-white/5 shadow-2xl glass flex flex-col justify-between hover:border-slate-800 transition-all duration-300 group"
            >
              <div className="space-y-4">
                {/* Meta details */}
                <div className="flex justify-between items-center gap-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-950/80 text-brand-blue border border-slate-850">
                    {post.category}
                  </span>
                  <span className="text-[10px] text-brand-text-muted font-medium">
                    {post.readTime}
                  </span>
                </div>

                <h2 className="text-xl font-bold text-white leading-tight group-hover:text-brand-orange transition-colors duration-200">
                  {post.title}
                </h2>

                <p className="text-xs text-brand-text-muted leading-relaxed">
                  {post.excerpt}
                </p>
              </div>

              {/* Author & Read CTA */}
              <div className="pt-6 border-t border-slate-800/80 mt-6 flex justify-between items-center text-[10px] text-brand-text-muted">
                <div className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>{post.author}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>{post.date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
