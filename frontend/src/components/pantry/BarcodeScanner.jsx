import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Barcode, X } from 'lucide-react';
import { toast } from 'sonner';

export default function BarcodeScanner({ onBarcodeDetected, isOpen, onOpenChange }) {
  const videoRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsScanning(true);
      }
    } catch (err) {
      toast.error('Unable to access camera. Check permissions.');
      console.error('Camera error:', err);
    }
  };

  const stopScanning = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setIsScanning(false);
  };

  const handleDetection = (barcode) => {
    // Here you'd typically send the barcode to a food database API
    // For now, just call the callback with the raw barcode
    onBarcodeDetected(barcode);
    stopScanning();
    onOpenChange(false);
    toast.success('Barcode scanned! Please select the product.');
  };

  React.useEffect(() => {
    if (isOpen && !isScanning) {
      startScanning();
    }
    return () => {
      stopScanning();
    };
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) stopScanning();
      onOpenChange(open);
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Barcode className="w-5 h-5" />
            Scan Barcode
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {!isScanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <p className="text-white text-sm">Initializing camera...</p>
              </div>
            )}
          </div>
          
          <p className="text-sm text-slate-600 text-center">
            Point your camera at the barcode. It will be automatically detected.
          </p>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                stopScanning();
                onOpenChange(false);
              }}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}