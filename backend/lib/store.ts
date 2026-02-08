import * as fs from 'fs';
import * as path from 'path';
import type { GraphData, Medication, Ingredient, Effect } from '../types/graph';

const DB_PATH = path.join(__dirname, '../data/db.json');

let store: GraphData = {
  medications: {},
  ingredients: {},
  effects: {},
};

function loadFromFile(): GraphData {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    const data = JSON.parse(raw) as GraphData;
    const ensure = <T>(rec: Record<string, T> | undefined, def: Record<string, T>) => (rec && typeof rec === 'object' ? rec : def);
    store = {
      medications: ensure(data.medications, {}),
      ingredients: ensure(data.ingredients, {}),
      effects: ensure(data.effects, {}),
    };
    ensureEffectArrays(store.effects);
    ensureIngredientArrays(store.ingredients);
  } catch {
    store = { medications: {}, ingredients: {}, effects: {} };
  }
  return store;
}

function ensureEffectArrays(effects: Record<string, Effect>): void {
  for (const k of Object.keys(effects)) {
    const e = effects[k];
    if (e && !Array.isArray(e.medicationsCausingIt)) e.medicationsCausingIt = [];
    if (e && !Array.isArray(e.medicationsTreatingIt)) e.medicationsTreatingIt = [];
  }
}

function ensureIngredientArrays(ingredients: Record<string, Ingredient>): void {
  for (const k of Object.keys(ingredients)) {
    const i = ingredients[k];
    if (i && !Array.isArray(i.medications)) i.medications = [];
  }
}

function saveToFile(): void {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save db.json:', err);
  }
}

function norm(s: string): string {
  return (s ?? '').trim();
}

/** Union of string arrays (case-insensitive dedupe by name). */
function unionNames(a: string[] | undefined, b: string[] | undefined): string[] {
  const set = new Set<string>();
  for (const x of [...(a ?? []), ...(b ?? [])]) {
    const key = (x ?? '').trim();
    if (!key) continue;
    const lower = key.toLowerCase();
    if (![...set].some((s) => s.toLowerCase() === lower)) set.add(key);
  }
  return [...set];
}

/** Remove medName from an ingredient's medications list. */
function removeMedFromIngredient(ingName: string, medName: string): void {
  const key = Object.keys(store.ingredients).find((k) => k.toLowerCase() === ingName.toLowerCase());
  if (!key) return;
  const list = store.ingredients[key].medications ?? [];
  store.ingredients[key].medications = list.filter((m) => m.toLowerCase() !== medName.toLowerCase());
}

function removeMedFromEffectCausing(effectName: string, medName: string): void {
  const key = Object.keys(store.effects).find((k) => k.toLowerCase() === effectName.toLowerCase());
  if (!key) return;
  const e = store.effects[key];
  if (e) e.medicationsCausingIt = (e.medicationsCausingIt ?? []).filter((m) => m.toLowerCase() !== medName.toLowerCase());
}

function removeMedFromEffectTreating(effectName: string, medName: string): void {
  const key = Object.keys(store.effects).find((k) => k.toLowerCase() === effectName.toLowerCase());
  if (!key) return;
  const e = store.effects[key];
  if (e) e.medicationsTreatingIt = (e.medicationsTreatingIt ?? []).filter((m) => m.toLowerCase() !== medName.toLowerCase());
}

function addToIngredient(ingName: string, medName: string): void {
  const key = Object.keys(store.ingredients).find((k) => k.toLowerCase() === ingName.toLowerCase()) ?? ingName;
  if (!store.ingredients[key]) store.ingredients[key] = { name: ingName, medications: [] };
  const list = store.ingredients[key].medications ?? [];
  if (!list.some((m) => m.toLowerCase() === medName.toLowerCase())) list.push(medName);
  store.ingredients[key].medications = list;
}

function addToEffectCausing(effectName: string, medName: string): void {
  const key = Object.keys(store.effects).find((k) => k.toLowerCase() === effectName.toLowerCase()) ?? effectName;
  if (!store.effects[key]) store.effects[key] = { name: effectName, medicationsCausingIt: [], medicationsTreatingIt: [] };
  const list = store.effects[key].medicationsCausingIt ?? [];
  if (!list.some((m) => m.toLowerCase() === medName.toLowerCase())) list.push(medName);
  store.effects[key].medicationsCausingIt = list;
}

