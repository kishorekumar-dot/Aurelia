// src/components/AureliaHeader.tsx
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export function AureliaHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [role, setRole] = useState<'LECTURER' | 'STUDENT'>('LECTURER');
  const [currentUser, setCurrentUser] = useState<{ name?: string; email?: string; role?: string } | null>(null);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    try {
      const token = localStorage.getItem('academic_review_token') || localStorage.getItem('aurelia_token');
      setHasToken(!!token);

      const auth = localStorage.getItem('aurelia_auth') || localStorage.getItem('aurelia_user');
      if (auth) {
        const parsed = JSON.parse(auth);
        setCurrentUser(parsed);
        if (parsed.role === 'STUDENT' || parsed.role === 'student') {
          setRole('STUDENT');
          return;
        } else if (parsed.role === 'LECTURER' || parsed.role === 'lecturer' || parsed.role === 'faculty') {
          setRole('LECTURER');
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

  const handleLogout = () => {
    localStorage.removeItem('academic_review_token');
    localStorage.removeItem('aurelia_token');
    localStorage.removeItem('aurelia_auth');
    localStorage.removeItem('aurelia_user');
    setHasToken(false);
    setCurrentUser(null);
    navigate('/login');
  };

  const toggleRole = () => {
    const nextRole = role === 'LECTURER' ? 'STUDENT' : 'LECTURER';
    setRole(nextRole);
    if (currentUser) {
      const updated = { ...currentUser, role: nextRole };
      setCurrentUser(updated);
      localStorage.setItem('aurelia_auth', JSON.stringify(updated));
    }

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

        {/* Right: Role Switcher, Persona Badge & Sign In/Out */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleRole}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] border border-white/10 hover:border-[#F5A623] transition-colors rounded-none font-mono text-[0.68rem] text-[#C4C5D6] cursor-pointer"
            title="Toggle between Lecturer and Student mode"
          >
            <div className={`w-2 h-2 rounded-full ${role === 'LECTURER' ? 'bg-[#F5A623]' : 'bg-[#7B6CFF]'}`} />
            <span>MODE: <strong className="text-white tracking-wider">{role}</strong></span>
            <span className="text-[#8A8B98] ml-1">⇄ Switch</span>
          </button>

          {hasToken ? (
            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col text-right">
                <span className="font-mono text-xs text-white font-medium truncate max-w-[120px]">
                  {currentUser?.name || currentUser?.email || 'User'}
                </span>
                <span className="font-mono text-[0.62rem] text-[#F5A623] uppercase">
                  {role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 border border-red-500/30 hover:border-red-400 bg-red-500/10 hover:bg-red-500/20 text-red-300 font-mono text-[0.68rem] uppercase tracking-wider transition-colors cursor-pointer"
                title="Sign out"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 border border-[#F5A623]/40 text-[#F5A623] hover:bg-[#F5A623]/10 font-mono text-xs uppercase tracking-wider transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="btn-terracotta px-3.5 py-1.5 font-headline text-xs tracking-wider uppercase hidden sm:inline-block"
              >
                Register
              </Link>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
