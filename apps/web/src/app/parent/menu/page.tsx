'use client';

import { useState } from 'react';
import { 
  Utensils, 
  Calendar, 
  Sun, 
  Coffee, 
  Apple, 
  Sparkles, 
  ShieldCheck, 
  Flame,
  CheckCircle2
} from 'lucide-react';

type WeekDay = 'Thứ 2' | 'Thứ 3' | 'Thứ 4' | 'Thứ 5' | 'Thứ 6';

const DAY_LABELS: WeekDay[] = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'];

const mockMenu = {
  id: 'menu-1',
  weekStartDate: '2026-09-07',
  weekEndDate: '2026-09-11',
  notes: 'Thực đơn tuần 36 — Tăng cường rau củ quả theo mùa & sữa chua lên men tự nhiên.',
  items: {
    'Thứ 2': {
      morning: {
        title: 'Bữa sáng (07:30)',
        dishes: ['Cháo thịt bằm cà rốt', 'Sữa tươi thanh trùng Cô Gái Hà Lan 180ml'],
        calories: '240 kcal',
        icon: Sun,
      },
      lunch: {
        title: 'Bữa trưa chính (10:45)',
        dishes: ['Cơm dẻo tám thơm', 'Thịt heo rim trứng cút', 'Canh bí đao nấu tôm khô', 'Tráng miệng: Chuối tiêu'],
        calories: '420 kcal',
        icon: Utensils,
      },
      afternoon: {
        title: 'Bữa xế chiều (14:30)',
        dishes: ['Bánh flan caramen nhà làm', 'Sữa chua men sống tự nhiên'],
        calories: '160 kcal',
        icon: Apple,
      },
    },
    'Thứ 3': {
      morning: {
        title: 'Bữa sáng (07:30)',
        dishes: ['Phở bò Hà Nội mini', 'Nước cam sành vắt tươi'],
        calories: '260 kcal',
        icon: Sun,
      },
      lunch: {
        title: 'Bữa trưa chính (10:45)',
        dishes: ['Cơm dẻo tám thơm', 'Cá phi lê sốt cà chua', 'Rau củ luộc chấm kho quẹt', 'Tráng miệng: Dưa hấu đỏ'],
        calories: '410 kcal',
        icon: Utensils,
      },
      afternoon: {
        title: 'Bữa xế chiều (14:30)',
        dishes: ['Chè đậu xanh hạt sen nước cốt dừa', 'Bánh quy bơ'],
        calories: '170 kcal',
        icon: Apple,
      },
    },
    'Thứ 4': {
      morning: {
        title: 'Bữa sáng (07:30)',
        dishes: ['Bún riêu cua đồng', 'Sữa hạt óc chó Vinamilk'],
        calories: '250 kcal',
        icon: Sun,
      },
      lunch: {
        title: 'Bữa trưa chính (10:45)',
        dishes: ['Cơm dẻo tám thơm', 'Gà hấp lá chanh xé phay', 'Canh rau ngót nấu thịt băm', 'Tráng miệng: Quýt đường'],
        calories: '430 kcal',
        icon: Utensils,
      },
      afternoon: {
        title: 'Bữa xế chiều (14:30)',
        dishes: ['Bánh bông lan trứng muối', 'Sữa đậu nành Fami'],
        calories: '165 kcal',
        icon: Apple,
      },
    },
    'Thứ 5': {
      morning: {
        title: 'Bữa sáng (07:30)',
        dishes: ['Mì Quảng tôm thịt', 'Nước dừa xiêm mát'],
        calories: '270 kcal',
        icon: Sun,
      },
      lunch: {
        title: 'Bữa trưa chính (10:45)',
        dishes: ['Cơm dẻo tám thơm', 'Đậu hũ dồn thịt băm sốt nấm', 'Canh cải ngọt nấu tôm tươi', 'Tráng miệng: Đu đủ chín'],
        calories: '400 kcal',
        icon: Utensils,
      },
      afternoon: {
        title: 'Bữa xế chiều (14:30)',
        dishes: ['Sữa chua dầm hoa quả', 'Bánh quy phô mai'],
        calories: '155 kcal',
        icon: Apple,
      },
    },
    'Thứ 6': {
      morning: {
        title: 'Bữa sáng (07:30)',
        dishes: ['Cháo bồ câu đậu xanh', 'Sữa tươi tiệt trùng 180ml'],
        calories: '255 kcal',
        icon: Sun,
      },
      lunch: {
        title: 'Bữa trưa chính (10:45)',
        dishes: ['Cơm dẻo tám thơm', 'Sườn non xào chua ngọt', 'Canh cua mồng tơi mướp hương', 'Tráng miệng: Nho ngọt'],
        calories: '440 kcal',
        icon: Utensils,
      },
      afternoon: {
        title: 'Bữa xế chiều (14:30)',
        dishes: ['Bánh su kem vani', 'Sữa chua uống Probi'],
        calories: '160 kcal',
        icon: Apple,
      },
    },
  },
};