function addToEffectTreating(effectName: string, medName: string): void {
  const key = Object.keys(store.effects).find((k) => k.toLowerCase() === effectName.toLowerCase()) ?? effectName;
  if (!store.effects[key]) store.effects[key] = { name: effectName, medicationsCausingIt: [], medicationsTreatingIt: [] };
  const list = store.effects[key].medicationsTreatingIt ?? [];
  if (!list.some((m) => m.toLowerCase() === medName.toLowerCase())) list.push(medName);
  store.effects[key].medicationsTreatingIt = list;
}

/** Find existing key by entity name (case-insensitive). */
function findMedicationKeyByName(name: string): string | undefined {
  const n = norm(name).toLowerCase();
  if (!n) return undefined;
  return Object.keys(store.medications).find((k) => (store.medications[k].name || '').toLowerCase() === n);
}
function findIngredientKeyByName(name: string): string | undefined {
  const n = norm(name).toLowerCase();
  if (!n) return undefined;
  return Object.keys(store.ingredients).find((k) => (store.ingredients[k].name || '').toLowerCase() === n);
}
function findEffectKeyByName(name: string): string | undefined {
  const n = norm(name).toLowerCase();
  if (!n) return undefined;
  return Object.keys(store.effects).find((k) => (store.effects[k].name || '').toLowerCase() === n);
}

/**
 * Duplicate check: by name only (case-insensitive). If exists, update every field with incoming changes.
 */
export function mergeData(data: Partial<GraphData>): GraphData {
  if (data.medications && typeof data.medications === 'object') {
    for (const [, med] of Object.entries(data.medications)) {
      if (!med || !med.name) continue;
      const nameNorm = norm(med.name) || '';
      const existingKey = findMedicationKeyByName(nameNorm);
      const existing = existingKey ? store.medications[existingKey] : undefined;
      const isDuplicate = !!existing;

      const merged: Medication = isDuplicate
        ? {
            name: nameNorm || existing!.name,
            ingredients: unionNames(existing!.ingredients, med.ingredients),
            sideEffects: unionNames(existing!.sideEffects, med.sideEffects),
            symptomsTreated: unionNames(existing!.symptomsTreated, med.symptomsTreated),
          }
        : {
            name: nameNorm,
            ingredients: med.ingredients ?? [],
            sideEffects: med.sideEffects ?? [],
            symptomsTreated: med.symptomsTreated ?? [],
          };

      const key = existingKey ?? nameNorm;
      store.medications[key] = merged;
      for (const ing of merged.ingredients ?? []) addToIngredient(ing, merged.name);
      for (const e of merged.sideEffects ?? []) addToEffectCausing(e, merged.name);
      for (const e of merged.symptomsTreated ?? []) addToEffectTreating(e, merged.name);
    }
  }

  if (data.ingredients && typeof data.ingredients === 'object') {
    for (const [, ing] of Object.entries(data.ingredients)) {
      if (!ing || !ing.name) continue;
      const nameNorm = norm(ing.name) || '';
      const existingKey = findIngredientKeyByName(nameNorm);
      const existing = existingKey ? store.ingredients[existingKey] : undefined;
      const isDuplicate = !!existing;
      const key = existingKey ?? nameNorm;
      const updated: Ingredient = isDuplicate
        ? {
            name: nameNorm || existing!.name,
            medications: unionNames(existing!.medications, ing.medications),
            description: ing.description !== undefined ? ing.description : existing!.description,
          }
        : {
            name: nameNorm,
            medications: ing.medications ?? [],
            description: ing.description,
          };
      store.ingredients[key] = updated;
    }
  }

  if (data.effects && typeof data.effects === 'object') {
    for (const [, eff] of Object.entries(data.effects)) {
      if (!eff || !eff.name) continue;
      const nameNorm = norm(eff.name) || '';
      const existingKey = findEffectKeyByName(nameNorm);
      const existing = existingKey ? store.effects[existingKey] : undefined;
      const isDuplicate = !!existing;
      const key = existingKey ?? nameNorm;
      const updated: Effect = isDuplicate
        ? {
            name: nameNorm || existing!.name,
            medicationsCausingIt: unionNames(existing!.medicationsCausingIt, eff.medicationsCausingIt),
            medicationsTreatingIt: unionNames(existing!.medicationsTreatingIt, eff.medicationsTreatingIt),
            description: eff.description !== undefined ? eff.description : existing!.description,
          }
        : {
            name: nameNorm,
            medicationsCausingIt: eff.medicationsCausingIt ?? [],
            medicationsTreatingIt: eff.medicationsTreatingIt ?? [],
            description: eff.description,
          };
      store.effects[key] = updated;
    }
  }

  saveToFile();
  return store;
}

export function getStore(): GraphData {
  return store;
}

export function initStore(): GraphData {
  return loadFromFile();
}
