import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { requireAuth } from '../middleware/auth.js';

const router  = Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// POST /api/ai/invoke — generic LLM call (replaces base44.integrations.Core.InvokeLLM)
router.post('/invoke', requireAuth, async (req, res) => {
  try {
    const { prompt, response_json_schema, max_tokens = 2048 } = req.body;
    if (!prompt) return res.status(400).json({ error: 'prompt required' });

    const systemPrompt = response_json_schema
      ? 'Respond ONLY with valid JSON matching the provided schema. No prose, no markdown.'
      : 'You are a helpful nutrition and health assistant for VitaPlate.';

    const response = await anthropic.messages.create({
      model:      'claude-haiku-4-5-20251001', // Cheap model for generic calls
      max_tokens,
      system:     systemPrompt,
      messages:   [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].text;

    // Try to parse JSON if schema was requested
    if (response_json_schema) {
      try {
        const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : cleaned);
        return res.json(parsed);
      } catch (parseErr) {
        console.error('JSON parse failed, returning raw text:', parseErr.message);
        return res.json({ text, _parseError: true });
      }
    }

    res.json({ text });
  } catch (err) {
    console.error('AI invoke error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
