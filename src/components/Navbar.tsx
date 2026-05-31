"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Menu, 
  X, 
  ChevronDown, 
  Briefcase, 
  UserCheck, 
  GraduationCap, 
  Calendar 
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Services", href: "/services" },
    { name: "Industries", href: "/industries" },
    { name: "Values", href: "/values" },
  ];

  const getInTouchItems = [
    {
      name: "I Am Hiring",
      href: "/get-in-touch/recruiter",
      description: "Submit hiring requirements",
      icon: Briefcase,
      color: "text-brand-orange"
    },
    {
      name: "Job Seeker",
      href: "/get-in-touch/job-seeker",
      description: "Submit resume & profile",
      icon: UserCheck,
      color: "text-brand-blue"
    },
    {
      name: "Fresher",
      href: "/get-in-touch/fresher",
      description: "Upload resume & project report",
      icon: GraduationCap,
      color: "text-amber-400"
    },
    {
      name: "Book Discovery Call",
      href: "/get-in-touch/book-call",
      description: "Schedule a discussion",
      icon: Calendar,
      color: "text-emerald-400"
    }
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-brand-orange to-brand-blue flex items-center justify-center font-bold text-xl text-white shadow-lg group-hover:scale-105 transition-transform duration-300">
                N
              </div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent group-hover:text-brand-orange transition-colors duration-300">
                NextGen <span className="font-light text-brand-orange">Academy</span>
              </span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-sm font-medium transition-colors duration-200 hover:text-brand-orange ${
                    isActive ? "text-brand-orange border-b-2 border-brand-orange pb-1" : "text-slate-300"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}

            {/* Get in Touch Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors duration-200 hover:text-brand-orange cursor-pointer px-4 py-2 rounded-full border border-slate-700 bg-slate-900/60 ${
                  pathname.startsWith("/get-in-touch") ? "text-brand-orange border-brand-orange" : "text-slate-200"
                }`}
              >
                <span>Get in Touch</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-3 w-80 rounded-2xl bg-brand-dark-light border border-slate-800 shadow-2xl p-2 animate-fade-in z-50">
                  <div className="grid gap-1">
                    {getInTouchItems.map((item) => {
                      const Icon = item.icon;
                      const isItemActive = pathname === item.href;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setDropdownOpen(false)}
                          className={`flex items-start gap-4 p-3 rounded-xl transition-all duration-200 hover:bg-slate-800/60 group ${
                            isItemActive ? "bg-slate-800/80" : ""
                          }`}
                        >
                          <div className={`p-2 rounded-lg bg-slate-900 group-hover:bg-brand-dark transition-colors duration-200 ${item.color}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-white group-hover:text-brand-orange transition-colors duration-200">
                              {item.name}
                            </div>
                            <div className="text-xs text-brand-text-muted mt-0.5">
                              {item.description}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-brand-dark-light border-b border-slate-800 animate-fade-in">
          <div className="px-2 pt-2 pb-4 space-y-1 sm:px-3">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`block px-3 py-2.5 rounded-lg text-base font-medium transition-all duration-200 ${
                    isActive ? "bg-slate-800 text-brand-orange" : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}

            {/* Mobile Dropdown Options Title */}
            <div className="border-t border-slate-800 my-2 pt-2">
              <div className="px-3 pb-2 text-xs font-semibold text-brand-text-muted uppercase tracking-wider">
                Get in Touch
              </div>
              <div className="space-y-1">
                {getInTouchItems.map((item) => {
                  const Icon = item.icon;
                  const isItemActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isItemActive ? "bg-slate-800 text-brand-orange" : "text-slate-400 hover:bg-slate-800/40 hover:text-white"
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${item.color}`} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}
    </nav>
  );
}
