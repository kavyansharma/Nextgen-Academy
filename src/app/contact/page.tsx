import React from "react";
import { Metadata } from "next";
import ContactForm from "@/components/ContactForm";
import { Phone, Mail, MapPin, Clock, Globe } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Our Industrial Advisors | NextGen Academy",
  description: "Get in touch with NextGen Academy & Consulting. Contact our expert industrial training and executive recruiting advisors for custom corporate programs.",
  openGraph: {
    title: "Contact Our Industrial Advisors | NextGen Academy",
    description: "Get in touch with NextGen Academy & Consulting for custom industrial training programs.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Our Industrial Advisors | NextGen Academy",
    description: "Get in touch with NextGen Academy & Consulting for custom industrial training programs.",
  },
};

export default function ContactPage() {
  const contactInfo = [
    {
      icon: Phone,
      title: "Call Us",
      details: "+91 (124) 400-8902",
      description: "Mon-Fri from 9am to 6pm IST.",
    },
    {
      icon: Mail,
      title: "Email Advisory",
      details: "advisory@nextgenacademy.com",
      description: "We reply within 24 business hours.",
    },
    {
      icon: MapPin,
      title: "Corporate HQ",
      details: "1207, Industrial Zone, EV Highway, Sector 62",
      description: "Delhi NCR, India.",
    },
  ];

  return (
    <div className="relative min-h-screen bg-brand-dark flex flex-col justify-between overflow-hidden">
      {/* Background Glow effects */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-orange/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[600px] h-[600px] bg-brand-blue/5 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10 w-full">
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-orange/10 border border-brand-orange/20 text-brand-orange text-xs font-semibold uppercase tracking-wider">
            <Globe className="w-3.5 h-3.5" />
            Connect With NextGen
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-none">
            Let&apos;s Build Something <span className="bg-gradient-to-r from-brand-orange to-amber-500 bg-clip-text text-transparent">Exceptional</span>
          </h1>
          <p className="text-sm sm:text-md text-brand-text-muted max-w-2xl mx-auto">
            Ready to scale your industrial engineering capabilities or recruit stellar CXOs? Drop us a line or visit our NCR office.
          </p>
        </div>

        {/* Grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Contact Cards */}
          <div className="lg:col-span-5 space-y-6">
            {contactInfo.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="p-6 rounded-2xl bg-slate-900/60 border border-white/5 shadow-xl glass flex items-start gap-4 hover:border-slate-800 transition-all duration-300">
                  <div className="p-3 bg-brand-orange/10 border border-brand-orange/20 rounded-xl text-brand-orange flex-shrink-0">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-white text-md">{item.title}</h3>
                    <p className="font-semibold text-brand-blue text-sm">{item.details}</p>
                    <p className="text-xs text-brand-text-muted">{item.description}</p>
                  </div>
                </div>
              );
            })}

            {/* Operating hours widget */}
            <div className="p-6 rounded-2xl bg-slate-950/40 border border-slate-900 text-xs text-brand-text-muted flex items-center gap-3">
              <Clock className="w-5 h-5 text-slate-500 flex-shrink-0" />
              <span>We operate <strong>Monday through Friday, 9:00 AM to 6:00 PM IST</strong>, excluding national holidays.</span>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-7">
            <div className="p-8 rounded-3xl bg-slate-900/60 border border-white/5 shadow-2xl glass relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/5 rounded-full blur-2xl"></div>
              
              <h2 className="text-2xl font-bold text-white mb-6">Send A Query</h2>
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
