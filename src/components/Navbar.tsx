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
    const timer = setTimeout(() => {
      setMobileMenuOpen(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  // Hide main site navigation on portal pages
  if (pathname.startsWith("/portal")) {
    return null;
  }

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Services", href: "/services" },
    { name: "Industries", href: "/industries" },
    { name: "Values", href: "/values" },
    { name: "Portal", href: "/portal" },
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
      color: "text-amber-600"
    },
    {
      name: "Book Discovery Call",
      href: "/get-in-touch/book-call",
      description: "Schedule a discussion",
      icon: Calendar,
      color: "text-emerald-600"
    }
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-brand-orange to-brand-blue flex items-center justify-center font-bold text-xl text-white shadow-sm group-hover:scale-105 transition-transform duration-300">
                N
              </div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900 group-hover:text-brand-orange transition-colors duration-300">
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
                    isActive ? "text-brand-orange border-b-2 border-brand-orange pb-1" : "text-slate-600"
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
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors duration-200 hover:text-brand-orange cursor-pointer px-4 py-2 rounded-full border border-slate-200 bg-slate-50 ${
                  pathname.startsWith("/get-in-touch") ? "text-brand-orange border-brand-orange" : "text-slate-700"
                }`}
              >
                <span>Get in Touch</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-3 w-80 rounded-2xl bg-white border border-slate-200 shadow-2xl p-2 animate-fade-in z-50">
                  <div className="grid gap-1">
                    {getInTouchItems.map((item) => {
                      const Icon = item.icon;
                      const isItemActive = pathname === item.href;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setDropdownOpen(false)}
                          className={`flex items-start gap-4 p-3 rounded-xl transition-all duration-200 hover:bg-slate-50 group ${
                            isItemActive ? "bg-slate-50" : ""
                          }`}
                        >
                          <div className={`p-2 rounded-lg bg-slate-100 group-hover:bg-slate-200 transition-colors duration-200 ${item.color}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-800 group-hover:text-brand-orange transition-colors duration-200">
                              {item.name}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
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
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 shadow-lg animate-fade-in">
          <div className="px-2 pt-2 pb-4 space-y-1 sm:px-3">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`block px-3 py-2.5 rounded-lg text-base font-medium transition-all duration-200 ${
                    isActive ? "bg-slate-50 text-brand-orange" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}

            {/* Mobile Dropdown Options Title */}
            <div className="border-t border-slate-200 my-2 pt-2">
              <div className="px-3 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
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
                        isItemActive ? "bg-slate-50 text-brand-orange" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
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
