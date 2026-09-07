"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@km/ui";
import { 
  GraduationCap, 
  ShieldCheck, 
  Users, 
  CalendarCheck, 
  Utensils, 
  HeartPulse, 
  CreditCard, 
  ArrowRight,
  Sparkles,
  ChevronRight,
  School,
  Baby,
  UserCheck,
  FileSpreadsheet,
  Lock,
  Clock,
  CheckCircle2,
  Bell,
  MessageSquare,
  QrCode,
  Layers,
  Smartphone,
  Laptop,
  Check,
  Building2
} from "lucide-react";
import { ThemeToggle } from "../components/ThemeToggle";

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<"school" | "parent">("school");

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20">
      {/* 1. Header & Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20 transition-transform group-hover:scale-105">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight leading-none text-primary">KinderManagement</span>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Hệ thống Mầm non Thông minh</span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#demo-roles" className="hover:text-primary transition-colors">Trải nghiệm Demo</a>
            <a href="#3-tru-cot" className="hover:text-primary transition-colors">Trụ cột Giá trị</a>
            <a href="#14-phan-he" className="hover:text-primary transition-colors">14 Phân hệ Nghiệp vụ</a>
            <a href="#preview" className="hover:text-primary transition-colors">Giao diện Thực tế</a>
            <a href="#bao-mat" className="hover:text-primary transition-colors">An toàn & RLS</a>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login">
              <Button className="shadow-sm font-semibold h-10 px-5">
                Đăng nhập
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section with Glow Gradient */}
      <section className="relative overflow-hidden pt-14 pb-16 md:pt-20 md:pb-24 border-b">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(99,102,241,0.18),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(99,102,241,0.28),rgba(0,0,0,0))]" />
        
        <div className="container mx-auto px-4 sm:px-8 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary mb-6 shadow-xs backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Chuẩn mực SaaS Mầm non Đa Cơ sở (Multi-tenant)</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.15] text-balance">
            Quản trị Toàn diện — Vận hành Chuẩn mực — Kết nối Yêu thương
          </h1>

          <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed">
            Giải pháp số hóa chuyên sâu cho giáo dục mầm non Việt Nam: đồng bộ điểm danh QR, dinh dưỡng & calo chuẩn Bộ GD&ĐT, theo dõi phát triển BMI WHO đến học phí minh bạch và bảo mật dữ liệu tuyệt đối.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#demo-roles" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto text-base px-8 h-12 shadow-lg shadow-primary/25 font-semibold">
                Khám phá Demo Nhanh
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
            <Link href="/login" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-base px-8 h-12 font-medium">
                Cổng Đăng nhập Thống nhất
              </Button>
            </Link>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 pt-10 border-t border-border/60">
            <div className="space-y-1">
              <div className="text-3xl font-extrabold text-primary tracking-tight">100%</div>
              <div className="text-xs text-muted-foreground font-medium">Cô lập Dữ liệu (PostgreSQL RLS)</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-extrabold text-primary tracking-tight">14+</div>
              <div className="text-xs text-muted-foreground font-medium">Phân hệ Nghiệp vụ Chuẩn hóa</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-extrabold text-primary tracking-tight">Real-time</div>
              <div className="text-xs text-muted-foreground font-medium">Điểm danh & Dinh dưỡng Tức thời</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-extrabold text-primary tracking-tight">3 Cổng</div>
              <div className="text-xs text-muted-foreground font-medium">Nhà trường / Phụ huynh / Nền tảng</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Interactive Demo Quick-Access Role Switcher Hub */}
      <section id="demo-roles" className="py-20 bg-muted/15 border-b scroll-mt-12">
        <div className="container mx-auto px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Trải nghiệm Tức thì Không cần Đăng nhập</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Cổng Truy cập Trực tiếp theo Vai trò</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Chọn vai trò để trải nghiệm đầy đủ các tính năng đã được thiết kế hoàn thiện từ Phase 1 đến Phase 11.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Vai trò 1: Ban Giám Hiệu */}
            <div className="rounded-2xl border bg-card p-6 shadow-xs card-hover flex flex-col justify-between space-y-5 relative overflow-hidden group">
              <div className="absolute -top-12 -right-12 w-28 h-28 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors" />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                    Ban Giám Hiệu
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">Cơ Sở Sunshine</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Điều hành toàn diện: điểm danh sĩ số thực tế, thực đơn dinh dưỡng, hóa đơn học phí & kiểm toán Audit Log.
                  </p>
                </div>
                <div className="pt-2 border-t space-y-1.5 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-primary" />
                    <span>6 Thẻ chỉ số KPI thời gian thực</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-primary" />
                    <span>Audit Log che giấu PII (***)</span>
                  </div>
                </div>
              </div>
              <Link href="/sunshine-kindergarten" className="w-full">
                <Button className="w-full font-medium text-xs h-10 shadow-xs bg-blue-600 hover:bg-blue-700 text-white">
                  Vào Cổng Nhà Trường
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>

            {/* Vai trò 2: Giáo Viên */}
            <div className="rounded-2xl border bg-card p-6 shadow-xs card-hover flex flex-col justify-between space-y-5 relative overflow-hidden group">
              <div className="absolute -top-12 -right-12 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors" />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <UserCheck className="h-6 w-6" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    Giáo Viên Lớp
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">Điểm danh & Triage Đơn</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Điểm danh một chạm, quét mã QR đón trả và xử lý duyệt đơn xin nghỉ, dặn thuốc phụ huynh tức thì.
                  </p>
                </div>
                <div className="pt-2 border-t space-y-1.5 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Check-in/out QR người đón</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Triage đơn nghỉ & thuốc 3 trạng thái</span>
                  </div>
                </div>
              </div>
              <Link href="/sunshine-kindergarten/attendance" className="w-full">
                <Button className="w-full font-medium text-xs h-10 shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                  Vào Điểm Danh QR
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>

            {/* Vai trò 3: Phụ Huynh Học Sinh */}
            <div className="rounded-2xl border bg-card p-6 shadow-xs card-hover flex flex-col justify-between space-y-5 relative overflow-hidden group">
              <div className="absolute -top-12 -right-12 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-colors" />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                    <Baby className="h-6 w-6" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                    Phụ Huynh (Mobile)
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">Sổ Liên Lạc Điện Tử</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Theo dõi biểu đồ phát triển BMI chuẩn WHO, thực đơn theo ngày, hóa đơn học phí VietQR và gửi đơn từ tiện lợi.
                  </p>
                </div>
                <div className="pt-2 border-t space-y-1.5 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-amber-600" />
                    <span>Dải quang phổ BMI WHO trực quan</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-amber-600" />
                    <span>Thanh toán VietQR chuyển khoản</span>
                  </div>
                </div>
              </div>
              <Link href="/parent" className="w-full">
                <Button className="w-full font-medium text-xs h-10 shadow-xs bg-amber-600 hover:bg-amber-700 text-white">
                  Vào Cổng Phụ Huynh
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>

            {/* Vai trò 4: System Admin */}
            <div className="rounded-2xl border bg-card p-6 shadow-xs card-hover flex flex-col justify-between space-y-5 relative overflow-hidden group">
              <div className="absolute -top-12 -right-12 w-28 h-28 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-colors" />
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-12 w-12 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-600 border border-purple-500/20">
                    System Admin
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">Quản Trị Nền Tảng</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Giám sát đa trường học, kiểm soát cấu hình bảo mật RLS, cấp phát phiên hỗ trợ và theo dõi log hệ thống.
                  </p>
                </div>
                <div className="pt-2 border-t space-y-1.5 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-purple-600" />
                    <span>Kiểm soát Tenant Isolation</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-purple-600" />
                    <span>Support Session có giới hạn</span>
                  </div>
                </div>
              </div>
              <Link href="/system-admin" className="w-full">
                <Button className="w-full font-medium text-xs h-10 shadow-xs bg-purple-600 hover:bg-purple-700 text-white">
                  Vào Cổng Nền Tảng
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Interactive Live Preview Showcase */}
      <section id="preview" className="py-20 border-b">
        <div className="container mx-auto px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <h2 className="text-3xl font-bold tracking-tight">Giao diện Thiết kế Đột phá</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Trải nghiệm thẩm mỹ tinh tế, tỷ lệ tương phản chuẩn mực WCAG AA và bố cục trực quan cho cả Desktop và Di động.
            </p>

            {/* Tab Switcher */}
            <div className="inline-flex p-1 rounded-xl bg-muted/60 border mt-4">
              <button
                onClick={() => setActiveTab("school")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "school"
                    ? "bg-background text-primary shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Laptop className="h-4 w-4" />
                <span>Không gian Cơ sở (School Desktop)</span>
              </button>
              <button
                onClick={() => setActiveTab("parent")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "parent"
                    ? "bg-background text-primary shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Smartphone className="h-4 w-4" />
                <span>Sổ Liên Lạc (Parent Mobile)</span>
              </button>
            </div>
          </div>

          {/* Preview Canvas */}
          <div className="max-w-4xl mx-auto rounded-2xl border bg-card/60 backdrop-blur p-6 shadow-md">
            {activeTab === "school" ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                      SK
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Trường Mầm non Ban Mai (Sunshine)</div>
                      <div className="text-[11px] text-muted-foreground">Mã: SUNSHINE • Năm học 2025 - 2026</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      RLS Active
                    </span>
                  </div>
                </div>

                {/* Simulated KPI Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-3.5 rounded-xl bg-muted/30 border space-y-1">
                    <div className="text-[11px] text-muted-foreground">Sĩ số Toàn trường</div>
                    <div className="text-xl font-bold text-foreground">128 bé</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-400">Có mặt hôm nay</div>
                    <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400">122 bé (95.3%)</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-muted/30 border space-y-1">
                    <div className="text-[11px] text-muted-foreground">Đơn xin nghỉ</div>
                    <div className="text-xl font-bold text-amber-600">6 đơn</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-muted/30 border space-y-1">
                    <div className="text-[11px] text-muted-foreground">Tiền ăn hôm nay</div>
                    <div className="text-xl font-bold text-primary">3,660,000 đ</div>
                  </div>
                </div>

                {/* Simulated Navigation Bar */}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Link href="/sunshine-kindergarten" className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors">
                    Tổng quan Cơ sở
                  </Link>
                  <Link href="/sunshine-kindergarten/attendance" className="text-xs px-3 py-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors font-medium">
                    Điểm danh QR
                  </Link>
                  <Link href="/sunshine-kindergarten/audit-log" className="text-xs px-3 py-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors font-medium">
                    Kiểm toán Audit Log (PII Safe)
                  </Link>
                  <Link href="/sunshine-kindergarten/parent-requests" className="text-xs px-3 py-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors font-medium">
                    Triage Đơn Phụ huynh
                  </Link>
                </div>
              </div>
            ) : (
              <div className="max-w-md mx-auto space-y-4">
                {/* Mobile Child Card Simulation */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 via-accent/15 to-primary/5 border border-primary/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center shadow-xs">
                      NA
                    </div>
                    <div>
                      <div className="font-bold text-sm">Nguyễn Gia An</div>
                      <div className="text-xs text-muted-foreground">Lớp Mầm A1 • 3 tuổi</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    Đã đến lớp (07:45)
                  </span>
                </div>

                {/* Simulated WHO BMI Bar */}
                <div className="p-4 rounded-xl bg-muted/30 border space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>Thể trạng BMI WHO</span>
                    <span className="text-emerald-600 font-bold">15.8 kg/m² • Chuẩn</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-gradient-to-r from-blue-400 via-emerald-400 to-rose-400 relative overflow-hidden" />
                </div>

                {/* Simulated Fast Mobile Nav */}
                <div className="grid grid-cols-4 gap-2 pt-2">
                  <Link href="/parent/health" className="p-2.5 rounded-xl border bg-card text-center hover:border-primary transition-colors">
                    <HeartPulse className="h-4 w-4 mx-auto text-rose-500 mb-1" />
                    <div className="text-[10px] font-medium">Sức khỏe</div>
                  </Link>
                  <Link href="/parent/menu" className="p-2.5 rounded-xl border bg-card text-center hover:border-primary transition-colors">
                    <Utensils className="h-4 w-4 mx-auto text-amber-500 mb-1" />
                    <div className="text-[10px] font-medium">Thực đơn</div>
                  </Link>
                  <Link href="/parent/tuition" className="p-2.5 rounded-xl border bg-card text-center hover:border-primary transition-colors">
                    <CreditCard className="h-4 w-4 mx-auto text-indigo-500 mb-1" />
                    <div className="text-[10px] font-medium">Học phí</div>
                  </Link>
                  <Link href="/parent/requests" className="p-2.5 rounded-xl border bg-card text-center hover:border-primary transition-colors">
                    <MessageSquare className="h-4 w-4 mx-auto text-purple-500 mb-1" />
                    <div className="text-[10px] font-medium">Gửi đơn</div>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. Three Pillars of Value */}
      <section id="3-tru-cot" className="py-20 bg-muted/20 border-b">
        <div className="container mx-auto px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl font-bold tracking-tight">3 Trụ cột Giá trị Trọng tâm</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Thiết kế hướng đối tượng mang lại trải nghiệm tối ưu và minh bạch cho từng nhóm người dùng trong hệ sinh thái.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Cột 1: Ban Giám hiệu */}
            <div className="rounded-2xl border bg-card p-8 shadow-xs card-hover space-y-4">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <School className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">Ban Giám Hiệu & Chủ Trường</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Nắm bắt toàn cảnh hoạt động trường học qua bảng điều hành số: theo dõi sĩ số, biến động học sinh, doanh thu học phí, kiểm soát chi phí thực phẩm và xuất báo cáo chuẩn xác.
              </p>
              <ul className="text-xs text-muted-foreground space-y-2 pt-2 border-t">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  <span>Quản lý hồ sơ học sinh, phân lớp theo năm học</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  <span>Kiểm toán bất biến (Audit Log) mọi thao tác nhạy cảm</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  <span>Cấu hình biểu phí và quản lý miễn giảm học phí</span>
                </li>
              </ul>
            </div>

            {/* Cột 2: Giáo viên */}
            <div className="rounded-2xl border bg-card p-8 shadow-xs card-hover space-y-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <UserCheck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">Giáo Viên & Nhân Sự</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Giảm tải áp lực sổ sách giấy tờ: điểm danh một chạm qua QR, theo dõi giấc ngủ, ghi nhận nhật ký sức khỏe, duyệt đơn xin nghỉ và gửi thông báo trực tiếp đến phụ huynh.
              </p>
              <ul className="text-xs text-muted-foreground space-y-2 pt-2 border-t">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Điểm danh QR xác thực người đón ủy quyền</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Sổ liên lạc điện tử cập nhật từng buổi học</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Quản lý dặn thuốc và tiếp nhận đơn xin nghỉ học</span>
                </li>
              </ul>
            </div>

            {/* Cột 3: Phụ huynh */}
            <div className="rounded-2xl border bg-card p-8 shadow-xs card-hover space-y-4">
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Baby className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">Phụ Huynh Học Sinh</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Đồng hành cùng con mỗi ngày: xem thực đơn bữa ăn, theo dõi biểu đồ phát triển BMI, nhận thông báo học phí minh bạch và gửi đơn từ tiện lợi ngay trên điện thoại (Mobile-First).
              </p>
              <ul className="text-xs text-muted-foreground space-y-2 pt-2 border-t">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Một tài khoản quản lý nhiều con ở các trường khác nhau</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Xem thực đơn dinh dưỡng và lượng calo hàng ngày</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Gửi đơn dặn thuốc, xin nghỉ học chỉ với vài thao tác</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 6. 14 Core Modules Grid */}
      <section id="14-phan-he" className="py-20 border-b">
        <div className="container mx-auto px-4 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3.5 py-1 text-xs font-semibold text-primary">
              <Layers className="h-3.5 w-3.5" />
              <span>Nghiệp vụ Chuyên sâu</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight">14 Phân hệ Nghiệp vụ Chuẩn hóa</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Bao quát trọn vẹn quy trình vận hành một trường mầm non hiện đại theo quy chuẩn giáo dục Việt Nam.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Nhóm 1: Vận hành */}
            <div className="rounded-xl border bg-card p-5 space-y-3 card-hover">
              <div className="h-9 w-9 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-base">Hồ sơ Học sinh Toàn cầu</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Định danh duy nhất bằng CCCD, bảo vệ thông tin PII, quản lý 3 nhóm người giám hộ (Cha/Mẹ/Giám hộ).
              </p>
            </div>

            <div className="rounded-xl border bg-card p-5 space-y-3 card-hover">
              <div className="h-9 w-9 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <School className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-base">Năm học & Lớp học</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Lịch sử phân lớp bất biến (Append-only History), không ghi đè dữ liệu, quản lý chuyển lớp chuẩn mực.
              </p>
            </div>

            <div className="rounded-xl border bg-card p-5 space-y-3 card-hover">
              <div className="h-9 w-9 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <UserCheck className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-base">Hồ sơ & Phân công Nhân sự</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Quản lý giáo viên chủ nhiệm, phụ tá, nhân viên y tế, kế toán, bảo mẫu và tài xế đưa đón.
              </p>
            </div>

            <div className="rounded-xl border bg-card p-5 space-y-3 card-hover">
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <CalendarCheck className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-base">Điểm danh & Đón trả QR</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Check-in/out bảo mật bằng QR, xác thực khuôn mặt hoặc mã ủy quyền của phụ huynh đưa đón.
              </p>
            </div>

            {/* Nhóm 2: Chăm sóc & Dinh dưỡng */}
            <div className="rounded-xl border bg-card p-5 space-y-3 card-hover">
              <div className="h-9 w-9 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Utensils className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-base">Dinh dưỡng & Thực đơn Tuần</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tự động tính toán năng lượng calo theo độ tuổi, thư viện món ăn và cân đối khẩu phần dinh dưỡng.
              </p>
            </div>

            <div className="rounded-xl border bg-card p-5 space-y-3 card-hover">
              <div className="h-9 w-9 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-base">Phiếu Đi Chợ & Định lượng</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tổng hợp nguyên liệu theo sĩ số điểm danh thực tế, kiểm soát ngân sách mua sắm thực phẩm hàng ngày.
              </p>
            </div>

            <div className="rounded-xl border bg-card p-5 space-y-3 card-hover">
              <div className="h-9 w-9 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center">
                <HeartPulse className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-base">Sức khỏe & Biểu đồ BMI WHO</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Theo dõi định kỳ chiều cao, cân nặng, phân loại thể trạng suy dinh dưỡng/béo phì theo chuẩn WHO.
              </p>
            </div>

            <div className="rounded-xl border bg-card p-5 space-y-3 card-hover">
              <div className="h-9 w-9 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-base">Quản lý Dị ứng & Sổ Tiêm chủng</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Cảnh báo dị ứng thực phẩm khi chế biến và theo dõi lịch sử tiêm chủng mở rộng của từng trẻ.
              </p>
            </div>

            {/* Nhóm 3: Tài chính */}
            <div className="rounded-xl border bg-card p-5 space-y-3 card-hover">
              <div className="h-9 w-9 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                <CreditCard className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-base">Danh mục Biểu phí Linh hoạt</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Khoản thu bắt buộc, tự nguyện, tiền ăn theo ngày điểm danh, tiền xe buýt và dịch vụ ngoài giờ.
              </p>
            </div>

            <div className="rounded-xl border bg-card p-5 space-y-3 card-hover">
              <div className="h-9 w-9 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-base">Miễn giảm Học phí</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Chính sách giảm trừ theo phần trăm hoặc số tiền cố định cho con thứ 2, diện chính sách gia đình.
              </p>
            </div>

            <div className="rounded-xl border bg-card p-5 space-y-3 card-hover">
              <div className="h-9 w-9 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                <Lock className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-base">Hóa đơn Snapshot Bất biến</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Hóa đơn tháng sau khi phát hành giữ nguyên giá trị lịch sử, bảo toàn tính pháp lý tài chính.
              </p>
            </div>

            {/* Nhóm 4: Giao tiếp & Hệ thống */}
            <div className="rounded-xl border bg-card p-5 space-y-3 card-hover">
              <div className="h-9 w-9 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <MessageSquare className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-base">Đơn Phụ huynh Trực tuyến</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Quy trình tiếp nhận và phê duyệt đơn xin nghỉ, dặn thuốc kèm hình ảnh đơn bác sĩ và ủy quyền đón.
              </p>
            </div>

            <div className="rounded-xl border bg-card p-5 space-y-3 card-hover">
              <div className="h-9 w-9 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <Bell className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-base">Thông báo Đẩy Đa kênh</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Gửi thông báo tức thì đến toàn trường, từng khối, lớp hoặc từng phụ huynh với tỷ lệ đọc cao.
              </p>
            </div>

            <div className="rounded-xl border bg-card p-5 space-y-3 card-hover">
              <div className="h-9 w-9 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <Clock className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-base">Kiểm toán AuditLog Tự động</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ghi log bất biến mọi thao tác tạo, cập nhật, xóa mềm dữ liệu, bảo đảm minh bạch pháp lý tuyệt đối.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Security & Isolation Section */}
      <section id="bao-mat" className="py-20 bg-muted/20 border-b">
        <div className="container mx-auto px-4 sm:px-8">
          <div className="max-w-4xl mx-auto rounded-3xl border bg-card p-8 sm:p-12 shadow-sm space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Kiến trúc An toàn & Cô lập Đa người thuê (RLS)</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Mỗi trường là một không gian độc lập, không chia sẻ ngữ cảnh dữ liệu dưới mọi hình thức.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Lock className="h-4 w-4 text-emerald-600" />
                  <span>PostgreSQL RLS</span>
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Row Level Security được kích hoạt trực tiếp từ tầng cơ sở dữ liệu, chặn đứng mọi nguy cơ rò rỉ dữ liệu ngoài ý muốn.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-emerald-600" />
                  <span>Support Access Giới hạn</span>
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  System Admin chỉ được truy cập dữ liệu trường học khi có phiên hỗ trợ kỹ thuật được kích hoạt rõ ràng về lý do và thời gian.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Xóa Mềm (Soft Delete)</span>
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tuyệt đối không xóa vật lý các dữ liệu vận hành. Mọi dữ liệu đều có thể khôi phục và truy vết nguồn gốc khi cần thiết.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FAQ Section */}
      <section id="faq" className="py-20 border-b">
        <div className="container mx-auto px-4 sm:px-8 max-w-3xl">
          <div className="text-center mb-12 space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Câu hỏi thường gặp</h2>
            <p className="text-sm text-muted-foreground">Những thắc mắc phổ biến về việc ứng dụng hệ thống mầm non.</p>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border bg-card p-5 card-hover">
              <h4 className="font-semibold text-sm mb-2">Phụ huynh có cần tạo nhiều tài khoản nếu có con học khác trường?</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Không. Hệ thống áp dụng cơ chế <strong>Parent Identity Reuse</strong>: Phụ huynh chỉ cần dùng duy nhất số điện thoại của mình để đăng nhập và xem được thông tin của tất cả các con đang học ở bất kỳ cơ sở nào trong hệ thống.
              </p>
            </div>

            <div className="rounded-xl border bg-card p-5 card-hover">
              <h4 className="font-semibold text-sm mb-2">Dữ liệu học phí và điểm danh của trẻ được lưu trữ trong bao lâu?</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Toàn bộ dữ liệu vận hành, hóa đơn học phí và lịch sử phân lớp đều được lưu trữ vĩnh viễn theo chính sách bất biến (Append-only), phục vụ đối soát tài chính và theo dõi tiến trình phát triển của trẻ qua các năm học.
              </p>
            </div>

            <div className="rounded-xl border bg-card p-5 card-hover">
              <h4 className="font-semibold text-sm mb-2">Nhà trường có thể dùng thử hoặc yêu cầu cấp tài khoản như thế nào?</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tài khoản trường học sẽ được cấp phát chính thức qua Cổng Quản trị Nền tảng (System Admin). Khi nhận trường, Hiệu trưởng được cấp thông tin tạm thời và bắt buộc đổi mật khẩu mới trong lần đăng nhập đầu tiên.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Final Call to Action */}
      <section className="py-16 bg-primary/5 text-center">
        <div className="container mx-auto px-4 sm:px-8 max-w-2xl space-y-6">
          <h2 className="text-3xl font-bold tracking-tight">Sẵn sàng nâng tầm chuyển đổi số mầm non?</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Trải nghiệm ngay hệ thống quản trị mầm non thông minh, an toàn và tinh gọn hàng đầu.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto font-semibold px-8 h-12 shadow-md shadow-primary/20">
                Đăng nhập Cổng Hệ thống
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 10. Full Footer */}
      <footer className="border-t py-12 bg-background">
        <div className="container mx-auto px-4 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-foreground">KinderManagement</span>
              <span>Nền tảng Vận hành Mầm non Đa Cơ sở © 2026.</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6">
            <a href="#demo-roles" className="hover:text-primary transition-colors">Trải nghiệm Demo</a>
            <a href="#3-tru-cot" className="hover:text-primary transition-colors">3 Trụ cột</a>
            <a href="#14-phan-he" className="hover:text-primary transition-colors">14 Phân hệ</a>
            <a href="#bao-mat" className="hover:text-primary transition-colors">Bảo mật RLS</a>
            <Link href="/login" className="hover:text-primary transition-colors">Đăng nhập</Link>
            <Link href="/system-admin" className="hover:text-primary transition-colors text-foreground font-medium">Quản trị Nền tảng</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
