import React from "react";
import type { Metadata } from "next";
import { 
  RefreshCw, 
  TrendingUp, 
  Zap, 
  BookOpen, 
  ShieldCheck,
  CheckCircle2
} from "lucide-react";

export const metadata: Metadata = {
  title: "Our Values - T.R.U.S.T. | NextGen Academy & Consulting",
  description: "NextGen Academy & Consulting is built upon T.R.U.S.T. - Transformation, Results Orientation, Unbounded Excellence, Subject Matter Mastery, and Trust & Integrity.",
};

export default function Values() {
  const valuesList = [
    {
      letter: "T",
      name: "Transformation",
      slogan: "Driving systemic evolution, not incremental change",
      description: "We believe in deep operational and leadership evolution. Whether redesigning plant workflows or sourcing new corporate leaders, we aim to transform organization capability rather than simply patching processes.",
      icon: RefreshCw,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderGlow: "group-hover:border-blue-600/30"
    },
    {
      letter: "R",
      name: "Results Orientation",
      slogan: "Measurable metrics over activities",
      description: "Consulting is only as good as its measurable outcomes. We tie our success directly to critical metrics: Overall Equipment Effectiveness (OEE) improvements, candidate retention rates, and technical skill validations.",
      icon: TrendingUp,
      color: "text-sky-600",
      bgColor: "bg-sky-50",
      borderGlow: "group-hover:border-sky-650/30"
    },
    {
      letter: "U",
      name: "Unbounded Excellence",
      slogan: "Exceeding international operational standards",
      description: "We reject the concept of 'good enough'. Our performance models, curricula, and recruitment searches target international benchmarks, ensuring client factories remain globally competitive.",
      icon: Zap,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      borderGlow: "group-hover:border-amber-600/30"
    },
    {
      letter: "S",
      name: "Subject Matter Mastery",
      slogan: "Deploying deep domain expertise on every project",
      description: "We do not deploy generalist project managers. Our consulting teams and trainers are former Plant Heads, Engineering Directors, and Quality Leads who command respect on the shop floor.",
      icon: BookOpen,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderGlow: "group-hover:border-emerald-650/30"
    },
    {
      letter: "T",
      name: "Trust & Integrity",
      slogan: "Strict confidentiality and absolute transparency",
      description: "We act as an extension of your board. We maintain strict non-disclosure compliance, deliver objective audits, and align our compensation strictly with client success parameters.",
      icon: ShieldCheck,
      color: "text-indigo-650",
      bgColor: "bg-indigo-50",
      borderGlow: "group-hover:border-indigo-650/30"
    }
  ];

  return (
    <div className="relative min-h-screen bg-slate-50 py-20 overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative space-y-20">
        
        {/* Header Title */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-semibold uppercase tracking-wider">
            <span>Corporate Philosophy</span>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 sm:text-5xl leading-tight">
            Built on <span className="text-blue-600">T.R.U.S.T.</span>
          </h1>
          <p className="text-lg text-slate-650 leading-relaxed">
            Our values form the foundational pillars of every strategy we engineer, candidate we map, and plant floor we transform.
          </p>
        </div>

        {/* T.R.U.S.T. Big Letter Banner */}
        <div className="relative flex justify-center py-6">
          <div className="flex gap-4 md:gap-8 text-5xl md:text-8xl font-black tracking-tighter opacity-15">
            {valuesList.map((val, idx) => (
              <span key={idx} className="hover:opacity-100 cursor-default hover:text-blue-600 transition-all duration-300 select-none">
                {val.letter}
              </span>
            ))}
          </div>
        </div>

        {/* Value Cards list */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {valuesList.map((value, idx) => {
            const Icon = value.icon;
            return (
              <div 
                key={idx}
                className="group relative p-8 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-600/30 transition-all duration-300 flex flex-col justify-between"
              >
                {/* Glow border overlay effect */}
                <div className={`absolute inset-0 border border-transparent rounded-3xl transition-colors duration-300 pointer-events-none ${value.borderGlow}`}></div>

                <div className="space-y-6">
                  {/* Top Header */}
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-2xl ${value.bgColor} ${value.color}`}>
                      {value.letter}
                    </div>
                    <div className={`p-2.5 rounded-lg bg-slate-50 border border-slate-100 ${value.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h2 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-200">
                    {value.name}
                  </h2>

                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 italic">
                    &ldquo;{value.slogan}&rdquo;
                  </p>

                  <p className="text-sm text-slate-600 leading-relaxed">
                    {value.description}
                  </p>
                </div>

                <div className="pt-6 border-t border-slate-100 mt-6 flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <CheckCircle2 className={`w-4 h-4 ${value.color}`} />
                  <span>Guaranteed delivery standard</span>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
