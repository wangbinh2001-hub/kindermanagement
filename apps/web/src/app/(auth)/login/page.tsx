"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Input } from "@km/ui";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  ShieldCheck, 
  Info,
  Loader2
} from "lucide-react";

import { useRouter } from "next/navigation";
import { loginAction } from "./actions";

const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, "Vui lòng nhập tài khoản (số điện thoại hoặc email)")
    .min(3, "Tài khoản phải có ít nhất 3 ký tự"),
  password: z
    .string()
    .min(1, "Vui lòng nhập mật khẩu")
    .min(5, "Mật khẩu phải có ít nhất 5 ký tự"),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const res = await loginAction({
        identifier: data.identifier,
        password: data.password,
      });

      if (!res.success) {
        setAuthError(res.error ?? "Tài khoản hoặc mật khẩu không chính xác.");
        setIsLoading(false);
        return;
      }

      if (res.role === 'SYSTEM_ADMIN') {
        router.push('/system-admin');
      } else if (res.role === 'SCHOOL_ADMIN' || res.role === 'TEACHER') {
        if (res.schoolSlug) {
          router.push(`/${res.schoolSlug}`);
        } else {
          router.push('/system-admin');
        }
      } else if (res.role === 'PARENT') {
        router.push('/parent');
      } else {
        if (res.schoolSlug) {
          router.push(`/${res.schoolSlug}`);
        } else {
          router.push('/system-admin');
        }
      }
    } catch (err) {
      setAuthError("Đã xảy ra lỗi trong quá trình kết nối. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tiêu đề trang & Lời chào */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Đăng nhập hệ thống
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Cổng truy cập thống nhất dành cho Cán bộ Quản lý, Giáo viên và Phụ huynh học sinh.
        </p>
      </div>

      {/* Thông báo lỗi xác thực (nếu có) */}
      {authError && (
        <div 
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 p-3.5 text-sm text-destructive flex items-start gap-2.5 animate-in fade-in duration-200"
        >
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{authError}</span>
        </div>
      )}

      {/* Form Đăng nhập */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Trường Tài khoản */}
        <div className="space-y-1.5">
          <label
            htmlFor="identifier"
            className="text-sm font-semibold text-foreground flex items-center gap-1.5"
          >
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Tài khoản truy cập</span>
          </label>
          <div className="relative">
            <Input
              id="identifier"
              placeholder="Số điện thoại hoặc tên đăng nhập"
              autoComplete="username"
              disabled={isLoading}
              className={`pr-3 ${errors.identifier ? "border-destructive focus-visible:ring-destructive" : ""}`}
              {...register("identifier")}
            />
          </div>
          {errors.identifier && (
            <p className="text-xs text-destructive font-medium flex items-center gap-1 pt-0.5" role="alert">
              {errors.identifier.message}
            </p>
          )}
        </div>

        {/* Trường Mật khẩu */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="text-sm font-semibold text-foreground flex items-center gap-1.5"
            >
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Mật khẩu</span>
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-xs font-medium text-primary hover:underline transition-colors"
              tabIndex={0}
            >
              Quên mật khẩu?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Nhập mật khẩu"
              autoComplete="current-password"
              disabled={isLoading}
              className={`pr-10 ${errors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive font-medium flex items-center gap-1 pt-0.5" role="alert">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Ghi nhớ tài khoản */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-input text-primary focus:ring-primary focus:ring-offset-background"
              {...register("rememberMe")}
              disabled={isLoading}
            />
            <span className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Ghi nhớ phiên đăng nhập
            </span>
          </label>
        </div>

        {/* Nút Submit */}
        <Button
          type="submit"
          className="w-full h-11 text-sm font-semibold shadow-sm transition-all active:scale-[0.99]"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Đang xử lý...</span>
            </span>
          ) : (
            "Đăng nhập"
          )}
        </Button>
      </form>

      {/* Hộp Thông báo Hướng dẫn cho Tài khoản cấp lần đầu */}
      <div className="rounded-xl border border-border/80 bg-muted/30 p-4 text-xs text-muted-foreground space-y-1.5">
        <div className="flex items-center gap-1.5 font-semibold text-foreground">
          <Info className="h-3.5 w-3.5 text-primary" />
          <span>Lưu ý đối với tài khoản mới</span>
        </div>
        <p className="leading-relaxed">
          Tài khoản do nhà trường cấp lần đầu sẽ được yêu cầu đổi mật khẩu cá nhân ở bước kế tiếp để đảm bảo tính an toàn và bảo mật cho trẻ.
        </p>
      </div>

      {/* Điều hướng Quay về Trang chủ & Huy hiệu Bảo mật */}
      <div className="pt-2 flex flex-col items-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Quay lại Trang chủ</span>
        </Link>

        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/80">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>Hệ thống bảo vệ mã hóa dữ liệu đa tầng</span>
        </div>
      </div>
    </div>
  );
}
