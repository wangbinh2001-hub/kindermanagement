'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  UserCheck,
  CreditCard,
  HeartPulse,
  Utensils,
  Settings,
  Sparkles,
  ClipboardList,
  History,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';

interface SchoolNavProps {
  schoolSlug: string;
  features: {
    enableAttendance: boolean;
    enableTuition: boolean;
    enableHealth: boolean;
    enableNutrition: boolean;
  };
}

export function SchoolNav({ schoolSlug, features }: SchoolNavProps) {
  const pathname = usePathname();
  const basePath = `/${schoolSlug}`;

  const managementItems = [
    {
      href: basePath,
      label: 'Tổng quan Vận hành',
      icon: LayoutDashboard,
      exact: true,
      enabled: true,
      color: 'text-primary',
    },
    {
      href: `${basePath}/students`,
      label: 'Hồ sơ Học sinh',
      icon: Users,
      exact: false,
      enabled: true,
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      href: `${basePath}/school-years`,
      label: 'Năm học & Lớp học',
      icon: CalendarDays,
      exact: false,
      enabled: true,
      color: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      href: `${basePath}/staff`,
      label: 'Đội ngũ Nhân sự',
      icon: UserCheck,
      exact: false,
      enabled: true,
      color: 'text-purple-600 dark:text-purple-400',
    },
  ];

  const kindergartenModules = [
    {
      href: `${basePath}/attendance`,
      label: 'Điểm danh & Đón trả',
      icon: UserCheck,
      enabled: features.enableAttendance,
      badge: 'QR Check-in',
      color: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      href: `${basePath}/tuition`,
      label: 'Học phí & Hóa đơn',
      icon: CreditCard,
      enabled: features.enableTuition,
      badge: 'VietQR',
      color: 'text-sky-600 dark:text-sky-400',
    },
    {
      href: `${basePath}/health`,
      label: 'Sức khỏe & BMI WHO',
      icon: HeartPulse,
      enabled: features.enableHealth,
      badge: 'Chuẩn WHO',
      color: 'text-rose-600 dark:text-rose-400',
    },
    {
      href: `${basePath}/nutrition`,
      label: 'Dinh dưỡng & Thực đơn',
      icon: Utensils,
      enabled: features.enableNutrition,
      badge: 'Bộ GD&ĐT',
      color: 'text-amber-600 dark:text-amber-400',
    },
  ];

  const operationalItems = [
    {
      href: `${basePath}/parent-requests`,
      label: 'Yêu cầu Phụ huynh',
      icon: ClipboardList,
      exact: false,
      enabled: true,
      badge: 'Trực tuyến',
      color: 'text-purple-600 dark:text-purple-400',
    },
    {
      href: `${basePath}/audit-log`,
      label: 'Nhật ký Kiểm toán',
      icon: History,
      exact: false,
      enabled: true,
      badge: 'PII Safe',
      color: 'text-slate-600 dark:text-slate-400',
    },
    {
      href: `${basePath}/settings`,
      label: 'Cài đặt Cơ sở',
      icon: Settings,
      exact: false,
      enabled: true,
      color: 'text-muted-foreground',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Quản trị Cơ sở */}
      <div className="space-y-1">
        <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-2">
          Quản trị Cơ sở
        </p>
        {managementItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                  : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-primary-foreground' : item.color}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* 2. Nghiệp vụ Mầm non Chuyên sâu */}
      <div className="space-y-1">
        <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-2 flex items-center justify-between">
          <span>Nghiệp vụ Mầm non</span>
          <Sparkles className="h-3 w-3 text-primary" />
        </div>
        {kindergartenModules.map((item) => {
          if (!item.enabled) return null;
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                  : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-primary-foreground' : item.color}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-md ${
                  isActive 
                    ? 'bg-white/20 text-white' 
                    : 'bg-primary/10 text-primary border border-primary/20'
                }`}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* 3. Vận hành & Giám sát */}
      <div className="space-y-1">
        <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-2">
          Vận hành & Giám sát
        </p>
        {operationalItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                  : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-primary-foreground' : item.color}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded-md ${
                  isActive 
                    ? 'bg-white/20 text-white' 
                    : 'bg-muted text-muted-foreground border border-border/60'
                }`}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
