// src/pages/NewReview.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AureliaHeader } from '../components/AureliaHeader';
import { ParticleOrb3D } from '../components/ParticleOrb3D';

export default function NewReview() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('Smart Storage Monitoring System using IoT and Machine Learning');
  const [author, setAuthor] = useState('Alex Rivera');
  const [department, setDepartment] = useState('Computer Science');
  const [policyId, setPolicyId] = useState('POL-CS-01');
  const [fileName, setFileName] = useState('alex_rivera_thesis_final.pdf');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Give time to show orb intensifying
    await new Promise((r) => setTimeout(r, 1200));
    navigate('/reviews/1/live');
  };

  return (
    <div className="min-h-screen bg-[#050508] text-[#E8E8EE] flex flex-col font-body">
      <AureliaHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 pt-28 pb-16">
        <div className="border-b border-[rgba(245,166,35,0.18)] pb-6 mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="font-mono text-xs text-[#F5A623] tracking-[0.24em] uppercase block mb-1">
              Submission Terminal
            </span>
            <h1 className="font-headline text-3xl md:text-4xl font-light text-white tracking-wide">
              Initiate Project Verification
            </h1>
          </div>
          <div className="font-mono text-xs text-[#8A8B98] tracking-[0.16em] uppercase">
            Format: PDF / DOCX · Max 100MB
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left: Form Intake */}
          <div className="lg:col-span-7">
            <form onSubmit={handleSubmit} className="mounted-document p-8 md:p-10 space-y-6">
              
              {/* File Upload Zone */}
              <div>
                <label className="block font-headline text-xs tracking-[0.18em] text-[#8A8B98] uppercase mb-2">
                  Academic Manuscript File
                </label>
                <div className="border border-dashed border-[rgba(245,166,35,0.3)] hover:border-[#F5A623] p-8 text-center transition-colors bg-[#070814] relative">
                  <input
                    type="file"
                    accept=".pdf,.docx"
                    onChange={(e) => {
                      if (e.target.files?.[0]) setFileName(e.target.files[0].name);
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="font-mono text-xs text-[#F5A623] tracking-wider mb-1">
                    {fileName ? `LOADED: ${fileName}` : 'CLICK OR DRAG PDF / DOCX HERE'}
                  </div>
                  <div className="font-mono text-[0.68rem] text-[#6A6B78]">
                    Embedded vector extraction · Figure analysis enabled
                  </div>
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label className="block font-headline text-xs tracking-[0.18em] text-[#8A8B98] uppercase mb-1.5">
                  Dissertation / Project Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#070814] border border-white/10 px-4 py-2.5 text-sm font-headline text-white focus:outline-none focus:border-[#F5A623]"
                />
              </div>

              {/* Author & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-headline text-xs tracking-[0.18em] text-[#8A8B98] uppercase mb-1.5">
                    Candidate Author
                  </label>
                  <input
                    type="text"
                    required
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full bg-[#070814] border border-white/10 px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-[#F5A623]"
                  />
                </div>

                <div>
                  <label className="block font-headline text-xs tracking-[0.18em] text-[#8A8B98] uppercase mb-1.5">
                    Department / Faculty
                  </label>
                  <input
                    type="text"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-[#070814] border border-white/10 px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-[#F5A623]"
                  />
                </div>
              </div>

              {/* Policy Selection */}
              <div>
                <label className="block font-headline text-xs tracking-[0.18em] text-[#8A8B98] uppercase mb-1.5">
                  Governing Adaptive Policy
                </label>
                <select
                  value={policyId}
                  onChange={(e) => setPolicyId(e.target.value)}
                  className="w-full bg-[#070814] border border-white/10 px-4 py-2.5 text-xs font-mono text-[#F5A623] focus:outline-none focus:border-[#F5A623]"
                >
                  <option value="POL-CS-01">CS Postgrad Rigorous v4.2 (Format · Empirical · Novelty)</option>
                  <option value="POL-ENG-02">Engineering Capstone Standard (Safety · Datasets · Schemas)</option>
                  <option value="POL-RES-03">Pure Research Dissertation (Literature Delta · Peer Baseline)</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn-terracotta py-3.5 text-xs tracking-[0.22em] uppercase font-semibold cursor-pointer"
                >
                  {isSubmitting ? 'Igniting Verification Mesh...' : 'Dispatch to Review Pipeline'}
                </button>
              </div>
            </form>
          </div>

          {/* Right: Particle Orb that intensifies when running */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative">
              <ParticleOrb3D
                size={460}
                status={isSubmitting ? 'running' : 'idle'}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="font-mono text-[0.68rem] text-[#F5A623] tracking-[0.24em] uppercase">
                  {isSubmitting ? 'EXECUTION IN FLIGHT' : 'ORB STANDBY'}
                </span>
              </div>
            </div>
            <p className="font-headline text-xs tracking-[0.18em] text-[#6A6B78] uppercase max-w-xs">
              Particle core pulses with active token verification cycles
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}
