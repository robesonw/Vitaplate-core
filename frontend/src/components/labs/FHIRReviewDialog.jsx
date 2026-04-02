import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function FHIRReviewDialog({ open, onOpenChange, biomarkers, testDate }) {
  const [editedBiomarkers, setEditedBiomarkers] = useState(biomarkers || {});
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('importFHIRLabResults', {
        fhir_observations: [],
        biomarkers: editedBiomarkers,
        test_date: testDate,
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['labResults'] });
      toast.success(`Imported ${data.biomarker_count} lab values from Apple Health`);
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to save results');
    },
  });

  const getStatusIcon = (status) => {
    if (status === 'high') return <TrendingUp className="w-4 h-4 text-rose-500" />;
    if (status === 'low') return <TrendingDown className="w-4 h-4 text-blue-500" />;
    return <Minus className="w-4 h-4 text-emerald-500" />;
  };

  const getStatusColor = (status) => {
    if (status === 'high') return 'bg-rose-100 text-rose-700 border-rose-200';
    if (status === 'low') return 'bg-blue-100 text-blue-700 border-blue-200';
    return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Your Imported Lab Results</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Review and edit your lab values before saving. Out-of-range values are highlighted.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(editedBiomarkers || {}).map(([name, data]) => (
              <div key={name} className="p-3 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-start justify-between">
                  <label className="text-xs font-medium text-slate-700">{name}</label>
                  {getStatusIcon(data.status)}
                </div>

                <Input
                  type="number"
                  step="0.01"
                  value={data.value || ''}
                  onChange={(e) =>
                    setEditedBiomarkers(prev => ({
                      ...prev,
                      [name]: { ...prev[name], value: parseFloat(e.target.value) }
                    }))
                  }
                  className="text-sm"
                />

                <Input
                  type="text"
                  placeholder="Unit (e.g. mg/dL)"
                  value={data.unit || ''}
                  onChange={(e) =>
                    setEditedBiomarkers(prev => ({
                      ...prev,
                      [name]: { ...prev[name], unit: e.target.value }
                    }))
                  }
                  className="text-xs"
                />

                <Badge className={getStatusColor(data.status)}>
                  {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
                </Badge>
              </div>
            ))}
          </div>

          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
            <p className="text-xs text-indigo-900">
              <strong>✓ Test Date:</strong> {new Date(testDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="flex-1"
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Confirm & Save'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}