import type { ProjectMetric } from "@shared/schema";

interface MetricScore {
  name: string;
  value: string;
  normalizedScore: number;
  type: string;
  confidence: number; // 0-1, indicates data quality/reliability
}

interface MetricTypeWeight {
  type: string;
  weight: number;
  metrics: MetricScore[];
}

// Industry benchmarks and reference values (can be customized per industry)
interface MetricBenchmark {
  min: number;      // Minimum expected value (worst case)
  max: number;      // Maximum expected value (best case)
  target: number;   // Target value (good performance)
  unit: string;     // Standard unit
  direction: 'higher' | 'lower'; // Whether higher or lower is better
}

// Benchmark database for common metrics
const metricBenchmarks: Record<string, MetricBenchmark> = {
  // CO2 Emissions (tons) - lower is better for emissions
  'co2': { min: 0, max: 50, target: 5, unit: 'tons', direction: 'lower' },
  'carbon': { min: 0, max: 50, target: 5, unit: 'tons', direction: 'lower' },
  'emission': { min: 0, max: 50, target: 5, unit: 'tons', direction: 'lower' },
  // CO2 Reduction (tons) - higher is better for reductions
  'co2_reduction': { min: 0, max: 50, target: 25, unit: 'tons', direction: 'higher' },
  'carbon_reduction': { min: 0, max: 50, target: 25, unit: 'tons', direction: 'higher' },
  'emission_reduction': { min: 0, max: 50, target: 25, unit: 'tons', direction: 'higher' },
  
  // Water (liters/gallons)
  'water': { min: 0, max: 100000, target: 10000, unit: 'liters', direction: 'lower' },
  'water_saved': { min: 0, max: 100000, target: 50000, unit: 'liters', direction: 'higher' },
  
  // Energy (kWh)
  'energy': { min: 0, max: 100000, target: 10000, unit: 'kWh', direction: 'lower' },
  'energy_saved': { min: 0, max: 100000, target: 50000, unit: 'kWh', direction: 'higher' },
  'energy_generated': { min: 0, max: 100000, target: 50000, unit: 'kWh', direction: 'higher' },
  'solar': { min: 0, max: 100000, target: 50000, unit: 'kWh', direction: 'higher' },
  'renewable': { min: 0, max: 100000, target: 50000, unit: 'kWh', direction: 'higher' },
  'electricity': { min: 0, max: 100000, target: 10000, unit: 'kWh', direction: 'lower' },
  
  // Cost (USD)
  'cost': { min: 0, max: 1000000, target: 100000, unit: 'USD', direction: 'lower' },
  'cost_saved': { min: 0, max: 1000000, target: 500000, unit: 'USD', direction: 'higher' },
  'saving': { min: 0, max: 1000000, target: 500000, unit: 'USD', direction: 'higher' },
  
  // ROI (%)
  'roi': { min: 0, max: 100, target: 20, unit: '%', direction: 'higher' },
  
  // Waste (kg)
  'waste': { min: 0, max: 10000, target: 1000, unit: 'kg', direction: 'lower' },
  'waste_reduced': { min: 0, max: 10000, target: 5000, unit: 'kg', direction: 'higher' },
  'weight_reduction': { min: 0, max: 10000, target: 5000, unit: 'kg', direction: 'higher' },
  'packaging': { min: 0, max: 10000, target: 5000, unit: 'kg', direction: 'lower' },
  
  // Recycling (%)
  'recycl': { min: 0, max: 100, target: 80, unit: '%', direction: 'higher' },
  
  // Satisfaction/Rating (1-5 or 1-10 scale)
  'satisfaction': { min: 1, max: 5, target: 4, unit: 'scale', direction: 'higher' },
  'rating': { min: 1, max: 5, target: 4, unit: 'scale', direction: 'higher' },
  'score': { min: 0, max: 100, target: 80, unit: 'points', direction: 'higher' },
};

