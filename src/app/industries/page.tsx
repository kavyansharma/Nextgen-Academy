import React from "react";
import type { Metadata } from "next";
import { 
  Car, 
  Settings2, 
  Factory, 
  ShoppingBag, 
  Network,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Industries Served | NextGen Academy & Consulting",
  description: "Learn about the core industries we serve: Automotive & EV, Heavy Engineering, Industrial Manufacturing, FMCG, and the IT Sector with customized consulting and talent acquisition.",
};

export default function Industries() {
  const industriesList = [
    {
      id: "automotive",
      name: "Automotive & EV",
      icon: Car,
      description: "Supporting standard automotive supply chains and the rapid transition to Electric Vehicles (EV). We source elite engineering and leadership talent capable of building high-efficiency motor, battery pack, and assembly plants.",
      deliverables: [
        "Battery cell chemistry & BMS technical roles",
        "Plant leadership for EV gigafactories",
        "Automation and CNC engineering specialists",
        "Custom upskilling in high-voltage safety standards"
      ],
      color: "text-blue-600",
      borderGlow: "group-hover:border-blue-600/20"
    },
    {
      id: "engineering",
      name: "Heavy Engineering",
      icon: Settings2,
      description: "Delivering executive mapping and process consulting for heavy fabrication, infrastructure, defense systems, and EPC conglomerates. We provide talent suited for massive manufacturing scale.",
      deliverables: [
        "Sourcing Directors of Operations & Project Heads",
        "Expertise in ASME & AWS fabrication standards",
        "Quality assurance & structural engineering talent",
        "On-site safety audits & compliance courses"
      ],
      color: "text-sky-650",
      borderGlow: "group-hover:border-sky-650/20"
    },
    {
      id: "manufacturing",
      name: "Industrial Manufacturing",
      icon: Factory,
      description: "Partnering with manufacturing companies to implement Lean Six Sigma methodologies, reduce raw material waste, and hire high-performance plant leadership (Plant Heads, Maintenance Heads, QC Directors).",
      deliverables: [
        "OEE audits & production capacity mapping",
        "Plant Head & Operations Director placement",
        "Shopfloor technician competency training",
        "Maintenance & reliability engineering roles"
      ],
      color: "text-amber-600",
      borderGlow: "group-hover:border-amber-600/20"
    },
    {
      id: "fmcg",
      name: "FMCG",
      icon: ShoppingBag,
      description: "Optimizing high-speed packaging operations, food safety standards, and supply chain logistics. We source and train teams to operate automated packaging systems with zero downtime.",
      deliverables: [
        "Packaging engineering & logistics leadership placement",
        "Custom course curriculum for high-speed filling line operators",
        "Food safety (HACCP) & compliance training",
        "Warehouse automation & distribution talent"
      ],
      color: "text-emerald-600",
      borderGlow: "group-hover:border-emerald-600/20"
    },
    {
      id: "it",
      name: "IT Sector",
      icon: Network,
      description: "Bridging the gap between physical factory floors and cyber-physical systems (Smart Factory / Industry 4.0). Sourcing developers for Manufacturing Execution Systems (MES), IoT sensors, and industrial cybersecurity.",
      deliverables: [
        "Smart factory & IoT systems integration consulting",
        "MES developers & SCADA network architects recruitment",
        "Industrial OT cybersecurity specialists placement",
        "Factory automation systems software training"
      ],
      color: "text-indigo-650",
      borderGlow: "group-hover:border-indigo-650/20"
    }
  ];

  return (
    <div className="relative min-h-screen bg-slate-50 py-20 overflow-hidden">
      
      {/* Background glow */}
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative space-y-20">
        
        {/* Page Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-semibold uppercase tracking-wider">
            <span>Sectors of Influence</span>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 sm:text-5xl leading-tight">
            Industrial Expertise <span className="text-blue-600">Sectors</span>
          </h1>
          <p className="text-lg text-slate-650 leading-relaxed">
            We deliver targeted consulting blueprints and leadership recruitment solutions across the backbone of the global industrial economy.
          </p>
        </div>

        {/* Industry Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {industriesList.map((industry) => {
            const Icon = industry.icon;
            return (
              <section 
                key={industry.id} 
                id={industry.id}
                className="group relative rounded-3xl bg-white border border-slate-200 p-8 shadow-sm hover:border-blue-600/30 hover:shadow-md transition-all duration-300 flex flex-col justify-between"
              >
                {/* Glow border overlay effect */}
                <div className={`absolute inset-0 border border-transparent rounded-3xl transition-colors duration-300 pointer-events-none ${industry.borderGlow}`}></div>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-xl bg-slate-50 border border-slate-100 ${industry.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs text-slate-400 font-mono uppercase">
                      #{industry.id}
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-200">
                    {industry.name}
                  </h2>
                  
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {industry.description}
                  </p>

                  <div className="border-t border-slate-100 my-4"></div>

                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-900 tracking-widest uppercase">
                      NextGen Deliverables:
                    </h3>
                    <ul className="space-y-2">
                      {industry.deliverables.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed">
                          <ShieldCheck className={`w-4 h-4 flex-shrink-0 mt-0.5 ${industry.color}`} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-8">
                  <Link 
                    href="/get-in-touch/recruiter"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    <span>Request sector profile</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

              </section>
            );
          })}
        </div>

      </div>
    </div>
  );
}
