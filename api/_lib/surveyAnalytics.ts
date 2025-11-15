/**
 * Survey Analytics Utilities
 * Provides consistent calculation of NPS, sentiment, and survey statistics
 */

import type { SurveyResponse } from "../../shared/schema";

export interface NPSCalculation {
  score: number;
  breakdown: {
    promoters: number;
    passives: number;
    detractors: number;
  };
  totalResponses: number;
}

export interface SentimentBreakdown {
  positive: number;
  neutral: number;
  negative: number;
}

/**
 * Calculate NPS (Net Promoter Score) from survey responses
 * NPS uses 0-10 scale: Promoters (9-10), Passives (7-8), Detractors (0-6)
 * Formula: ((Promoters - Detractors) / Total) * 100
 * 
 * If responses are on 1-5 scale, we convert: 5->10, 4->8, 3->6, 2->4, 1->2
 */
export function calculateNPS(responses: SurveyResponse[]): NPSCalculation {
  const numericResponses = responses.filter(r => r.numericValue !== null && r.numericValue !== undefined);
  
  if (numericResponses.length === 0) {
    return {
      score: 0,
      breakdown: { promoters: 0, passives: 0, detractors: 0 },
      totalResponses: 0,
    };
  }

  // Convert scores to 0-10 scale if needed
  const npsScores = numericResponses.map(r => {
    const value = Number(r.numericValue);
    // If value is on 1-5 scale, convert to 0-10 scale
    if (value >= 1 && value <= 5) {
      // Map: 5->10, 4->8, 3->6, 2->4, 1->2
      return (value - 1) * 2 + 2;
    }
    // If already on 0-10 scale, use as is
    return Math.max(0, Math.min(10, value));
  });

  // NPS classification: Promoters (9-10), Passives (7-8), Detractors (0-6)
  const promoters = npsScores.filter(s => s >= 9).length;
  const detractors = npsScores.filter(s => s <= 6).length;
  const passives = npsScores.length - promoters - detractors;

  // Calculate NPS: ((Promoters - Detractors) / Total) * 100
  const npsScore = Math.round(((promoters - detractors) / npsScores.length) * 100);

  return {
    score: npsScore,
    breakdown: {
      promoters,
      passives,
      detractors,
    },
    totalResponses: npsScores.length,
  };
}

/**
 * Calculate sentiment breakdown from survey responses
 * Uses 1-5 or 0-10 scale: Positive (>=4 or >=8), Negative (<=2 or <=4), Neutral (others)
 */
export function calculateSentiment(responses: SurveyResponse[]): SentimentBreakdown {
  const numericResponses = responses.filter(r => r.numericValue !== null && r.numericValue !== undefined);
  
  if (numericResponses.length === 0) {
    return { positive: 0, neutral: 0, negative: 0 };
  }

  const scores = numericResponses.map(r => Number(r.numericValue));
  
  // Determine scale (1-5 or 0-10)
  const maxScore = Math.max(...scores);
  const isFivePointScale = maxScore <= 5;

  let positive: number;
  let negative: number;
  let neutral: number;

  if (isFivePointScale) {
    // 1-5 scale: Positive (>=4), Negative (<=2), Neutral (3)
    positive = scores.filter(s => s >= 4).length;
    negative = scores.filter(s => s <= 2).length;
    neutral = scores.length - positive - negative;
  } else {
    // 0-10 scale: Positive (>=8), Negative (<=4), Neutral (5-7)
    positive = scores.filter(s => s >= 8).length;
    negative = scores.filter(s => s <= 4).length;
    neutral = scores.length - positive - negative;
  }

  return { positive, neutral, negative };
}

/**
 * Calculate average score from survey responses
 */
export function calculateAverageScore(responses: SurveyResponse[]): number {
  const numericResponses = responses.filter(r => r.numericValue !== null && r.numericValue !== undefined);
  
  if (numericResponses.length === 0) return 0;

  const sum = numericResponses.reduce((acc, r) => {
    const value = typeof r.numericValue === 'string' ? parseFloat(r.numericValue) : Number(r.numericValue);
    return acc + (isNaN(value) ? 0 : value);
  }, 0);

  return Math.round((sum / numericResponses.length) * 10) / 10;
}

/**
 * Determine survey status based on response count and questions
 */
export function determineSurveyStatus(responseCount: number, questionCount: number): 'gathering' | 'completed' {
  // Consider completed if we have at least 10 responses per question
  const threshold = questionCount * 10;
  return responseCount >= threshold ? 'completed' : 'gathering';
}

