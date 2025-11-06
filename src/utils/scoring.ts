import type {
  Product,
  Criterion,
  Weights,
  ComparisonResult,
  ProductScore,
  NormalizedScore,
} from '../types';

/**
 * Normalize a value using min-max normalization
 * If all values are equal, return 0.5
 * If goal is 'min', invert the normalization
 */
function normalize(
  value: number,
  min: number,
  max: number,
  goal: 'max' | 'min'
): number {
  if (max === min) {
    return 0.5;
  }
  
  const norm = (value - min) / (max - min);
  return goal === 'min' ? 1 - norm : norm;
}

/**
 * Calculate comparison scores for selected products
 */
export function calculateComparison(
  products: Product[],
  criteria: Criterion[],
  weights: Weights
): ComparisonResult {
  const scores: { [productId: string]: ProductScore } = {};
  
  // For each criterion, calculate normalized scores
  criteria.forEach((criterion) => {
    const values = products.map((p) => p.specs[criterion.key] || 0);
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    products.forEach((product, idx) => {
      if (!scores[product.id]) {
        scores[product.id] = { total: 0 };
      }
      
      const raw = values[idx];
      const norm = normalize(raw, min, max, criterion.goal);
      const weight = weights[criterion.key] || 0;
      const contrib = norm * weight;
      
      scores[product.id][criterion.key] = {
        raw,
        norm,
        weight,
        contrib,
      };
      
      scores[product.id].total += contrib;
    });
  });
  
  // Sort products by total score with tie-breakers
  const ranking = [...products].sort((a, b) => {
    const scoreA = scores[a.id].total;
    const scoreB = scores[b.id].total;
    
    // 1. Higher score wins
    if (Math.abs(scoreA - scoreB) > 0.0001) {
      return scoreB - scoreA;
    }
    
    // 2. Lower price wins
    const priceA = a.specs.price_inr || Infinity;
    const priceB = b.specs.price_inr || Infinity;
    if (priceA !== priceB) {
      return priceA - priceB;
    }
    
    // 3. Newer release year wins
    if (a.releaseYear !== b.releaseYear) {
      return b.releaseYear - a.releaseYear;
    }
    
    // 4. Brand alphabetical
    return a.brand.localeCompare(b.brand);
  }).map((p) => p.id);
  
  // Generate rationale for winner
  const winnerId = ranking[0];
  const winnerScore = scores[winnerId];
  
  // Get all criterion contributions
  const contributions = criteria.map((c) => ({
    criterion: c.label,
    key: c.key,
    contribution: winnerScore[c.key]?.contrib || 0,
  }));
  
  // Sort by contribution
  contributions.sort((a, b) => b.contribution - a.contribution);
  
  // Top 3 helps
  const helps = contributions.slice(0, 3).map((c) => ({
    criterion: c.criterion,
    contribution: c.contribution,
  }));
  
  // Find the worst performing criterion (lowest contribution)
  const hurts = contributions
    .slice(-1)
    .filter((c) => c.contribution < 0.15) // Only include if significantly low
    .map((c) => ({
      criterion: c.criterion,
      contribution: c.contribution,
    }));
  
  return {
    products: products.map((p) => ({
      id: p.id,
      brand: p.brand,
      model: p.model,
    })),
    criteria,
    scores,
    ranking,
    rationale: {
      winnerId,
      helps,
      hurts,
    },
  };
}

/**
 * Validate and normalize weights to sum to 1.0
 */
export function normalizeWeights(weights: { [key: string]: number }): Weights {
  const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
  
  if (total === 0) {
    return {};
  }
  
  const normalized: Weights = {};
  Object.keys(weights).forEach((key) => {
    normalized[key] = weights[key] / total;
  });
  
  return normalized;
}

/**
 * Check if weights sum to 100 (for slider validation)
 */
export function validateWeightSum(weights: { [key: string]: number }): boolean {
  const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
  return Math.abs(total - 100) < 0.1;
}

/**
 * Auto-balance weights to sum to 100
 * Adjusts the last modified weight to make the total exactly 100
 */
export function balanceWeights(
  weights: { [key: string]: number },
  lastModifiedKey: string
): { [key: string]: number } {
  const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
  const diff = total - 100;
  
  if (Math.abs(diff) < 0.1) {
    return weights;
  }
  
  const balanced = { ...weights };
  const currentValue = balanced[lastModifiedKey];
  const newValue = Math.max(0, Math.min(100, currentValue - diff));
  balanced[lastModifiedKey] = newValue;
  
  return balanced;
}