// Helper function to find matching benchmark
function findBenchmark(metricName: string, unit?: string | null): MetricBenchmark | null {
  const name = metricName.toLowerCase();
  
  // Priority: Check for exact or most specific matches first
  // Try to match specific benchmark keys in order of specificity
  
  // First, try to match specific positive indicators with their benchmarks
  if (name.includes('solar') || name.includes('energy_generated') || name.includes('energy generated')) {
    // Check if 'solar' or 'energy_generated' benchmark exists
    if (metricBenchmarks['solar']) return metricBenchmarks['solar'];
    if (metricBenchmarks['energy_generated']) return metricBenchmarks['energy_generated'];
    if (metricBenchmarks['renewable']) return metricBenchmarks['renewable'];
  }
  
  if (name.includes('energy_saved') || name.includes('energy saved')) {
    if (metricBenchmarks['energy_saved']) return metricBenchmarks['energy_saved'];
  }
  
  if (name.includes('water_saved') || name.includes('water saved')) {
    if (metricBenchmarks['water_saved']) return metricBenchmarks['water_saved'];
  }
  
  if (name.includes('weight_reduction') || name.includes('weight reduction') || 
      (name.includes('packaging') && name.includes('reduction'))) {
    if (metricBenchmarks['weight_reduction']) return metricBenchmarks['weight_reduction'];
    if (metricBenchmarks['waste_reduced']) return metricBenchmarks['waste_reduced'];
  }
  
  if (name.includes('waste_reduced') || name.includes('waste reduced')) {
    if (metricBenchmarks['waste_reduced']) return metricBenchmarks['waste_reduced'];
  }
  
  // Check for CO2/Carbon/Emission metrics
  // Prioritize "reduction" metrics (higher is better) over "emission" metrics (lower is better)
  if ((name.includes('co2') || name.includes('carbon') || name.includes('emission')) && 
      (name.includes('reduction') || name.includes('reduced') || name.includes('saved'))) {
    // This is a reduction metric, higher is better
    if (metricBenchmarks['co2_reduction']) return metricBenchmarks['co2_reduction'];
    if (metricBenchmarks['carbon_reduction']) return metricBenchmarks['carbon_reduction'];
    if (metricBenchmarks['emission_reduction']) return metricBenchmarks['emission_reduction'];
  } else if (name.includes('co2') || name.includes('carbon') || name.includes('emission')) {
    // This is an emission metric, lower is better
    if (metricBenchmarks['co2']) return metricBenchmarks['co2'];
    if (metricBenchmarks['carbon']) return metricBenchmarks['carbon'];
    if (metricBenchmarks['emission']) return metricBenchmarks['emission'];
  }
  
  // Then check for general patterns
  // Check for positive indicators (higher is better)
  if (name.includes('saved') || name.includes('generated') || name.includes('reduced') || 
      name.includes('recycled') || name.includes('renewable')) {
    // Find matching benchmark with 'higher' direction
    for (const [key, benchmark] of Object.entries(metricBenchmarks)) {
      if (name.includes(key) && benchmark.direction === 'higher') {
        return benchmark;
      }
    }
  }
  
  // Check for negative indicators (lower is better)
  if (name.includes('waste') || name.includes('consumption') || name.includes('emission') || 
      name.includes('carbon') || name.includes('cost')) {
    // Find matching benchmark with 'lower' direction
    for (const [key, benchmark] of Object.entries(metricBenchmarks)) {
      if (name.includes(key) && benchmark.direction === 'lower') {
        return benchmark;
      }
    }
  }
  
  // Direct match (fallback)
  for (const [key, benchmark] of Object.entries(metricBenchmarks)) {
    if (name.includes(key)) {
      return benchmark;
    }
  }
  
  return null;
}

// Helper function to normalize units
function normalizeUnit(value: number, unit?: string | null): { value: number; normalizedUnit: string } {
  if (!unit) return { value, normalizedUnit: 'unknown' };
  
  const unitLower = unit.toLowerCase();
  
  // Convert to standard units
  if (unitLower.includes('kg') || unitLower.includes('kilogram')) {
    return { value, normalizedUnit: 'kg' };
  }
  if (unitLower.includes('ton') || unitLower.includes('tonne')) {
    return { value: value * 1000, normalizedUnit: 'kg' };
  }
  if (unitLower.includes('gallon')) {
    return { value: value * 3.78541, normalizedUnit: 'liters' };
  }
  if (unitLower.includes('mwh')) {
    return { value: value * 1000, normalizedUnit: 'kWh' };
  }
  if (unitLower.includes('$') || unitLower.includes('usd') || unitLower.includes('dollar')) {
    return { value, normalizedUnit: 'USD' };
  }
  
  return { value, normalizedUnit: unitLower };
}

