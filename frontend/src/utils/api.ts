const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5001';

export interface Medication {
  name: string;
  ingredients: string[];
  sideEffects: string[];
  symptomsTreated: string[];
}

export interface Ingredient {
  name: string;
  medications: string[];
  description?: string;
}

export interface Effect {
  name: string;
  medicationsCausingIt: string[];
  medicationsTreatingIt: string[];
  description?: string;
}

export interface GraphData {
  medications?: Record<string, Medication>;
  ingredients?: Record<string, Ingredient>;
  effects?: Record<string, Effect>;
}

export interface SendDataResponse {
  message: string;
  medicationCount: number;
  ingredientCount: number;
  effectCount: number;
}

export interface SearchEffectsResponse {
  effects: Effect[];
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? res.statusText);
  }
  return res.json();
}

async function apiPost<T>(path: string, body: object): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? res.statusText);
  }
  return res.json();
}

/** 1. Parse med – return the medication JSON for the given name */
export function getMedication(name: string): Promise<Medication> {
  return apiGet<Medication>(`/api/medications/${encodeURIComponent(name)}`);
}

/** 2. Parse ingredient – return the ingredient JSON for the given name */
export function getIngredient(name: string): Promise<Ingredient> {
  return apiGet<Ingredient>(`/api/ingredients/${encodeURIComponent(name)}`);
}

/** 3. Parse effect – return the effect JSON for the given name */
export function getEffect(name: string): Promise<Effect> {
  return apiGet<Effect>(`/api/effects/${encodeURIComponent(name)}`);
}

/** Search effects by keyword (name or description); returns matching effect JSON(s). */
export function searchEffects(keyword: string): Promise<SearchEffectsResponse> {
  return apiGet<SearchEffectsResponse>(`/api/search?q=${encodeURIComponent(keyword.trim())}`);
}

/** 4. Merge – send JSON from frontend; duplicates are merged into existing, new entities created */
export function sendData(data: GraphData): Promise<SendDataResponse> {
  return apiPost<SendDataResponse>('/api/data', data);
}
