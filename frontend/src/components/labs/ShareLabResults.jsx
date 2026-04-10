import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Download, Twitter, Copy, CheckCircle, TrendingDown, TrendingUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// ─── Generate share image on canvas ──────────────────────────────────────────
async function generateShareImage(trends, labDates) {
  const canvas  = document.createElement('canvas');
  canvas.width  = 1200;
  canvas.height = 630;
  const ctx     = canvas.getContext('2d');

  // Background
  const bg = ctx.createLinearGradient(0, 0, 1200, 630);
  bg.addColorStop(0,   '#0f1117');
  bg.addColorStop(0.5, '#0d1331');
  bg.addColorStop(1,   '#0f1117');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1200, 630);

  // Dot grid
  ctx.fillStyle = 'rgba(99,102,241,0.05)';
  for (let x = 0; x < 1200; x += 32) {
    for (let y = 0; y < 630; y += 32) {
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Top badge
  ctx.fillStyle = 'rgba(99,102,241,0.15)';
  roundRect(ctx, 80, 60, 260, 36, 18);
  ctx.fill();
  ctx.fillStyle = '#818cf8';
  ctx.font = '500 13px -apple-system, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('🔬  My VitaPlate Lab Trends', 100, 83);

  // Main headline
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 52px -apple-system, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('My biomarkers improved.', 80, 175);

  const improved = Object.values(trends).filter(t => t.improved).length;
  const total    = Object.values(trends).length;

  ctx.fillStyle = '#a5b4fc';
  ctx.font = '400 24px -apple-system, system-ui, sans-serif';
  ctx.fillText(`${improved} of ${total} markers improved following my meal plan`, 80, 220);

  // Date range
  if (labDates?.latestDate && labDates?.previousDate) {
    ctx.fillStyle = '#475569';
    ctx.font = '400 16px -apple-system, system-ui, sans-serif';
    ctx.fillText(`${labDates.previousDate}  →  ${labDates.latestDate}`, 80, 255);
  }

  // Biomarker cards — show top 6 most impactful
  const topMarkers = Object.entries(trends)
    .filter(([, t]) => Math.abs(t.deltaPct) > 0)
    .sort((a, b) => Math.abs(b[1].deltaPct) - Math.abs(a[1].deltaPct))
    .slice(0, 6);

  const cols   = 3;
  const cardW  = 310;
  const cardH  = 100;
  const startX = 80;
  const startY = 300;
  const gapX   = 30;
  const gapY   = 18;

  topMarkers.forEach(([name, trend], i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x   = startX + col * (cardW + gapX);
    const y   = startY + row * (cardH + gapY);

    const improved = trend.improved;
    const color    = improved ? '#10b981' : '#ef4444';
    const bgColor  = improved ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)';
    const border   = improved ? 'rgba(16,185,129,0.2)'  : 'rgba(239,68,68,0.2)';

    // Card bg
    ctx.fillStyle = bgColor;
    roundRect(ctx, x, y, cardW, cardH, 12);
    ctx.fill();
    ctx.strokeStyle = border;
    ctx.lineWidth = 1;
    roundRect(ctx, x, y, cardW, cardH, 12);
    ctx.stroke();

    // Marker name
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '500 14px -apple-system, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(name, x + 16, y + 30);

    // Value change
    ctx.fillStyle = '#94a3b8';
    ctx.font = '400 13px -apple-system, system-ui, sans-serif';
    ctx.fillText(
      `${trend.previous.value} ${trend.current.unit}  →  ${trend.current.value} ${trend.current.unit}`,
      x + 16, y + 52
    );

    // Delta badge
    const delta    = trend.deltaPct;
    const deltaStr = `${delta > 0 ? '+' : ''}${delta}%`;
    ctx.fillStyle  = color;
    ctx.font       = 'bold 20px -apple-system, system-ui, sans-serif';
    ctx.textAlign  = 'right';
    ctx.fillText(deltaStr, x + cardW - 16, y + 62);

    // Arrow indicator
    ctx.fillStyle = color;
    ctx.font      = '16px -apple-system, system-ui, sans-serif';
    ctx.fillText(improved ? '↓' : '↑', x + cardW - 16, y + 85);
  });

  // VitaPlate branding — bottom right
  const brandX = 1200 - 80;
  const brandY = 590;

  // Logo circle
  const grad = ctx.createLinearGradient(brandX - 100, brandY - 20, brandX - 60, brandY + 10);
  grad.addColorStop(0, '#6366f1');
  grad.addColorStop(1, '#8b5cf6');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(brandX - 110, brandY - 22, 28, 28, 7);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font      = 'bold 14px -apple-system, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('V', brandX - 96, brandY - 3);

  ctx.fillStyle = '#ffffff';
  ctx.font      = 'bold 16px -apple-system, system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('VitaPlate', brandX, brandY);

  ctx.fillStyle = '#475569';
  ctx.font      = '400 13px -apple-system, system-ui, sans-serif';
  ctx.fillText('vitaplate.ai', brandX, brandY + 18);

  return canvas.toDataURL('image/png');
}

