// src/pages/Register.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ParticleOrb3D } from '../components/ParticleOrb3D';
import { api } from '../services/api';

export default function Register() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<'lecturer' | 'student'>('lecturer');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    username: '',
    password: '',
    department: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await api.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: selectedRole,
        full_name: formData.fullName,
        department: formData.department,
      });

      localStorage.setItem('academic_review_token', data.access_token as string);
      localStorage.setItem('aurelia_token', data.access_token as string);
      const authObj = {
        email: formData.email,
        role: selectedRole.toUpperCase(),
        name: formData.fullName || formData.username,
        department: formData.department
      };
      localStorage.setItem('aurelia_auth', JSON.stringify(authObj));
      localStorage.setItem('aurelia_user', JSON.stringify({
        ...data.user,
        email: formData.email,
        role: selectedRole.toUpperCase(),
        full_name: formData.fullName || formData.username,
        department: formData.department
      }));

      if (selectedRole === 'student') {
        navigate('/student');
      } else {
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050508] text-[#E8E8EE] flex flex-col items-center justify-center relative overflow-hidden px-6 font-body">
      <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none -z-10">
        <ParticleOrb3D size={480} status="idle" />
      </div>

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

      <div className="w-full max-w-md mounted-document p-8 md:p-10 rounded-sm relative z-10 space-y-6">
        <div className="text-center">
          <span className="font-mono text-[0.65rem] text-[#F5A623] tracking-[0.24em] uppercase block mb-1">
            Institutional Identity Registration
          </span>
          <h1 className="font-headline text-2xl md:text-3xl font-light text-white tracking-wide">
            Create Account
          </h1>
        </div>

        {/* Role Toggle */}
        <div className="grid grid-cols-2 p-1 bg-[#080914] border border-white/10 font-mono text-xs">
          <button
            type="button"
            onClick={() => setSelectedRole('lecturer')}
            className={`py-2 text-center transition-colors ${
              selectedRole === 'lecturer'
                ? 'bg-[#F5A623]/20 text-[#F5A623] border border-[#F5A623]/40'
                : 'text-[#8A8B98] hover:text-white'
            }`}
          >
            Faculty Supervisor
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole('student')}
            className={`py-2 text-center transition-colors ${
              selectedRole === 'student'
                ? 'bg-[#7B6CFF]/20 text-[#7B6CFF] border border-[#7B6CFF]/40'
                : 'text-[#8A8B98] hover:text-white'
            }`}
          >
            Student Candidate
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-headline text-[0.72rem] tracking-[0.16em] text-[#9A9BA8] uppercase mb-1.5">Full Name</label>
            <input type="text" required value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Dr. John Smith" className="w-full bg-[#080914] border border-[rgba(245,166,35,0.22)] rounded-none px-4 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-[#F5A623] transition-colors" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-headline text-[0.72rem] tracking-[0.16em] text-[#9A9BA8] uppercase mb-1.5">Username</label>
              <input type="text" required value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })}
                placeholder="jsmith" className="w-full bg-[#080914] border border-[rgba(245,166,35,0.22)] rounded-none px-4 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-[#F5A623] transition-colors" />
            </div>
            <div>
              <label className="block font-headline text-[0.72rem] tracking-[0.16em] text-[#9A9BA8] uppercase mb-1.5">Department</label>
              <input type="text" required value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })}
                placeholder="Computer Science" className="w-full bg-[#080914] border border-[rgba(245,166,35,0.22)] rounded-none px-4 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-[#F5A623] transition-colors" />
            </div>
          </div>

          <div>
            <label className="block font-headline text-[0.72rem] tracking-[0.16em] text-[#9A9BA8] uppercase mb-1.5">Institutional Email</label>
            <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder="user@university.edu" className="w-full bg-[#080914] border border-[rgba(245,166,35,0.22)] rounded-none px-4 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-[#F5A623] transition-colors" />
          </div>

          <div>
            <label className="block font-headline text-[0.72rem] tracking-[0.16em] text-[#9A9BA8] uppercase mb-1.5">Password</label>
            <input type="password" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
              placeholder="Minimum 8 characters" className="w-full bg-[#080914] border border-[rgba(245,166,35,0.22)] rounded-none px-4 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-[#F5A623] transition-colors" />
          </div>

          {error && (
            <div className="p-3 border border-red-500/30 bg-red-500/10 font-mono text-xs text-red-400">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full btn-terracotta py-3 text-xs tracking-[0.2em] mt-2 cursor-pointer uppercase font-semibold">
            {loading ? 'Registering...' : 'Create Institutional Account'}
          </button>
        </form>

        <div className="pt-3 border-t border-[rgba(255,255,255,0.06)] text-center">
          <p className="font-mono text-[0.65rem] text-[#6A6B78]">
            Already have an account?{' '}
            <Link to="/login" className="text-[#F5A623] hover:underline">Sign in here</Link>
          </p>
        </div>
      </div>

      <div className="mt-8 text-center font-mono text-[0.68rem] text-[#555666] tracking-widest uppercase">
        Aurelia Engine v1.0.4 · Encrypted Audit Ledger · PRD Verified
      </div>
    </div>
  );
}
