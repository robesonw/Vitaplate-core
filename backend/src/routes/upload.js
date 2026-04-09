import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.js';
import { uploadProgressPhoto, uploadRecipeImage, getFoodImage } from '../services/storage.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error(`File type ${file.mimetype} not supported`));
  },
});

// ── POST /api/upload/photo — progress photo upload ────────────────────────────
router.post('/photo', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    const result = await uploadProgressPhoto({
      buffer:   req.file.buffer,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      userId:   req.userId,
    });

    res.json({
      success:  true,
      file_url: result.publicUrl,
      path:     result.path,
    });
  } catch (err) {
    console.error('Photo upload error:', err.message);
    res.status(422).json({ error: err.message });
  }
});

// ── POST /api/upload/recipe — recipe image upload ─────────────────────────────
router.post('/recipe', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    const result = await uploadRecipeImage({
      buffer:   req.file.buffer,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      userId:   req.userId,
    });

    res.json({ success: true, file_url: result.publicUrl });
  } catch (err) {
    res.status(422).json({ error: err.message });
  }
});

// ── GET /api/upload/food-image?query=salmon — get Unsplash food image ─────────
router.get('/food-image', requireAuth, async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: 'query required' });
    const result = await getFoodImage(query);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
