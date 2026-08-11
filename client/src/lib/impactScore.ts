/**
 * Client-side impact score calculation
 * This should match the server-side logic in server/impactScore.ts
 * 
 * Note: This is a simplified version for client-side use.
 * For accurate scores, always use the impactScore from the server (project.impactScore)
 */

import type { ProjectMetric } from "@shared/schema";

/**
 * Get impact score from project data
 * Priority: 1. project.impactScore (server-calculated), 2. Calculate from metrics
 */
export function getProjectImpactScore(
  project: { impactScore?: string | number | null },
  metrics: ProjectMetric[] = []
): number {
  // Priority 1: Use server-calculated impactScore if available
  if (project.impactScore !== null && project.impactScore !== undefined) {
    const score = Number(project.impactScore);
    if (!isNaN(score)) {
      return Math.max(0, Math.min(100, Math.round(score)));
    }
  }

  // Priority 2: Calculate from metrics if available
  if (metrics.length > 0) {
    return calculateImpactScoreFromMetrics(metrics);
  }

  // Default: return 0 if no data available
  return 0;
}

/**
 * Calculate impact score from metrics (fallback when server score not available)
 * This is a simplified version - server-side calculation is more accurate
 */
function calculateImpactScoreFromMetrics(metrics: ProjectMetric[]): number {
  if (metrics.length === 0) return 0;

  // Use normalizedScore if available, otherwise calculate it
  const scores = metrics.map(metric => {
    if (metric.normalizedScore !== null && metric.normalizedScore !== undefined) {
      return Number(metric.normalizedScore);
    }
    // Fallback: simple normalization (server does this better)
    return 50; // Default score
  });

  // Simple average (server uses weighted average by metric type)
  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  return Math.max(0, Math.min(100, Math.round(average)));
}

