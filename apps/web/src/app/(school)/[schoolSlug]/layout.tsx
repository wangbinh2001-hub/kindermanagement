import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@km/db';
import { SchoolNav } from './school-nav';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationBell } from '@/components/notification-bell';
import { 
  Building2, 
  ShieldCheck, 
  LogOut, 
  ExternalLink, 
  Sparkles,
  Home,
  CheckCircle2,
  CalendarCheck
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export async function getSchoolOrNull(schoolSlug: string) {
  return prisma.school.findUnique({
    where: { slug: schoolSlug },
    include: {
      setting: true,
    },
  });
}

export default async function SchoolWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ schoolSlug: string }>;
}) {
  const { schoolSlug } = await params;

  const school = await prisma.school.findUnique({
    where: { slug: schoolSlug },
    include: {
      setting: true,
    },
  });

  if (!school || school.deletedAt || school.status === 'DELETED') {
    notFound();
  }

  const features = {
    enableAttendance: school.setting?.enableAttendance ?? true,
    enableTuition: school.setting?.enableTuition ?? true,
    enableHealth: school.setting?.enableHealth ?? true,
    enableNutrition: school.setting?.enableNutrition ?? false,
  };

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col md:flex-row selection:bg-primary/20">
      {/* Sidebar Desktop */}
      <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col shrink-0 shadow-xs">
        {/* Header trường */}
        <div className="p-4 border-b border-border/70 space-y-2">
          <Link href={`/${school.slug}`} className="flex items-start gap-3 group cursor-pointer">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-primary to-indigo-500 text-primary-foreground flex items-center justify-center font-bold text-base shrink-0 shadow-md shadow-primary/20 group-hover:scale-105 transition-all">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-sm text-foreground truncate leading-tight group-hover:text-primary transition-colors">
                {school.name}
              </h2>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                  {school.code}
                </span>
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Hoạt động
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Danh mục điều hướng */}
        <div className="flex-1 p-3.5 overflow-y-auto">
          <SchoolNav schoolSlug={school.slug} features={features} />
        </div>

        {/* Footer Sidebar */}
        <div className="p-3.5 border-t border-border/70 space-y-2.5 bg-muted/20">
          <div className="p-2.5 rounded-xl bg-card border border-border/70 text-xs space-y-1 shadow-2xs">
            <div className="font-bold text-foreground flex items-center gap-1.5 text-[11px]">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Multi-tenant RLS Active</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Cô lập 100% dữ liệu theo cơ sở {school.code}.
            </p>
          </div>

          <div className="flex items-center justify-between pt-1 px-1">
            <Link
              href="/system-admin"
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors font-semibold"
            >
              <ExternalLink className="h-3 w-3" />
              <span>System Admin</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 border-b border-border/70 bg-card/85 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="md:hidden flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shadow-xs">
                KM
              </div>
              <span className="font-bold text-sm truncate max-w-[160px]">{school.name}</span>
            </div>
            <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{school.name}</span>
              <span>/</span>
              <span className="text-muted-foreground font-mono">{school.code}</span>
              <span>/</span>
              <span className="text-primary font-medium">Không gian làm việc</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <NotificationBell schoolSlug={school.slug} />

            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/80 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
            >
              <Home className="h-3.5 w-3.5" />
              <span>Trang chủ</span>
            </Link>

            <div className="md:hidden">
              <ThemeToggle />
            </div>

            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 text-xs font-bold transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </Link>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
