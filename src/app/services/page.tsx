import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { 
  Briefcase, 
  BookOpen, 
  TrendingUp, 
  UserCheck, 
  Cpu, 
  ChevronRight, 
  CheckCircle,
  FileCheck,
  ShieldAlert
} from "lucide-react";

export const metadata: Metadata = {
  title: "Our Services | NextGen Academy & Consulting",
  description: "Explore our professional consulting services, including Executive Search & Talent Advisory, Performance Academy (on-site industrial training), and Expert Strategic Solutions.",
};

export default function Services() {
  const serviceList = [
    {
      id: "executive-search",
      title: "Executive Search & Talent Advisory",
      tagline: "Securing Elite Industrial Leadership",
      description: "Our premier search practice is customized specifically for heavy industry, automotive, manufacturing, and technology conglomerates. We maintain active connections with the highest-performing industrial minds to fill critical leadership gaps.",
      icon: Briefcase,
      features: [
        "C-Suite Recruitment (CEO, COO, CFO, VP Operations)",
        "Technical Leadership Sourcing (Plant Heads, Quality Directors, Automation Leads)",
        "Rigorous 5-Stage Competency Mapping",
        "Confidential Executive Mapping & Talent Pipeline advisory",
        "Transition Coaching for newly onboarded industrial heads"
      ],
      cta: { text: "Submit Hiring Requirement", href: "/get-in-touch/recruiter" },
      bgColor: "from-brand-orange/10 to-transparent",
      accentColor: "text-brand-orange",
      borderGlow: "group-hover:border-brand-orange/30"
    },
    {
      id: "performance-academy",
      title: "Performance Academy",
      tagline: "On-Site Industrial Capability Building",
      description: "NextGen Performance Academy implements dedicated skill validation and learning academies directly on the plant floor. We design and validate training solutions to bridge operational skill gaps and reduce production cycle times.",
      icon: BookOpen,
      features: [
        "Customized Operator & Technician Upskilling curricula",
        "Automation, PLC, SCADA, & Robotics training courses",
        "Lean Manufacturing, Kaizen, and Six Sigma workshops",
        "Digital Learning modules with plant-floor validation checks",
        "Joint certification programs with leading technical institutes"
      ],
      cta: { text: "Learn More / Inquire", href: "/get-in-touch/book-call" },
      bgColor: "from-brand-blue/10 to-transparent",
      accentColor: "text-brand-blue",
      borderGlow: "group-hover:border-brand-blue/30"
    },
    {
      id: "strategic-solutions",
      title: "Expert Strategic Solutions",
      tagline: "Unlocking Plant Operational Efficiency",
      description: "NextGen consulting teams deploy on-site to inspect, audit, and design lean operational flows. From Greenfield plant layout setups to Brownfield optimizations, our methodologies eliminate process waste and maximize asset efficiency.",
      icon: TrendingUp,
      features: [
        "Greenfield & Brownfield Plant Design advisory",
        "Overall Equipment Effectiveness (OEE) improvement audits",
        "Supply Chain and Procurement cost optimization mapping",
        "ISO, IATF, and Quality Management compliance audits",
        "Change Management consulting for industrial scaling"
      ],
      cta: { text: "Book Advisory Discovery Call", href: "/get-in-touch/book-call" },
      bgColor: "from-amber-500/5 to-transparent",
      accentColor: "text-amber-400",
      borderGlow: "group-hover:border-amber-400/30"
    }
  ];

  return (
    <div className="relative min-h-screen bg-brand-dark py-20 overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 w-[400px] h-[400px] bg-brand-orange/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 w-[400px] h-[400px] bg-brand-blue/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative space-y-24">
        
        {/* Header Title */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-brand-blue text-xs font-semibold uppercase tracking-wider">
            <span>Capabilities Portfolio</span>
          </div>
          <h1 className="text-4xl font-extrabold text-white sm:text-5xl leading-tight">
            Consulting & Training <span className="text-brand-blue">Solutions</span>
          </h1>
          <p className="text-lg text-brand-text-muted leading-relaxed">
            We deliver modular, end-to-end consulting blueprints that drive organizational competence, operational uptime, and bottom-line expansion.
          </p>
        </div>

        {/* Services List */}
        <div className="space-y-16">
          {serviceList.map((service, index) => {
            const Icon = service.icon;
            return (
              <section 
                key={service.id} 
                id={service.id}
                className="group relative rounded-3xl bg-brand-dark-light border border-slate-800/80 p-8 md:p-12 hover:border-slate-700 transition-all duration-300 overflow-hidden"
              >
                {/* Visual gradient backdrop */}
                <div className={`absolute inset-0 bg-gradient-to-br ${service.bgColor} opacity-60 pointer-events-none`}></div>
                
                <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Left Column: Title and details */}
                  <div className="lg:col-span-7 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className={`p-3.5 rounded-2xl bg-slate-950 border border-slate-850 ${service.accentColor}`}>
                        <Icon className="w-7 h-7" />
                      </div>
                      <div>
                        <span className={`text-xs font-bold tracking-widest uppercase ${service.accentColor}`}>
                          SERVICE 0{index + 1}
                        </span>
                        <h2 className="text-2xl md:text-3xl font-extrabold text-white mt-0.5">
                          {service.title}
                        </h2>
                      </div>
                    </div>

                    <div className="border-t border-slate-800/80 my-4"></div>

                    <div className="space-y-4">
                      <h4 className="text-white font-semibold text-lg italic">
                        {service.tagline}
                      </h4>
                      <p className="text-sm md:text-base text-brand-text-muted leading-relaxed">
                        {service.description}
                      </p>
                    </div>

                    <div className="pt-4">
                      <Link 
                        href={service.cta.href}
                        className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-brand-orange hover:bg-slate-800 text-white text-sm font-semibold transition-all duration-300 group-hover:scale-[1.01]"
                      >
                        <span>{service.cta.text}</span>
                        <ChevronRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform duration-200" />
                      </Link>
                    </div>
                  </div>

                  {/* Right Column: Key feature bullets */}
                  <div className="lg:col-span-5 bg-slate-950/40 p-6 md:p-8 rounded-2xl border border-slate-850 glass">
                    <h3 className="text-white font-bold text-sm tracking-wider uppercase mb-6 flex items-center gap-2">
                      <FileCheck className={`w-5 h-5 ${service.accentColor}`} />
                      <span>Deliverables & Focus Areas</span>
                    </h3>
                    <ul className="space-y-4">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <CheckCircle className={`w-4.5 h-4.5 mt-0.5 flex-shrink-0 ${service.accentColor}`} />
                          <span className="text-xs md:text-sm text-slate-300 leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>
              </section>
            );
          })}
        </div>

      </div>
    </div>
  );
}
