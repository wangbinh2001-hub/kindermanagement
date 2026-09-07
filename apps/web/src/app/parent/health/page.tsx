'use client';

import { 
  HeartPulse, 
  TrendingUp, 
  AlertTriangle, 
  Sparkles, 
  Scale, 
  Ruler, 
  Calendar,
  CheckCircle2
} from 'lucide-react';

const BMI_LABELS: Record<string, { label: string; badge: string; color: string }> = {
  SEVERELY_UNDERWEIGHT: { 
    label: 'Suy dinh dưỡng', 
    badge: 'bg-red-500/15 text-red-600 border-red-200', 
    color: '#EF4444' 
  },
  UNDERWEIGHT: { 
    label: 'Nhẹ cân', 
    badge: 'bg-amber-500/15 text-amber-600 border-amber-200', 
    color: '#F59E0B' 
  },
  NORMAL: { 
    label: 'Phát triển chuẩn WHO', 
    badge: 'bg-emerald-500/15 text-emerald-600 border-emerald-200', 
    color: '#10B981' 
  },
  OVERWEIGHT: { 
    label: 'Nguy cơ béo phì', 
    badge: 'bg-orange-500/15 text-orange-600 border-orange-200', 
    color: '#F97316' 
  },
  OBESE: { 
    label: 'Béo phì', 
    badge: 'bg-red-500/15 text-red-600 border-red-200', 
    color: '#DC2626' 
  },
};

const mockRecords = [
  {
    id: 'hr-1',
    measuredAt: '2026-09-01',
    heightCm: 110.5,
    heightDelta: '+2.5 cm',
    weightKg: 19.2,
    weightDelta: '+0.7 kg',
    bmi: 15.7,
    bmiCategory: 'NORMAL',
    notes: 'Bé phát triển rất tốt, hoạt bát và ăn hết suất bán trú.',
    allergies: ['Dị ứng tôm cua (Nhẹ)', 'Dị ứng đậu phộng'],
  },
  {
    id: 'hr-2',
    measuredAt: '2026-06-01',
    heightCm: 108.0,
    heightDelta: '+2.5 cm',
    weightKg: 18.5,
    weightDelta: '+0.7 kg',
    bmi: 15.9,
    bmiCategory: 'NORMAL',
    notes: 'Khám định kỳ đầu hè: sức khỏe bình thường.',
    allergies: ['Dị ứng tôm cua (Nhẹ)'],
  },
  {
    id: 'hr-3',
    measuredAt: '2026-03-01',
    heightCm: 105.5,
    heightDelta: '—',
    weightKg: 17.8,
    weightDelta: '—',
    bmi: 16.0,
    bmiCategory: 'NORMAL',
    notes: null,
    allergies: [],
  },
];

export default function ParentHealthPage() {
  const latest = mockRecords[0]!;
  const bmiInfo = (BMI_LABELS[latest.bmiCategory as keyof typeof BMI_LABELS] ?? BMI_LABELS.NORMAL)!;

  // Calculate percentage on 12 to 22 BMI scale for WHO visual bar
  const bmiPercent = Math.min(Math.max(((latest.bmi - 12) / (22 - 12)) * 100, 5), 95);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <HeartPulse className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground">Sức khỏe & Thể trạng</h1>
            <p className="text-xs text-muted-foreground">Theo dõi biểu đồ phát triển theo chuẩn WHO</p>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="rounded-2xl border border-border/80 bg-card p-3.5 text-center shadow-xs card-hover">
          <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 mx-auto flex items-center justify-center mb-2">
            <Ruler className="h-4 w-4" />
          </div>
          <p className="text-xl font-extrabold text-foreground">{latest.heightCm}</p>
          <p className="text-[11px] text-muted-foreground font-medium">cm (Chiều cao)</p>
          <span className="inline-block text-[10px] font-semibold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.2 rounded-md mt-1">
            {latest.heightDelta}
          </span>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-3.5 text-center shadow-xs card-hover">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 mx-auto flex items-center justify-center mb-2">
            <Scale className="h-4 w-4" />
          </div>
          <p className="text-xl font-extrabold text-foreground">{latest.weightKg}</p>
          <p className="text-[11px] text-muted-foreground font-medium">kg (Cân nặng)</p>
          <span className="inline-block text-[10px] font-semibold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.2 rounded-md mt-1">
            {latest.weightDelta}
          </span>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-3.5 text-center shadow-xs card-hover">
          <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-600 mx-auto flex items-center justify-center mb-2">
            <TrendingUp className="h-4 w-4" />
          </div>
          <p className="text-xl font-extrabold text-foreground">{latest.bmi.toFixed(1)}</p>
          <p className="text-[11px] text-muted-foreground font-medium">Chỉ số BMI</p>
          <span className="inline-block text-[10px] font-semibold text-purple-600 bg-purple-500/10 px-1.5 py-0.2 rounded-md mt-1">
            Chuẩn
          </span>
        </div>
      </div>

      {/* WHO BMI Visual Spectrum Indicator */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Phổ phân loại BMI (Chuẩn WHO)</span>
          </div>
          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${bmiInfo.badge}`}>
            {bmiInfo.label}
          </span>
        </div>

        {/* Visual Gradient Spectrum Bar with Marker */}
        <div className="relative pt-4 pb-2">
          {/* Position Pin Marker */}
          <div 
            className="absolute top-0 -translate-x-1/2 flex flex-col items-center transition-all duration-500"
            style={{ left: `${bmiPercent}%` }}
          >
            <span className="text-[10px] font-extrabold text-foreground bg-card border px-1.5 py-0.5 rounded-md shadow-xs whitespace-nowrap">
              Bé: {latest.bmi.toFixed(1)}
            </span>
            <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-foreground"></div>
          </div>

          {/* Continuous Multi-zone Bar */}
          <div className="h-3 w-full rounded-full bg-gradient-to-r from-amber-400 via-emerald-400 to-rose-400 shadow-inner"></div>

          <div className="flex justify-between text-[10px] text-muted-foreground font-medium mt-1.5">
            <span>Thiếu cân (&lt;14)</span>
            <span className="text-emerald-600 font-bold">Chuẩn WHO (14 - 17.5)</span>
            <span>Thừa cân (&gt;18)</span>
          </div>
        </div>

        {latest.notes && (
          <div className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground italic border-l-2 border-primary">
            &ldquo;{latest.notes}&rdquo;
          </div>
        )}
      </div>

      {/* Allergy Safety Notice */}
      {latest.allergies.length > 0 && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4 space-y-2">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-xs">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Cảnh báo Dị ứng & Lưu ý Y tế từ Nhà trường</span>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {latest.allergies.map((allergy, i) => (
              <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/20">
                {allergy}
              </span>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
            Bếp ăn trường và giáo viên chủ nhiệm đã được thông báo tự động để loại bỏ thành phần dị ứng trong khẩu phần.
          </p>
        </div>
      )}

      {/* History Timeline */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">Lịch sử kiểm tra thể trạng</h3>
        <div className="rounded-2xl border border-border/80 bg-card divide-y divide-border/60 shadow-xs overflow-hidden">
          {mockRecords.map((record) => {
            const recBmi = BMI_LABELS[record.bmiCategory] || { label: '—', badge: '', color: '' };
            return (
              <div key={record.id} className="p-3.5 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-muted/70 flex items-center justify-center text-muted-foreground shrink-0">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      {new Date(record.measuredAt).toLocaleDateString('vi-VN', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {record.heightCm} cm • {record.weightKg} kg
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md border ${recBmi.badge}`}>
                    {recBmi.label}
                  </span>
                  <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                    BMI: {record.bmi.toFixed(1)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
