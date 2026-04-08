import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '../lib/prisma.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Supabase client for file storage
function getSupabaseStorage() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// ─── Upload PDF to Supabase Storage ──────────────────────────────────────────
export async function uploadLabPDF(fileBuffer, fileName, userId) {
  const supabase = getSupabaseStorage();
  const filePath = `labs/${userId}/${Date.now()}-${fileName}`;

  const { data, error } = await supabase.storage
    .from('lab-results')
    .upload(filePath, fileBuffer, {
      contentType: 'application/pdf',
      upsert: false,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data: { publicUrl } } = supabase.storage
    .from('lab-results')
    .getPublicUrl(filePath);

  return { filePath, publicUrl };
}

// ─── Extract text from PDF buffer ────────────────────────────────────────────
export async function extractPDFText(buffer) {
  try {
    // Dynamic import to handle ESM/CJS issues
    const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default;
    const data = await pdfParse(buffer);
    return data.text;
  } catch (err) {
    console.error('PDF parse error:', err.message);
    throw new Error('Could not read PDF. Please ensure it is a valid lab results document.');
  }
}

// ─── Extract biomarkers from text via Claude Haiku ───────────────────────────
const BIOMARKER_SYSTEM = `You are a medical lab results parser. Extract biomarker values from lab report text.

Return ONLY valid JSON. No prose, no markdown fences.

Extract these biomarkers if present (use exact key names):
- Lipids: "LDL Cholesterol", "HDL Cholesterol", "Total Cholesterol", "Triglycerides"
- Blood sugar: "Glucose", "HbA1c", "Fasting Glucose"  
- Liver: "ALT", "AST", "ALP", "Bilirubin"
- Kidney: "Creatinine", "BUN", "eGFR", "Uric Acid"
- Thyroid: "TSH", "T3 Free", "T4 Free", "T3 Total", "T4 Total"
- Vitamins: "Vitamin D", "Vitamin B12", "Folate", "Iron", "Ferritin"
- Inflammation: "CRP", "hsCRP", "ESR", "Homocysteine"
- Blood: "Hemoglobin", "Hematocrit", "WBC", "Platelets", "RBC"
- Electrolytes: "Sodium", "Potassium", "Magnesium", "Calcium", "Phosphorus"
- Hormones: "Testosterone", "Estradiol", "DHEA-S", "Cortisol", "Insulin"

For each biomarker found, determine status vs standard reference ranges:
- "normal" = within reference range
- "high" = above reference range  
- "low" = below reference range
- "borderline" = near the edge of reference range

Return format:
{
  "biomarkers": {
    "LDL Cholesterol": { "value": 145, "unit": "mg/dL", "status": "high", "reference": "< 100 mg/dL" },
    "Glucose": { "value": 98, "unit": "mg/dL", "status": "normal", "reference": "70-99 mg/dL" }
  },
  "lab_date": "2024-01-15",
  "lab_provider": "Quest Diagnostics",
  "patient_name": "John Smith",
  "extraction_confidence": "high"
}

Only include biomarkers you actually found in the text. Do not guess or hallucinate values.`;

export async function extractBiomarkersFromText(labText) {
  // Truncate very long PDFs — Haiku context window
  const truncated = labText.slice(0, 12000);

  const response = await anthropic.messages.create({
    model:      'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    system:     BIOMARKER_SYSTEM,
    messages:   [{
      role:    'user',
      content: `Extract all biomarkers from this lab report:\n\n${truncated}`,
    }],
  });

  const raw = response.content[0].text.trim();

  try {
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    return parsed;
  } catch {
    throw new Error('Could not parse biomarkers from lab report. Please try a different file.');
  }
}

// ─── Full pipeline: upload → extract text → extract biomarkers → save ────────
export async function processLabUpload({ fileBuffer, fileName, userId, notes }) {
  const steps = [];

  // 1. Upload to Supabase Storage
  steps.push('Uploading file...');
  let fileUrl = '';
  try {
    const { publicUrl } = await uploadLabPDF(fileBuffer, fileName, userId);
    fileUrl = publicUrl;
    steps.push('✅ File uploaded');
  } catch (err) {
    // Storage not configured — continue without file URL
    console.warn('Storage upload failed (continuing):', err.message);
    steps.push('⚠️  File storage skipped — proceeding with extraction');
  }

  // 2. Extract text from PDF
  steps.push('Reading PDF...');
  const labText = await extractPDFText(fileBuffer);
  steps.push(`✅ PDF read (${labText.length} characters)`);

  // 3. Extract biomarkers via AI
  steps.push('Extracting biomarkers...');
  const extracted = await extractBiomarkersFromText(labText);
  const biomarkerCount = Object.keys(extracted.biomarkers || {}).length;
  steps.push(`✅ ${biomarkerCount} biomarkers extracted`);

  if (biomarkerCount === 0) {
    throw new Error('No biomarkers found. Please ensure this is a blood lab results PDF.');
  }

  // 4. Save to database
  steps.push('Saving to your health profile...');
  const labDate = extracted.lab_date || new Date().toISOString().split('T')[0];

  const labResult = await prisma.labResult.create({
    data: {
      userId,
      uploadDate:  labDate,
      fileUrl,
      biomarkers:  extracted.biomarkers,
      notes:       notes || `Uploaded: ${fileName}. Provider: ${extracted.lab_provider || 'Unknown'}`,
    },
  });

  steps.push('✅ Saved to health profile');

  // 5. Identify abnormal markers for summary
  const abnormal = Object.entries(extracted.biomarkers || {})
    .filter(([, v]) => v.status !== 'normal')
    .map(([name, v]) => ({ name, value: v.value, unit: v.unit, status: v.status }));

  return {
    labResult,
    biomarkers:    extracted.biomarkers,
    biomarkerCount,
    abnormal,
    labDate,
    labProvider:   extracted.lab_provider,
    confidence:    extracted.extraction_confidence,
    steps,
  };
}

// ─── Setup helper — call once to create the storage bucket ───────────────────
export async function ensureStorageBucket() {
  try {
    const supabase = getSupabaseStorage();
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some(b => b.name === 'lab-results');
    if (!exists) {
      await supabase.storage.createBucket('lab-results', {
        public: false,
        allowedMimeTypes: ['application/pdf'],
        fileSizeLimit: 20 * 1024 * 1024,
      });
      console.log('✅ Created lab-results storage bucket');
    }
  } catch (err) {
    console.warn('⚠️  Could not create storage bucket (uploads will skip file storage):', err.message);
  }
}
