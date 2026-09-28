// src/pages/Login.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ParticleOrb3D } from '../components/ParticleOrb3D';

export default function Login() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<'LECTURER' | 'STUDENT'>('LECTURER');
  const [email, setEmail] = useState('dr.chen@cambridge.edu');
  const [password, setPassword] = useState('academic123');
  const [loading, setLoading] = useState(false);

  const handleRoleChange = (role: 'LECTURER' | 'STUDENT') => {
    setSelectedRole(role);
    if (role === 'LECTURER') {
      setEmail('dr.chen@cambridge.edu');
    } else {
      setEmail('alex.rivera@student.cambridge.edu');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    
    localStorage.setItem('aurelia_auth', JSON.stringify({ 
      email, 
      role: selectedRole,
      name: selectedRole === 'LECTURER' ? 'Dr. Evelyn Chen' : 'Alex Rivera'
    }));

    if (selectedRole === 'LECTURER') {
      navigate('/dashboard');
    } else {
      navigate('/student');
    }
  };

  const handleQuickDemo = (role: 'LECTURER' | 'STUDENT') => {
    const emailToSet = role === 'LECTURER' ? 'dr.chen@cambridge.edu' : 'alex.rivera@student.cambridge.edu';
    localStorage.setItem('aurelia_auth', JSON.stringify({ 
      email: emailToSet, 
      role,
      name: role === 'LECTURER' ? 'Dr. Evelyn Chen' : 'Alex Rivera'
    }));
    if (role === 'LECTURER') {
      navigate('/dashboard');
    } else {
      navigate('/student');
    }
  };

  return (
    <div className="min-h-screen bg-[#050508] text-[#E8E8EE] flex flex-col items-center justify-center relative overflow-hidden px-6 font-body">
      {/* Dimmed small particle orb in background */}
      <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none -z-10">
        <ParticleOrb3D size={480} status="idle" />
      </div>

      {/* Header link back to landing */}
      <div className="absolute top-8 left-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full border border-[rgba(245,166,35,0.4)] flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-[#7B6CFF] to-[#F5A623]" />
          </div>
          <span className="font-headline tracking-[0.22em] text-white text-sm font-light uppercase">
            Aurelia
          </span>
        </Link>
      </div>

      {/* Centered Framed Form with Brass/Gold Hairline Border */}
      <div className="w-full max-w-md mounted-document p-8 md:p-10 rounded-sm relative z-10 space-y-6">
        <div className="text-center">
          <span className="font-mono text-[0.65rem] text-[#F5A623] tracking-[0.24em] uppercase block mb-1">
            Academic Assessment Identity (PRD FR-01)
          </span>
          <h1 className="font-headline text-2xl md:text-3xl font-light text-white tracking-wide">
            Authenticate Desk
          </h1>
        </div>

        {/* Role Toggle Strip */}
        <div className="grid grid-cols-2 p-1 bg-[#080914] border border-white/10 font-mono text-xs">
          <button
            type="button"
            onClick={() => handleRoleChange('LECTURER')}
            className={`py-2 text-center transition-colors ${
              selectedRole === 'LECTURER'
                ? 'bg-[#F5A623]/20 text-[#F5A623] border border-[#F5A623]/40'
                : 'text-[#8A8B98] hover:text-white'
            }`}
          >
            Faculty Supervisor
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange('STUDENT')}
            className={`py-2 text-center transition-colors ${
              selectedRole === 'STUDENT'
                ? 'bg-[#7B6CFF]/20 text-[#7B6CFF] border border-[#7B6CFF]/40'
                : 'text-[#8A8B98] hover:text-white'
            }`}
          >
            Student Candidate
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-headline text-[0.72rem] tracking-[0.16em] text-[#9A9BA8] uppercase mb-1.5">
              {selectedRole === 'LECTURER' ? 'Faculty Academic Email' : 'Student Institutional Email'}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#080914] border border-[rgba(245,166,35,0.22)] rounded-none px-4 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-[#F5A623] transition-colors"
            />
          </div>

          <div>
            <label className="block font-headline text-[0.72rem] tracking-[0.16em] text-[#9A9BA8] uppercase mb-1.5">
              Access Secret Key
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#080914] border border-[rgba(245,166,35,0.22)] rounded-none px-4 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-[#F5A623] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-terracotta py-3 text-xs tracking-[0.2em] mt-2 cursor-pointer uppercase font-semibold"
          >
            {loading ? 'Authenticating...' : `Enter ${selectedRole === 'LECTURER' ? 'Faculty Review Desk' : 'Student Candidate Desk'}`}
          </button>
        </form>

        {/* Quick Demo Access Bar */}
        <div className="pt-4 border-t border-[rgba(255,255,255,0.06)] space-y-2">
          <span className="font-mono text-[0.65rem] text-[#6A6B78] uppercase tracking-wider block text-center">
            Instant Demo Sign-in:
          </span>
          <div className="grid grid-cols-2 gap-2 font-mono text-[0.68rem]">
            <button
              type="button"
              onClick={() => handleQuickDemo('LECTURER')}
              className="p-2 border border-[#F5A623]/30 bg-[#F5A623]/5 text-[#F5A623] hover:bg-[#F5A623]/15 transition-colors text-center"
            >
              Dr. Evelyn Chen<br /><span className="text-[0.6rem] text-[#8A8B98]">(Lecturer)</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('STUDENT')}
              className="p-2 border border-[#7B6CFF]/30 bg-[#7B6CFF]/5 text-[#7B6CFF] hover:bg-[#7B6CFF]/15 transition-colors text-center"
            >
              Alex Rivera<br /><span className="text-[0.6rem] text-[#8A8B98]">(Candidate)</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center font-mono text-[0.68rem] text-[#555666] tracking-widest uppercase">
        Aurelia Engine v1.0.4 · Encrypted Audit Ledger · PRD Verified
      </div>
    </div>
  );
}
