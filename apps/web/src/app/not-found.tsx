import Link from "next/link";
import { Button } from "@km/ui";
import { Home, ArrowLeft, Search, GraduationCap } from "lucide-react";

export default function RootNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-4 selection:bg-primary/20">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Brand Icon */}
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-sm">
            <GraduationCap className="h-9 w-9" />
          </div>
        </div>

        {/* 404 Visual & Code */}
        <div className="space-y-2">
          <span className="text-6xl sm:text-7xl font-extrabold tracking-tight text-primary font-mono">
            404
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Không tìm thấy trang
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Địa chỉ bạn yêu cầu không tồn tại hoặc đã được chuyển sang đường dẫn khác trong hệ thống.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href="/" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto font-semibold gap-2">
              <Home className="h-4 w-4" />
              <span>Về Trang chủ</span>
            </Button>
          </Link>
          <Link href="/login" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto font-medium gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Cổng Đăng nhập</span>
            </Button>
          </Link>
        </div>

        {/* Footer info */}
        <div className="pt-6 border-t border-border/60 text-xs text-muted-foreground flex items-center justify-center gap-1.5">
          <Search className="h-3.5 w-3.5 text-muted-foreground/80" />
          <span>KinderManagement — Nền tảng Mầm non Thông minh</span>
        </div>
      </div>
    </div>
  );
}
