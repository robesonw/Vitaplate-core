import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';
import { Download, FileText, Loader2, Lock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export default function MonthlyReportDialog({ open, onOpenChange, subscriptionStatus = 'free' }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [clinicalMode, setClinicalMode] = useState(false);

  const isPro = subscriptionStatus === 'pro' || subscriptionStatus === 'premium';

  const handleGenerateReport = async () => {
    if (!isPro && !clinicalMode) {
      // This is the preview for free users
      toast.info('Upgrade to Pro to generate full reports');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await base44.functions.invoke('generateMonthlyReport', {
        month: selectedMonth.getMonth() + 1,
        year: selectedMonth.getFullYear(),
        clinicalMode
      });

      if (response.data.pdf) {
        // Download the PDF
        const link = document.createElement('a');
        link.href = response.data.pdf;
        link.download = response.data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success('Report downloaded successfully!');
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const monthName = format(selectedMonth, 'MMMM yyyy');
  const monthStart = format(startOfMonth(selectedMonth), 'MMM d');
  const monthEnd = format(endOfMonth(selectedMonth), 'MMM d, yyyy');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Monthly Health Report
          </DialogTitle>
          <DialogDescription>
            Generate a comprehensive PDF summary of your health metrics
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Month Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">
              Select Month
            </label>
            <input
              type="month"
              value={`${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}`}
              onChange={(e) => {
                const [year, month] = e.target.value.split('-');
                setSelectedMonth(new Date(year, month - 1, 1));
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
            <p className="text-xs text-slate-500 mt-1">
              {monthStart} - {monthEnd}
            </p>
          </div>

          {/* Report Preview */}
          <Card className="border-slate-200 bg-slate-50">
            <CardContent className="p-4 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Lab Results Summary</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Nutrition Analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Meal Plan Adherence</span>
              </div>
              <div className={`flex items-center gap-2 ${!isPro ? 'text-slate-400' : 'text-emerald-600'}`}>
                <CheckCircle2 className={`w-4 h-4 ${!isPro ? 'text-slate-300' : 'text-emerald-600'}`} />
                <span>Progress Photos {!isPro && <Lock className="w-3 h-3 inline ml-1" />}</span>
              </div>
              <div className={`flex items-center gap-2 ${!isPro ? 'text-slate-400' : 'text-emerald-600'}`}>
                <CheckCircle2 className={`w-4 h-4 ${!isPro ? 'text-slate-300' : 'text-emerald-600'}`} />
                <span>Achievements {!isPro && <Lock className="w-3 h-3 inline ml-1" />}</span>
              </div>
            </CardContent>
          </Card>

          {/* Pro Features */}
          {!isPro && (
            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="p-4 space-y-2">
                <p className="text-sm font-medium text-purple-900">✨ Pro Features Locked</p>
                <p className="text-xs text-purple-800">
                  Upgrade to Pro to unlock progress photos, achievements, and share reports with your doctor.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Clinical Mode (Pro only) */}
          {isPro && (
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <input
                type="checkbox"
                id="clinical"
                checked={clinicalMode}
                onChange={(e) => setClinicalMode(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="clinical" className="text-sm text-slate-700">
                Clinical version (no photos, data only)
              </label>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerateReport}
              disabled={isGenerating || !isPro}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  {isPro ? 'Generate Report' : 'View Preview'}
                </>
              )}
            </Button>
          </div>

          {/* Free User CTA */}
          {!isPro && (
            <Button
              variant="default"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Upgrade to Pro
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}