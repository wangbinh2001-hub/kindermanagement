"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input } from "@km/ui";
import { 
  ArrowLeft, 
  GraduationCap, 
  User, 
  Users, 
  Calendar, 
  MapPin, 
  Phone, 
  FileText, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ArrowRightLeft, 
  Settings2,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  HeartHandshake,
} from "lucide-react";
import { transferStudentClassAction, updateEnrollmentStatusAction } from "../../../students/actions";

interface StudentDetailProps {
  schoolId: string;
  schoolSlug: string;
  relationship: {
    id: string;
    enrollmentStatus: "ACTIVE" | "WITHDRAWN" | "GRADUATED" | "ON_LEAVE";
    enrolledAt: string;
    withdrawnAt: string | null;
    withdrawalReason: string | null;
    currentClass: {
      id: string;
      name: string;
      ageGroup: string;
    } | null;
    student: {
      id: string;
      firstName: string;
      middleName: string | null;
      lastName: string;
      gender: "MALE" | "FEMALE" | "OTHER";
      dateOfBirth: string;
      cccd: string | null;
      personalIdNumber: string | null;
      phoneContact: string | null;
      permanentAddressProvince: string | null;
      permanentAddressDistrict: string | null;
      permanentAddressWard: string | null;
      permanentAddressDetail: string | null;
      currentAddressProvince: string | null;
      currentAddressDistrict: string | null;
      currentAddressWard: string | null;
      currentAddressDetail: string | null;
      policyObject: string | null;
      disabilityType: string | null;
      tuitionExempt: boolean;
      tuitionReduced: boolean;
      studyCostSupport: boolean;
      lunchSupport: boolean;
    };
    responsiblePersons: Array<{
      id: string;
      type: "FATHER" | "MOTHER" | "GUARDIAN";
      fullName: string | null;
      yearOfBirth: number | null;
      phone: string | null;
      cccd: string | null;
      occupation: string | null;
      noInfo: boolean;
    }>;
    classMemberships: Array<{
      id: string;
      startedAt: string;
      endedAt: string | null;
      class: {
        id: string;
        name: string;
        ageGroup: string;
      };
    }>;
  };
  availableClasses: Array<{
    id: string;
    name: string;
    ageGroup: string;
  }>;
}