// Canvas helper
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ─── Share modal ──────────────────────────────────────────────────────────────
export default function ShareLabResults({ trends, labDates, improved, total }) {
  const [open, setOpen]         = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied]     = useState(false);

  const handleOpen = async () => {
    setOpen(true);
    setGenerating(true);
    try {
      const url = await generateShareImage(trends, labDates);
      setImageUrl(url);
    } catch (err) {
      toast.error('Could not generate share image');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    const a    = document.createElement('a');
    a.href     = imageUrl;
    a.download = 'vitaplate-lab-results.png';
    a.click();
    toast.success('Image downloaded!');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText('https://vitaplate.ai');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Link copied!');
    } catch {
      toast.error('Could not copy link');
    }
  };

  const twitterText = encodeURIComponent(
    `My biomarkers improved! ${improved} of ${total} markers trending better after following my @VitaPlate meal plan. \n\nYour blood work → your meal plan 🧬\nvitaplate.ai`
  );

  return (
    <>
      <Button onClick={handleOpen} size="sm" className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-500/20">
        <Share2 className="w-4 h-4 mr-2" />
        Share My Results
      </Button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1,    y: 0  }}
              exit={  { opacity: 0, scale: 0.92, y: 20  }}
              transition={{ duration: 0.2 }}
              className="bg-[#0f1117] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-white/5">
                <div>
                  <h3 className="font-bold text-white">Share your progress</h3>
                  <p className="text-slate-400 text-xs mt-0.5">
                    {improved} of {total} biomarkers improved
                  </p>
                </div>
                <button onClick={() => setOpen(false)} className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Image preview */}
              <div className="p-5">
                <div className="rounded-xl overflow-hidden bg-slate-800 aspect-[1200/630] flex items-center justify-center">
                  {generating ? (
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs">Generating your share card...</p>
                    </div>
                  ) : imageUrl ? (
                    <img src={imageUrl} alt="Lab results share card" className="w-full h-full object-cover" />
                  ) : null}
                </div>
              </div>

              {/* Share actions */}
              <div className="px-5 pb-5 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={handleDownload}
                    disabled={!imageUrl}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all disabled:opacity-40 text-white"
                  >
                    <Download className="w-5 h-5" />
                    <span className="text-xs font-medium">Save Image</span>
                  </button>

                  <a
                    href={`https://twitter.com/intent/tweet?text=${twitterText}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-sky-500/10 border border-sky-500/20 hover:bg-sky-500/20 transition-all text-sky-400"
                  >
                    <Twitter className="w-5 h-5" />
                    <span className="text-xs font-medium">Post on X</span>
                  </a>

                  <button
                    onClick={handleCopyLink}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white"
                  >
                    {copied
                      ? <CheckCircle className="w-5 h-5 text-emerald-400" />
                      : <Copy className="w-5 h-5" />}
                    <span className="text-xs font-medium">{copied ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                </div>

                <p className="text-slate-600 text-xs text-center">
                  Your specific lab values are shown — only share what you're comfortable with.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
