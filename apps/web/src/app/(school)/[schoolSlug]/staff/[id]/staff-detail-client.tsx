'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Edit3,
  GraduationCap,
  Mail,
  Phone,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserX,
  X,
  AlertTriangle,
  FileText,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  updateStaffProfileAction,
  updateStaffPermissionsAction,
  changeStaffStatusAction,
  type UpdateStaffInput,
  type ChangeStaffStatusInput,
} from '@/app/(school)/staff/actions';
import {
  ALL_PERMISSIONS,
  ROLE_DEFINITIONS,
  type RoleDefinition,
} from '@/app/(school)/staff/constants';

interface StaffDetailProps {
  schoolSlug: string;
  schoolId: string;
  staff: {
    id: string;
    userId: string;
    fullName: string | null;
    phone: string | null;
    email: string | null;
    avatarUrl: string | null;
    employeeCode: string | null;
    roles: string[];
    permissions: string[];
    employmentStatus: 'ACTIVE' | 'ON_LEAVE' | 'RESIGNED' | 'TERMINATED';
    hiredAt: string;
    resignedAt: string | null;
    notes: string | null;
    homeroomClasses: Array<{ id: string; name: string; ageGroup: string }>;
    assistantClasses: Array<{ id: string; name: string; ageGroup: string }>;
  };
}

