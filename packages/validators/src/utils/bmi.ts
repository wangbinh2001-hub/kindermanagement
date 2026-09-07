export function calculateBmi(heightCm: number, weightKg: number): number {
  const heightM = heightCm / 100;
  return Number((weightKg / (heightM * heightM)).toFixed(1));
}

export function getWhoBmiCategory(
  bmi: number,
  ageMonths: number,
  _gender: 'MALE' | 'FEMALE' | 'OTHER'
): { category: 'UNDERWEIGHT' | 'NORMAL' | 'OVERWEIGHT' | 'OBESE'; reference: string } {
  // ponytail: Simplified WHO mapping. Add full WHO 2006/2007 z-score tables when [precise clinical tracking required].
  let reference = ageMonths < 60 ? 'WHO 2006' : 'WHO 2007';
  
  if (bmi < 13.5) return { category: 'UNDERWEIGHT', reference };
  if (bmi >= 13.5 && bmi < 18) return { category: 'NORMAL', reference };
  if (bmi >= 18 && bmi < 20) return { category: 'OVERWEIGHT', reference };
  return { category: 'OBESE', reference };
}