// Scientific normalization using sigmoid/logistic function for better distribution
function sigmoidNormalize(value: number, min: number, max: number, target: number, direction: 'higher' | 'lower'): number {
  if (max === min) return 50; // Default if range is invalid
  
  // Normalize to 0-1 range
  let normalized: number;
  if (direction === 'higher') {
    // Higher is better: use sigmoid centered at target
    const range = max - min;
    const position = (value - min) / range;
    const targetPosition = (target - min) / range;
    
    // Sigmoid function: S(x) = 1 / (1 + e^(-k(x - x0)))
    // k controls steepness, x0 is the center point
    const k = 10; // Steepness factor
    const x0 = targetPosition;
    normalized = 1 / (1 + Math.exp(-k * (position - x0)));
  } else {
    // Lower is better: invert the sigmoid
    const range = max - min;
    const position = (value - min) / range;
    const targetPosition = (target - min) / range;
    
    const k = 10;
    const x0 = targetPosition;
    normalized = 1 - (1 / (1 + Math.exp(-k * (position - x0))));
  }
  
  // Scale to 0-100
  return Math.max(0, Math.min(100, normalized * 100));
}

// Helper function to classify metric type based on name
function classifyMetricType(metricName: string): string {
  const name = metricName.toLowerCase();
  
  // Environmental Impact
  if (name.includes("co2") || name.includes("carbon") || name.includes("emission") || 
      name.includes("greenhouse") || name.includes("ghg") || name.includes("pollution") ||
      name.includes("waste") || name.includes("recycl") || name.includes("plastic") ||
      name.includes("air") || name.includes("quality")) {
    return "Environmental Impact";
  }
  
  // Resource Efficiency
  if (name.includes("water") || name.includes("energy") || name.includes("power") ||
      name.includes("electricity") || name.includes("fuel") || name.includes("consumption") ||
      name.includes("efficiency") || name.includes("usage") || name.includes("reduction") ||
      name.includes("renewable")) {
    return "Resource Efficiency";
  }
  
  // Cost Effectiveness
  if (name.includes("cost") || name.includes("saving") || name.includes("roi") ||
      name.includes("revenue") || name.includes("profit") || name.includes("budget") ||
      name.includes("expense") || name.includes("financial") || name.includes("economic") ||
      name.includes("investment")) {
    return "Cost Effectiveness";
  }
  
  // Social Impact
  if (name.includes("satisfaction") || name.includes("engagement") || name.includes("awareness") ||
      name.includes("education") || name.includes("community") || name.includes("social") ||
      name.includes("brand") || name.includes("reputation") || name.includes("employee") ||
      name.includes("health") || name.includes("safety")) {
    return "Social Impact";
  }
  
  // Default to Environmental Impact
  return "Environmental Impact";
}

// Calculate confidence score based on data quality
function calculateConfidence(metric: ProjectMetric, normalizedScore: number): number {
  let confidence = 1.0;
  
  // Reduce confidence if no unit provided
  if (!metric.unit || metric.unit.trim() === '') {
    confidence *= 0.8;
  }
  
  // Reduce confidence if value seems unrealistic
  const numericMatch = metric.value.match(/[\d.]+/);
  if (numericMatch) {
    const numericValue = parseFloat(numericMatch[0]);
    if (numericValue < 0) {
      confidence *= 0.7; // Negative values might be errors
    }
    if (numericValue === 0 && !metric.value.includes('0')) {
      confidence *= 0.6; // Zero might indicate missing data
    }
  }
  
  // Increase confidence if normalizedScore was provided
  if (metric.normalizedScore !== null && metric.normalizedScore !== undefined) {
    confidence = Math.min(1.0, confidence * 1.1);
  }
  
  return Math.max(0.5, Math.min(1.0, confidence));
}

