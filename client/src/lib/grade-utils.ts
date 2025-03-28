// Grade conversion utilities

export const letterGrades: { [key: string]: { min: number; max: number } } = {
  "A+": { min: 97, max: 100 },
  "A": { min: 93, max: 96.99 },
  "A-": { min: 90, max: 92.99 },
  "B+": { min: 87, max: 89.99 },
  "B": { min: 83, max: 86.99 },
  "B-": { min: 80, max: 82.99 },
  "C+": { min: 77, max: 79.99 },
  "C": { min: 73, max: 76.99 },
  "C-": { min: 70, max: 72.99 },
  "D+": { min: 67, max: 69.99 },
  "D": { min: 63, max: 66.99 },
  "D-": { min: 60, max: 62.99 },
  "F": { min: 0, max: 59.99 },
};

/**
 * Convert a percentage grade to letter grade based on standard scale
 */
export function percentageToLetterGrade(percentage: number): string {
  for (const [letter, range] of Object.entries(letterGrades)) {
    if (percentage >= range.min && percentage <= range.max) {
      return letter;
    }
  }
  return "N/A";
}

/**
 * Format score as a fraction (e.g. "42/50")
 */
export function formatScoreFraction(score: number, maxScore: number): string {
  return `${score}/${maxScore}`;
}

/**
 * Format score as a percentage with letter grade
 */
export function formatScoreWithGrade(score: number, maxScore: number): string {
  const percentage = (score / maxScore) * 100;
  const letterGrade = percentageToLetterGrade(percentage);
  return `${letterGrade} (${percentage.toFixed(1)}%)`;
}

/**
 * Calculate weighted average of scores
 * @param scores Array of score objects with score, maxScore, and weight properties
 */
export function calculateWeightedAverage(
  scores: Array<{ score: number; maxScore: number; weight: number }>
): number {
  if (!scores.length) return 0;

  const totalWeightedScore = scores.reduce(
    (sum, { score, maxScore, weight }) => {
      const percentage = (score / maxScore) * 100;
      return sum + percentage * weight;
    },
    0
  );

  const totalWeight = scores.reduce((sum, { weight }) => sum + weight, 0);
  
  return totalWeightedScore / (totalWeight || 1);
}

/**
 * Format a weighted average as a letter grade with percentage
 */
export function formatWeightedAverage(average: number): string {
  const letterGrade = percentageToLetterGrade(average);
  return `${letterGrade} (${average.toFixed(1)}%)`;
}

/**
 * Create a grade distribution object from scores
 */
export function createGradeDistribution(scores: number[]): Record<string, number> {
  const distribution: Record<string, number> = {};
  
  // Initialize all letter grades with 0 count
  Object.keys(letterGrades).forEach(letter => {
    distribution[letter] = 0;
  });
  
  // Count scores in each grade range
  scores.forEach(score => {
    const letter = percentageToLetterGrade(score);
    distribution[letter] = (distribution[letter] || 0) + 1;
  });
  
  return distribution;
}

/**
 * Format a date for display (e.g. "Today, 10:23 AM" or "Yesterday, 3:15 PM" or "2 days ago")
 */
export function formatDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  let prefix = "";
  if (diffDays === 0) {
    prefix = "Today";
  } else if (diffDays === 1) {
    prefix = "Yesterday";
  } else {
    return `${diffDays} days ago`;
  }
  
  const timeString = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  
  return `${prefix}, ${timeString}`;
}
