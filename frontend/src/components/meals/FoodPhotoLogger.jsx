import React, { useRef, useState } from 'react';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function FoodPhotoLogger({ onPhotoSelected, isLoading }) {
  const [showDialog, setShowDialog] = useState(false);
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const handlePhotoSelected = async (file) => {
    if (!file) return;

    // Validate file is image
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Convert to base64 for sending to AI
    const reader = new FileReader();
    reader.onload = async (e) => {
      setShowDialog(false);
      await onPhotoSelected(e.target.result, file);
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        variant="outline"
        disabled={isLoading}
        className="gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Camera className="w-4 h-4" />
            Photo Log
          </>
        )}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Log Meal with Photo</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <Button
              onClick={() => cameraInputRef.current?.click()}
              className="w-full h-12 gap-2"
              variant="outline"
            >
              <Camera className="w-5 h-5" />
              Take a Photo
            </Button>

            <Button
              onClick={() => galleryInputRef.current?.click()}
              className="w-full h-12 gap-2"
              variant="outline"
            >
              <Upload className="w-5 h-5" />
              Choose from Gallery
            </Button>
          </div>

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => handlePhotoSelected(e.target.files?.[0])}
            className="hidden"
          />

          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handlePhotoSelected(e.target.files?.[0])}
            className="hidden"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}