// Enhanced normalized score calculation with benchmarks
function calculateNormalizedScore(metricName: string, value: string, unit?: string | null, providedScore?: number | null | string): number {
  // Use provided score if available and valid
  if (providedScore !== null && providedScore !== undefined) {
    const numScore = typeof providedScore === 'string' ? parseFloat(providedScore) : providedScore;
    if (!isNaN(numScore)) {
      return Math.max(0, Math.min(100, numScore));
    }
  }
  
  // Try to extract numeric value
  const numericMatch = value.match(/[\d.]+/);
  if (!numericMatch) return 50; // Default score if no number found
  
  const numericValue = parseFloat(numericMatch[0]);
  if (isNaN(numericValue)) return 50;
  
  // Normalize unit
  const { value: normalizedValue, normalizedUnit } = normalizeUnit(numericValue, unit);
  
  // Find benchmark
  const benchmark = findBenchmark(metricName, normalizedUnit);
  
  if (benchmark) {
    // Use benchmark-based normalization
    return sigmoidNormalize(
      normalizedValue,
      benchmark.min,
      benchmark.max,
      benchmark.target,
      benchmark.direction
    );
  }
  
  // Fallback: intelligent scaling based on value magnitude and unit
  const name = metricName.toLowerCase();
  
  // Percentage values
  if (value.includes("%") || unit?.includes("%") || normalizedUnit.includes('%')) {
    return Math.max(0, Math.min(100, numericValue));
  }
  
  // Rating scales (1-5 or 1-10)
  if (name.includes("rating") || name.includes("satisfaction") || name.includes("score")) {
    if (numericValue <= 5) {
      return (numericValue / 5) * 100;
    } else if (numericValue <= 10) {
      return (numericValue / 10) * 100;
    } else if (numericValue <= 100) {
      return numericValue;
    }
  }
  
  // For values without clear benchmark, use intelligent scaling
  // Check if it's a reduction/saving metric (higher is better)
  if (name.includes("reduction") || name.includes("saved") || name.includes("generated") || 
      name.includes("recycled") || name.includes("renewable")) {
    // Higher values are better - use logarithmic scaling with optimistic target
    if (normalizedValue > 0) {
      const logValue = Math.log10(normalizedValue + 1);
      const maxLogValue = 6; // Assume max is around 1,000,000
      const baseScore = (logValue / maxLogValue) * 100;
      // Boost score for positive metrics
      return Math.min(100, baseScore * 1.2);
    }
  }
  
  // For consumption/waste metrics (lower is better), use inverse scaling
  if (name.includes("consumption") || name.includes("waste") || name.includes("emission")) {
    if (normalizedValue > 0) {
      const logValue = Math.log10(normalizedValue + 1);
      const maxLogValue = 6;
      const baseScore = (logValue / maxLogValue) * 100;
      // Invert: lower values get higher scores
      return Math.max(0, 100 - baseScore * 0.8);
    }
  }
  
  // Default: use logarithmic scaling (neutral)
  if (normalizedValue > 0) {
    const logValue = Math.log10(normalizedValue + 1);
    const maxLogValue = 6; // Assume max is around 1,000,000
    return Math.min(100, (logValue / maxLogValue) * 100);
  }
  
  return 50; // Default fallback
}

// Default metric weights (can be customized per project type)
const defaultMetricWeights: Record<string, number> = {
  "Environmental Impact": 0.35,  // 35%
  "Resource Efficiency": 0.30,   // 30%
  "Cost Effectiveness": 0.20,    // 20%
  "Social Impact": 0.15,         // 15%
};

// Normalize weights to sum to 1.0
function normalizeWeights(weights: Record<string, number>): Record<string, number> {
  const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
  if (total === 0) return defaultMetricWeights;
  
  const normalized: Record<string, number> = {};
  for (const [key, value] of Object.entries(weights)) {
    normalized[key] = value / total;
  }
  return normalized;
}

/**
 * Calculate Overall Impact Score from project metrics
 * Uses scientific normalization, confidence weighting, and benchmark-based scoring
 * 
 * @param metrics - Array of project metrics
 * @param metricWeights - Optional custom weights for metric types (should sum to 1.0)
 * @returns Impact score from 0-100
 */
