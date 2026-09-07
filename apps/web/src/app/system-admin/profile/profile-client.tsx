"use client";

import { useState, useTransition } from "react";
import { Button, Input } from "@km/ui";
import { 
  ShieldCheck, 
  Mail, 
  Phone, 
  User, 
  Lock, 
  KeyRound, 
  CheckCircle2, 
  AlertTriangle,
  Loader2,
  Calendar,
  Clock,
  Eye,
  EyeOff
} from "lucide-react";
import { 
  updateSystemAdminProfileAction, 
  changeSystemAdminPasswordAction 
} from "../actions";

interface ProfileClientProps {
  initialProfile: {
    id: string;
    email: string;
    fullName: string;
    phone: string;
    role: string;
    createdAt: string;
    lastSignInAt: string | null;
  };
}

export function ProfileClient({ initialProfile }: ProfileClientProps) {
  const [profile, setProfile] = useState(initialProfile);

  // Profile Edit Form State
  const [fullName, setFullName] = useState(initialProfile.fullName);
  const [phone, setPhone] = useState(initialProfile.phone);
  const [isUpdatingProfile, startUpdatingProfile] = useTransition();
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  // Password Change Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isChangingPass, startChangingPass] = useTransition();
  const [passSuccessMsg, setPassSuccessMsg] = useState<string | null>(null);
  const [passErrorMsg, setPassErrorMsg] = useState<string | null>(null);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccessMsg(null);
    setProfileErrorMsg(null);

    if (!fullName.trim()) {
      setProfileErrorMsg("Vui lòng nhập họ và tên.");
      return;
    }

    startUpdatingProfile(async () => {
      const res = await updateSystemAdminProfileAction({
        fullName: fullName.trim(),
        phone: phone.trim(),
      });

      if (res.success) {
        setProfile((prev) => ({
          ...prev,
          fullName: fullName.trim(),
          phone: phone.trim(),
        }));
        setProfileSuccessMsg("Đã cập nhật thông tin quản trị viên thành công!");
        setTimeout(() => setProfileSuccessMsg(null), 4000);
      } else {
        setProfileErrorMsg(res.error ?? "Lỗi cập nhật thông tin.");
      }
    });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPassSuccessMsg(null);
    setPassErrorMsg(null);

    if (!currentPassword) {
      setPassErrorMsg("Vui lòng nhập mật khẩu hiện tại.");
      return;
    }
    if (newPassword.length < 5) {
      setPassErrorMsg("Mật khẩu mới phải có tối thiểu 5 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassErrorMsg("Mật khẩu xác nhận không khớp.");
      return;
    }

    startChangingPass(async () => {
      const res = await changeSystemAdminPasswordAction({
        currentPassword,
        newPassword,
      });

      if (res.success) {
        setPassSuccessMsg("Đã đổi mật khẩu thành công! Bạn có thể sử dụng mật khẩu mới ở lần đăng nhập tiếp theo.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPassSuccessMsg(null), 5000);
      } else {
        setPassErrorMsg(res.error ?? "Lỗi khi đổi mật khẩu.");
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header Trang Hồ Sơ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Thông tin Quản trị viên
            </h1>
            <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary border border-primary/20">
              <ShieldCheck className="h-3.5 w-3.5" />
              Root Admin
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý thông tin tài khoản, danh tính và bảo mật tài khoản System Administrator.
          </p>
        </div>
      </div>

      {/* Thẻ Tổng quan Hồ sơ */}
      <div className="rounded-2xl border bg-card p-6 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 h-32 w-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-bold text-xl shadow-md shadow-primary/20 shrink-0">
            SA
          </div>

          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl font-bold text-foreground truncate">
                {profile.fullName}
              </h2>
              <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold px-2.5 py-0.5 border border-emerald-500/20 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Đang kích hoạt
              </span>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1 font-mono">
                <Mail className="h-3 w-3" />
                {profile.email}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {profile.phone || "Chưa cập nhật số điện thoại"}
              </span>
            </p>
          </div>
        </div>

        {/* Chi tiết meta */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t text-xs">
          <div className="space-y-1">
            <span className="text-muted-foreground flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Vai trò thẩm quyền
            </span>
            <span className="font-semibold text-foreground block">
              Quản trị viên Hệ thống (System Admin)
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Ngày khởi tạo
            </span>
            <span className="font-semibold text-foreground block">
              {new Date(profile.createdAt).toLocaleDateString("vi-VN")}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-muted-foreground flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Đăng nhập gần nhất
            </span>
            <span className="font-semibold text-foreground block">
              {profile.lastSignInAt
                ? new Date(profile.lastSignInAt).toLocaleString("vi-VN")
                : "Phiên hiện tại"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Cập nhật Thông tin Quản trị */}
        <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-5">
          <div className="border-b pb-3">
            <h2 className="text-base font-bold flex items-center gap-2 text-foreground">
              <User className="h-4 w-4 text-primary" />
              <span>Cập nhật Thông tin Liên hệ</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Chỉnh sửa thông tin họ tên và số điện thoại liên lạc của quản trị viên.
            </p>
          </div>

          {profileSuccessMsg && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{profileSuccessMsg}</span>
            </div>
          )}

          {profileErrorMsg && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2 animate-in fade-in">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{profileErrorMsg}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="adminEmail" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Địa chỉ Email</span>
              </label>
              <Input
                id="adminEmail"
                type="email"
                value={profile.email}
                disabled
                className="bg-muted/40 font-mono text-xs cursor-not-allowed"
              />
              <span className="text-[11px] text-muted-foreground">
                Email quản trị viên cố định dùng cho định danh bảo mật đa người thuê.
              </span>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="adminFullName" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Họ và tên Quản trị viên</span>
              </label>
              <Input
                id="adminFullName"
                type="text"
                placeholder="Ví dụ: Nguyễn Văn Quản Trị"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isUpdatingProfile}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="adminPhone" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Số điện thoại liên hệ</span>
              </label>
              <Input
                id="adminPhone"
                type="tel"
                placeholder="Ví dụ: 0901234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isUpdatingProfile}
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                id="btn-save-profile"
                disabled={isUpdatingProfile}
                className="font-semibold shadow-xs"
              >
                {isUpdatingProfile ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Đang lưu...</span>
                  </span>
                ) : (
                  "Lưu thông tin"
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Form Đổi Mật khẩu Quản trị */}
        <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-5">
          <div className="border-b pb-3">
            <h2 className="text-base font-bold flex items-center gap-2 text-foreground">
              <KeyRound className="h-4 w-4 text-amber-600" />
              <span>Đổi Mật khẩu Admin</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Thay đổi mật khẩu đăng nhập để bảo vệ an toàn cho hệ thống.
            </p>
          </div>

          {passSuccessMsg && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{passSuccessMsg}</span>
            </div>
          )}

          {passErrorMsg && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2 animate-in fade-in">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{passErrorMsg}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            {/* Mật khẩu hiện tại */}
            <div className="space-y-1.5">
              <label htmlFor="currentPassword" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Mật khẩu hiện tại</span>
              </label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPass ? "text" : "password"}
                  placeholder="Nhập mật khẩu hiện tại (ví dụ: admin)"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={isChangingPass}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  aria-label={showCurrentPass ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showCurrentPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Mật khẩu mới */}
            <div className="space-y-1.5">
              <label htmlFor="newPassword" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Mật khẩu mới</span>
              </label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPass ? "text" : "password"}
                  placeholder="Nhập mật khẩu mới (tối thiểu 5 ký tự)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isChangingPass}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  aria-label={showNewPass ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Xác nhận mật khẩu mới */}
            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Xác nhận mật khẩu mới</span>
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isChangingPass}
                required
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                id="btn-change-password"
                disabled={isChangingPass}
                className="font-semibold shadow-xs"
              >
                {isChangingPass ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Đang cập nhật...</span>
                  </span>
                ) : (
                  "Cập nhật mật khẩu"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
