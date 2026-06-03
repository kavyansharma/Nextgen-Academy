import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { 
  ArrowRight, 
  Settings, 
  Award, 
  Users, 
  Building2, 
  Activity, 
  CheckCircle2, 
  ShieldCheck 
} from "lucide-react";

export const metadata: Metadata = {
  title: "NextGen Academy & Consulting | Corporate Industrial Training",
  description: "NextGen Academy & Consulting provides professional industrial training in Lean Six Sigma, Automation, Strategic Processes, and Executive Recruitment.",
  openGraph: {
    title: "NextGen Academy & Consulting | Corporate Industrial Training",
    description: "Upskilling and recruiting top industrial operations talent.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NextGen Academy & Consulting",
    description: "Upskilling and recruiting top industrial operations talent.",
  },
};

export default function Home() {
  const stats = [
    { value: "21+", label: "Years Experience", description: "In executive recruitment & strategy" },
    { value: "500+", label: "Professionals Trained", description: "Across manufacturing & engineering" },
    { value: "50+", label: "Organizations Served", description: "From MNCs to industrial conglomerates" }
  ];

  const valueProps = [
    {
      title: "Executive Recruitment",
      description: "Securing visionary leaders (CXOs, Plant Heads, Directors) who drive industrial excellence.",
      icon: Users,
    },
    {
      title: "Industrial Training",
      description: "Upskilling workforce capabilities in automation, operations, and manufacturing standards.",
      icon: Award,
    },
    {
      title: "Strategic Consulting",
      description: "Consulting on process optimizations, plant design, supply chain, and quality compliance.",
      icon: Settings,
    }
  ];

  const highlights = [
    "Industrial & Manufacturing Focus",
    "Expert Subject Matter Experts",
    "Result-Oriented Methodologies",
    "Comprehensive End-to-End Delivery",
    "Proprietary Assessment Frameworks",
    "2 Decades of Industry Trust"
  ];

  return (
    <div className="relative min-h-screen bg-brand-dark flex flex-col justify-between overflow-hidden">
      
      {/* Background Glow effects */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-orange/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[600px] h-[600px] bg-brand-blue/5 rounded-full blur-[140px] pointer-events-none"></div>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-orange/10 border border-brand-orange/20 text-brand-orange text-xs font-semibold tracking-wide uppercase animate-fade-in">
              <Activity className="w-3.5 h-3.5" />
              <span>Industrial & Manufacturing Specialists</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight animate-fade-in-up">
              Talent. Train.<br />
              <span className="bg-gradient-to-r from-brand-orange via-amber-500 to-brand-blue bg-clip-text text-transparent">
                Transform.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-brand-text-muted leading-relaxed max-w-2xl mx-auto lg:mx-0 animate-fade-in-up animate-delay-100">
              NextGen Academy & Consulting bridges the gap between industrial competence and strategic operations. We equip organizations with top-tier leadership, performance-focused training academies, and battle-tested advisory.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4 animate-fade-in-up animate-delay-200">
              <Link 
                href="/get-in-touch/book-call" 
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-brand-orange hover:bg-brand-orange-hover text-white font-semibold transition-all duration-300 hover:scale-[1.02] text-center shadow-lg shadow-brand-orange/20 cursor-pointer"
              >
                Book Discovery Call
              </Link>
              <Link 
                href="/get-in-touch/recruiter" 
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900 border border-slate-700 hover:border-brand-orange text-slate-200 font-semibold transition-all duration-300 hover:scale-[1.02] text-center hover:bg-slate-800 cursor-pointer flex items-center justify-center gap-2 group"
              >
                <span>Submit Hiring Requirement</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
            </div>
          </div>

          {/* Hero Right Visual */}
          <div className="lg:col-span-5 relative flex justify-center animate-fade-in animate-delay-200">
            <div className="relative w-full max-w-md p-8 rounded-3xl bg-slate-900/60 border border-white/5 shadow-2xl glass overflow-hidden group">
              {/* Corner industrial decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/10 rounded-full blur-2xl group-hover:bg-brand-orange/20 transition-all duration-500"></div>
              
              <div className="relative space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center text-brand-orange">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">NextGen Trust</h3>
                    <p className="text-xs text-brand-text-muted">High-impact human solutions</p>
                  </div>
                </div>

                <div className="border-t border-slate-800/80 my-4"></div>

                <ul className="space-y-4">
                  {highlights.map((highlight, index) => (
                    <li key={index} className="flex items-center gap-3 text-sm text-slate-300">
                      <CheckCircle2 className="w-4.5 h-4.5 text-brand-blue flex-shrink-0" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-2">
                  <Link href="/about" className="text-xs font-semibold text-brand-orange hover:text-brand-orange-hover flex items-center gap-1.5">
                    <span>Learn more about our methodology</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Statistics Section */}
      <section className="relative py-16 bg-slate-950/60 border-y border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="p-8 rounded-2xl bg-brand-dark-light/50 border border-slate-900 text-center hover:border-brand-orange/25 transition-all duration-300 group"
              >
                <div className="text-4xl lg:text-5xl font-extrabold text-white group-hover:text-brand-orange transition-colors duration-300 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-base font-semibold text-slate-200 mt-2">
                  {stat.label}
                </div>
                <div className="text-xs text-brand-text-muted mt-1">
                  {stat.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Overview of Offerings Section */}
      <section className="relative py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            End-to-End Corporate Solutions
          </h2>
          <p className="text-base text-brand-text-muted leading-relaxed">
            From strategic executive recruitment to on-site skills validation and operations consulting, we configure tailored services to support your manufacturing goals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {valueProps.map((prop, index) => {
            const Icon = prop.icon;
            return (
              <div 
                key={index}
                className="p-8 rounded-2xl bg-brand-dark-light border border-slate-800 hover:border-brand-orange/40 hover:scale-[1.01] transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-6">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-brand-orange">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white">{prop.title}</h3>
                  <p className="text-sm text-brand-text-muted leading-relaxed">
                    {prop.description}
                  </p>
                </div>
                <div className="pt-6">
                  <Link 
                    href="/services" 
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-blue hover:text-brand-blue-hover group"
                  >
                    <span>View program details</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Industrial Sectors Mock Section */}
      <section className="relative py-16 bg-slate-950/40 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Delivering Success Across Core Industrial Verticals
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-60">
            {["AUTOMOTIVE & EV", "HEAVY ENGINEERING", "INDUSTRIAL MFG", "FMCG LEADING BRANDS", "TECH SYSTEMS"].map((sector, i) => (
              <div key={i} className="text-sm md:text-base font-extrabold tracking-wider text-slate-400 hover:text-white transition-colors duration-200">
                {sector}
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
