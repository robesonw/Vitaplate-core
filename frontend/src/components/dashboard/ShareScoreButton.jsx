import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Share2, Download, Copy, Loader2, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ShareScoreButton({ healthScore, scoreBiomarkers, user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [scoreImage, setScoreImage] = useState(null);
  const [isCopied, setIsCopied] = useState(false);

  const generateImage = async () => {
    try {
      setIsGenerating(true);
      const biomarkers = scoreBiomarkers || [
        { name: 'Cholesterol', status: 'optimal' },
        { name: 'Blood Sugar', status: 'good' },
        { name: 'Vitamin D', status: 'warning' }
      ];

      const response = await base44.functions.invoke('generateScoreImage', {
        health_score: healthScore,
        score_label: healthScore >= 80 ? 'Excellent Health' : healthScore >= 60 ? 'Good Health' : 'Fair Health',
        biomarkers: biomarkers.slice(0, 3)
      });

      setScoreImage(response.data.image);
    } catch (error) {
      toast.error('Failed to generate score card');
      console.error('Generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!scoreImage) return;
    
    const link = document.createElement('a');
    link.href = scoreImage;
    link.download = `vitaplate-score-${user?.full_name?.replace(/\s+/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Score card downloaded!');
  };

  const handleCopyLink = () => {
    const scoreLink = `${window.location.origin}/scorecard/${user?.id}`;
    navigator.clipboard.writeText(scoreLink);
    setIsCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleShareInstagram = () => {
    if (!scoreImage) return;
    toast.info('Right-click the image and select "Save Image" to post to Instagram');
  };

  return (
    <>
      <Button
        onClick={() => {
          setIsOpen(true);
          generateImage();
        }}
        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white gap-2"
      >
        <Share2 className="w-4 h-4" />
        Share My Score
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Share Your Health Score</DialogTitle>
            <DialogDescription>
              Generate and share your VitaPlate health score with friends
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Image Preview */}
            {isGenerating ? (
              <div className="flex items-center justify-center h-64 bg-slate-50 rounded-lg">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : scoreImage ? (
              <div className="rounded-lg overflow-hidden border border-slate-200">
                <img src={scoreImage} alt="Health Score Card" className="w-full" />
              </div>
            ) : null}

            {/* Action Buttons */}
            {scoreImage && (
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleDownload}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>

                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  className="gap-2"
                >
                  {isCopied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Link
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleShareInstagram}
                  className="col-span-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share to Instagram
                </Button>
              </div>
            )}

            {/* Sharecard Link Preview */}
            {scoreImage && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-600 font-medium mb-2">Share this link:</p>
                <p className="text-xs text-slate-500 font-mono break-all">
                  {window.location.origin}/scorecard/{user?.id}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}