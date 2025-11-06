// Type definitions for the product comparison app

export interface Criterion {
  key: string;
  label: string;
  type: 'number';
  goal: 'max' | 'min';
  unit?: string;
}

export interface Preset {
  [key: string]: number; // criterion key -> weight value (0-100)
}

export interface Category {
  id: string;
  name: string;
  criteria: Criterion[];
  presets: {
    [presetName: string]: Preset;
  };
}

export interface ProductSpecs {
  [key: string]: number; // criterion key -> value
}

export interface Product {
  id: string;
  categoryId: string;
  brand: string;
  model: string;
  specs: ProductSpecs;
  releaseYear: number;
}

export interface Weights {
  [key: string]: number; // criterion key -> weight (0-1)
}

export interface NormalizedScore {
  raw: number;
  norm: number;
  weight: number;
  contrib: number;
}

export interface ProductScore {
  [criterionKey: string]: NormalizedScore;
  total: number;
}

export interface ComparisonResult {
  products: Array<{
    id: string;
    brand: string;
    model: string;
  }>;
  criteria: Criterion[];
  scores: {
    [productId: string]: ProductScore;
  };
  ranking: string[]; // product IDs in rank order
  rationale: {
    winnerId: string;
    helps: Array<{ criterion: string; contribution: number }>;
    hurts: Array<{ criterion: string; contribution: number }>;
  };
}

export interface ValidationError {
  row?: number;
  field: string;
  message: string;
}

export interface UploadResult {
  added: number;
  skipped: number;
  errors: ValidationError[];
}
