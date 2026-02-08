import { Router, Request, Response } from 'express';
import { getStore, mergeData } from '../lib/store';
import type { GraphData } from '../types/graph';

const router = Router();

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

export default router;
