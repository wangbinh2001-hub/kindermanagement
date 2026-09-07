import Link from "next/link";
import { GraduationCap, ShieldAlert, Plus, Home } from "lucide-react";
import { Button } from "@km/ui";
import { ThemeToggle } from "../../components/ThemeToggle";
import { SystemAdminNav } from "./nav";

export default function SystemAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20">
      {/* Header Quản trị Nền tảng */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-6">
            <Link href="/system-admin" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/25 transition-transform group-hover:scale-105">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base tracking-tight leading-none text-foreground">
                    KinderManagement
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/30 uppercase tracking-wider">
                    <ShieldAlert className="h-3 w-3" />
                    System Admin
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">
                  Cổng Quản trị Nền tảng SaaS
                </span>
              </div>
            </Link>

            {/* Menu chính */}
            <div className="hidden md:block">
              <SystemAdminNav />
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/system-admin/schools/new">
              <Button size="sm" className="hidden sm:inline-flex items-center gap-1.5 h-9 font-semibold shadow-xs">
                <Plus className="h-4 w-4" />
                <span>Tạo trường</span>
              </Button>
            </Link>

            <Link href="/system-admin/profile" title="Hồ sơ & Mật khẩu Admin">
              <Button variant="outline" size="sm" className="h-9 px-3 text-xs font-semibold gap-1.5 border-primary/20 text-foreground hover:bg-primary/10">
                <div className="h-4 w-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">
                  A
                </div>
                <span className="hidden sm:inline">Admin</span>
              </Button>
            </Link>

            <Link href="/" title="Về trang chủ Landing Page">
              <Button variant="ghost" size="sm" className="h-9 px-2.5 text-muted-foreground hover:text-foreground">
                <Home className="h-4 w-4" />
                <span className="sr-only">Trang chủ</span>
              </Button>
            </Link>

            <ThemeToggle />
          </div>
        </div>

        {/* Menu Mobile */}
        <div className="md:hidden border-t px-4 py-2 bg-muted/30 overflow-x-auto">
          <SystemAdminNav />
        </div>
      </header>

      {/* Nội dung chính */}
      <main className="flex-1 container mx-auto px-4 sm:px-8 py-8">
        {children}
      </main>

      {/* Footer System Admin */}
      <footer className="border-t py-6 bg-muted/20 text-xs text-muted-foreground">
        <div className="container mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">KinderManagement SaaS Platform</span>
            <span>• Quản trị viên Cấp cao</span>
          </div>
          <div>Bảo mật đa người thuê (RLS) • Tuân thủ quy định dữ liệu 2026</div>
        </div>
      </footer>
    </div>
  );
}