export function calculateImpactScore(
  metrics: ProjectMetric[],
  metricWeights: Record<string, number> = defaultMetricWeights
): number {
  if (metrics.length === 0) return 0;

  // Normalize weights
  const normalizedWeights = normalizeWeights(metricWeights);

  // Convert ProjectMetric to MetricScore format with confidence
  const metricScores: MetricScore[] = metrics.map((metric) => {
    const normalizedScore = calculateNormalizedScore(
      metric.metricName,
      metric.value,
      metric.unit,
      metric.normalizedScore
    );
    
    const confidence = calculateConfidence(metric, normalizedScore);
    
    return {
      name: metric.metricName,
      value: metric.value,
      normalizedScore: Math.round(normalizedScore * 100) / 100, // Round to 2 decimals
      type: classifyMetricType(metric.metricName),
      confidence,
    };
  });

  // Group metrics by type
  const groupedMetrics: MetricTypeWeight[] = Object.entries(
    metricScores.reduce((acc, metric) => {
      if (!acc[metric.type]) {
        acc[metric.type] = [];
      }
      acc[metric.type].push(metric);
      return acc;
    }, {} as Record<string, MetricScore[]>)
  ).map(([type, metrics]) => ({
    type,
    weight: normalizedWeights[type] || 0.25, // Default to equal weight if not specified
    metrics,
  }));

  // Calculate weighted average with confidence adjustment
  let totalWeightedScore = 0;
  let totalWeight = 0;

  groupedMetrics.forEach(group => {
    if (group.metrics.length > 0) {
      // Calculate confidence-weighted average for this group
      const totalConfidence = group.metrics.reduce((sum, m) => sum + m.confidence, 0);
      const avgConfidence = totalConfidence / group.metrics.length;
      
      // Calculate average score, weighted by confidence
      const confidenceWeightedSum = group.metrics.reduce(
        (sum, m) => sum + (m.normalizedScore * m.confidence),
        0
      );
      const groupAverage = totalConfidence > 0 
        ? confidenceWeightedSum / totalConfidence
        : group.metrics.reduce((sum, m) => sum + m.normalizedScore, 0) / group.metrics.length;
      
      // Apply confidence penalty to weight (lower confidence = lower effective weight)
      const effectiveWeight = group.weight * avgConfidence;
      
      totalWeightedScore += groupAverage * effectiveWeight;
      totalWeight += effectiveWeight;
    }
  });

  // Final score with minimum threshold
  const finalScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
  
  // Apply slight smoothing to avoid extreme jumps
  // Use a simple moving average approach if we have historical data
  // For now, just round to integer
  return Math.max(0, Math.min(100, Math.round(finalScore)));
}

/**
 * Get detailed breakdown of impact score calculation
 * Useful for debugging and transparency
 */
export function getImpactScoreBreakdown(
  metrics: ProjectMetric[],
  metricWeights: Record<string, number> = defaultMetricWeights
): {
  overallScore: number;
  byType: Array<{
    type: string;
    weight: number;
    averageScore: number;
    confidence: number;
    metricCount: number;
  }>;
  metrics: MetricScore[];
} {
  const normalizedWeights = normalizeWeights(metricWeights);
  
  const metricScores: MetricScore[] = metrics.map((metric) => {
    const normalizedScore = calculateNormalizedScore(
      metric.metricName,
      metric.value,
      metric.unit,
      metric.normalizedScore
    );
    const confidence = calculateConfidence(metric, normalizedScore);
    
    return {
      name: metric.metricName,
      value: metric.value,
      normalizedScore: Math.round(normalizedScore * 100) / 100,
      type: classifyMetricType(metric.metricName),
      confidence,
    };
  });

  const groupedMetrics: MetricTypeWeight[] = Object.entries(
    metricScores.reduce((acc, metric) => {
      if (!acc[metric.type]) {
        acc[metric.type] = [];
      }
      acc[metric.type].push(metric);
      return acc;
    }, {} as Record<string, MetricScore[]>)
  ).map(([type, metrics]) => ({
    type,
    weight: normalizedWeights[type] || 0.25,
    metrics,
  }));

  const byType = groupedMetrics.map(group => {
    if (group.metrics.length === 0) {
      return {
        type: group.type,
        weight: group.weight,
        averageScore: 0,
        confidence: 0,
        metricCount: 0,
      };
    }
    
    const totalConfidence = group.metrics.reduce((sum, m) => sum + m.confidence, 0);
    const avgConfidence = totalConfidence / group.metrics.length;
    
    const confidenceWeightedSum = group.metrics.reduce(
      (sum, m) => sum + (m.normalizedScore * m.confidence),
      0
    );
    const averageScore = totalConfidence > 0 
      ? confidenceWeightedSum / totalConfidence
      : group.metrics.reduce((sum, m) => sum + m.normalizedScore, 0) / group.metrics.length;
    
    return {
      type: group.type,
      weight: group.weight,
      averageScore: Math.round(averageScore * 100) / 100,
      confidence: Math.round(avgConfidence * 100) / 100,
      metricCount: group.metrics.length,
    };
  });

  const overallScore = calculateImpactScore(metrics, metricWeights);

  return {
    overallScore,
    byType,
    metrics: metricScores,
  };
}
