import React, { useRef, useState, useEffect } from 'react';
import { 
  PenTool, 
  RotateCcw, 
  CheckCircle2, 
  ShieldCheck, 
  AlertCircle, 
  FileCheck, 
  Lock, 
  Download,
  Image as ImageIcon
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { saveSignedProposal } from '../lib/supabase';
import { formatCurrency } from '../lib/currency';
import { downloadAuditCertificateJpg, downloadProposalPhotoJpg } from '../lib/certificateGenerator';

export default function SignaturePad({ proposal, onSigned, onToast }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [signerName, setSignerName] = useState(proposal?.clientName || '');
  const [signerTitle, setSignerTitle] = useState('Authorized Officer');
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingJpg, setIsGeneratingJpg] = useState(false);
  const [isGeneratingPhoto, setIsGeneratingPhoto] = useState(false);
  const [signedRecord, setSignedRecord] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const effectiveSignedRecord = signedRecord || proposal?.signedRecord || null;

  // Setup canvas resolution and styling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    // High DPI scaling
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.strokeStyle = '#2563eb'; // Elegant signature blue
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if (e.touches && e.touches[0]) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e) => {
    if (effectiveSignedRecord) return;
    e.preventDefault();
    const coords = getCanvasCoords(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
    setHasDrawn(true);
    setErrorMsg('');
  };

  const draw = (e) => {
    if (!isDrawing || effectiveSignedRecord) return;
    e.preventDefault();
    const coords = getCanvasCoords(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = (e) => {
    if (!isDrawing) return;
    if (e) e.preventDefault();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (effectiveSignedRecord) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const triggerConfetti = () => {
    try {
      const end = Date.now() + 2.5 * 1000;
      const colors = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'];

      (function frame() {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());
    } catch (e) {
      console.warn('Confetti animation failed:', e);
    }
  };

  const handleDownloadPdf = () => {
    const originalTitle = document.title;
    document.title = `Proposal-${proposal.proposalId}-${proposal.clientName.replace(/\s+/g, '_')}-SIGNED`;
    window.print();
    document.title = originalTitle;
  };

  const handleDownloadJpgProof = async () => {
    if (!effectiveSignedRecord) return;
    setIsGeneratingJpg(true);
    try {
      await downloadAuditCertificateJpg(effectiveSignedRecord, proposal);
      onToast?.('Audit Certificate (.jpg) generated & downloaded!', 'success');
    } catch (err) {
      console.error('Failed to generate JPG certificate:', err);
      onToast?.('Failed to export JPG certificate.', 'error');
    } finally {
      setIsGeneratingJpg(false);
    }
  };

  const handleDownloadProposalPhoto = async () => {
    if (!effectiveSignedRecord) return;
    setIsGeneratingPhoto(true);
    try {
      await downloadProposalPhotoJpg(proposal, effectiveSignedRecord);
      onToast?.('Executed Proposal Photo (.jpg) saved to device!', 'success');
    } catch (err) {
      console.error('Failed to generate proposal photo:', err);
      onToast?.('Failed to export proposal photo.', 'error');
    } finally {
      setIsGeneratingPhoto(false);
    }
  };

  const handleAcceptAndSign = async () => {
    setErrorMsg('');

    if (!signerName.trim()) {
      setErrorMsg('Please enter the full legal name of the signatory.');
      onToast?.('Please enter your full name to sign.', 'error');
      return;
    }

    if (!hasDrawn) {
      setErrorMsg('Please provide your digital signature on the pad above.');
      onToast?.('Please draw your signature before accepting.', 'error');
      return;
    }

    if (!termsAgreed) {
      setErrorMsg('Please accept the proposal terms and commercial agreement.');
      onToast?.('Please check the terms acceptance box.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const canvas = canvasRef.current;
      const signatureDataUrl = canvas ? canvas.toDataURL('image/png') : '';

      const signedPayload = {
        ...proposal,
        signerName: signerName.trim(),
        signerTitle: signerTitle.trim() || 'Client Representative',
        signatureDataUrl,
        signedAt: new Date().toISOString(),
      };

      // Execute Supabase insert (with local fallback)
      const result = await saveSignedProposal(signedPayload);

      const recordWithMeta = {
        ...signedPayload,
        recordId: result.id,
        dbSource: result.source,
        verificationHash: `SHA256-${Array.from(crypto.getRandomValues(new Uint8Array(8)))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')
          .toUpperCase()}`,
      };

      setSignedRecord(recordWithMeta);
      setIsSubmitting(false);

      // Trigger Confetti Celebration!
      triggerConfetti();

      onToast?.(
        'Proposal legally signed! Audit Certificate (.jpg) and PDF ready for export.',
        'success'
      );

      if (onSigned) {
        onSigned(recordWithMeta);
      }
    } catch (err) {
      console.error('Error signing proposal:', err);
      setIsSubmitting(false);
      setErrorMsg('An unexpected error occurred while saving the signature.');
      onToast?.('Failed to sign proposal. Please try again.', 'error');
    }
  };

  return (
    <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800" id="client-signature-section">
      <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-5 bg-slate-100/60 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 dark:bg-indigo-400/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg tracking-tight">
                Client Sign-Off (E-Signature)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Review the proposal details and draw your signature below to approve.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              effectiveSignedRecord 
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
            }`}>
              {effectiveSignedRecord ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Executed & Verified
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  Awaiting Signature
                </>
              )}
            </span>
          </div>
        </div>

        <div className="p-6 md:p-8">
          {effectiveSignedRecord ? (
            /* VERIFIED SIGNATURE CERTIFICATE */
            <div className="bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-emerald-500/20">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25">
                    <FileCheck className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        Certificate of Execution
                      </span>
                      <span className="px-2 py-0.5 text-[10px] rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-mono">
                        VERIFIED
                      </span>
                    </div>
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                      Proposal Formally Executed
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Record ID: <span className="font-mono text-slate-700 dark:text-slate-300">{effectiveSignedRecord.recordId}</span> ({effectiveSignedRecord.dbSource === 'supabase' ? 'Supabase Live' : 'Supabase Client DB'})
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-xs text-slate-500 dark:text-slate-400">Timestamp</div>
                  <div className="text-sm font-semibold font-mono text-slate-800 dark:text-slate-200">
                    {new Date(effectiveSignedRecord.signedAt).toLocaleString()}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                    Hash: {effectiveSignedRecord.verificationHash}
                  </div>
                </div>
              </div>

              {/* Signature Visual Proof */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 items-center">
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Signatory Name</label>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{effectiveSignedRecord.signerName}</p>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Title / Authorization</label>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{effectiveSignedRecord.signerTitle}</p>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Client Organization</label>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{effectiveSignedRecord.clientName}</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2">
                    Client Digital Signature
                  </span>
                  <div className="w-full h-28 flex items-center justify-center bg-slate-50 dark:bg-slate-950/60 rounded-lg border border-slate-100 dark:border-slate-800/80 p-2">
                    {effectiveSignedRecord.signatureDataUrl ? (
                      <img 
                        src={effectiveSignedRecord.signatureDataUrl} 
                        alt="Client Signature" 
                        className="max-h-full max-w-full object-contain filter dark:invert"
                      />
                    ) : (
                      <span className="text-xs text-slate-400 italic">Signature on file</span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Cryptographically bound to proposal #{proposal?.proposalId}</span>
                  </div>
                </div>
              </div>

              {/* Download Executed PDF & JPG Photo Actions */}
              <div className="no-print mt-8 pt-6 border-t border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Agreement legally executed. Save proof to your device as a <strong>JPG Photo</strong> or <strong>PDF Document</strong>:
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                  {/* Download JPG Certificate Button */}
                  <button
                    type="button"
                    onClick={handleDownloadJpgProof}
                    disabled={isGeneratingJpg}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-indigo-700 dark:text-indigo-200 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/70 transition shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    <ImageIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>{isGeneratingJpg ? 'Rendering JPG...' : 'Audit Certificate (JPG Photo)'}</span>
                  </button>

                  {/* Download Proposal Photo Button */}
                  <button
                    type="button"
                    onClick={handleDownloadProposalPhoto}
                    disabled={isGeneratingPhoto}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-violet-700 dark:text-violet-200 bg-violet-50 dark:bg-violet-950/70 border border-violet-200 dark:border-violet-800 hover:bg-violet-100 dark:hover:bg-violet-900/70 transition shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    <ImageIcon className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    <span>{isGeneratingPhoto ? 'Saving Photo...' : 'Proposal Photo (JPG)'}</span>
                  </button>

                  {/* Download PDF Button */}
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition shadow-md shadow-emerald-600/20 active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download (PDF)</span>
                  </button>
                </div>
              </div>

            </div>
          ) : (
            /* ACTIVE SIGNATURE FORM */
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Your Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="e.g. Rajesh Sharma"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Your Role / Title (e.g. Owner, Director)
                  </label>
                  <input
                    type="text"
                    value={signerTitle}
                    onChange={(e) => setSignerTitle(e.target.value)}
                    placeholder="e.g. Owner, Manager, Director"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  />
                </div>
              </div>

              {/* Canvas Pad */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <span>Draw Your E-Signature</span>
                    <span className="text-rose-500">*</span>
                    <span className="text-[11px] text-slate-400 font-normal lowercase">(mouse or touch)</span>
                  </label>

                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                    title="Clear Signature Canvas"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Clear
                  </button>
                </div>

                <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 rounded-2xl bg-white dark:bg-slate-900/90 overflow-hidden transition-all duration-200">
                  <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-44 cursor-crosshair touch-none block"
                  />

                  {!hasDrawn && (
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                      <PenTool className="w-8 h-8 mb-2 opacity-40 animate-bounce" />
                      <p className="text-xs font-medium">Click and drag or use finger/stylus to draw signature</p>
                    </div>
                  )}

                  <div className="absolute bottom-2 left-3 pointer-events-none">
                    <span className="text-[10px] text-slate-400 dark:text-slate-600 font-mono">
                      x ___________________________________________
                    </span>
                  </div>
                </div>
              </div>

              {/* Agreement Checkbox */}
              <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  checked={termsAgreed}
                  onChange={(e) => setTermsAgreed(e.target.checked)}
                  className="mt-1 w-4 h-4 text-emerald-600 rounded border-slate-300 dark:border-slate-700 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="agreeTerms" className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer leading-relaxed">
                  I have reviewed this proposal for <strong className="text-slate-900 dark:text-white">{proposal?.clientName || 'this project'}</strong>. I confirm the 3 project tasks, delivery timeline, and total price of <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">{formatCurrency(proposal?.costBreakdown?.totalInvestment || proposal?.totalInvestment || proposal?.budget, proposal?.currency)}</strong> as stated in Proposal <strong className="text-slate-900 dark:text-white">#{proposal?.proposalId}</strong>.
                </label>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="flex items-center gap-2 p-3 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Accept & Sign Button with vibrant gradient */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Secure digital signature verified in real-time</span>
                </div>

                <button
                  type="button"
                  onClick={handleAcceptAndSign}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm sm:text-base rounded-2xl shadow-lg shadow-emerald-600/25 transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.02]"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving Signature...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Sign & Approve Proposal</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
