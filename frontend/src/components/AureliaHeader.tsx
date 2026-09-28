// src/components/AureliaHeader.tsx
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export function AureliaHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [role, setRole] = useState<'LECTURER' | 'STUDENT'>('LECTURER');

  useEffect(() => {
    try {
      const auth = localStorage.getItem('aurelia_auth');
      if (auth) {
        const parsed = JSON.parse(auth);
        if (parsed.role === 'STUDENT') {
          setRole('STUDENT');
          return;
        }
      }
      if (location.pathname.startsWith('/student')) {
        setRole('STUDENT');
      } else {
        setRole('LECTURER');
      }
    } catch {
      setRole('LECTURER');
    }
  }, [location.pathname]);

  const toggleRole = () => {
    const nextRole = role === 'LECTURER' ? 'STUDENT' : 'LECTURER';
    setRole(nextRole);
    localStorage.setItem('aurelia_auth', JSON.stringify({
      email: nextRole === 'STUDENT' ? 'alex.rivera@student.cambridge.edu' : 'dr.chen@cambridge.edu',
      role: nextRole
    }));

    if (nextRole === 'STUDENT') {
      navigate('/student');
    } else {
      navigate('/dashboard');
    }
  };

  const lecturerNav = [
    { label: 'DESK', href: '/dashboard' },
    { label: 'RULES & POLICIES', href: '/rules' },
    { label: 'NEW REVIEW', href: '/reviews/new' },
    { label: 'PIPELINE', href: '/reviews/1/live' },
    { label: 'ARCHIVE', href: '/history' },
  ];

  const studentNav = [
    { label: 'MY PORTAL', href: '/student' },
    { label: 'SUBMIT REPORT', href: '/student/submit' },
    { label: 'PUBLISHED FEEDBACK', href: '/student/feedback' },
    { label: 'VERSION HISTORY', href: '/student/history' },
  ];

  const navItems = role === 'STUDENT' ? studentNav : lecturerNav;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#050508]/90 backdrop-blur-md border-b border-white/[0.06] transition-all duration-300 font-body">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* Left: Circular Mark + Wordmark AURELIA */}
        <Link to="/" className="flex items-center gap-3.5 group">
          <div className="w-8 h-8 rounded-full border border-[rgba(245,166,35,0.45)] flex items-center justify-center relative overflow-hidden group-hover:border-[#F5A623] transition-colors duration-300">
            <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-[#7B6CFF] to-[#F5A623] opacity-90 shadow-[0_0_12px_rgba(245,166,35,0.6)]" />
          </div>
          <div>
            <span className="font-headline tracking-[0.25em] text-white text-lg font-light uppercase group-hover:text-[#F5A623] transition-colors duration-300 block leading-tight">
              Aurelia
            </span>
            <span className="font-mono text-[0.62rem] text-[#8A8B98] tracking-widest uppercase block">
              Academic Review Engine
            </span>
          </div>
        </Link>

        {/* Center: Navigation Links for Active Persona */}
        <nav className="hidden lg:flex items-center gap-7">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.label}
                to={item.href}
                className={`font-headline text-[0.72rem] tracking-[0.18em] transition-colors duration-300 uppercase ${
                  isActive
                    ? 'text-[#F5A623] font-normal border-b border-[#F5A623] pb-0.5'
                    : 'text-[#9A9BA8] hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Role Switcher & Persona Badge (PRD Section 7) */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleRole}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] border border-white/10 hover:border-[#F5A623] transition-colors rounded-none font-mono text-[0.68rem] text-[#C4C5D6] cursor-pointer"
            title="Toggle between Lecturer and Student mode"
          >
            <div className={`w-2 h-2 rounded-full ${role === 'LECTURER' ? 'bg-[#F5A623]' : 'bg-[#7B6CFF]'}`} />
            <span>MODE: <strong className="text-white tracking-wider">{role}</strong></span>
            <span className="text-[#8A8B98] ml-1">⇄ Switch</span>
          </button>

          <Link
            to={role === 'LECTURER' ? '/dashboard' : '/student'}
            className="btn-terracotta px-5 py-2 text-xs font-headline tracking-[0.16em] uppercase shadow-lg hidden sm:inline-block"
          >
            {role === 'LECTURER' ? 'Faculty Desk' : 'Student Desk'}
          </Link>
        </div>

      </div>
    </header>
  );
}
