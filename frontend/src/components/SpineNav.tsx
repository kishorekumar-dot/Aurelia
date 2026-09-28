import { NavLink, useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  FileText, 
  PlusCircle, 
  Archive, 
  Compass, 
  LogOut,
  UserCheck
} from 'lucide-react';

export default function SpineNav() {
  const navigate = useNavigate();
  const token = localStorage.getItem("aurelia_token");
  const userJson = localStorage.getItem("aurelia_user");
  const user = userJson ? JSON.parse(userJson) : { full_name: "Dr. Evelyn Chen", department: "Cambridge CS & Tech" };

  const handleLogout = () => {
    localStorage.removeItem("aurelia_token");
    localStorage.removeItem("aurelia_user");
    navigate('/login');
  };

  return (
    <aside className="spine-rail">
      <div>
        {/* Brand Seal & Header */}
        <div className="spine-brand">
          <div className="spine-brand-title">AURELIA</div>
          <div className="spine-brand-sub">Academic Review Engine</div>
        </div>

        {/* Numbered Section Navigation */}
        <nav className="flex flex-col">
          <div className="font-mono text-[0.65rem] text-[#B08D57] uppercase tracking-[0.15em] mb-2 px-2">
            Desk Sections
          </div>

          <NavLink
            to="/"
            end
            className={({ isActive }) => `spine-nav-item${isActive ? ' active' : ''}`}
            id="nav-landing"
          >
            <span className="spine-num">01</span>
            <Compass size={16} />
            <span>Thesis & Portal</span>
          </NavLink>

          <NavLink
            to="/dashboard"
            className={({ isActive }) => `spine-nav-item${isActive ? ' active' : ''}`}
            id="nav-dashboard"
          >
            <span className="spine-num">02</span>
            <BookOpen size={16} />
            <span>Review Desk</span>
          </NavLink>

          <NavLink
            to="/rules"
            className={({ isActive }) => `spine-nav-item${isActive ? ' active' : ''}`}
            id="nav-rules"
          >
            <span className="spine-num">03</span>
            <FileText size={16} />
            <span>Rules & Policies</span>
          </NavLink>

          <NavLink
            to="/new-review"
            className={({ isActive }) => `spine-nav-item${isActive ? ' active' : ''}`}
            id="nav-new-review"
          >
            <span className="spine-num">04</span>
            <PlusCircle size={16} />
            <span>New Review</span>
          </NavLink>

          <NavLink
            to="/history"
            className={({ isActive }) => `spine-nav-item${isActive ? ' active' : ''}`}
            id="nav-history"
          >
            <span className="spine-num">05</span>
            <Archive size={16} />
            <span>Archive History</span>
          </NavLink>
        </nav>
      </div>

      {/* Lecturer Profile Badge */}
      <div className="pt-4 border-t border-[rgba(18,18,18,0.15)]">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-[#121212] text-[#F4EFE6] flex items-center justify-center font-serif text-sm font-bold border border-[#B08D57]">
            EC
          </div>
          <div className="overflow-hidden">
            <div className="font-sans text-xs font-semibold text-[#121212] truncate">
              {user.full_name || "Dr. Evelyn Chen"}
            </div>
            <div className="font-mono text-[0.65rem] text-[#8C1C13] truncate">
              Lecturer Authority
            </div>
          </div>
        </div>

        {token ? (
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-1.5 font-mono text-[0.7rem] uppercase tracking-wider text-[#8C1C13] hover:text-[#121212] py-1 border border-dashed border-[#8C1C13] hover:border-[#121212] transition-colors"
          >
            <LogOut size={12} /> Sign Out
          </button>
        ) : (
          <NavLink
            to="/login"
            className="w-full flex items-center justify-center gap-1.5 font-mono text-[0.7rem] uppercase tracking-wider text-[#121212] py-1 border border-[#B08D57] hover:bg-[#B08D57] hover:text-[#F4EFE6] transition-colors text-center"
          >
            <UserCheck size={12} /> Sign In
          </NavLink>
        )}
      </div>
    </aside>
  );
}
