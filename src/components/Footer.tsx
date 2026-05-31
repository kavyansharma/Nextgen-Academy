import React from "react";
import Link from "next/link";
import { 
  Mail, 
  Phone, 
  MapPin, 
  ArrowRight 
} from "lucide-react";

// Inline brand SVGs to replace deprecated/removed Lucide brand icons
const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect width="4" height="12" x="2" y="9"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
);

const TwitterIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
  </svg>
);

const YoutubeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17z"/>
    <polygon points="10 15 15 12 10 9"/>
  </svg>
);

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const services = [
    { name: "Executive Search & Talent Advisory", href: "/services#executive-search" },
    { name: "Performance Academy", href: "/services#performance-academy" },
    { name: "Expert Strategic Solutions", href: "/services#strategic-solutions" }
  ];

  const industries = [
    { name: "Automotive & EV", href: "/industries#automotive" },
    { name: "Heavy Engineering", href: "/industries#engineering" },
    { name: "Industrial Manufacturing", href: "/industries#manufacturing" },
    { name: "FMCG", href: "/industries#fmcg" },
    { name: "IT Sector", href: "/industries#it" }
  ];

  const quickLinks = [
    { name: "Home", href: "/" },
    { name: "About NextGen", href: "/about" },
    { name: "Our Core Values", href: "/values" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" }
  ];

  return (
    <footer className="bg-slate-950 border-t border-slate-900 text-slate-400 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          {/* Brand Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-brand-orange to-brand-blue flex items-center justify-center font-bold text-lg text-white shadow-lg">
                N
              </div>
              <span className="font-extrabold text-lg tracking-tight text-white">
                NextGen <span className="font-light text-brand-orange">Academy</span>
              </span>
            </div>
            <p className="text-sm text-brand-text-muted leading-relaxed">
              Empowering industrial and manufacturing sectors through strategic executive recruitment, technical performance training, and strategic consulting.
            </p>
            {/* Socials */}
            <div className="flex items-center gap-4 pt-2">
              <a href="#" className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-brand-orange hover:border-brand-orange transition-all duration-300">
                <LinkedinIcon className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-brand-orange hover:border-brand-orange transition-all duration-300">
                <TwitterIcon className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-brand-orange hover:border-brand-orange transition-all duration-300">
                <YoutubeIcon className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-sm tracking-wider uppercase mb-6">Our Services</h3>
            <ul className="space-y-3">
              {services.map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-sm text-slate-400 hover:text-brand-orange transition-colors duration-200 flex items-center gap-1.5 group">
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all duration-200 -ml-5 group-hover:ml-0" />
                    <span>{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Industries */}
          <div>
            <h3 className="text-white font-semibold text-sm tracking-wider uppercase mb-6">Industries Covered</h3>
            <ul className="space-y-3">
              {industries.map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="text-sm text-slate-400 hover:text-brand-orange transition-colors duration-200 flex items-center gap-1.5 group">
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all duration-200 -ml-5 group-hover:ml-0" />
                    <span>{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-6">
            <h3 className="text-white font-semibold text-sm tracking-wider uppercase">Get in Touch</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-brand-orange mt-0.5 flex-shrink-0" />
                <span className="text-sm text-brand-text-muted leading-relaxed">
                  NextGen Academy & Consulting Corp.<br />
                  DLF Cyber City, Building 10C,<br />
                  Gurugram, HR - 122002, India
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-brand-orange flex-shrink-0" />
                <a href="tel:+919876543210" className="text-sm text-brand-text-muted hover:text-white transition-colors duration-200">
                  +91 98765 43210
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-brand-orange flex-shrink-0" />
                <a href="mailto:info@nextgen-consulting.com" className="text-sm text-brand-text-muted hover:text-white transition-colors duration-200">
                  info@nextgen-consulting.com
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Sub Footer */}
        <div className="border-t border-slate-900 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6">
            {quickLinks.map((item) => (
              <Link key={item.name} href={item.href} className="text-xs text-brand-text-muted hover:text-brand-orange transition-colors duration-200">
                {item.name}
              </Link>
            ))}
          </div>
          <p className="text-xs text-brand-text-muted">
            &copy; {currentYear} NextGen Academy & Consulting. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
}
