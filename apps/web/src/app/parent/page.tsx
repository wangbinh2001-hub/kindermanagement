'use client';

import Link from 'next/link';
import { useState } from 'react';
import { 
  CreditCard, 
  HeartPulse, 
  Utensils, 
  ClipboardList, 
  CalendarCheck2, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight,
  Clock,
  Apple,
  FileText
} from 'lucide-react';

const mockChildren = [
  {
    id: 'ssr-1',
    name: 'Nguyễn Minh Anh',
    gender: 'FEMALE',
    schoolName: 'Trường Mầm Non Ánh Dương',
    class: 'Lớp Lá A',
    code: 'HS-2026-042',
    isCurrent: true,
  },
];

const quickLinks = [
  {
    label: 'Học phí & Hóa đơn',
    description: 'Hóa đơn tháng 9 & đóng phí qua QR',
    href: '/parent/tuition',
    badge: 'Kỳ T9/2026',
    icon: CreditCard,
    accent: 'from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-400 border-blue-200/60 dark:border-blue-800/40',
  },
  {
    label: 'Theo dõi Sức khỏe',
    description: 'Chỉ số BMI WHO & lịch dặn thuốc',
    href: '/parent/health',
    badge: 'Chuẩn WHO',
    icon: HeartPulse,
    accent: 'from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40',
  },
  {
    label: 'Thực đơn Dinh dưỡng',
    description: 'Bữa ăn chuẩn calo & dinh dưỡng',
    href: '/parent/menu',
    badge: 'Tuần này',
    icon: Utensils,
    accent: 'from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/40',
  },
  {
    label: 'Đơn từ & Dặn dò',
    description: 'Xin nghỉ học, dặn thuốc, đón hộ',
    href: '/parent/requests',
    badge: 'Gửi nhanh',
    icon: ClipboardList,
    accent: 'from-purple-500/10 to-pink-500/10 text-purple-600 dark:text-purple-400 border-purple-200/60 dark:border-purple-800/40',
  },
];

export default function ParentHomePage() {
  const [selectedChild] = useState(mockChildren[0]);

  if (!selectedChild) {
    return (
      <div className="p-8 text-center text-muted-foreground py-16">
        <p>Không tìm thấy thông tin học sinh.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Child Profile Card */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-indigo-400 text-primary-foreground flex items-center justify-center font-bold text-xl shadow-md">
              {selectedChild.name.charAt(0)}
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-background"></span>
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base text-foreground truncate">{selectedChild.name}</h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {selectedChild.class}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{selectedChild.schoolName}</p>
            <p className="text-[11px] font-mono text-muted-foreground mt-0.5">Mã học sinh: {selectedChild.code}</p>
          </div>
        </div>

        {/* Live Day Status Highlights */}
        <div className="mt-4 pt-3.5 border-t border-border/60 grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 bg-muted/40 rounded-xl p-2.5">
            <Clock className="h-4 w-4 text-emerald-600 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground">Điểm danh hôm nay</p>
              <p className="font-semibold text-foreground truncate">Có mặt (07:45)</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-muted/40 rounded-xl p-2.5">
            <Apple className="h-4 w-4 text-amber-600 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground">Bữa trưa hôm nay</p>
              <p className="font-semibold text-foreground truncate">Cơm gà nấm</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="flex items-center gap-2">
        <Link 
          href="/parent/requests" 
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-sm hover:bg-primary/90 transition-all active:scale-[0.98] cursor-pointer"
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Gửi đơn xin nghỉ</span>
        </Link>
        <Link 
          href="/parent/tuition" 
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-card border border-border/80 text-foreground font-semibold text-xs shadow-xs hover:bg-muted transition-all active:scale-[0.98] cursor-pointer"
        >
          <CreditCard className="h-3.5 w-3.5 text-primary" />
          <span>Đóng học phí</span>
        </Link>
      </div>

      {/* Quick Access Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Phân hệ nghiệp vụ</h3>
          <span className="text-[10px] text-primary font-semibold flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            <span>4 phân hệ mở rộng</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`group relative overflow-hidden rounded-2xl border p-4 bg-gradient-to-br ${link.accent} transition-all duration-200 hover:shadow-md active:scale-[0.99] card-hover cursor-pointer`}
              >
                <div className="flex items-start justify-between">
                  <div className="h-10 w-10 rounded-xl bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-background/80 backdrop-blur-sm border border-border/60">
                    {link.badge}
                  </span>
                </div>

                <div className="mt-3">
                  <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                    <span>{link.label}</span>
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{link.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Security & Transparency Notice */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground space-y-1.5">
        <div className="flex items-center gap-2 text-foreground font-semibold">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span>Bảo mật & Minh bạch Dữ liệu</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          Phụ huynh chỉ truy cập dữ liệu đã được nhà trường công bố chính thức. Thông tin sức khỏe, dinh dưỡng và học phí được mã hóa và bảo mật đa tầng.
        </p>
      </div>
    </div>
  );
}
