// src/pages/StudentSubmit.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AureliaHeader } from '../components/AureliaHeader';
import { getActiveReview, submitRevision } from '../utils/storage';

export default function StudentSubmit() {
  const navigate = useNavigate();
  const currentReview = getActiveReview();
  const nextVersion = currentReview.version + 1;

  const [fileName, setFileName] = useState('');
  const [changelog, setChangelog] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName) {
      alert('Please select or drop your manuscript document (PDF or DOCX).');
      return;
    }
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 900));

    submitRevision(fileName, changelog || 'Addressed figure captions and bibliography formatting as requested.');
    setIsSubmitting(false);
    setSuccessNotice(true);

    setTimeout(() => {
      navigate('/student');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#050508] text-[#E8E8EE] flex flex-col font-body">
      <AureliaHeader />

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 pt-28 pb-20 space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 font-mono text-xs text-[#8A8B98]">
          <Link to="/student" className="hover:text-white transition-colors">
            ← Student Desk
          </Link>
          <span>/</span>
          <span className="text-[#F5A623]">Submit Manuscript Revision v{nextVersion}.0</span>
        </div>

        {/* Page Title */}
        <div className="border-b border-[rgba(245,166,35,0.18)] pb-6">
          <span className="font-mono text-xs text-[#F5A623] tracking-[0.24em] uppercase block mb-1">
            Student Submission Portal · Revision Cycle
          </span>
          <h1 className="font-headline text-3xl md:text-4xl font-light text-white tracking-wide">
            Upload Corrected Report (Version {nextVersion}.0)
          </h1>
          <p className="text-xs font-mono text-[#8A8B98] mt-1.5">
            Project: {currentReview.title}
          </p>
        </div>

        {/* Submission Form */}
        <form onSubmit={handleSubmit} className="mounted-document p-8 md:p-10 space-y-8">
          
          {/* File Upload Drop Area */}
          <div>
            <label className="block font-headline text-xs tracking-[0.18em] text-[#8A8B98] uppercase mb-2">
              Manuscript Document File (.pdf or .docx)
            </label>
            <div className="border border-dashed border-[rgba(245,166,35,0.3)] hover:border-[#F5A623] p-10 text-center transition-colors bg-[#070814] relative rounded-none cursor-pointer">
              <input
                type="file"
                accept=".pdf,.docx"
                onChange={(e) => {
                  if (e.target.files?.[0]) setFileName(e.target.files[0].name);
                }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="w-12 h-12 rounded-full border border-[rgba(245,166,35,0.4)] flex items-center justify-center mx-auto mb-3">
                <span className="text-xl text-[#F5A623]">↑</span>
              </div>
              <div className="font-mono text-sm text-[#F5A623] tracking-wider mb-1 font-medium">
                {fileName ? `READY: ${fileName}` : 'CLICK OR DRAG REVISED PDF / DOCX HERE'}
              </div>
              <div className="font-mono text-[0.68rem] text-[#6A6B78]">
                Strict layout preservation · Automated verification cycle runs upon receipt
              </div>
            </div>
          </div>

          {/* Quick Pre-fills for Demo */}
          <div className="flex flex-wrap gap-2 text-xs font-mono">
            <span className="text-[#8A8B98] self-center mr-1">Demo sample files:</span>
            <button
              type="button"
              onClick={() => {
                setFileName(`alex_rivera_thesis_v${nextVersion}_revised.pdf`);
                setChangelog('1. Fixed Figure 7 caption below diagram.\n2. Added IEEE 802.15.4 standard to References bibliography as [34].\n3. Inserted Zenodo DOI for the 142k sensor dataset in Section 4.3.');
              }}
              className="px-3 py-1 bg-white/[0.04] border border-white/10 hover:border-[#F5A623] text-white transition-colors"
            >
              alex_rivera_thesis_v{nextVersion}_revised.pdf
            </button>
            <button
              type="button"
              onClick={() => {
                setFileName(`alex_rivera_thesis_v${nextVersion}.docx`);
                setChangelog('Applied typography modifications and added empirical dataset DOI link.');
              }}
              className="px-3 py-1 bg-white/[0.04] border border-white/10 hover:border-[#F5A623] text-white transition-colors"
            >
              alex_rivera_thesis_v{nextVersion}.docx
            </button>
          </div>

          {/* Revision Changelog Notes */}
          <div>
            <label className="block font-headline text-xs tracking-[0.18em] text-[#8A8B98] uppercase mb-1.5">
              Author Correction Notes / Response to Faculty Guidance
            </label>
            <textarea
              rows={4}
              required
              placeholder="Detail specific modifications made in this version (e.g. Added Figure 7 caption, added IEEE citation to bibliography, inserted Zenodo repository link)..."
              value={changelog}
              onChange={(e) => setChangelog(e.target.value)}
              className="w-full bg-[#070814] border border-white/10 px-4 py-3 text-xs text-white focus:outline-none focus:border-[#F5A623] font-body leading-relaxed"
            />
          </div>

          {/* Supervisor Notification Notice */}
          <div className="p-4 bg-[#070814] border border-white/10 font-mono text-xs text-[#A4A5B6] space-y-1">
            <div className="text-[#F5A623] uppercase tracking-wider text-[0.68rem]">
              Automated Notification Protocol
            </div>
            <p>
              Submitting will automatically notify supervisor <span className="text-white">Dr. Evelyn Chen</span> that Version {nextVersion}.0 has been uploaded.
              Background verification checks will execute against your updated document.
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || successNotice}
              className="w-full btn-terracotta py-3.5 text-xs tracking-[0.22em] uppercase font-semibold cursor-pointer"
            >
              {isSubmitting ? 'Transmitting Revision...' : successNotice ? '✓ Revision Registered!' : `Transmit Version ${nextVersion}.0 for Faculty Review`}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
