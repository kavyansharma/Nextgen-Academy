import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NextGen Academy & Consulting | Executive Talent, Training & Strategy",
  description: "A premier corporate consulting firm specializing in Executive Search, Talent Advisory, Performance Academy, and Expert Strategic Solutions for the Industrial and Manufacturing sectors.",
  keywords: ["Executive Search", "Talent Advisory", "Industrial Consulting", "Manufacturing Consulting", "Performance Academy", "Skill Training", "CXO Recruitment"],
  authors: [{ name: "NextGen Consulting" }],
  openGraph: {
    title: "NextGen Academy & Consulting",
    description: "Premium recruitment, talent advisory, and performance consulting for industrial & manufacturing leaders.",
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-brand-dark text-slate-100">
        <Navbar />
        <main className="flex-grow pt-20">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
