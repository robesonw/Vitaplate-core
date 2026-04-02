import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function OrderFeedbackDialog({ affiliateClickId, isOpen, onClose }) {
  const updateMutation = useMutation({
    mutationFn: (id) =>
      base44.asServiceRole.entities.AffiliateClick.update(id, {
        order_completed: true,
        order_completed_at: new Date().toISOString(),
      }),
    onSuccess: () => {
      toast.success('Thanks for letting us know!');
      onClose();
    },
    onError: () => {
      toast.error('Failed to save feedback');
    },
  });

  if (!affiliateClickId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Order Confirmation</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-slate-600">
            Did your order go through successfully? Your feedback helps us improve the experience.
          </p>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Not Yet
            </Button>
            <Button
              onClick={() => updateMutation.mutate(affiliateClickId)}
              disabled={updateMutation.isPending}
              className="flex-1"
            >
              Yes, Order Placed! ✓
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}