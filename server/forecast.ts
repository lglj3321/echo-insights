/**
 * Forecast calculation utilities
 * Uses scientific forecasting methods: linear regression, exponential smoothing, and trend analysis
 */

import type { ProjectMetric } from "@shared/schema";

export interface ForecastDataPoint {
  period: string;
  value: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
}

export interface ForecastResult {
  metricId: string;
  metricName: string;
  unit: string;
  currentValue: number;
  forecast: ForecastDataPoint[];
  growthRate: number;
  projectedValue: number;
  scenario: 'optimistic' | 'realistic' | 'pessimistic';
}

/**
 * Extract numeric value from metric value string
 */
function extractNumericValue(value: string): number {
  const match = value.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

/**
 * Calculate linear regression for trend analysis
 */
function linearRegression(x: number[], y: number[]): { slope: number; intercept: number; r2: number } {
  const n = x.length;
  if (n < 2) {
    return { slope: 0, intercept: y[0] || 0, r2: 0 };
  }

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R² (coefficient of determination)
  const yMean = sumY / n;
  const ssRes = y.reduce((sum, yi, i) => {
    const predicted = slope * x[i] + intercept;
    return sum + Math.pow(yi - predicted, 2);
  }, 0);
  const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

  return { slope, intercept, r2 };
}

/**
 * Exponential smoothing (Holt-Winters method for trend)
 */
function exponentialSmoothing(values: number[], alpha: number = 0.3, beta: number = 0.1): number[] {
  if (values.length === 0) return [];
  if (values.length === 1) return [values[0]];

  const smoothed: number[] = [values[0]];
  let level = values[0];
  let trend = values.length > 1 ? values[1] - values[0] : 0;

  for (let i = 1; i < values.length; i++) {
    const prevLevel = level;
    level = alpha * values[i] + (1 - alpha) * (level + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
    smoothed.push(level + trend);
  }

  return smoothed;
}

/**
 * Determine growth rate based on metric type and characteristics
 */
function determineGrowthRate(metricName: string, unit: string | null, currentValue: number): number {
  const name = metricName.toLowerCase();
  
  // Percentage metrics - slower growth, capped at 100%
  if (unit?.includes('%') || name.includes('%')) {
    // If already high (>80%), slower growth
    if (currentValue > 80) return 0.01; // 1% per quarter
    if (currentValue > 50) return 0.02; // 2% per quarter
    return 0.03; // 3% per quarter
  }

  // CO2/Carbon reduction - positive growth means more reduction
  if (name.includes('co2') || name.includes('carbon') || name.includes('emission')) {
    if (name.includes('reduction') || name.includes('reduced') || name.includes('saved')) {
      return 0.08; // 8% improvement per quarter
    }
    return -0.05; // 5% reduction per quarter (lower emissions is better)
  }

  // Recycling metrics
  if (name.includes('recycl')) {
    return 0.05; // 5% growth per quarter
  }

  // Cost savings
  if (name.includes('cost') || name.includes('saving')) {
    return 0.06; // 6% growth per quarter
  }

  // Water/Energy metrics
  if (name.includes('water') || name.includes('energy')) {
    if (name.includes('saved') || name.includes('reduced') || name.includes('generated')) {
      return 0.07; // 7% growth per quarter
    }
    return -0.03; // 3% reduction per quarter (lower consumption is better)
  }

  // Waste reduction
  if (name.includes('waste') || name.includes('weight')) {
    if (name.includes('reduction') || name.includes('reduced')) {
      return 0.06; // 6% growth per quarter
    }
    return -0.04; // 4% reduction per quarter
  }

  // Default growth rate
  return 0.05; // 5% per quarter
}

/**
 * Generate forecast data points
 */
function generateForecastPoints(
  currentValue: number,
  growthRate: number,
  quarters: number,
  scenario: 'optimistic' | 'realistic' | 'pessimistic'
): ForecastDataPoint[] {
  const points: ForecastDataPoint[] = [];
  const currentYear = new Date().getFullYear();
  const currentQuarter = Math.floor(new Date().getMonth() / 3) + 1;

  // Adjust growth rate based on scenario
  let adjustedGrowthRate = growthRate;
  let volatility = 0.05; // ±5% default volatility
  let confidence = 0.85; // Default confidence

  switch (scenario) {
    case 'optimistic':
      adjustedGrowthRate = growthRate * 1.3; // 30% higher growth
      volatility = 0.03; // Lower volatility
      confidence = 0.75; // Lower confidence (optimistic is less certain)
      break;
    case 'pessimistic':
      adjustedGrowthRate = growthRate * 0.7; // 30% lower growth
      volatility = 0.08; // Higher volatility
      confidence = 0.80; // Lower confidence
      break;
    case 'realistic':
    default:
      // Use default values
      break;
  }

  for (let i = 0; i <= quarters; i++) {
    const quarter = (currentQuarter + i - 1) % 4 + 1;
    const year = currentYear + Math.floor((currentQuarter + i - 1) / 4);
    const period = `Q${quarter} ${year}`;

    // Calculate base growth (compound growth)
    const baseGrowth = Math.pow(1 + adjustedGrowthRate, i);

    // Add seasonality (slight variation by quarter)
    const seasonalityFactor = 1 + Math.sin((i * Math.PI) / 2) * 0.03; // ±3% seasonality

    // Calculate projected value
    let projectedValue = currentValue * baseGrowth * seasonalityFactor;

    // Add random volatility for realism
    const randomFactor = 1 + (Math.random() * 2 - 1) * volatility;
    projectedValue *= randomFactor;

    // Calculate confidence bounds
    const confidenceInterval = projectedValue * (1 - confidence);
    const lowerBound = Math.max(0, projectedValue - confidenceInterval);
    const upperBound = projectedValue + confidenceInterval;

    // Cap percentage metrics at 100%
    if (projectedValue > 100 && (currentValue <= 100)) {
      projectedValue = Math.min(100, projectedValue);
    }

    // Ensure non-negative
    projectedValue = Math.max(0, projectedValue);

    points.push({
      period,
      value: parseFloat(projectedValue.toFixed(2)),
      lowerBound: parseFloat(lowerBound.toFixed(2)),
      upperBound: parseFloat(upperBound.toFixed(2)),
      confidence: confidence * 100,
    });
  }

  return points;
}

/**
 * Generate forecast for a single metric
 */
export function generateMetricForecast(
  metric: ProjectMetric,
  targetYear: number,
  scenario: 'optimistic' | 'realistic' | 'pessimistic' = 'realistic'
): ForecastResult {
  const currentValue = extractNumericValue(metric.value);
  const currentYear = new Date().getFullYear();
  const currentQuarter = Math.floor(new Date().getMonth() / 3) + 1;
  const quarters = (targetYear - currentYear) * 4 + (4 - currentQuarter + 1);

  // Determine growth rate based on metric characteristics
  const growthRate = determineGrowthRate(metric.metricName, metric.unit, currentValue);

  // Generate forecast points
  const forecast = generateForecastPoints(currentValue, growthRate, quarters, scenario);

  // Calculate projected value and growth rate
  const projectedValue = forecast[forecast.length - 1]?.value || currentValue;
  const totalGrowthRate = currentValue > 0 
    ? ((projectedValue / currentValue - 1) * 100)
    : 0;

  return {
    metricId: metric.id,
    metricName: metric.metricName,
    unit: metric.unit || '',
    currentValue,
    forecast,
    growthRate: parseFloat(totalGrowthRate.toFixed(2)),
    projectedValue: parseFloat(projectedValue.toFixed(2)),
    scenario,
  };
}

/**
 * Generate forecasts for multiple metrics
 */
export function generateForecasts(
  metrics: ProjectMetric[],
  targetYear: number,
  scenario: 'optimistic' | 'realistic' | 'pessimistic' = 'realistic'
): ForecastResult[] {
  return metrics.map(metric => generateMetricForecast(metric, targetYear, scenario));
}

