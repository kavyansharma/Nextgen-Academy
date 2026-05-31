import React from "react";
import type { Metadata } from "next";
import { 
  Building2, 
  Target, 
  Eye, 
  Award, 
  Users2, 
  Globe 
} from "lucide-react";

export const metadata: Metadata = {
  title: "About Us | NextGen Academy & Consulting",
  description: "Learn about NextGen Academy & Consulting. Serving the industrial and manufacturing sectors for over 21 years with top-tier talent acquisition and performance training.",
};

export default function About() {
  const pillars = [
    {
      title: "Our Mission",
      description: "To enable industrial enterprises to achieve operational excellence by delivering world-class executive talent and implementing high-performance training systems.",
      icon: Target,
      color: "text-brand-orange"
    },
    {
      title: "Our Vision",
      description: "To be the ultimate global consulting partner for manufacturing sectors, recognized for engineering transformation and mastering talent capability systems.",
      icon: Eye,
      color: "text-brand-blue"
    },
  ];

  const points = [
    {
      title: "21+ Years of Leadership",
      description: "Decades of consulting experience focused heavily on heavy engineering, automotive, EV, and process manufacturing fields.",
      icon: Award
    },
    {
      title: "Expert Advisors",
      description: "Our consultants are veteran Plant Heads, HR Leaders, and manufacturing executives with subject matter mastery.",
      icon: Users2
    },
    {
      title: "Pan-Industrial Network",
      description: "Deep roots across industrial clusters, allowing rapid sourcing of hard-to-find technical and operational leaders.",
      icon: Globe
    }
  ];

  return (
    <div className="relative min-h-screen bg-brand-dark py-20 overflow-hidden">
      
      {/* Background glow */}
      <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-brand-blue/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative space-y-20">
        
        {/* Header Hero */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-brand-orange text-xs font-semibold uppercase tracking-wider">
            <span>Corporate Profile</span>
          </div>
          <h1 className="text-4xl font-extrabold text-white sm:text-5xl leading-tight">
            Engineering Success, <span className="text-brand-orange">Developing Leaders</span>
          </h1>
          <p className="text-lg text-brand-text-muted leading-relaxed">
            For more than two decades, NextGen Academy & Consulting has stood as a trusted advisor to industrial corporations, manufacturing giants, and high-tech engineering firms.
          </p>
        </div>

        {/* Company Background Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Building2 className="w-6 h-6 text-brand-orange" />
              <span>Who We Are</span>
            </h2>
            <div className="space-y-4 text-slate-300 leading-relaxed text-sm md:text-base">
              <p>
                Founded on the principles of precision, results orientation, and subject matter mastery, NextGen Academy & Consulting bridges the gap between executive capability and plant floor execution. We understand the specific challenges Plant Heads, CXOs, and HR leaders face—from skilled labor shortages on assembly lines to the strategic execution of Industry 4.0 automation.
              </p>
              <p>
                Our unique consulting ecosystem delivers on two fronts: locating elite executive talent through our **Talent Advisory & Executive Search** practice, and building technical talent pipelines using our customized **Performance Academy** on-site academies.
              </p>
            </div>
          </div>
          
          <div className="lg:col-span-5">
            <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl glass space-y-6">
              <h3 className="text-white font-bold text-lg">Our Unique Advantage</h3>
              <ul className="space-y-4">
                {points.map((pt, idx) => {
                  const Icon = pt.icon;
                  return (
                    <li key={idx} className="flex gap-4">
                      <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-brand-orange h-fit">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">{pt.title}</h4>
                        <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">{pt.description}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>

        {/* Mission & Vision Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div 
                key={idx} 
                className="p-8 rounded-3xl bg-brand-dark-light border border-slate-800/80 hover:border-brand-orange/20 transition-all duration-300 flex items-start gap-5 group"
              >
                <div className={`p-4 rounded-2xl bg-slate-900 border border-slate-850 group-hover:scale-105 transition-transform duration-300 ${pillar.color}`}>
                  <Icon className="w-8 h-8" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-white">{pillar.title}</h3>
                  <p className="text-sm text-brand-text-muted leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