export function StudentDetailClient({
  schoolId,
  schoolSlug,
  relationship,
  availableClasses,
}: StudentDetailProps) {
  const router = useRouter();
  const student = relationship.student;
  const fullName = [student.lastName, student.middleName, student.firstName]
    .filter(Boolean)
    .join(" ");

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal Chuyển lớp
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [targetClassId, setTargetClassId] = useState(
    availableClasses.find((c) => c.id !== relationship.currentClass?.id)?.id || ""
  );
  const [transferEffectiveAt, setTransferEffectiveAt] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isTransferring, startTransferring] = useTransition();
  const [transferError, setTransferError] = useState<string | null>(null);

  // Modal Đổi trạng thái nhập học / Thôi học
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState<"ACTIVE" | "ON_LEAVE" | "WITHDRAWN" | "GRADUATED">(
    relationship.enrollmentStatus
  );
  const [withdrawalReason, setWithdrawalReason] = useState("");
  const [statusEffectiveAt, setStatusEffectiveAt] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isUpdatingStatus, startUpdatingStatus] = useTransition();
  const [statusError, setStatusError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleTransferClass = () => {
    setTransferError(null);
    if (!targetClassId) {
      setTransferError("Vui lòng chọn lớp học mới");
      return;
    }

    startTransferring(async () => {
      const res = await transferStudentClassAction(schoolId, {
        enrollmentId: relationship.id,
        targetClassId,
        effectiveAt: new Date(transferEffectiveAt || new Date()),
      });

      if (res.success) {
        showToast("Đã chuyển lớp và lưu dòng thời gian học tập thành công!");
        setShowTransferModal(false);
        router.refresh();
      } else {
        setTransferError(res.error ?? "Lỗi khi chuyển lớp");
      }
    });
  };

  const handleUpdateStatus = () => {
    setStatusError(null);
    if (targetStatus === "WITHDRAWN" && !withdrawalReason.trim()) {
      setStatusError("Vui lòng nhập lý do thôi học của học sinh.");
      return;
    }

    startUpdatingStatus(async () => {
      let res;
      if (targetStatus === "WITHDRAWN") {
        res = await updateEnrollmentStatusAction(schoolId, {
          enrollmentId: relationship.id,
          withdrawalReason: withdrawalReason.trim(),
          withdrawnAt: new Date(statusEffectiveAt || new Date()),
        });
      } else {
        res = await updateEnrollmentStatusAction(schoolId, {
          enrollmentId: relationship.id,
          enrollmentStatus: targetStatus,
        });
      }

      if (res.success) {
        showToast("Đã cập nhật trạng thái học sinh thành công!");
        setShowStatusModal(false);
        router.refresh();
      } else {
        setStatusError(res.error ?? "Lỗi cập nhật trạng thái");
      }
    });
  };

  const statusBadge =
    relationship.enrollmentStatus === "ACTIVE"
      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
      : relationship.enrollmentStatus === "ON_LEAVE"
      ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
      : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20";

  const statusText =
    relationship.enrollmentStatus === "ACTIVE"
      ? "Đang học (ACTIVE)"
      : relationship.enrollmentStatus === "ON_LEAVE"
      ? "Tạm nghỉ (ON_LEAVE)"
      : relationship.enrollmentStatus === "WITHDRAWN"
      ? "Đã thôi học (WITHDRAWN)"
      : "Đã tốt nghiệp (GRADUATED)";

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 rounded-xl bg-emerald-600 text-white px-4 py-3 text-xs font-semibold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="h-4 w-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Điều hướng */}
      <div>
        <Link
          href={`/${schoolSlug}/students`}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors font-medium mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Quay lại Danh sách học sinh</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-bold text-xl shadow-md shadow-primary/20 shrink-0">
              {student.firstName.slice(0, 1)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {fullName}
                </h1>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusBadge}`}>
                  {statusText}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Lớp: <strong className="text-foreground">{relationship.currentClass?.name || "Chưa phân lớp"}</strong> • Ngày nhập học: {new Date(relationship.enrolledAt).toLocaleDateString("vi-VN")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              id="btn-transfer-class"
              variant="outline"
              size="sm"
              onClick={() => {
                setTransferError(null);
                setShowTransferModal(true);
              }}
              className="h-9 font-semibold text-xs gap-1.5"
            >
              <ArrowRightLeft className="h-3.5 w-3.5" />
              <span>Chuyển lớp học</span>
            </Button>

            <Button
              id="btn-update-status"
              variant="outline"
              size="sm"
              onClick={() => {
                setStatusError(null);
                setShowStatusModal(true);
              }}
              className="h-9 font-semibold text-xs gap-1.5"
            >
              <Settings2 className="h-3.5 w-3.5" />
              <span>Cập nhật trạng thái</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cột trái: Thông tin học sinh & Người giám hộ */}
        <div className="lg:col-span-2 space-y-6">
          {/* Thông tin nhân thân */}
          <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold flex items-center gap-2 text-foreground border-b pb-3">
              <User className="h-4 w-4 text-primary" />
              <span>Thông tin Nhân thân & Địa chỉ</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-muted-foreground block mb-1">Giới tính</span>
                <span className="font-semibold text-foreground">
                  {student.gender === "MALE" ? "Nam" : student.gender === "FEMALE" ? "Nữ" : "Khác"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Ngày sinh</span>
                <span className="font-semibold text-foreground">
                  {new Date(student.dateOfBirth).toLocaleDateString("vi-VN")}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Mã CCCD / Định danh</span>
                <span className="font-mono font-semibold text-foreground">
                  {student.cccd || student.personalIdNumber || "Chưa khai báo"}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t space-y-2 text-xs">
              <span className="text-muted-foreground block">Nơi ở hiện tại</span>
              <p className="font-medium text-foreground">
                {[
                  student.currentAddressDetail,
                  student.currentAddressWard,
                  student.currentAddressDistrict,
                  student.currentAddressProvince,
                ]
                  .filter(Boolean)
                  .join(", ") || "Chưa cập nhật địa chỉ"}
              </p>
            </div>

            {/* Chính sách */}
            <div className="pt-3 border-t space-y-2 text-xs">
              <span className="text-muted-foreground block">Chế độ chính sách & Miễn giảm</span>
              <div className="flex flex-wrap gap-2">
                {student.tuitionExempt && (
                  <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-700 dark:text-blue-400 font-semibold border border-blue-500/20">
                    Miễn 100% học phí
                  </span>
                )}
                {student.lunchSupport && (
                  <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold border border-amber-500/20">
                    Hỗ trợ tiền ăn trưa
                  </span>
                )}
                {!student.tuitionExempt && !student.lunchSupport && (
                  <span className="text-muted-foreground italic">Không có chế độ miễn giảm đặc biệt</span>
                )}
              </div>
            </div>
          </div>

          {/* Người giám hộ */}
          <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold flex items-center gap-2 text-foreground border-b pb-3">
              <Users className="h-4 w-4 text-primary" />
              <span>Gia đình & Người Chịu trách nhiệm ({relationship.responsiblePersons.length})</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {relationship.responsiblePersons.map((p) => (
                <div key={p.id} className="p-4 rounded-xl border bg-muted/20 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-foreground">
                      {p.fullName || "Chưa rõ họ tên"}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold text-[10px]">
                      {p.type === "FATHER" ? "Cha" : p.type === "MOTHER" ? "Mẹ" : "Giám hộ"}
                    </span>
                  </div>

                  <div className="space-y-1 text-muted-foreground">
                    <p className="flex items-center gap-1.5 font-mono text-foreground">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      {p.phone || "Chưa có số điện thoại"}
                    </p>
                    <p>Năm sinh: {p.yearOfBirth || "Chưa rõ"}</p>
                    <p>Nghề nghiệp: {p.occupation || "Tự do"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cột phải: Dòng thời gian chuyển lớp (Class Membership History Timeline) */}
        <div className="space-y-6">
          <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-5">
            <h2 className="text-base font-bold flex items-center gap-2 text-foreground border-b pb-3">
              <GraduationCap className="h-4 w-4 text-primary" />
              <span>Lịch sử Phân lớp (Append-Only)</span>
            </h2>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
              {relationship.classMemberships.map((m, index) => {
                const isCurrent = m.endedAt === null;

                return (
                  <div key={m.id} className="relative space-y-1 text-xs">
                    <div
                      className={`absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 bg-background ${
                        isCurrent
                          ? "border-primary bg-primary animate-pulse"
                          : "border-muted-foreground"
                      }`}
                    />

                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm text-foreground">
                        Lớp {m.class.name}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 px-1.5 py-0.2 rounded border border-emerald-500/20">
                          Hiện tại
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-muted-foreground">
                      {new Date(m.startedAt).toLocaleDateString("vi-VN")} →{" "}
                      {m.endedAt ? new Date(m.endedAt).toLocaleDateString("vi-VN") : "Đang học"}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Chuyển lớp */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 space-y-5 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-primary">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <ArrowRightLeft className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Chuyển Lớp Học</h3>
                <p className="text-xs text-muted-foreground">Học sinh: {fullName}</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-muted-foreground leading-relaxed">
                Thao tác chuyển lớp sẽ ghi nhận thời điểm kết thúc ở lớp cũ và khởi tạo giai đoạn học tập mới trong lịch sử phân lớp.
              </p>

              <div className="space-y-1.5">
                <label htmlFor="targetClassSelect" className="font-semibold text-foreground">
                  Chọn lớp học tiếp nhận mới <span className="text-destructive">*</span>
                </label>
                <select
                  id="targetClassSelect"
                  value={targetClassId}
                  onChange={(e) => setTargetClassId(e.target.value)}
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
                >
                  {availableClasses.map((c) => (
                    <option key={c.id} value={c.id} disabled={c.id === relationship.currentClass?.id}>
                      Lớp {c.name} {c.id === relationship.currentClass?.id ? "(Hiện tại)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="transferEffectiveAt" className="font-semibold text-foreground">
                  Ngày hiệu lực chuyển lớp <span className="text-destructive">*</span>
                </label>
                <Input
                  id="transferEffectiveAt"
                  type="date"
                  value={transferEffectiveAt}
                  onChange={(e) => setTransferEffectiveAt(e.target.value)}
                />
              </div>

              {transferError && (
                <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{transferError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTransferModal(false)}
                  disabled={isTransferring}
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="button"
                  id="btn-confirm-transfer"
                  size="sm"
                  onClick={handleTransferClass}
                  disabled={isTransferring}
                  className="font-semibold shadow-xs"
                >
                  {isTransferring ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Đang chuyển...</span>
                    </span>
                  ) : (
                    "Xác nhận Chuyển lớp"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cập nhật trạng thái */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 space-y-5 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <Settings2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Cập nhật Trạng thái Học sinh</h3>
                <p className="text-xs text-muted-foreground">Học sinh: {fullName}</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label htmlFor="targetStatusSelect" className="font-semibold text-foreground">
                  Trạng thái nhập học mới
                </label>
                <select
                  id="targetStatusSelect"
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as "ACTIVE" | "ON_LEAVE" | "WITHDRAWN" | "GRADUATED")}
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
                >
                  <option value="ACTIVE">Đang theo học (ACTIVE)</option>
                  <option value="ON_LEAVE">Tạm nghỉ / Bảo lưu (ON_LEAVE)</option>
                  <option value="WITHDRAWN">Đã thôi học / Rút hồ sơ (WITHDRAWN)</option>
                  <option value="GRADUATED">Đã tốt nghiệp (GRADUATED)</option>
                </select>
              </div>

              {targetStatus === "WITHDRAWN" && (
                <>
                  <div className="space-y-1.5">
                    <label htmlFor="withdrawalReason" className="font-semibold text-foreground">
                      Lý do thôi học / rút hồ sơ <span className="text-destructive">*</span>
                    </label>
                    <Input
                      id="withdrawalReason"
                      placeholder="Ví dụ: Chuyển nơi cư trú sang tỉnh khác..."
                      value={withdrawalReason}
                      onChange={(e) => setWithdrawalReason(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="statusEffectiveAt" className="font-semibold text-foreground">
                      Ngày hiệu lực thôi học <span className="text-destructive">*</span>
                    </label>
                    <Input
                      id="statusEffectiveAt"
                      type="date"
                      value={statusEffectiveAt}
                      onChange={(e) => setStatusEffectiveAt(e.target.value)}
                    />
                  </div>
                </>
              )}

              {statusError && (
                <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{statusError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowStatusModal(false)}
                  disabled={isUpdatingStatus}
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="button"
                  id="btn-confirm-status"
                  size="sm"
                  onClick={handleUpdateStatus}
                  disabled={isUpdatingStatus}
                  className="font-semibold shadow-xs"
                >
                  {isUpdatingStatus ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Đang cập nhật...</span>
                    </span>
                  ) : (
                    "Lưu trạng thái"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
