import { Router } from 'express';
import multer from 'multer';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { processLabUpload } from '../services/labUpload.js';
import { generateSupplementRecommendations } from '../services/ai.js';

const router = Router();

// Multer — memory storage (we stream to Supabase, don't write to disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 20 * 1024 * 1024 }, // 20MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are accepted for lab results'));
    }
  },
});

// ── GET /api/labs ─────────────────────────────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const labs = await prisma.labResult.findMany({
      where:   { userId: req.userId },
      orderBy: { uploadDate: 'desc' },
    });
    res.json(labs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/labs/upload — PDF upload + biomarker extraction ─────────────────
router.post('/upload', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file provided' });
    }

    const result = await processLabUpload({
      fileBuffer: req.file.buffer,
      fileName:   req.file.originalname,
      userId:     req.userId,
      notes:      req.body.notes,
    });

    res.status(201).json({
      success:       true,
      labResult:     result.labResult,
      biomarkerCount: result.biomarkerCount,
      abnormal:      result.abnormal,
      labDate:       result.labDate,
      labProvider:   result.labProvider,
      confidence:    result.confidence,
      message:       `Successfully extracted ${result.biomarkerCount} biomarkers from your lab report.`,
      abnormalCount: result.abnormal.length,
      steps:         result.steps,
    });
  } catch (err) {
    console.error('Lab upload error:', err.message);
    res.status(422).json({
      error:   err.message,
      hint:    'Ensure the file is a valid blood lab results PDF (Quest, LabCorp, or similar)',
    });
  }
});

// ── POST /api/labs — manual entry (no PDF) ───────────────────────────────────
router.post('/', requireAuth, async (req, res) => {
  try {
    const { uploadDate, biomarkers, notes } = req.body;
    const lab = await prisma.labResult.create({
      data: {
        userId:     req.userId,
        uploadDate: uploadDate || new Date().toISOString().split('T')[0],
        biomarkers: biomarkers || {},
        notes,
      },
    });
    res.status(201).json(lab);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/labs/supplements — rules-based supplement recs from latest lab ───
router.get('/supplements', requireAuth, async (req, res) => {
  try {
    const latest = await prisma.labResult.findFirst({
      where:   { userId: req.userId },
      orderBy: { uploadDate: 'desc' },
    });
    if (!latest) {
      return res.status(404).json({ error: 'No lab results found. Upload your first lab report to get supplement recommendations.' });
    }
    const result = generateSupplementRecommendations(latest.biomarkers);
    res.json({ ...result, labDate: latest.uploadDate, labId: latest.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/labs/trends — compare latest two lab results ───────────────────
router.get('/trends', requireAuth, async (req, res) => {
  try {
    const labs = await prisma.labResult.findMany({
      where:   { userId: req.userId },
      orderBy: { uploadDate: 'desc' },
      take:    5,
    });

    if (labs.length < 2) {
      return res.json({
        hasTrends: false,
        message:   'Upload at least 2 lab results to see your health trends',
        labs,
      });
    }

    const latest   = labs[0];
    const previous = labs[1];
    const trends   = {};

    // Compare each marker in latest vs previous
    for (const [marker, data] of Object.entries(latest.biomarkers || {})) {
      const prev = previous.biomarkers?.[marker];
      if (!prev || prev.value == null || data.value == null) continue;

      const delta    = data.value - prev.value;
      const deltaPct = prev.value !== 0 ? ((delta / prev.value) * 100).toFixed(1) : 0;
      const improved = isImprovement(marker, delta);

      trends[marker] = {
        current:   { value: data.value,  unit: data.unit,  status: data.status,  date: latest.uploadDate },
        previous:  { value: prev.value,  unit: prev.unit,  status: prev.status,  date: previous.uploadDate },
        delta:     parseFloat(delta.toFixed(2)),
        deltaPct:  parseFloat(deltaPct),
        improved,
        direction: delta > 0 ? 'up' : delta < 0 ? 'down' : 'stable',
      };
    }

    res.json({
      hasTrends:    true,
      trends,
      latestDate:   latest.uploadDate,
      previousDate: previous.uploadDate,
      totalMarkers: Object.keys(trends).length,
      improved:     Object.values(trends).filter(t => t.improved).length,
      worsened:     Object.values(trends).filter(t => !t.improved && t.delta !== 0).length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lower is better for these markers
const LOWER_IS_BETTER = new Set([
  'LDL Cholesterol', 'Total Cholesterol', 'Triglycerides',
  'Glucose', 'HbA1c', 'Fasting Glucose',
  'CRP', 'hsCRP', 'ESR', 'Homocysteine',
  'ALT', 'AST', 'ALP', 'Creatinine', 'BUN',
  'TSH', 'Uric Acid', 'Insulin',
]);

function isImprovement(marker, delta) {
  if (LOWER_IS_BETTER.has(marker)) return delta <= 0;
  return delta >= 0; // Higher is better (HDL, Vitamin D, B12, etc.)
}

// ── PUT /api/labs/:id ─────────────────────────────────────────────────────────
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const lab = await prisma.labResult.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!lab) return res.status(404).json({ error: 'Not found' });
    const updated = await prisma.labResult.update({
      where: { id: lab.id },
      data:  req.body,
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/labs/:id ──────────────────────────────────────────────────────
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const lab = await prisma.labResult.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!lab) return res.status(404).json({ error: 'Not found' });
    await prisma.labResult.delete({ where: { id: lab.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
