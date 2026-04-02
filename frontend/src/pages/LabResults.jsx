import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, TrendingUp, TrendingDown, Minus, Loader2, Calendar, Trash2, CheckCircle2, AlertCircle, FlaskConical, Pill } from 'lucide-react';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AppleHealthFHIRImport from '../components/labs/AppleHealthFHIRImport';

export default function LabResults() {
  const [isUploading, setIsUploading] = useState(false);
  const [parseStep, setParseStep] = useState(''); // 'uploading' | 'parsing' | 'saving' | ''
  const [lastParsedResult, setLastParsedResult] = useState(null); // { biomarkers, date, error }
  const [uploadDate, setUploadDate] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState(null);

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const { data: labResults = [] } = useQuery({
    queryKey: ['labResults'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.LabResult.filter({ created_by: currentUser.email }, '-upload_date');
    },
  });

  const createLabResult = useMutation({
    mutationFn: (data) => base44.entities.LabResult.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labResults'] });
      toast.success('Lab result uploaded successfully!');
      setUploadDate('');
      setNotes('');
      setFile(null);
    },
  });

  const deleteLabResult = useMutation({
    mutationFn: (id) => base44.entities.LabResult.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labResults'] });
      toast.success('Lab result deleted successfully!');
    },
  });

  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    // Rename file to lowercase .pdf extension if needed
    if (selectedFile.name.toUpperCase().endsWith('.PDF') && !selectedFile.name.endsWith('.pdf')) {
      const newName = selectedFile.name.replace(/\.PDF$/i, '.pdf');
      const renamedFile = new File([selectedFile], newName, { type: 'application/pdf' });
      setFile(renamedFile);
    } else {
      setFile(selectedFile);
    }
  };

  const biomarkerSchema = {
    type: "object",
    description: "All biomarkers found in the lab report",
    additionalProperties: {
      type: "object",
      properties: {
        value: { type: "number", description: "Numeric result value" },
        unit: { type: "string", description: "Unit of measurement (e.g. mg/dL, U/L, %)" },
        status: { type: "string", enum: ["normal", "high", "low"], description: "Whether the value is normal, high, or low based on the reference range shown" },
        reference_range: { type: "string", description: "The reference range shown in the report e.g. '70-99 mg/dL'" }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !uploadDate) {
      toast.error('Please select a file and date');
      return;
    }

    setIsUploading(true);
    setLastParsedResult(null);

    try {
      // Step 1: Upload file
      setParseStep('uploading');
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Step 2: AI parsing - use InvokeLLM with file_urls for broad biomarker extraction
      setParseStep('parsing');
      let biomarkers = {};
      let parseError = null;

      try {
        const aiResult = await base44.integrations.Core.InvokeLLM({
          prompt: `You are a medical lab report parser. Analyze this lab report PDF and extract ALL biomarkers present.
Extract every single test result you can find, including but not limited to:
- Metabolic panel: Glucose, BUN, Creatinine, eGFR, Sodium, Potassium, Chloride, CO2, Calcium
- Liver enzymes: ALT, AST, ALP, GGT, Bilirubin (Total, Direct)
- Lipid panel: Total Cholesterol, LDL, HDL, Triglycerides, Non-HDL
- Complete blood count: WBC, RBC, Hemoglobin, Hematocrit, Platelets, MCV, MCH, MCHC
- Diabetes markers: HbA1c, Fasting Glucose, Insulin
- Thyroid: TSH, T3, T4, Free T3, Free T4
- Vitamins & minerals: Vitamin D (25-OH), Vitamin B12, Folate, Iron, Ferritin, TIBC, Transferrin Saturation
- Hormones: Testosterone, Estradiol, Cortisol, DHEA-S
- Inflammation: CRP, ESR, Homocysteine
- Other: Uric Acid, Albumin, Total Protein, A/G Ratio, Phosphorus, Magnesium

For each biomarker found, record its exact numeric value, unit, reference range, and whether it's normal/high/low based on the reference range in the report. If a value is flagged as abnormal (H or L or out of range), set status accordingly.

Return ONLY the biomarkers object - use the exact test name as the key (e.g. "Glucose", "HbA1c", "Vitamin D", "LDL Cholesterol").`,
          file_urls: [file_url],
          response_json_schema: {
            type: "object",
            properties: {
              biomarkers: biomarkerSchema,
              test_date: { type: "string", description: "Test date found in the report, YYYY-MM-DD format if possible" }
            }
          }
        });

        if (aiResult?.biomarkers && Object.keys(aiResult.biomarkers).length > 0) {
          biomarkers = aiResult.biomarkers;
          // Use date from report if found and user didn't specify
          if (aiResult.test_date && !uploadDate) {
            setUploadDate(aiResult.test_date);
          }
        } else {
          parseError = 'No biomarkers could be extracted from this file. The file may not be a standard lab report, or the format is not supported.';
        }
      } catch (err) {
        console.error('AI parsing error:', err);
        parseError = 'AI parsing failed. The file was saved without biomarker data.';
      }

      // Step 3: Save to database
      setParseStep('saving');
      const existingDates = new Set(labResults.map(r => r.upload_date));
      if (existingDates.has(uploadDate)) {
        toast.error('A result for this date already exists');
        setLastParsedResult({ error: 'A result for this date already exists' });
        return;
      }

      await createLabResult.mutateAsync({
        upload_date: uploadDate,
        file_url,
        biomarkers,
        notes: parseError ? `${notes} [Parse error: ${parseError}]` : notes
      });

      setLastParsedResult({ biomarkers, date: uploadDate, error: parseError });

      if (parseError) {
        toast.warning('File saved, but biomarker extraction failed. See details below.');
      } else {
        toast.success(`Successfully extracted ${Object.keys(biomarkers).length} biomarkers!`);
      }

      // Reset form
      setUploadDate('');
      setNotes('');
      setFile(null);
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';

    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Upload failed: ${error.message || 'Unknown error'}`);
      setLastParsedResult({ error: error.message || 'Upload failed' });
    } finally {
      setIsUploading(false);
      setParseStep('');
    }
  };

  const biomarkerList = ['ALT', 'AST', 'Glucose', 'Sodium', 'Potassium', 'eGFR', 'BUN', 'Creatinine', 'HbA1c', 'Total Cholesterol', 'LDL', 'HDL', 'Triglycerides', 'Vitamin D', 'Iron', 'Ferritin', 'TSH', 'Hemoglobin', 'WBC', 'Platelets'];

  const getTrendData = (biomarkerName) => {
    const seen = new Set();
    return labResults
      .filter(result => result.biomarkers?.[biomarkerName]?.value)
      .filter(result => {
        // Deduplicate by date - keep first occurrence (most recent due to sorting)
        if (seen.has(result.upload_date)) return false;
        seen.add(result.upload_date);
        return true;
      })
      .map(result => ({
        date: new Date(result.upload_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        value: result.biomarkers[biomarkerName].value
      }))
      .reverse();
  };

  const getStatusIcon = (status) => {
    if (status === 'high') return <TrendingUp className="w-4 h-4 text-rose-500" />;
    if (status === 'low') return <TrendingDown className="w-4 h-4 text-blue-500" />;
    return <Minus className="w-4 h-4 text-emerald-500" />;
  };

  const getStatusBadge = (status) => {
    const normalizedStatus = status?.toLowerCase();
    if (normalizedStatus === 'high') return <Badge className="bg-rose-100 text-rose-700 border-rose-200">High</Badge>;
    if (normalizedStatus === 'low') return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Low</Badge>;
    return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Normal</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Lab Results</h1>
        <p className="text-slate-600 mt-1">
          Upload and track your blood test results over time
        </p>
      </div>

      {/* Apple Health FHIR Import */}
      <AppleHealthFHIRImport
        onImportSuccess={() => queryClient.invalidateQueries({ queryKey: ['labResults'] })}
        lastImport={labResults.find(r => r.source === 'apple_health_fhir') ? {
          date: labResults.find(r => r.source === 'apple_health_fhir').upload_date,
          count: Object.keys(labResults.find(r => r.source === 'apple_health_fhir').biomarkers || {}).length,
          provider: labResults.find(r => r.source === 'apple_health_fhir').provider || 'Apple Health'
        } : null}
      />

      {/* Upload Form */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-indigo-600" />
            Upload New Lab Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-4 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-sm text-blue-900 font-medium mb-2">📋 AI-Powered Lab Analysis</p>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>PDF files only</strong> (.pdf format)</li>
              <li>• AI extracts <strong>all biomarkers</strong>: Glucose, Cholesterol (LDL/HDL), HbA1c, Vitamin D, Iron, Ferritin, Thyroid (TSH/T3/T4), CBC, liver enzymes, and more</li>
              <li>• Flags abnormal values automatically based on your report's reference ranges</li>
              <li>• Tracks trends over time across multiple uploads</li>
            </ul>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Test Date</Label>
                <Input
                  type="date"
                  value={uploadDate}
                  onChange={(e) => setUploadDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Upload PDF File</Label>
                <Input
                  type="file"
                  accept=".pdf,.PDF,application/pdf"
                  onChange={handleFileUpload}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                placeholder="Any additional notes about this test..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              disabled={isUploading}
              className="bg-gradient-to-r from-indigo-600 to-purple-600"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {parseStep === 'uploading' && 'Uploading file...'}
                  {parseStep === 'parsing' && 'AI is parsing biomarkers...'}
                  {parseStep === 'saving' && 'Saving results...'}
                  {!parseStep && 'Processing...'}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload & Analyze
                </>
              )}
            </Button>
          </form>

          {/* Parse loading state */}
          {isUploading && parseStep === 'parsing' && (
            <div className="mt-4 p-4 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-indigo-600 animate-spin flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-indigo-900">AI is reading your lab report...</p>
                <p className="text-xs text-indigo-600 mt-0.5">Extracting glucose, cholesterol, HbA1c, vitamins, and all other biomarkers</p>
              </div>
            </div>
          )}

          {/* Parse result preview */}
          {lastParsedResult && !isUploading && (
            <div className="mt-4">
              {lastParsedResult.error && !lastParsedResult.biomarkers && (
                <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-rose-900">Parsing failed</p>
                    <p className="text-xs text-rose-700 mt-0.5">{lastParsedResult.error}</p>
                  </div>
                </div>
              )}
              {lastParsedResult.biomarkers && Object.keys(lastParsedResult.biomarkers).length > 0 && (
                <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <p className="text-sm font-semibold text-emerald-900">
                      {Object.keys(lastParsedResult.biomarkers).length} biomarkers extracted successfully
                    </p>
                    {lastParsedResult.error && (
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">Partial</Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {Object.entries(lastParsedResult.biomarkers).map(([name, data]) => (
                      <div key={name} className="bg-white rounded-lg p-2.5 border border-emerald-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-slate-600 truncate">{name}</span>
                          {getStatusIcon(data.status)}
                        </div>
                        <p className="text-sm font-bold text-slate-900">
                          {data.value}
                          <span className="text-xs font-normal text-slate-500 ml-1">{data.unit}</span>
                        </p>
                        {getStatusBadge(data.status)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trends */}
      {labResults.length > 1 && (
        <>
          <h2 className="text-xl font-semibold text-slate-900">Biomarker Trends</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {biomarkerList.map((biomarker) => {
              const trendData = getTrendData(biomarker);
              if (trendData.length < 2) return null;

              return (
                <motion.div
                  key={biomarker}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="border-slate-200">
                    <CardHeader>
                      <CardTitle className="text-base">{biomarker} Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={trendData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: '12px' }} />
                          <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                          <Tooltip />
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#6366f1" 
                            strokeWidth={2}
                            dot={{ fill: '#6366f1', r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      {/* Complete History with Biomarkers */}
      {labResults.length > 0 && (
        <>
          <h2 className="text-xl font-semibold text-slate-900">Complete Test History</h2>

          <div className="space-y-4">
            {labResults.filter((result, index, self) => 
              index === self.findIndex(r => r.upload_date === result.upload_date)
            ).map((result, index) => (
              <Card key={result.id} className="border-slate-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {new Date(result.upload_date).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                          {result.source === 'apple_health_fhir' && (
                            <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">Apple Health</Badge>
                          )}
                        </CardTitle>
                        {result.notes && (
                          <p className="text-sm text-slate-500">{result.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={result.file_url} target="_blank" rel="noopener noreferrer">
                          <FileText className="w-4 h-4 mr-2" />
                          View PDF
                        </a>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        asChild
                        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                      >
                        <a href={`/SupplementRecommendations?labResultId=${result.id}`}>
                          <Pill className="w-4 h-4 mr-2" />
                          Supplements
                        </a>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this lab result?')) {
                            deleteLabResult.mutate(result.id);
                          }
                        }}
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {biomarkerList.map((biomarker) => {
                      const data = result.biomarkers?.[biomarker];
                      if (!data || !data.value) return null;

                      return (
                        <div key={biomarker} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                          <div className="flex items-start justify-between mb-2">
                            <p className="text-xs font-medium text-slate-600">{biomarker}</p>
                            {getStatusIcon(data.status)}
                          </div>
                          <p className="text-lg font-bold text-slate-900">
                            {data.value}
                            <span className="text-xs text-slate-500 ml-1">{data.unit}</span>
                          </p>
                          <div className="mt-2">
                            {getStatusBadge(data.status)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {Object.keys(result.biomarkers || {}).length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-3">
                      No biomarker data extracted from this test
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {labResults.length === 0 && (
        <Card className="border-slate-200 border-dashed">
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No Lab Results Yet
            </h3>
            <p className="text-slate-600">
              Upload your first blood test PDF to start tracking your biomarkers
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}