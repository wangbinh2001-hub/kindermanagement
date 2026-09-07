"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Input } from "@km/ui";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  provisionSchoolSchema, 
  ProvisionSchoolInput 
} from "@km/validators/schemas/system-admin";
import { 
  School, 
  User, 
  CheckCircle2, 
  Copy, 
  Check, 
  ArrowLeft, 
  AlertCircle,
  ShieldAlert,
  Loader2
} from "lucide-react";
import { provisionSchoolAction } from "../../actions";

export default function NewSchoolPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [createdResult, setCreatedResult] = useState<{
    schoolCode: string;
    schoolId: string;
    name: string;
    slug: string;
    initialUsername: string;
    initialPassword: string;
    mustChangePassword: boolean;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProvisionSchoolInput>({
    resolver: zodResolver(provisionSchoolSchema),
    defaultValues: {
      name: "",
      ownerName: "",
      phone: "",
      email: "",
      address: "",
      initialUsername: "",
      initialPassword: "",
    },
  });

  const onSubmit = async (data: ProvisionSchoolInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await provisionSchoolAction(data);
      if (res.success && res.data) {
        setCreatedResult(res.data);
        reset();
      } else {
        setError(res.error ?? "Lỗi máy chủ khi tạo trường");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi kết nối");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdResult) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const text = `--- THÔNG TIN TÀI KHOẢN TRƯỜNG HỌC ---
Tên trường: ${createdResult.name}
Mã trường: ${createdResult.schoolCode}
Tên đăng nhập: ${createdResult.initialUsername}
Mật khẩu tạm: ${createdResult.initialPassword}
Lưu ý: Bắt buộc đổi mật khẩu ở lần đăng nhập đầu tiên.
Trang đăng nhập: ${origin}/login`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (createdResult) {
    return (
      <div id="credentials-modal" className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
        <div className="rounded-2xl border border-emerald-500/30 bg-card p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                Khởi tạo trường học thành công!
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Thông tin tài khoản quản trị viên trường đã được tạo và kích hoạt.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
            <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="space-y-1">
              <span className="font-semibold block">Lưu ý quan trọng:</span>
              <p className="leading-relaxed">
                Mật khẩu tạm chỉ hiển thị <strong>MỘT LẦN DUY NHẤT</strong> trên màn hình này. Vui lòng sao chép và gửi cho Chủ trường / Hiệu trưởng. Tài khoản sẽ bắt buộc đổi mật khẩu ở lần đầu đăng nhập.
              </p>
            </div>
          </div>

          <div className="rounded-xl border bg-muted/30 p-5 space-y-3 font-mono text-xs">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Tên trường:</span>
              <span className="font-semibold text-foreground font-sans">{createdResult.name}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Mã trường (School Code):</span>
              <span id="modal-school-code" className="font-bold text-primary">{createdResult.schoolCode}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Slug định danh:</span>
              <span className="text-foreground">{createdResult.slug}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Tên đăng nhập:</span>
              <span className="font-bold text-foreground">{createdResult.initialUsername}</span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-muted-foreground">Mật khẩu khởi tạo:</span>
              <span className="px-2 py-1 rounded bg-destructive/10 text-destructive font-bold text-sm">
                {createdResult.initialPassword}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Button
              type="button"
              id="btn-copy-credentials"
              onClick={handleCopyCredentials}
              className="w-full sm:w-auto font-semibold"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-1.5 text-emerald-300" />
                  <span>Đã sao chép!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1.5" />
                  <span>Sao chép thông tin đăng nhập</span>
                </>
              )}
            </Button>

            <Link href="/system-admin/schools" className="w-full sm:w-auto">
              <Button id="btn-modal-close" variant="outline" className="w-full font-medium">
                Hoàn tất & Đến danh sách trường
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/system-admin/schools"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors font-medium mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Quay lại Danh sách trường</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Khởi tạo trường học mới</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cấp mới cơ sở trường học và tài khoản quản trị viên School Admin ban đầu.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive flex items-center gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        {/* Phần 1: Thông tin Trường học */}
        <div className="rounded-xl border bg-card p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold flex items-center gap-2 border-b pb-3">
            <School className="h-4 w-4 text-primary" />
            <span>Thông tin cơ sở trường học</span>
          </h2>

          <div className="space-y-1.5">
            <label htmlFor="name" className="text-xs font-semibold text-foreground">
              Tên trường học <span className="text-destructive">*</span>
            </label>
            <Input
              id="name"
              placeholder="Ví dụ: Trường Mầm non Ánh Sao Mai"
              disabled={isLoading}
              className={errors.name ? "border-destructive" : ""}
              {...register("name")}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="ownerName" className="text-xs font-semibold text-foreground">
                Họ và tên chủ trường / Đại diện <span className="text-destructive">*</span>
              </label>
              <Input
                id="ownerName"
                placeholder="Ví dụ: Nguyễn Văn A"
                disabled={isLoading}
                className={errors.ownerName ? "border-destructive" : ""}
                {...register("ownerName")}
              />
              {errors.ownerName && <p className="text-xs text-destructive">{errors.ownerName.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="phone" className="text-xs font-semibold text-foreground">
                Số điện thoại liên hệ <span className="text-destructive">*</span>
              </label>
              <Input
                id="phone"
                placeholder="Ví dụ: 0987654321"
                disabled={isLoading}
                className={errors.phone ? "border-destructive" : ""}
                {...register("phone")}
              />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-foreground">
                Email liên hệ (tùy chọn)
              </label>
              <Input
                id="email"
                type="email"
                placeholder="contact@truongmamnon.edu.vn"
                disabled={isLoading}
                className={errors.email ? "border-destructive" : ""}
                {...register("email")}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="address" className="text-xs font-semibold text-foreground">
                Địa chỉ cơ sở (tùy chọn)
              </label>
              <Input
                id="address"
                placeholder="Số 123 đường ABC, Quận XYZ, TP. Hà Nội"
                disabled={isLoading}
                className={errors.address ? "border-destructive" : ""}
                {...register("address")}
              />
              {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
            </div>
          </div>
        </div>

        {/* Phần 2: Tài khoản Quản trị viên Trường ban đầu */}
        <div className="rounded-xl border bg-card p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold flex items-center gap-2 border-b pb-3">
            <User className="h-4 w-4 text-primary" />
            <span>Tài khoản School Admin khởi tạo</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="initialUsername" className="text-xs font-semibold text-foreground">
                Tên đăng nhập <span className="text-destructive">*</span>
              </label>
              <Input
                id="initialUsername"
                placeholder="admin_anhsaomai"
                disabled={isLoading}
                className={errors.initialUsername ? "border-destructive" : ""}
                {...register("initialUsername")}
              />
              {errors.initialUsername && (
                <p className="text-xs text-destructive">{errors.initialUsername.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="initialPassword" className="text-xs font-semibold text-foreground">
                Mật khẩu tạm thời <span className="text-destructive">*</span>
              </label>
              <Input
                id="initialPassword"
                placeholder="Tối thiểu 6 ký tự"
                disabled={isLoading}
                className={errors.initialPassword ? "border-destructive" : ""}
                {...register("initialPassword")}
              />
              {errors.initialPassword && (
                <p className="text-xs text-destructive">{errors.initialPassword.message}</p>
              )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Mã trường dạng <code>SCH-YYYY-XXXX</code> sẽ được hệ thống tự động sinh nối tiếp.
          </p>
        </div>

        {/* Nút Hoàn tất */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/system-admin/schools">
            <Button type="button" variant="outline" disabled={isLoading}>
              Hủy bỏ
            </Button>
          </Link>
          <Button id="btn-submit-provision" type="submit" disabled={isLoading} className="font-semibold min-w-32 shadow-xs">
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Đang khởi tạo...</span>
              </span>
            ) : (
              "Khởi tạo trường"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
