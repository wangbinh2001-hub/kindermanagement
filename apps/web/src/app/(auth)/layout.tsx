import Link from "next/link";
import { GraduationCap, ShieldCheck, HeartHandshake, Sparkles } from "lucide-react";
import { ThemeToggle } from "../../components/ThemeToggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background text-foreground selection:bg-primary/20">
      {/* Cột Bên Trái: Khu vực Form Đăng nhập */}
      <div className="flex flex-1 flex-col justify-between p-6 sm:p-10 lg:max-w-xl xl:max-w-2xl">
        {/* Header trên cùng bên trái */}
        <div className="flex items-center justify-between">
          <Link 
            href="/" 
            className="flex items-center gap-2.5 group transition-opacity hover:opacity-90"
            title="Quay lại Trang chủ"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/25">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight leading-none text-primary">
                KinderManagement
              </span>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                Cổng Xác Thực
              </span>
            </div>
          </Link>

          <ThemeToggle />
        </div>

        {/* Nội dung form trung tâm */}
        <div className="w-full max-w-sm sm:max-w-md mx-auto my-auto py-8">
          {children}
        </div>

        {/* Footer nhỏ dưới cùng bên trái */}
        <div className="text-center sm:text-left text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2 border-t pt-4">
          <span>KinderManagement © 2026</span>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-primary transition-colors">Trang chủ</Link>
            <Link href="/system-admin" className="hover:text-primary transition-colors">Quản trị Nền tảng</Link>
          </div>
        </div>
      </div>

      {/* Cột Bên Phải (Desktop): Không gian Trực quan Thương hiệu */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-muted/40 border-l border-border/60 p-12 xl:p-16 flex-col justify-between">
        {/* Background Gradients & Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent pointer-events-none" />
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

        {/* Top Tagline */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Nền tảng Vận hành Mầm non Đa Cơ sở</span>
          </div>
        </div>

        {/* Middle Value Quote */}
        <div className="relative z-10 max-w-lg space-y-6">
          <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight leading-tight text-balance">
            Vận hành khoa học, nuôi dưỡng tương lai với chuẩn mực công nghệ cao.
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed text-balance">
            Giải pháp chuyên biệt cho ngành giáo dục mầm non Việt Nam: đồng bộ thực đơn calo, theo dõi biểu đồ tăng trưởng WHO và bảo mật phân quyền tuyệt đối giữa các cơ sở.
          </p>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="rounded-xl border border-border/80 bg-background/80 backdrop-blur p-4 shadow-xs">
              <ShieldCheck className="h-5 w-5 text-emerald-600 mb-2" />
              <div className="text-sm font-semibold">An toàn Dữ liệu</div>
              <div className="text-xs text-muted-foreground mt-0.5">PostgreSQL RLS cô lập độc quyền theo từng trường.</div>
            </div>

            <div className="rounded-xl border border-border/80 bg-background/80 backdrop-blur p-4 shadow-xs">
              <HeartHandshake className="h-5 w-5 text-primary mb-2" />
              <div className="text-sm font-semibold">Gắn kết Bền chặt</div>
              <div className="text-xs text-muted-foreground mt-0.5">Thông tin minh bạch giữa nhà trường & phụ huynh.</div>
            </div>
          </div>
        </div>

        {/* Bottom Metadata */}
        <div className="relative z-10 text-xs text-muted-foreground flex items-center justify-between border-t border-border/60 pt-6">
          <span>Tiêu chuẩn Bảo mật SaaS 2026</span>
          <span className="font-mono">Ver 1.0.0</span>
        </div>
      </div>
    </div>
  );
}