export function StaffDetailClient({
  schoolSlug,
  schoolId,
  staff,
}: StaffDetailProps) {
  const router = useRouter();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Status Change Modal State
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState<
    'ACTIVE' | 'ON_LEAVE' | 'RESIGNED' | 'TERMINATED'
  >(staff.employmentStatus);
  const [statusNote, setStatusNote] = useState('');
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isUpdatingStatus, startUpdatingStatus] = useTransition();

  // Edit Profile Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [fullName, setFullName] = useState(staff.fullName || '');
  const [phone, setPhone] = useState(staff.phone || '');
  const [email, setEmail] = useState(staff.email || '');
  const [employeeCode, setEmployeeCode] = useState(staff.employeeCode || '');
  const [selectedRoles, setSelectedRoles] = useState<string[]>(staff.roles);
  const [notes, setNotes] = useState(staff.notes || '');
  const [editError, setEditError] = useState<string | null>(null);
  const [isUpdatingProfile, startUpdatingProfile] = useTransition();

  // Permission Matrix State
  const [currentPermissions, setCurrentPermissions] = useState<string[]>(staff.permissions);
  const [permError, setPermError] = useState<string | null>(null);
  const [isSavingPerms, startSavingPerms] = useTransition();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleRoleToggle = (roleKey: string) => {
    if (selectedRoles.includes(roleKey)) {
      if (selectedRoles.length > 1) {
        setSelectedRoles(selectedRoles.filter((r) => r !== roleKey));
      }
    } else {
      setSelectedRoles([...selectedRoles, roleKey]);
    }
  };

  const handlePermissionToggle = (permId: string) => {
    if (currentPermissions.includes(permId)) {
      setCurrentPermissions(currentPermissions.filter((p) => p !== permId));
    } else {
      setCurrentPermissions([...currentPermissions, permId]);
    }
  };

  const handleSavePermissions = () => {
    setPermError(null);
    startSavingPerms(async () => {
      const res = await updateStaffPermissionsAction(schoolId, staff.id, currentPermissions);
      if (res.success) {
        showToast('Đã lưu ma trận phân quyền thành công!');
        router.refresh();
      } else {
        setPermError(res.error ?? 'Lỗi khi lưu phân quyền');
      }
    });
  };

  const handleEditProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);

    const payload: UpdateStaffInput = {
      staffId: staff.id,
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      employeeCode: employeeCode.trim() || undefined,
      roles: selectedRoles,
      notes: notes.trim() || undefined,
    };

    startUpdatingProfile(async () => {
      const res = await updateStaffProfileAction(schoolId, payload);
      if (res.success) {
        showToast('Đã cập nhật thông tin hồ sơ nhân sự!');
        setShowEditModal(false);
        router.refresh();
      } else {
        setEditError(res.error ?? 'Lỗi khi cập nhật hồ sơ');
      }
    });
  };

  const handleUpdateStatus = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusError(null);

    const payload: ChangeStaffStatusInput = {
      staffId: staff.id,
      status: targetStatus,
      note: statusNote.trim() || undefined,
    };

    startUpdatingStatus(async () => {
      const res = await changeStaffStatusAction(schoolId, payload);
      if (res.success) {
        showToast('Đã cập nhật trạng thái làm việc thành công!');
        setShowStatusModal(false);
        router.refresh();
      } else {
        setStatusError(res.error ?? 'Lỗi khi cập nhật trạng thái');
      }
    });
  };

  type PermissionItem = (typeof ALL_PERMISSIONS)[number];

  // Group permissions by module
  const permissionGroups = ALL_PERMISSIONS.reduce(
    (acc: Record<string, PermissionItem[]>, perm: PermissionItem) => {
      const groupList = acc[perm.group] ?? [];
      groupList.push(perm);
      acc[perm.group] = groupList;
      return acc;
    },
    {} as Record<string, PermissionItem[]>
  );

  const statusBadge =
    staff.employmentStatus === 'ACTIVE'
      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
      : staff.employmentStatus === 'ON_LEAVE'
      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
      : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20';

  const statusText =
    staff.employmentStatus === 'ACTIVE'
      ? 'Đang làm việc (ACTIVE)'
      : staff.employmentStatus === 'ON_LEAVE'
      ? 'Tạm nghỉ (ON_LEAVE)'
      : staff.employmentStatus === 'RESIGNED'
      ? 'Đã thôi việc (RESIGNED)'
      : 'Sa thải (TERMINATED)';

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 rounded-xl bg-emerald-600 text-white px-4 py-3 text-xs font-semibold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="h-4 w-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Điều hướng */}
      <div>
        <Link
          href={`/${schoolSlug}/staff`}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors font-medium mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Quay lại Danh sách Nhân sự</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-bold text-xl shadow-md shadow-primary/20 shrink-0">
              {staff.fullName ? staff.fullName.slice(0, 1) : 'NV'}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  {staff.fullName || 'Chưa cập nhật tên'}
                </h1>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusBadge}`}>
                  {statusText}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Mã NV: <strong className="font-mono text-foreground">{staff.employeeCode || 'N/A'}</strong> • Ngày vào làm: {new Date(staff.hiredAt).toLocaleDateString('vi-VN')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              id="btn-edit-staff-profile"
              variant="outline"
              size="sm"
              onClick={() => {
                setEditError(null);
                setShowEditModal(true);
              }}
              className="h-9 font-semibold text-xs gap-1.5"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Chỉnh sửa hồ sơ</span>
            </Button>

            <Button
              id="btn-change-staff-status"
              variant="outline"
              size="sm"
              onClick={() => {
                setStatusError(null);
                setTargetStatus(staff.employmentStatus);
                setShowStatusModal(true);
              }}
              className="h-9 font-semibold text-xs gap-1.5"
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>Đổi trạng thái</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cột Trái: Thông tin nhân thân & Phân công lớp học */}
        <div className="space-y-6">
          {/* Thông tin cá nhân */}
          <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold flex items-center gap-2 text-foreground border-b pb-3">
              <User className="h-4 w-4 text-primary" />
              <span>Thông tin Nhân sự & Liên hệ</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-muted-foreground block mb-0.5">Số điện thoại</span>
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  {staff.phone || 'Chưa có'}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground block mb-0.5">Email liên hệ</span>
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  {staff.email || 'Chưa cập nhật'}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground block mb-1">Vai trò đảm nhiệm</span>
                <div className="flex flex-wrap gap-1.5">
                  {staff.roles.map((r) => {
                    const def = ROLE_DEFINITIONS[r];
                    return (
                      <span
                        key={r}
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                          def?.badgeColor ?? 'bg-muted text-foreground border-border'
                        }`}
                      >
                        {def?.label ?? r}
                      </span>
                    );
                  })}
                </div>
              </div>

              {staff.notes && (
                <div className="pt-2 border-t">
                  <span className="text-muted-foreground block mb-1">Ghi chú</span>
                  <p className="text-foreground whitespace-pre-line text-[11px] bg-muted/30 p-2.5 rounded-xl border">
                    {staff.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Phân công lớp học */}
          <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold flex items-center gap-2 text-foreground border-b pb-3">
              <GraduationCap className="h-4 w-4 text-primary" />
              <span>Phân công Phụ trách Lớp học</span>
            </h2>

            <div className="space-y-3 text-xs">
              {/* Lớp Chủ nhiệm */}
              <div className="space-y-1.5">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <span>Giáo viên Chủ nhiệm:</span>
                </span>
                {staff.homeroomClasses.length > 0 ? (
                  <div className="space-y-1">
                    {staff.homeroomClasses.map((cls) => (
                      <div
                        key={cls.id}
                        className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between"
                      >
                        <span className="font-bold text-primary">{cls.name}</span>
                        <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded">
                          Chủ nhiệm
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground italic pl-3.5">
                    Chưa được phân công chủ nhiệm lớp nào.
                  </p>
                )}
              </div>

              {/* Lớp Phụ trách */}
              <div className="space-y-1.5 pt-2 border-t">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-sky-500" />
                  <span>Giáo viên Phụ trách:</span>
                </span>
                {staff.assistantClasses.length > 0 ? (
                  <div className="space-y-1">
                    {staff.assistantClasses.map((cls) => (
                      <div
                        key={cls.id}
                        className="p-2.5 rounded-xl bg-muted/30 border flex items-center justify-between"
                      >
                        <span className="font-medium text-foreground">{cls.name}</span>
                        <span className="text-[10px] font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded">
                          Phụ trách
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground italic pl-3.5">
                    Chưa được phân công phụ trách lớp nào.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Cột Phải: Ma trận Phân quyền Động (Dynamic Permission Matrix) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
              <div>
                <h2 className="text-base font-bold flex items-center gap-2 text-foreground">
                  <Shield className="h-4 w-4 text-primary" />
                  <span>Ma trận Phân quyền Chi tiết (Dynamic RBAC)</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  School Admin có thể bật hoặc tắt từng quyền cụ thể độc lập với vai trò mặc định.
                </p>
              </div>

              <Button
                id="btn-save-permissions"
                onClick={handleSavePermissions}
                disabled={isSavingPerms}
                size="sm"
                className="font-semibold text-xs h-9"
              >
                {isSavingPerms ? 'Đang lưu...' : 'Lưu ma trận quyền'}
              </Button>
            </div>

            {permError && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{permError}</span>
              </div>
            )}

            <div className="space-y-6">
              {Object.entries(permissionGroups).map(([groupName, permissions]: [string, PermissionItem[]]) => (
                <div key={groupName} className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                      Phân hệ {groupName}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {permissions.map((perm: PermissionItem) => {
                      const isChecked = currentPermissions.includes(perm.id);
                      return (
                        <div
                          key={perm.id}
                          id={`perm-card-${perm.id.replace(':', '-')}`}
                          onClick={() => handlePermissionToggle(perm.id)}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-3 select-none ${
                            isChecked
                              ? 'border-primary bg-primary/5 shadow-2xs'
                              : 'border-border bg-card hover:bg-muted/30 opacity-70'
                          }`}
                        >
                          <input
                            id={`perm-input-${perm.id.replace(':', '-')}`}
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handlePermissionToggle(perm.id)}
                            className="mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-primary"
                          />
                          <div className="space-y-0.5">
                            <span className={`font-semibold block ${isChecked ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {perm.label}
                            </span>
                            <span className="font-mono text-[10px] text-muted-foreground block">
                              {perm.id}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Chỉnh sửa Hồ sơ Nhân sự */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="font-bold text-base text-foreground">Chỉnh sửa Hồ sơ Nhân sự</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {editError && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleEditProfile} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label htmlFor="editFullName" className="font-semibold text-foreground">
                  Họ và tên nhân sự <span className="text-destructive">*</span>
                </label>
                <Input
                  id="editFullName"
                  value={fullName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="editPhone" className="font-semibold text-foreground">
                    Số điện thoại <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="editPhone"
                    value={phone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="editEmail" className="font-semibold text-foreground">
                    Email liên hệ
                  </label>
                  <Input
                    id="editEmail"
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="editEmployeeCode" className="font-semibold text-foreground">
                  Mã nhân viên
                </label>
                <Input
                  id="editEmployeeCode"
                  value={employeeCode}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmployeeCode(e.target.value)}
                />
              </div>

              {/* Vai trò */}
              <div className="space-y-2 pt-1">
                <label className="font-semibold text-foreground block">
                  Vai trò công việc <span className="text-destructive">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(ROLE_DEFINITIONS).map(([key, def]: [string, RoleDefinition]) => {
                    const isSelected = selectedRoles.includes(key);
                    return (
                      <button
                        type="button"
                        key={key}
                        onClick={() => handleRoleToggle(key)}
                        className={`py-2 px-2 rounded-xl border text-left font-medium transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary font-bold'
                            : 'border-border bg-card text-muted-foreground'
                        }`}
                      >
                        <span className="truncate">{def.label}</span>
                        {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="editNotes" className="font-semibold text-foreground">
                  Ghi chú chuyên môn
                </label>
                <textarea
                  id="editNotes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background p-2.5 text-xs focus:outline-hidden focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEditModal(false)}
                  disabled={isUpdatingProfile}
                >
                  Hủy bỏ
                </Button>
                <Button
                  id="btn-confirm-edit-profile"
                  type="submit"
                  size="sm"
                  disabled={isUpdatingProfile}
                  className="font-semibold"
                >
                  {isUpdatingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Đổi Trạng thái Làm việc */}
      {showStatusModal && (
        <div id="modal-change-staff-status" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="font-bold text-base text-foreground">Cập nhật Trạng thái Làm việc</h3>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {statusError && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{statusError}</span>
              </div>
            )}

            {(targetStatus === 'RESIGNED' || targetStatus === 'TERMINATED') && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  <span>Lưu ý quan trọng:</span>
                </p>
                <p>
                  Khi nhân sự chuyển sang trạng thái <strong>{targetStatus === 'RESIGNED' ? 'Đã thôi việc' : 'Sa thải'}</strong>, hệ thống sẽ <strong>tự động gỡ bỏ</strong> phân công giáo viên chủ nhiệm và phụ trách tại tất cả các lớp đang hoạt động.
                </p>
              </div>
            )}

            <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label htmlFor="selectTargetStatus" className="font-semibold text-foreground">
                  Trạng thái mới <span className="text-destructive">*</span>
                </label>
                <select
                  id="selectTargetStatus"
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as typeof targetStatus)}
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
                >
                  <option value="ACTIVE">Đang làm việc (ACTIVE)</option>
                  <option value="ON_LEAVE">Tạm nghỉ / Nghỉ phép (ON_LEAVE)</option>
                  <option value="RESIGNED">Đã thôi việc / Nghỉ việc (RESIGNED)</option>
                  <option value="TERMINATED">Sa thải / Chấm dứt hợp đồng (TERMINATED)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="statusChangeNote" className="font-semibold text-foreground">
                  Lý do / Ghi chú thay đổi
                </label>
                <textarea
                  id="statusChangeNote"
                  rows={3}
                  placeholder="Nhập lý do thay đổi trạng thái..."
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background p-2.5 text-xs focus:outline-hidden focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t">
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
                  id="btn-confirm-change-status"
                  type="submit"
                  size="sm"
                  disabled={isUpdatingStatus}
                  className="font-semibold"
                >
                  {isUpdatingStatus ? 'Đang cập nhật...' : 'Xác nhận trạng thái'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
