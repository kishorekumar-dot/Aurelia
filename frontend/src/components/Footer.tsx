// src/components/Footer.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 pt-16 pb-12 relative overflow-hidden">
      {/* Glow highlight */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-blue-600/5 blur-3xl rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-slate-900">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 p-0.5">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-blue-400" />
                </div>
              </div>
              <span className="font-heading font-extrabold text-xl text-white">
                AcademicReview <span className="text-gradient-blue">AI</span>
              </span>
            </Link>
            <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
              Evidence-grounded academic review assistance. Analyze student project reports, verify criteria, and empower lecturers with structured decision support.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>AI-assisted. Lecturer-led.</span>
            </div>
          </div>

          {/* Quick Links Column */}
          <div>
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li><Link to="/#how-it-works" className="hover:text-blue-400 transition-colors">How It Works</Link></li>
              <li><Link to="/#features" className="hover:text-blue-400 transition-colors">Specialized Agents</Link></li>
              <li><Link to="/#evidence" className="hover:text-blue-400 transition-colors">Evidence Engine</Link></li>
              <li><Link to="/#authority" className="hover:text-blue-400 transition-colors">Lecturer Control</Link></li>
              <li><Link to="/dashboard" className="hover:text-blue-400 transition-colors">App Dashboard</Link></li>
            </ul>
          </div>

          {/* Research & Institutional */}
          <div>
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 mb-4">
              Research & Innovation
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li><a href="#explainability" className="hover:text-blue-400 transition-colors">Explainable AI</a></li>
              <li><a href="#adaptive-rules" className="hover:text-blue-400 transition-colors">Adaptive Policy Rules</a></li>
              <li><a href="#documentation" className="hover:text-blue-400 transition-colors">Documentation</a></li>
              <li><a href="#academic-papers" className="hover:text-blue-400 transition-colors">Research Papers</a></li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div>
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 mb-4">
              Institutional
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li><a href="#contact" className="hover:text-blue-400 transition-colors">University Pilot</a></li>
              <li><a href="#privacy" className="hover:text-blue-400 transition-colors">Privacy Policy</a></li>
              <li><a href="#terms" className="hover:text-blue-400 transition-colors">Terms of Service</a></li>
              <li><a href="#security" className="hover:text-blue-400 transition-colors">Security & Ethics</a></li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} AcademicReview AI. Built for Evidence-Based Higher Education.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-300">v2.4 Pro Engine</span>
            <span className="hover:text-slate-300">Status: Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
