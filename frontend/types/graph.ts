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
  medications: Record<string, Medication>;
  ingredients: Record<string, Ingredient>;
  effects: Record<string, Effect>;
}