export default function ParentMenuPage() {
  const [selectedDay, setSelectedDay] = useState<WeekDay>('Thứ 2');
  const dayMenu = mockMenu.items[selectedDay];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Utensils className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground">Thực đơn Dinh dưỡng</h1>
            <p className="text-xs text-muted-foreground">Tuần lễ 07/09/2026 — 11/09/2026</p>
          </div>
        </div>
      </div>

      {/* MoET Compliance Banner */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-card via-card to-primary/5 p-4 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Đạt Chuẩn Dinh Dưỡng Bộ GD&ĐT</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
            820 Kcal / ngày
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {mockMenu.notes}
        </p>
      </div>

      {/* Day Selector Pills */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-muted/60 border border-border/60 overflow-x-auto">
        {DAY_LABELS.map((day) => {
          const isSelected = selectedDay === day;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`flex-1 min-w-[64px] py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isSelected 
                  ? 'bg-card text-primary shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Daily Meals Breakdown */}
      {dayMenu && (
        <div className="space-y-3.5">
          {/* Sáng */}
          <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-2.5 shadow-xs card-hover">
            <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center">
                  <Sun className="h-4 w-4" />
                </div>
                <span className="font-bold text-xs text-foreground">{dayMenu.morning.title}</span>
              </div>
              <span className="text-[11px] font-mono font-semibold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                {dayMenu.morning.calories}
              </span>
            </div>
            <ul className="space-y-1.5 text-xs text-foreground pl-1">
              {dayMenu.morning.dishes.map((dish: string, i: number) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                  <span>{dish}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Trưa */}
          <div className="rounded-2xl border border-primary/30 bg-primary/[0.02] p-4 space-y-2.5 shadow-xs card-hover">
            <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                  <Utensils className="h-4 w-4" />
                </div>
                <span className="font-bold text-xs text-foreground">{dayMenu.lunch.title}</span>
              </div>
              <span className="text-[11px] font-mono font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                {dayMenu.lunch.calories}
              </span>
            </div>
            <ul className="space-y-1.5 text-xs text-foreground pl-1">
              {dayMenu.lunch.dishes.map((dish: string, i: number) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                  <span className={i === 1 ? 'font-semibold text-foreground' : ''}>{dish}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Xế chiều */}
          <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-2.5 shadow-xs card-hover">
            <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
                  <Apple className="h-4 w-4" />
                </div>
                <span className="font-bold text-xs text-foreground">{dayMenu.afternoon.title}</span>
              </div>
              <span className="text-[11px] font-mono font-semibold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                {dayMenu.afternoon.calories}
              </span>
            </div>
            <ul className="space-y-1.5 text-xs text-foreground pl-1">
              {dayMenu.afternoon.dishes.map((dish: string, i: number) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  <span>{dish}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
