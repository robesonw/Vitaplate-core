import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Smartphone, CheckCircle2, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AppleHealthFHIRImport({ onImportSuccess, lastImport }) {
  const [isImporting, setIsImporting] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [reviewData, setReviewData] = useState(null);

  // Check if device is iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  const handleImportClick = async () => {
    if (!isIOS) {
      setShowGuide(true);
      return;
    }

    setIsImporting(true);
    try {
      // In a real implementation, this would use HealthKit framework
      // For now, we show a guide
      setShowGuide(true);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-base">Apple Health Records (FHIR)</CardTitle>
                <CardDescription>Auto-import lab results from your iPhone</CardDescription>
              </div>
            </div>
            {lastImport && <Badge className="bg-green-100 text-green-700">Connected</Badge>}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">
            If you've connected LabCorp, Quest Diagnostics, or your hospital to Apple Health, VitaPlate can automatically pull your lab results with a single tap.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
            <p className="text-xs font-semibold text-blue-900">✓ Supported Lab Providers:</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-blue-800">
              <div>• LabCorp</div>
              <div>• Quest Diagnostics</div>
              <div>• Epic Health Records</div>
              <div>• Hospital Systems</div>
            </div>
          </div>

          {lastImport && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-xs text-emerald-900">
                <CheckCircle2 className="inline w-4 h-4 mr-2" />
                <strong>Last imported:</strong> {new Date(lastImport.date).toLocaleDateString()} — {lastImport.count} values from {lastImport.provider}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleImportClick}
              disabled={isImporting}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                '📱 Import from Apple Health'
              )}
            </Button>

            {lastImport && (
              <Button variant="outline" className="flex-1">
                Check for New Results
              </Button>
            )}
          </div>

          {!isIOS && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-900">
                <AlertCircle className="inline w-4 h-4 mr-2" />
                This feature is only available on iPhone. You can use the PDF upload below on other devices.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Setup Guide Dialog */}
      <Dialog open={showGuide} onOpenChange={setShowGuide}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect Your Lab Provider</DialogTitle>
            <DialogDescription>
              Follow these steps to enable auto-import
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-3">
              {[
                { step: 1, title: 'Open Health App', desc: 'Open the Health app on your iPhone' },
                { step: 2, title: 'Go to Health Records', desc: 'Tap your profile icon → Health Records' },
                { step: 3, title: 'Add Your Provider', desc: 'Search for LabCorp, Quest, or your hospital' },
                { step: 4, title: 'Sign In & Authorize', desc: 'Sign in with your lab provider account and approve access' },
                { step: 5, title: 'Return & Import', desc: 'Come back here and tap "Import from Apple Health"' },
              ].map((item) => (
                <div key={item.step} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-900">
                <strong>No results yet?</strong> Your lab provider may not be connected. Check your Health app to verify the connection is active.
              </p>
            </div>

            <Button onClick={() => setShowGuide(false)} className="w-full">
              Got It
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}