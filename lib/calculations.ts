/**
 * attendanceRate — PRESENT + LATE count as attended.
 * EXCUSED is excluded from both numerator and denominator.
 */
export function attendanceRate(
  present: number,
  absent: number,
  late: number,
  excused: number = 0
): number {
  const total = present + absent + late; // excused excluded
  if (total === 0) return 0;
  return Math.round(((present + late) / total) * 100);
}

/**
 * letterGrade — A ≥ 90 · B ≥ 75 · C ≥ 60 · D ≥ 50 · F < 50
 */
export function letterGrade(percentage: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (percentage >= 90) return 'A';
  if (percentage >= 75) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'F';
}

/**
 * subjectAverage — mean of (score / maxScore * 100) for graded entries only.
 * Ungraded (score === null) are excluded entirely.
 */
export function subjectAverage(
  grades: Array<{ score: number | null; maxScore: number }>
): number | null {
  const graded = grades.filter((g) => g.score !== null) as Array<{
    score: number;
    maxScore: number;
  }>;
  if (graded.length === 0) return null;
  const sum = graded.reduce((acc, g) => acc + (g.score / g.maxScore) * 100, 0);
  return Math.round((sum / graded.length) * 10) / 10;
}
