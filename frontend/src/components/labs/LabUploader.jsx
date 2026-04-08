import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle, Loader2, X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { supabase } from '@/api/base44Client';

const STATUS_COLORS = {
  high:       'bg-red-100 text-red-700 border-red-200',
  low:        'bg-blue-100 text-blue-700 border-blue-200',
  borderline: 'bg-amber-100 text-amber-700 border-amber-200',
  normal:     'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const STATUS_ICONS = {
  high:       <TrendingUp className="w-3 h-3" />,
  low:        <TrendingDown className="w-3 h-3" />,
  borderline: <AlertTriangle className="w-3 h-3" />,
  normal:     <CheckCircle className="w-3 h-3" />,
};

export default function LabUploader({ onUploadComplete }) {
  const [isDragging, setIsDragging]   = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress]       = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [result, setResult]           = useState(null);
  const [error, setError]             = useState('');
  const fileRef = useRef();

  const STEPS = [
    { label: 'Uploading file',             pct: 20 },
    { label: 'Reading PDF content',        pct: 40 },
    { label: 'Extracting biomarkers (AI)', pct: 70 },
    { label: 'Saving to health profile',   pct: 90 },
    { label: 'Complete',                   pct: 100 },
  ];

  const simulateProgress = () => {
    let i = 0;
    const tick = () => {
      if (i >= STEPS.length) return;
      setCurrentStep(STEPS[i].label);
      setProgress(STEPS[i].pct);
      i++;
      if (i < STEPS.length) setTimeout(tick, 1800);
    };
    tick();
  };

  const handleFile = async (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file. Lab results are usually downloaded as PDFs from your lab portal.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('File too large. Please upload a PDF under 20MB.');
      return;
    }

    setError('');
    setResult(null);
    setIsUploading(true);
    setProgress(5);
    setCurrentStep('Preparing upload...');
    simulateProgress();

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const formData = new FormData();
      formData.append('file', file);

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/labs/upload`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}` },
        body:    formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setProgress(100);
      setCurrentStep('Complete');
      setResult(data);
      toast.success(`${data.biomarkerCount} biomarkers extracted successfully!`);
      onUploadComplete?.(data.labResult);
    } catch (err) {
      setError(err.message);
      setProgress(0);
      setCurrentStep('');
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  if (result) {
    const { biomarkers } = result.labResult;
    const abnormal = Object.entries(biomarkers || {}).filter(([, v]) => v.status !== 'normal');
    const normal   = Object.entries(biomarkers || {}).filter(([, v]) => v.status === 'normal');

    return (
      <div className="space-y-4">
        {/* Success banner */}
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-emerald-800">Lab results processed successfully</p>
            <p className="text-sm text-emerald-600">
              {result.biomarkerCount} biomarkers extracted from {result.labProvider || 'your lab report'} · {result.labDate}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setResult(null)} className="flex-shrink-0">
            Upload Another
          </Button>
        </div>

        {/* Abnormal markers — highlighted */}
        {abnormal.length > 0 && (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                {abnormal.length} Marker{abnormal.length > 1 ? 's' : ''} Need Attention
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {abnormal.map(([name, data]) => (
                  <div key={name} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div>
                      <p className="font-medium text-sm text-slate-800">{name}</p>
                      <p className="text-xs text-slate-500">{data.reference}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-800">{data.value} <span className="font-normal text-xs text-slate-500">{data.unit}</span></p>
                      <Badge className={`text-xs ${STATUS_COLORS[data.status]} border`}>
                        <span className="flex items-center gap-1">
                          {STATUS_ICONS[data.status]}
                          {data.status}
                        </span>
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Normal markers */}
        {normal.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                {normal.length} Normal Markers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {normal.map(([name, data]) => (
                  <div key={name} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
                    <span className="text-xs font-medium text-emerald-800">{name}</span>
                    <span className="text-xs text-emerald-600">{data.value} {data.unit}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* CTA */}
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
          <p className="text-sm font-medium text-indigo-800 mb-2">
            🎯 Ready to generate your personalized meal plan?
          </p>
          <p className="text-xs text-indigo-600 mb-3">
            Your biomarkers are now saved. Head to Health Diet Hub to generate a meal plan that directly addresses your {abnormal.length > 0 ? `${abnormal.length} out-of-range marker${abnormal.length > 1 ? 's' : ''}` : 'health goals'}.
          </p>
          <Button
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
            onClick={() => window.location.href = '/HealthDietHub'}
          >
            Generate Meal Plan from My Labs →
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onClick={() => !isUploading && fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all
          ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}
          ${isUploading ? 'cursor-default pointer-events-none' : ''}`}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />

        {isUploading ? (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 mb-1">{currentStep}</p>
              <p className="text-xs text-slate-500">Hang tight — AI is reading your lab report</p>
            </div>
            <Progress value={progress} className="w-full max-w-xs mx-auto h-2" />
            <p className="text-xs text-slate-400">{progress}%</p>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-indigo-600" />
            </div>
            <p className="text-lg font-semibold text-slate-800 mb-1">
              Drop your lab report here
            </p>
            <p className="text-slate-500 text-sm mb-4">
              or click to browse — PDF files only
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-xs text-slate-400">
              {['Quest Diagnostics', 'LabCorp', 'BioReference', 'Any standard lab PDF'].map(lab => (
                <span key={lab} className="flex items-center gap-1">
                  <FileText className="w-3 h-3" /> {lab}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Upload failed</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* What gets extracted */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
        {[
          { label: 'Cholesterol Panel', items: 'LDL, HDL, Total, Triglycerides' },
          { label: 'Blood Sugar', items: 'Glucose, HbA1c, Insulin' },
          { label: 'Vitamins & Minerals', items: 'Vitamin D, B12, Iron, Ferritin' },
          { label: 'Organ Function', items: 'Liver, Kidney, Thyroid markers' },
        ].map(({ label, items }) => (
          <div key={label} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs font-semibold text-slate-700 mb-1">{label}</p>
            <p className="text-xs text-slate-500">{items}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
