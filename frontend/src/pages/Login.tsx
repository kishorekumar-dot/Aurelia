// src/pages/Login.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ParticleOrb3D } from '../components/ParticleOrb3D';
import { api } from '../services/api';
import { TOKEN_KEY, AUTH_KEY, USER_KEY } from '../utils/auth';

export default function Login() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<'LECTURER' | 'STUDENT'>('LECTURER');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRoleChange = (role: 'LECTURER' | 'STUDENT') => {
    setSelectedRole(role);
    setEmail('');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await api.login(email.trim(), password, selectedRole.toLowerCase());
      // Store token and user info using canonical keys
      localStorage.setItem(TOKEN_KEY, data.access_token);
      const authObj = {
        id: data.user.id,
        email: data.user.email,
        role: data.user.role.toUpperCase(),
        name: data.user.full_name || data.user.username,
        department: data.user.department || ''
      };
      localStorage.setItem(AUTH_KEY, JSON.stringify(authObj));
      localStorage.setItem(USER_KEY, JSON.stringify({
        ...data.user,
        role: data.user.role.toUpperCase(),
      }));

      const role = data.user.role.toUpperCase();
      if (role === 'STUDENT') {
        navigate('/student');
      } else {
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setError(msg);
    } finally {
      setLoading(false);
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
              maxLength={254}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={selectedRole === 'LECTURER' ? 'faculty@university.edu' : 'student@university.edu'}
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
              maxLength={128}
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full bg-[#080914] border border-[rgba(245,166,35,0.22)] rounded-none px-4 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-[#F5A623] transition-colors"
            />
          </div>

          {error && (
            <div className="p-3 border border-red-500/30 bg-red-500/10 font-mono text-xs text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-terracotta py-3 text-xs tracking-[0.2em] mt-2 cursor-pointer uppercase font-semibold"
          >
            {loading ? 'Authenticating...' : `Enter ${selectedRole === 'LECTURER' ? 'Faculty Review Desk' : 'Student Candidate Desk'}`}
          </button>
        </form>

        {/* Register Link */}
        <div className="pt-3 border-t border-[rgba(255,255,255,0.06)] text-center">
          <p className="font-mono text-[0.65rem] text-[#6A6B78]">
            New to Aurelia?{' '}
            <Link to="/register" className="text-[#F5A623] hover:underline">
              Register your institutional account
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-8 text-center font-mono text-[0.68rem] text-[#555666] tracking-widest uppercase">
        Aurelia Engine v1.0.4 · Encrypted Audit Ledger · PRD Verified
      </div>
    </div>
  );
}
