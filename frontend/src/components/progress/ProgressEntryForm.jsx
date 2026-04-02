import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { Loader2, Upload, Calendar, Camera } from 'lucide-react';
import { toast } from 'sonner';

export default function ProgressEntryForm({ onSuccess }) {
  const [isLoading, setIsLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [weightUnit, setWeightUnit] = useState('kg');

  const [formData, setFormData] = useState({
    entry_date: new Date().toISOString().split('T')[0],
    weight: '',
    body_fat_percentage: '',
    waist_cm: '',
    hip_cm: '',
    chest_cm: '',
    arm_cm: '',
    notes: '',
    energy_level: '3',
    mood: '3'
  });

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoPreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.weight) {
      toast.error('Weight is required');
      return;
    }

    setIsLoading(true);
    try {
      let photoUrl = null;

      // Upload photo if provided
      if (photoFile) {
        const uploadedPhoto = await base44.integrations.Core.UploadFile({
          file: photoFile
        });
        photoUrl = uploadedPhoto.file_url;
      }

      // Create progress entry
      await base44.entities.ProgressEntry.create({
        entry_date: formData.entry_date,
        weight: parseFloat(formData.weight),
        weight_unit: weightUnit,
        body_fat_percentage: formData.body_fat_percentage ? parseFloat(formData.body_fat_percentage) : null,
        waist_cm: formData.waist_cm ? parseFloat(formData.waist_cm) : null,
        hip_cm: formData.hip_cm ? parseFloat(formData.hip_cm) : null,
        chest_cm: formData.chest_cm ? parseFloat(formData.chest_cm) : null,
        arm_cm: formData.arm_cm ? parseFloat(formData.arm_cm) : null,
        photo_url: photoUrl,
        notes: formData.notes,
        energy_level: parseInt(formData.energy_level),
        mood: parseInt(formData.mood)
      });

      toast.success('Progress entry saved! 🎉');
      
      // Reset form
      setFormData({
        entry_date: new Date().toISOString().split('T')[0],
        weight: '',
        body_fat_percentage: '',
        waist_cm: '',
        hip_cm: '',
        chest_cm: '',
        arm_cm: '',
        notes: '',
        energy_level: '3',
        mood: '3'
      });
      setPhotoFile(null);
      setPhotoPreview(null);

      onSuccess?.();
    } catch (error) {
      console.error('Error saving progress entry:', error);
      toast.error('Failed to save progress entry');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-emerald-600" />
          Log Your Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date */}
          <div>
            <Label htmlFor="entry_date">Date</Label>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <Input
                id="entry_date"
                type="date"
                value={formData.entry_date}
                onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
              />
            </div>
          </div>

          {/* Weight */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="weight">Weight *</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                placeholder="e.g., 75.5"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="weight_unit">Unit</Label>
              <Select value={weightUnit} onValueChange={setWeightUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">Kilograms (kg)</SelectItem>
                  <SelectItem value="lbs">Pounds (lbs)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Body Measurements */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="body_fat">Body Fat %</Label>
              <Input
                id="body_fat"
                type="number"
                step="0.1"
                min="0"
                max="100"
                placeholder="e.g., 25.5"
                value={formData.body_fat_percentage}
                onChange={(e) => setFormData({ ...formData, body_fat_percentage: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="waist">Waist (cm)</Label>
              <Input
                id="waist"
                type="number"
                step="0.5"
                placeholder="e.g., 85"
                value={formData.waist_cm}
                onChange={(e) => setFormData({ ...formData, waist_cm: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="hip">Hip (cm)</Label>
              <Input
                id="hip"
                type="number"
                step="0.5"
                placeholder="e.g., 95"
                value={formData.hip_cm}
                onChange={(e) => setFormData({ ...formData, hip_cm: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="chest">Chest (cm)</Label>
              <Input
                id="chest"
                type="number"
                step="0.5"
                placeholder="e.g., 100"
                value={formData.chest_cm}
                onChange={(e) => setFormData({ ...formData, chest_cm: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="arm">Arm (cm)</Label>
              <Input
                id="arm"
                type="number"
                step="0.5"
                placeholder="e.g., 32"
                value={formData.arm_cm}
                onChange={(e) => setFormData({ ...formData, arm_cm: e.target.value })}
              />
            </div>
          </div>

          {/* Photo Upload */}
          <div>
            <Label htmlFor="photo">Progress Photo</Label>
            <div className="border-2 border-dashed border-emerald-300 rounded-lg p-4 text-center">
              {photoPreview ? (
                <div className="space-y-2">
                  <img src={photoPreview} alt="Preview" className="w-32 h-32 object-cover rounded mx-auto" />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPhotoFile(null);
                      setPhotoPreview(null);
                    }}
                  >
                    Remove Photo
                  </Button>
                </div>
              ) : (
                <div>
                  <Camera className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600 mb-2">Click to upload a progress photo</p>
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('photo').click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Photo
                  </Button>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2">Private photo - only you can see it</p>
          </div>

          {/* Energy & Mood */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="energy">Energy Level</Label>
              <Select value={formData.energy_level} onValueChange={(value) => setFormData({ ...formData, energy_level: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">😴 Very Low</SelectItem>
                  <SelectItem value="2">😒 Low</SelectItem>
                  <SelectItem value="3">😐 Normal</SelectItem>
                  <SelectItem value="4">😊 Good</SelectItem>
                  <SelectItem value="5">🔥 Excellent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="mood">Mood</Label>
              <Select value={formData.mood} onValueChange={(value) => setFormData({ ...formData, mood: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">😢 Very Low</SelectItem>
                  <SelectItem value="2">😕 Low</SelectItem>
                  <SelectItem value="3">😐 Neutral</SelectItem>
                  <SelectItem value="4">🙂 Good</SelectItem>
                  <SelectItem value="5">😄 Great</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="How are you feeling? Any wins this week? What's changed?"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Log Progress Entry
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}