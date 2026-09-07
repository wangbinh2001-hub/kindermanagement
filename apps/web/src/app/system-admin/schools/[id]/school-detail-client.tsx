"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input } from "@km/ui";
import { 
  ArrowLeft, 
  School, 
  Settings, 
  ShieldAlert, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  Trash2, 
  AlertTriangle,
  CalendarCheck,
  CreditCard,
  HeartPulse,
  Utensils,
  Loader2,
  Info
} from "lucide-react";
import { 
  updateFeatureFlagsAction, 
  updateSchoolStatusAction, 
  deleteSchoolAction,
  resetSchoolAdminPasswordAction,
} from "../../actions";
import { KeyRound, Copy, Check } from "lucide-react";

interface SchoolDetailProps {
  school: {
    id: string;
    code: string;
    name: string;
    slug: string;
    ownerName: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    status: "PENDING_SETUP" | "ACTIVE" | "SUSPENDED" | "DELETED";
    createdAt: string;
    setting: {
      enableAttendance: boolean;
      enableTuition: boolean;
      enableHealth: boolean;
      enableNutrition: boolean;
    };
    auditLogs: Array<{
      id: string;
      action: string;
      userRole: string;
      createdAt: string;
      metadata?: unknown;
    }>;
  };
}

export function SchoolDetailClient({ school }: SchoolDetailProps) {
  const router = useRouter();
  const [status, setStatus] = useState(school.status);
  const [flags, setFlags] = useState(school.setting);
  const [isSavingFlags, startSavingFlags] = useTransition();
  const [isUpdatingStatus, startUpdatingStatus] = useTransition();
  const [isDeleting, startDeleting] = useTransition();
  const [isResettingPass, startResettingPass] = useTransition();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // State cho Modal Đặt lại Mật khẩu School Admin
  const [showResetPassModal, setShowResetPassModal] = useState(false);
  const [customNewPass, setCustomNewPass] = useState("");
  const [resetSuccessData, setResetSuccessData] = useState<{
    adminEmail: string;
    temporaryPassword: string;
  } | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [hasCopiedPass, setHasCopiedPass] = useState(false);

  // State cho Modal Xóa 2 bước
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmCode, setConfirmCode] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveFlags = () => {
    startSavingFlags(async () => {
      const res = await updateFeatureFlagsAction(school.id, flags);
      if (res.success) {
        showToast("Đã cập nhật cấu hình phân hệ tính năng thành công!");
      } else {
        alert(res.error ?? "Lỗi lưu cấu hình");
      }
    });
  };

  const handleToggleStatus = () => {
    const nextStatus = status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    const confirmPrompt = nextStatus === "SUSPENDED"
      ? "Tạm khóa trường học sẽ chuyển tài khoản trường sang chế độ Chỉ xem (Read-only) và chặn mọi thao tác ghi mới. Bạn có chắc muốn tiếp tục?"
      : "Kích hoạt lại trường học cho phép nhà trường tiếp tục vận hành bình thường?";

    if (!window.confirm(confirmPrompt)) return;

    startUpdatingStatus(async () => {
      const res = await updateSchoolStatusAction(school.id, nextStatus, "Đổi trạng thái từ trang chi tiết");
      if (res.success) {
        setStatus(nextStatus);
        showToast(`Trạng thái trường đã được đổi sang: ${nextStatus === "ACTIVE" ? "Hoạt động" : "Tạm khóa"}`);
      } else {
        alert(res.error ?? "Lỗi cập nhật");
      }
    });
  };

  const handleDeleteSchool = () => {
    setDeleteError(null);
    if (confirmCode.trim() !== school.code) {
      setDeleteError(`Mã xác nhận phải nhập chính xác là: ${school.code}`);
      return;
    }
    if (!adminPassword || adminPassword.length < 6) {
      setDeleteError("Vui lòng nhập mật khẩu xác nhận của System Admin (tối thiểu 6 ký tự)");
      return;
    }

    startDeleting(async () => {
      const res = await deleteSchoolAction(school.id, confirmCode, adminPassword);
      if (res.success) {
        alert("Đã xóa mềm trường học thành công!");
        router.push("/system-admin/schools");
      } else {
        setDeleteError(res.error ?? "Lỗi khi xóa trường");
      }
    });
  };

  const handleResetSchoolAdminPass = () => {
    setResetError(null);
    startResettingPass(async () => {
      const res = await resetSchoolAdminPasswordAction(
        school.id,
        customNewPass.trim() ? customNewPass.trim() : undefined
      );

      if (res.success && res.data) {
        setResetSuccessData(res.data);
        showToast("Đã đặt lại mật khẩu School Admin thành công!");
      } else {
        setResetError(res.error ?? "Lỗi khi đặt lại mật khẩu");
      }
    });
  };

  const handleCopyPassword = (text: string) => {
    navigator.clipboard.writeText(text);
    setHasCopiedPass(true);
    setTimeout(() => setHasCopiedPass(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header & Điều hướng quay lại */}
      <div>
        <Link
          href="/system-admin/schools"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors font-medium mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Quay lại Danh sách trường</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {school.name}
              </h1>
              <span className="font-mono text-xs px-2.5 py-1 rounded bg-primary/10 text-primary font-bold">
                {school.code}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Slug: <span className="font-mono text-foreground">{school.slug}</span> • Khởi tạo ngày: {school.createdAt}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleStatus}
              disabled={isUpdatingStatus}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors ${
                status === "ACTIVE"
                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 border border-amber-500/30"
                  : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30"
              }`}
            >
              {status === "ACTIVE" ? (
                <>
                  <Lock className="h-3.5 w-3.5" />
                  <span>Tạm khóa trường</span>
                </>
              ) : (
                <>
                  <Unlock className="h-3.5 w-3.5" />
                  <span>Kích hoạt lại</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Thông tin cơ bản */}
      <div className="rounded-xl border bg-card p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold border-b pb-3 flex items-center gap-2">
          <School className="h-4 w-4 text-primary" />
          <span>Thông tin liên hệ cơ sở</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-xs">
          <div className="min-w-0">
            <span className="text-muted-foreground block mb-1">Chủ trường / Đại diện</span>
            <span className="font-semibold text-foreground text-sm truncate block">{school.ownerName}</span>
          </div>
          <div className="min-w-0">
            <span className="text-muted-foreground block mb-1">Số điện thoại</span>
            <span className="font-semibold text-foreground text-sm block">{school.phone}</span>
          </div>
          <div className="min-w-0">
            <span className="text-muted-foreground block mb-1">Email liên hệ</span>
            <span className="font-semibold text-foreground text-sm break-all block">{school.email || "Chưa thiết lập"}</span>
          </div>
          <div className="min-w-0">
            <span className="text-muted-foreground block mb-1">Địa chỉ</span>
            <span className="font-semibold text-foreground text-sm break-words block">{school.address || "Chưa thiết lập"}</span>
          </div>
        </div>
      </div>

      {/* Phân hệ & Feature Flags (Task P2.4) */}
      <div className="rounded-xl border bg-card p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" />
              <span>Cấu hình Phân hệ Tính năng (Feature Flags)</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Bật hoặc tắt các module theo gói dịch vụ bản quyền mà trường đã đăng ký.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handleSaveFlags}
            disabled={isSavingFlags}
            className="font-semibold shadow-xs"
          >
            {isSavingFlags ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Đang lưu...</span>
              </span>
            ) : (
              "Lưu cấu hình phân hệ"
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Flag 1: Điểm danh */}
          <div className="rounded-lg border p-4 flex items-start justify-between gap-3 bg-muted/20">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <CalendarCheck className="h-4 w-4 text-emerald-600" />
                <span>Điểm danh & Đón trả QR</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Cho phép giáo viên điểm danh và phụ huynh check-in/out qua mã QR.
              </p>
            </div>
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-input text-primary focus:ring-primary mt-1"
              checked={flags.enableAttendance}
              onChange={(e) => setFlags({ ...flags, enableAttendance: e.target.checked })}
            />
          </div>

          {/* Flag 2: Học phí */}
          <div className="rounded-lg border p-4 flex items-start justify-between gap-3 bg-muted/20">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <CreditCard className="h-4 w-4 text-blue-600" />
                <span>Quản lý Học phí & Hóa đơn</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Lập biểu phí, áp dụng miễn giảm và xuất hóa đơn học phí định kỳ.
              </p>
            </div>
            <input
              type="checkbox"
              id="flag-tuition"
              className="h-5 w-5 rounded border-input text-primary focus:ring-primary mt-1"
              checked={flags.enableTuition}
              onChange={(e) => setFlags({ ...flags, enableTuition: e.target.checked })}
            />
          </div>

          {/* Flag 3: Y tế */}
          <div className="rounded-lg border p-4 flex items-start justify-between gap-3 bg-muted/20">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <HeartPulse className="h-4 w-4 text-rose-600" />
                <span>Theo dõi Sức khỏe & BMI WHO</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Ghi nhận chỉ số thể trạng, cân đo định kỳ và sổ tiêm chủng của trẻ.
              </p>
            </div>
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-input text-primary focus:ring-primary mt-1"
              checked={flags.enableHealth}
              onChange={(e) => setFlags({ ...flags, enableHealth: e.target.checked })}
            />
          </div>

          {/* Flag 4: Dinh dưỡng */}
          <div className="rounded-lg border p-4 flex items-start justify-between gap-3 bg-muted/20">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <Utensils className="h-4 w-4 text-amber-600" />
                <span>Dinh dưỡng & Thực đơn Calo</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Xây dựng thực đơn tuần, tính toán năng lượng calo và phiếu đi chợ.
              </p>
            </div>
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-input text-primary focus:ring-primary mt-1"
              checked={flags.enableNutrition}
              onChange={(e) => setFlags({ ...flags, enableNutrition: e.target.checked })}
            />
          </div>
        </div>
      </div>

      {/* Quản lý Tài khoản Quản trị Trường & Reset Mật khẩu */}
      <div className="rounded-xl border bg-card p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold flex items-center gap-2 text-foreground">
              <KeyRound className="h-4 w-4 text-amber-600" />
              <span>Quản lý Tài khoản School Admin</span>
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Đặt lại mật khẩu cho quản trị viên trường học trong trường hợp quên mật khẩu hoặc cần cấp lại thông tin truy cập ban đầu.
            </p>
          </div>

          <Button
            type="button"
            id="btn-open-reset-pass-modal"
            variant="outline"
            size="sm"
            onClick={() => {
              setResetSuccessData(null);
              setResetError(null);
              setCustomNewPass("");
              setShowResetPassModal(true);
            }}
            className="shrink-0 font-semibold border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
          >
            <KeyRound className="h-4 w-4 mr-1.5" />
            <span>Đặt lại mật khẩu School Admin</span>
          </Button>
        </div>
      </div>

      {/* Modal Đặt lại Mật khẩu School Admin */}
      {showResetPassModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div id="reset-pass-modal" className="bg-card border border-border rounded-2xl max-w-md w-full p-6 space-y-5 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Đặt lại mật khẩu School Admin</h3>
                <p className="text-xs text-muted-foreground">Trường: {school.name}</p>
              </div>
            </div>

            {resetSuccessData ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold text-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Đặt lại mật khẩu thành công!</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Email tài khoản: <strong className="text-foreground">{resetSuccessData.adminEmail}</strong>
                  </p>
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-background border font-mono text-sm">
                    <span className="text-primary font-bold">{resetSuccessData.temporaryPassword}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyPassword(resetSuccessData.temporaryPassword)}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded bg-muted hover:bg-muted/80 transition-colors"
                    >
                      {hasCopiedPass ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Đã sao chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    * Tài khoản sẽ được đánh dấu <strong>mustChangePass = true</strong> và bắt buộc đổi mật khẩu cá nhân ở lần đăng nhập tiếp theo.
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={() => setShowResetPassModal(false)}
                    className="w-full font-semibold"
                  >
                    Đóng
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Bạn có thể để trống để hệ thống <strong>tự động sinh mật khẩu ngẫu nhiên an toàn</strong>, hoặc tự nhập mật khẩu mới (tối thiểu 6 ký tự).
                </p>

                <div className="space-y-1.5">
                  <label htmlFor="customNewPass" className="text-xs font-semibold text-foreground">
                    Mật khẩu mới (Tùy chọn)
                  </label>
                  <Input
                    id="customNewPass"
                    type="text"
                    placeholder="Để trống để tự động sinh mật khẩu"
                    value={customNewPass}
                    onChange={(e) => setCustomNewPass(e.target.value)}
                    disabled={isResettingPass}
                  />
                </div>

                {resetError && (
                  <div className="text-xs text-destructive flex items-center gap-1.5 bg-destructive/10 p-2.5 rounded-lg border border-destructive/20">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>{resetError}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowResetPassModal(false)}
                    disabled={isResettingPass}
                  >
                    Hủy bỏ
                  </Button>
                  <Button
                    type="button"
                    id="btn-confirm-reset-pass"
                    size="sm"
                    onClick={handleResetSchoolAdminPass}
                    disabled={isResettingPass}
                    className="font-semibold shadow-xs"
                  >
                    {isResettingPass ? (
                      <span className="flex items-center gap-1.5">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Đang xử lý...</span>
                      </span>
                    ) : (
                      "Xác nhận đặt lại"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}


      {/* Khu vực Nguy hiểm: Xóa trường 2 bước */}
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 shadow-xs space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Khu vực Nguy hiểm: Xóa Trường Học</span>
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Thao tác này sẽ thực hiện <strong>Xóa mềm (Soft Delete)</strong>. Trường học và toàn bộ tài khoản liên quan sẽ bị vô hiệu hóa hoàn toàn. Yêu cầu xác thực 2 bước để tiếp tục.
            </p>
          </div>

          <Button
            type="button"
            id="btn-open-delete-modal"
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
            className="shrink-0 font-semibold"
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            Xóa trường
          </Button>
        </div>
      </div>

      {/* Modal Xác thực 2 bước khi Xóa */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div id="delete-school-modal" className="bg-card border border-border rounded-2xl max-w-md w-full p-6 space-y-5 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-destructive">
              <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Xác nhận Xóa Trường Học</h3>
                <span className="text-xs text-destructive font-semibold">Thao tác có tính chất nguy hại cao</span>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-xs text-destructive font-medium">
                {deleteError}
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground block">
                  Bước 1: Nhập lại chính xác mã trường <code>{school.code}</code>:
                </label>
                <Input
                  id="confirmSchoolCode"
                  value={confirmCode}
                  onChange={(e) => setConfirmCode(e.target.value)}
                  placeholder={school.code}
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground block">
                  Bước 2: Nhập mật khẩu xác thực của System Admin:
                </label>
                <Input
                  id="adminPassword"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Mật khẩu System Admin"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteError(null);
                }}
                disabled={isDeleting}
              >
                Hủy bỏ
              </Button>
              <Button
                type="button"
                id="btn-confirm-delete"
                variant="destructive"
                size="sm"
                onClick={handleDeleteSchool}
                disabled={isDeleting}
                className="font-semibold"
              >
                {isDeleting ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Đang xóa...</span>
                  </span>
                ) : (
                  "Xác nhận Xóa trường"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
