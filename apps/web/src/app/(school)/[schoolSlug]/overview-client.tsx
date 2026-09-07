'use client';

import Link from 'next/link';
import {
  GraduationCap,
  CalendarDays,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  PlusCircle,
  Sparkles,
  CreditCard,
  UserCheck,
  Building2,
  AlertCircle,
  HeartPulse,
  Utensils,
  ClipboardList,
  History,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

interface OverviewMetrics {
  school: {
    id: string;
    code: string;
    name: string;
    slug: string;
    status: string;
  };
  currentYear: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  } | null;
  classesCount: number;
  studentsCount: number;
  staffCount: number;
  pendingRequestsCount: number;
}

export function OverviewClient({ metrics }: { metrics: OverviewMetrics }) {
  const { school, currentYear, classesCount, studentsCount, staffCount, pendingRequestsCount } = metrics;
  const isSetupNeeded = !currentYear || classesCount === 0;

  const cards = [
    {
      title: 'Năm học hiện tại',
      value: currentYear ? currentYear.name : 'Chưa thiết lập',
      subtext: currentYear ? `${currentYear.startDate} — ${currentYear.endDate}` : 'Cần kích hoạt năm học',
      badge: currentYear ? 'Đang diễn ra' : 'Cần cài đặt',
      icon: CalendarDays,
      style: 'text-primary bg-primary/10 border-primary/20',
    },
    {
      title: 'Tổng số lớp học',
      value: classesCount.toString(),
      subtext: currentYear ? `Phân bổ trong ${currentYear.name}` : 'Chưa có năm học',
      badge: `${classesCount} nhóm lớp`,
      icon: GraduationCap,
      style: 'text-blue-600 bg-blue-500/10 border-blue-500/20 dark:text-blue-400',
    },
    {
      title: 'Học sinh đang theo học',
      value: studentsCount.toString(),
      subtext: 'Danh sách nhập học chính thức',
      badge: 'Đã phân lớp',
      icon: Users,
      style: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400',
    },
    {
      title: 'Cán bộ & Giáo viên',
      value: staffCount.toString(),
      subtext: 'Giáo viên và nhân viên vận hành',
      badge: '100% Hoạt động',
      icon: UserCheck,
      style: 'text-purple-600 bg-purple-500/10 border-purple-500/20 dark:text-purple-400',
    },
    {
      title: 'Tỷ lệ Chuyên cần hôm nay',
      value: '100%',
      subtext: 'Đã hoàn tất điểm danh đầu ngày',
      badge: 'QR Đồng bộ',
      icon: CheckCircle2,
      style: 'text-teal-600 bg-teal-500/10 border-teal-500/20 dark:text-teal-400',
    },
    {
      title: 'Yêu cầu phụ huynh chờ duyệt',
      value: pendingRequestsCount.toString(),
      subtext: 'Đơn xin nghỉ & dặn thuốc cần xử lý',
      badge: pendingRequestsCount > 0 ? 'Cần xử lý' : 'Đã sạch đơn',
      icon: Clock,
      style: 'text-amber-600 bg-amber-500/10 border-amber-500/20 dark:text-amber-400',
    },
  ];

  const quickActions = [
    {
      title: 'Điểm danh hôm nay',
      desc: 'Quét QR & ghi nhận đón trả',
      href: `/${school.slug}/attendance`,
      icon: UserCheck,
      color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    },
    {
      title: 'Hồ sơ học sinh',
      desc: 'Thêm mới hoặc phân lớp',
      href: `/${school.slug}/students`,
      icon: Users,
      color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    },
    {
      title: 'Học phí & Hóa đơn',
      desc: 'Lập phiếu thu & xuất VietQR',
      href: `/${school.slug}/tuition`,
      icon: CreditCard,
      color: 'bg-sky-500/10 text-sky-600 border-sky-500/20',
    },
    {
      title: 'Duyệt đơn phụ huynh',
      desc: 'Xử lý đơn xin nghỉ, dặn thuốc',
      href: `/${school.slug}/parent-requests`,
      icon: ClipboardList,
      color: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    },
    {
      title: 'Thực đơn tuần',
      desc: 'Kế hoạch dinh dưỡng chuẩn Calo',
      href: `/${school.slug}/nutrition`,
      icon: Utensils,
      color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    },
    {
      title: 'Sức khỏe & BMI WHO',
      desc: 'Kiểm tra thể trạng định kỳ',
      href: `/${school.slug}/health`,
      icon: HeartPulse,
      color: 'text-rose-600 bg-rose-500/10 border-rose-500/20',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-r from-card via-card to-primary/5 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                {school.code}
              </span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground font-medium">Bảng điều khiển Trung tâm</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {school.name}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl leading-relaxed">
              Tổng quan hoạt động thời gian thực: Quản lý học sinh, chuyên cần, sức khỏe, học phí và tương tác phụ huynh.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              href={`/${school.slug}/school-years`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md shadow-primary/20 hover:bg-primary/90 transition-all cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Năm học & Lớp học</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Setup Checklist khi trường mới chưa có Năm học / Lớp học */}
      {isSetupNeeded && (
        <div id="setup-checklist" className="p-6 rounded-3xl border border-primary/30 bg-primary/5 dark:bg-primary/10 space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-primary to-indigo-500 text-primary-foreground flex items-center justify-center font-bold shrink-0 shadow-md">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">
                Khởi động cơ sở trường học mới — Thiết lập 3 bước
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Hoàn thiện các bước cấu hình ban đầu để sẵn sàng đón nhận và quản lý học sinh.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className={`p-4 rounded-2xl border transition-all ${currentYear ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-card border-border'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-foreground">Bước 1: Tạo Năm học</span>
                {currentYear ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <span className="text-[10px] font-semibold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">
                    Chờ tạo
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mb-3">
                Khai báo năm học mới (ví dụ: 2026-2027) và đặt làm năm học chính thức.
              </p>
              <Link
                href={`/${school.slug}/school-years`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                <span>Thiết lập năm học</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className={`p-4 rounded-2xl border transition-all ${classesCount > 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-card border-border'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-foreground">Bước 2: Khởi tạo Lớp học</span>
                {classesCount > 0 ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <span className="text-[10px] font-semibold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">
                    Chờ tạo
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mb-3">
                Tạo các lớp mầm non theo độ tuổi chuẩn (Nhà trẻ, Mầm, Chồi, Lá).
              </p>
              <Link
                href={`/${school.slug}/school-years`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                <span>Tạo lớp học</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className={`p-4 rounded-2xl border transition-all ${studentsCount > 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-card border-border'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-foreground">Bước 3: Nhập học sinh</span>
                <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  Phase 4
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mb-3">
                Tiếp nhận hồ sơ trẻ, phân lớp và liên kết phụ huynh.
              </p>
              <Link
                href={`/${school.slug}/students`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                <span>Quản lý học sinh</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
          Chỉ số Vận hành Cốt lõi
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="p-5 rounded-3xl border border-border/80 bg-card shadow-xs space-y-3 card-hover"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">{card.title}</span>
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center border ${card.style}`}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-extrabold tracking-tight text-foreground">{card.value}</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground truncate">{card.subtext}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-muted/70 text-muted-foreground shrink-0">
                      {card.badge}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Action Matrix (Phase 1-11) */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
          Thao tác Nhanh Nghiệp vụ
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <Link
                key={i}
                href={action.href}
                className="group flex items-center gap-3.5 p-4 rounded-2xl border border-border/80 bg-card hover:bg-muted/40 transition-all card-hover cursor-pointer shadow-2xs"
              >
                <div className={`h-11 w-11 rounded-2xl flex items-center justify-center border shrink-0 ${action.color} group-hover:scale-105 transition-transform`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                    <span>{action.title}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{action.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
