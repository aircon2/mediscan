import { Router, Request, Response } from 'express';
import Fuse from 'fuse.js';
import { getStore, mergeData } from '../lib/store';
import type { GraphData, Effect } from '../types/graph';
import { analyzeMedicine } from "../api/openrouter"; 
import multer from "multer"; 
import fs from "fs"; 

const router = Router();
const upload = multer({ dest: "tmp/" });

function getNameParam(req: Request): string {
  return decodeURIComponent((req.params.name as string) || '');
}

function findByName<T extends { name: string }>(rec: Record<string, T>, name: string): T | undefined {
  return rec[name] ?? Object.values(rec).find((x) => x.name.toLowerCase() === name.toLowerCase());
}

/** 1. Parse med – return the medication JSON for the given name */
router.get('/medications/:name', (req: Request, res: Response) => {
  const store = getStore();
  const name = getNameParam(req);
  const medication = findByName(store.medications, name);
  if (!medication) {
    return res.status(404).json({ error: 'Medication not found', name });
  }
  return res.json(medication);
});

/** 2. Parse ingredient – return the ingredient JSON for the given name */
router.get('/ingredients/:name', (req: Request, res: Response) => {
  const store = getStore();
  const name = getNameParam(req);
  const ingredient = findByName(store.ingredients, name);
  if (!ingredient) {
    return res.status(404).json({ error: 'Ingredient not found', name });
  }
  return res.json(ingredient);
});

/** 3. Parse effect – return the effect JSON for the given name */
router.get('/effects/:name', (req: Request, res: Response) => {
  const store = getStore();
  const name = getNameParam(req);
  const effect = findByName(store.effects, name);
  if (!effect) {
    return res.status(404).json({ error: 'Effect not found', name });
  }
  return res.json(effect);
});

/** Search effects by name or description using Fuse.js fuzzy search. GET /api/search?q=keyword */
router.get('/search', (req: Request, res: Response) => {
  const store = getStore();
  const q = (req.query.q as string)?.trim();
  console.log('[backend /api/search] request, q:', q);
  if (!q) {
    return res.status(400).json({ error: 'Query parameter q is required.' });
  }
  const list: Effect[] = Object.values(store.effects);
  if (list.length === 0) return res.json({ effects: [] });

  const fuse = new Fuse(list, {
    keys: ['name', 'description'],
    threshold: 0.4,
    ignoreLocation: true,
  });
  const results = fuse.search(q);
  const effects = results.map((r) => r.item);
  console.log('[backend /api/search] results count:', effects.length);
  return res.json({ effects });
});

/** 4. Merge – receive JSON from frontend; if entity exists add to existing, else create new */
router.post('/data', (req: Request, res: Response) => {
  const body = req.body as Partial<GraphData>;
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'Send JSON with medications, ingredients, and/or effects.' });
  }
  try {
    const store = mergeData(body);
    return res.json({
      message: 'Data merged. Duplicates merged into existing; new entities created.',
      medicationCount: Object.keys(store.medications).length,
      ingredientCount: Object.keys(store.ingredients).length,
      effectCount: Object.keys(store.effects).length,
    });
  } catch (err) {
    console.error('Merge error:', err);
    return res.status(500).json({ error: 'Failed to merge data.' });
  }
});

// POST /api/analyze
// router.post("/analyze", async (req: Request, res: Response) => {
//   try {
//     const { image } = req.body;
//     if (!image) return res.status(400).json({ error: "No image provided" });

//     const result = await analyzeMedicine(image); // call OpenRouter
//     return res.json(result);
//   } catch (error) {
//     console.error("Analysis error:", error);
//     return res.status(500).json({ error: "Failed to analyze medicine" });
//   }
// });

// router.post("/analyze", upload.single("image"), async (req, res) => {
//   try {
//     if (!req.file) return res.status(400).json({ error: "No image uploaded" });

//     console.log("req.file:", req.file);

//     const filePath = req.file.path;

//     // Send the file path to analyzeMedicine (we’ll update it to accept a file instead of Base64)
//     const result = await analyzeMedicine(filePath);

//     // Delete temp file
//     fs.unlinkSync(filePath);

//     res.json(result);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to analyze medicine" });
//   }
// });

router.post('/analyze', async (req, res) => {
  try {
    console.log("req.body:", req.body)
    const { image } = req.body;
    
    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const result = await analyzeMedicine(image);
    res.json(result);
  } catch (error) {
    console.error('Analyze error:', error);
    res.status(500).json({ error: 'Failed to analyze medication' });
  }
});

export default router;
