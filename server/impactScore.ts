import type { ProjectMetric } from "@shared/schema";

interface MetricScore {
  name: string;
  value: string;
  normalizedScore: number;
  type: string;
}

interface MetricTypeWeight {
  type: string;
  weight: number;
  metrics: MetricScore[];
}

// Helper function to classify metric type based on name
function classifyMetricType(metricName: string): string {
  const name = metricName.toLowerCase();
  
  // Environmental Impact
  if (name.includes("co2") || name.includes("carbon") || name.includes("emission") || 
      name.includes("greenhouse") || name.includes("ghg") || name.includes("pollution") ||
      name.includes("waste") || name.includes("recycl") || name.includes("plastic")) {
    return "Environmental Impact";
  }
  
  // Resource Efficiency
  if (name.includes("water") || name.includes("energy") || name.includes("power") ||
      name.includes("electricity") || name.includes("fuel") || name.includes("consumption") ||
      name.includes("efficiency") || name.includes("usage") || name.includes("reduction")) {
    return "Resource Efficiency";
  }
  
  // Cost Effectiveness
  if (name.includes("cost") || name.includes("saving") || name.includes("roi") ||
      name.includes("revenue") || name.includes("profit") || name.includes("budget") ||
      name.includes("expense") || name.includes("financial") || name.includes("economic")) {
    return "Cost Effectiveness";
  }
  
  // Social Impact
  if (name.includes("satisfaction") || name.includes("engagement") || name.includes("awareness") ||
      name.includes("education") || name.includes("community") || name.includes("social") ||
      name.includes("brand") || name.includes("reputation") || name.includes("employee")) {
    return "Social Impact";
  }
  
  // Default to Environmental Impact
  return "Environmental Impact";
}

// Helper function to calculate normalized score if not provided
function calculateNormalizedScore(metricName: string, value: string, unit?: string | null): number {
  // Try to extract numeric value
  const numericMatch = value.match(/[\d.]+/);
  if (!numericMatch) return 50; // Default score if no number found
  
  const numericValue = parseFloat(numericMatch[0]);
  if (isNaN(numericValue)) return 50;
  
  const name = metricName.toLowerCase();
  
  // CO2/Carbon emissions - lower is better, normalize to 0-100
  if (name.includes("co2") || name.includes("carbon") || name.includes("emission")) {
    // Assume 0-10 tons is good (100), 10+ tons is worse
    return Math.min(100, Math.max(0, 100 - (numericValue * 10)));
  }
  
  // Water/Energy savings - higher is better
  if (name.includes("water") || name.includes("energy") || name.includes("saving")) {
    // Assume 0-1000 units is good, scale to 0-100
    return Math.min(100, (numericValue / 10));
  }
  
  // Percentage - use directly
  if (value.includes("%") || unit?.includes("%")) {
    return Math.min(100, Math.max(0, numericValue));
  }
  
  // Cost savings - higher is better, but scale differently
  if (name.includes("cost") || name.includes("saving")) {
    // Assume 0-10000 is good, scale to 0-100
    return Math.min(100, (numericValue / 100));
  }
  
  // Rating (1-5 scale) - convert to 0-100
  if (name.includes("rating") || name.includes("satisfaction") || name.includes("score")) {
    if (numericValue <= 5) {
      return (numericValue / 5) * 100;
    }
  }
  
  // Default: scale based on value magnitude
  if (numericValue < 1) {
    return numericValue * 100;
  } else if (numericValue < 100) {
    return numericValue;
  } else {
    return Math.min(100, 100 - (numericValue / 100));
  }
}

// Default metric weights
const defaultMetricWeights: Record<string, number> = {
  "Environmental Impact": 40,
  "Resource Efficiency": 30,
  "Cost Effectiveness": 20,
  "Social Impact": 10,
};

/**
 * Calculate Overall Impact Score from project metrics
 */
export function calculateImpactScore(
  metrics: ProjectMetric[],
  metricWeights: Record<string, number> = defaultMetricWeights
): number {
  if (metrics.length === 0) return 0;

  // Convert ProjectMetric to MetricScore format
  const metricScores: MetricScore[] = metrics.map((metric) => {
    const normalizedScore = metric.normalizedScore 
      ? Number(metric.normalizedScore) 
      : calculateNormalizedScore(metric.metricName, metric.value, metric.unit);
    
    return {
      name: metric.metricName,
      value: metric.value,
      normalizedScore: Math.round(normalizedScore),
      type: classifyMetricType(metric.metricName),
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
    weight: metricWeights[type] || 25,
    metrics,
  }));

  // Calculate weighted average
  let totalWeightedScore = 0;
  let totalWeight = 0;

  groupedMetrics.forEach(group => {
    if (group.metrics.length > 0) {
      const groupAverage = group.metrics.reduce((sum, m) => sum + m.normalizedScore, 0) / group.metrics.length;
      totalWeightedScore += groupAverage * group.weight;
      totalWeight += group.weight;
    }
  });

  return totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 0;
}

