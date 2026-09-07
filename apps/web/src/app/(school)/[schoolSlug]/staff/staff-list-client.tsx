'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Phone,
  Mail,
  Briefcase,
  ShieldCheck,
  ChevronRight,
  UserCheck,
  Clock,
  UserX,
  X,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  createStaffAction,
  type CreateStaffInput,
} from '@/app/(school)/staff/actions';
import {
  ROLE_DEFINITIONS,
  type RoleDefinition,
} from '@/app/(school)/staff/constants';

export interface StaffListItem {
  id: string;
  userId: string;
  fullName: string | null;
  phone: string | null;
  email: string | null;
  employeeCode: string | null;
  roles: string[];
  permissions: string[];
  employmentStatus: 'ACTIVE' | 'ON_LEAVE' | 'RESIGNED' | 'TERMINATED';
  hiredAt: string;
  resignedAt: string | null;
  notes: string | null;
  homeroomClasses: Array<{ id: string; name: string }>;
  assistantClasses: Array<{ id: string; name: string }>;
}

interface StaffListClientProps {
  schoolSlug: string;
  schoolId: string;
  staffMembers: StaffListItem[];
}

export function StaffListClient({
  schoolSlug,
  schoolId,
  staffMembers,
}: StaffListClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['TEACHER']);
  const [hiredAt, setHiredAt] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!fullName.trim()) {
      setModalError('Vui lòng nhập họ và tên nhân sự.');
      return;
    }
    if (!phone.trim()) {
      setModalError('Vui lòng nhập số điện thoại nhân sự.');
      return;
    }
    if (selectedRoles.length === 0) {
      setModalError('Vui lòng chọn ít nhất một vai trò công việc.');
      return;
    }

    const payload: CreateStaffInput = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      employeeCode: employeeCode.trim() || undefined,
      roles: selectedRoles,
      hiredAt: hiredAt ? new Date(hiredAt) : new Date(),
      notes: notes.trim() || undefined,
    };

    startTransition(async () => {
      const res = await createStaffAction(schoolId, payload);
      if (res.success) {
        showToast('Đã tiếp nhận nhân sự mới thành công!');
        setShowAddModal(false);
        // Reset form
        setFullName('');
        setPhone('');
        setEmail('');
        setEmployeeCode('');
        setSelectedRoles(['TEACHER']);
        setNotes('');
      } else {
        setModalError(res.error ?? 'Lỗi khi lưu thông tin nhân sự.');
      }
    });
  };

  // Filter Logic
  const filteredStaff = staffMembers.filter((staff) => {
    const term = searchTerm.trim().toLowerCase();
    const digitsOnlySearch = searchTerm.replace(/\D/g, '');
    const digitsOnlyPhone = (staff.phone || '').replace(/\D/g, '');
    const matchesPhone =
      Boolean(staff.phone && staff.phone.includes(searchTerm.trim())) ||
      (digitsOnlySearch.length >= 6 &&
        digitsOnlyPhone.endsWith(digitsOnlySearch.replace(/^0/, '')));

    const matchesSearch =
      !term ||
      (staff.fullName && staff.fullName.toLowerCase().includes(term)) ||
      (staff.employeeCode && staff.employeeCode.toLowerCase().includes(term)) ||
      matchesPhone ||
      (staff.email && staff.email.toLowerCase().includes(term));

    const matchesRole =
      selectedRole === 'ALL' || staff.roles.includes(selectedRole);

    const matchesStatus =
      selectedStatus === 'ALL' || staff.employmentStatus === selectedStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalActive = staffMembers.filter((s) => s.employmentStatus === 'ACTIVE').length;
  const totalOnLeave = staffMembers.filter((s) => s.employmentStatus === 'ON_LEAVE').length;
  const totalResigned = staffMembers.filter(
    (s) => s.employmentStatus === 'RESIGNED' || s.employmentStatus === 'TERMINATED'
  ).length;

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 rounded-xl bg-emerald-600 text-white px-4 py-3 text-xs font-semibold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="h-4 w-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Thao tác chính */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Đội ngũ Giáo viên & Nhân sự
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              {staffMembers.length} người
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Quản trị nhân sự cơ sở, phân bổ vai trò chuyên trách, phân công lớp học và ma trận quyền động (RBAC).
          </p>
        </div>

        <Button
          id="btn-add-staff"
          onClick={() => {
            setModalError(null);
            setShowAddModal(true);
          }}
          className="gap-2 font-semibold shadow-sm text-xs h-10 px-4"
        >
          <UserPlus className="h-4 w-4" />
          <span>Tiếp nhận nhân sự mới</span>
        </Button>
      </div>

      {/* Thẻ Thống kê 4 Chỉ số */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border bg-card p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Tổng nhân sự</span>
            <Users className="h-4 w-4 text-primary" />
          </div>
          <p id="stat-total-staff" className="text-2xl font-bold text-foreground">{staffMembers.length}</p>
          <span className="text-[11px] text-muted-foreground block">Đã đăng ký tại cơ sở</span>
        </div>

        <div className="rounded-2xl border bg-card p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Đang làm việc</span>
            <UserCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <p id="stat-active-staff" className="text-2xl font-bold text-emerald-600">{totalActive}</p>
          <span className="text-[11px] text-muted-foreground block">Trạng thái ACTIVE</span>
        </div>

        <div className="rounded-2xl border bg-card p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Tạm nghỉ / Phép</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p id="stat-onleave-staff" className="text-2xl font-bold text-amber-600">{totalOnLeave}</p>
          <span className="text-[11px] text-muted-foreground block">Trạng thái ON_LEAVE</span>
        </div>

        <div className="rounded-2xl border bg-card p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Đã thôi việc</span>
            <UserX className="h-4 w-4 text-rose-500" />
          </div>
          <p id="stat-resigned-staff" className="text-2xl font-bold text-rose-600">{totalResigned}</p>
          <span className="text-[11px] text-muted-foreground block">Đã rút / Sa thải</span>
        </div>
      </div>

      {/* Thanh Tìm kiếm & Bộ lọc */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="staff-search-input"
            placeholder="Tìm theo Tên nhân sự, Mã nhân viên, SĐT hoặc Email..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="pl-9 h-10 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Lọc theo Vai trò */}
          <select
            id="filter-staff-role"
            value={selectedRole}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedRole(e.target.value)}
            className="h-10 rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary shrink-0"
          >
            <option value="ALL">Tất cả vai trò</option>
            {Object.entries(ROLE_DEFINITIONS).map(([key, def]: [string, RoleDefinition]) => (
              <option key={key} value={key}>
                {def.label}
              </option>
            ))}
          </select>

          {/* Lọc theo Trạng thái làm việc */}
          <select
            id="filter-staff-status"
            value={selectedStatus}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedStatus(e.target.value)}
            className="h-10 rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary shrink-0"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang làm việc (ACTIVE)</option>
            <option value="ON_LEAVE">Tạm nghỉ (ON_LEAVE)</option>
            <option value="RESIGNED">Đã thôi việc (RESIGNED)</option>
            <option value="TERMINATED">Sa thải (TERMINATED)</option>
          </select>
        </div>
      </div>

      {/* Danh sách / Bảng Nhân sự */}
      {staffMembers.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center bg-card/50 space-y-3">
          <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="font-semibold text-foreground text-sm">
            Chưa có nhân sự nào được tiếp nhận
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Bắt đầu thiết lập đội ngũ cán bộ, giáo viên và nhân viên cho cơ sở trường học.
          </p>
          <Button
            id="btn-add-staff-empty"
            onClick={() => {
              setModalError(null);
              setShowAddModal(true);
            }}
            className="gap-2 font-semibold text-xs h-9 px-4"
          >
            <UserPlus className="h-4 w-4" />
            <span>Tiếp nhận nhân sự đầu tiên</span>
          </Button>
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center bg-card/50 space-y-3">
          <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="font-semibold text-foreground text-sm">
            Không tìm thấy nhân sự phù hợp với bộ lọc
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh lại bộ lọc vai trò/trạng thái.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-muted/30 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Nhân sự</th>
                  <th className="py-3.5 px-4">Mã NV</th>
                  <th className="py-3.5 px-4">Vai trò công việc</th>
                  <th className="py-3.5 px-4">Phân công lớp</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-4 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredStaff.map((staff) => {
                  const statusBadge =
                    staff.employmentStatus === 'ACTIVE'
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                      : staff.employmentStatus === 'ON_LEAVE'
                      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                      : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20';

                  const statusText =
                    staff.employmentStatus === 'ACTIVE'
                      ? 'Đang làm việc'
                      : staff.employmentStatus === 'ON_LEAVE'
                      ? 'Tạm nghỉ'
                      : staff.employmentStatus === 'RESIGNED'
                      ? 'Đã thôi việc'
                      : 'Sa thải';

                  return (
                    <tr
                      key={staff.id}
                      className="hover:bg-muted/40 transition-colors group cursor-pointer"
                      onClick={() => {
                        window.location.href = `/${schoolSlug}/staff/${staff.id}`;
                      }}
                    >
                      {/* Cột 1: Thông tin nhân sự */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-primary/80 to-primary flex items-center justify-center text-primary-foreground font-bold text-xs shadow-xs shrink-0">
                            {staff.fullName ? staff.fullName.slice(0, 1) : 'NV'}
                          </div>
                          <div className="space-y-0.5">
                            <span className="font-bold text-sm text-foreground block group-hover:text-primary transition-colors">
                              {staff.fullName || 'Chưa cập nhật tên'}
                            </span>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                              {staff.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3 text-muted-foreground" />
                                  {staff.phone}
                                </span>
                              )}
                              {staff.email && (
                                <span className="flex items-center gap-1 truncate max-w-[140px]">
                                  <Mail className="h-3 w-3 text-muted-foreground" />
                                  {staff.email}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Mã NV */}
                      <td className="py-4 px-4 font-mono font-semibold text-foreground">
                        {staff.employeeCode || 'N/A'}
                      </td>

                      {/* Cột 3: Vai trò */}
                      <td className="py-4 px-4">
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
                      </td>

                      {/* Cột 4: Phân công lớp */}
                      <td className="py-4 px-4">
                        <div className="space-y-1 text-xs">
                          {staff.homeroomClasses.length > 0 && (
                            <div className="flex items-center gap-1 text-primary font-medium">
                              <span className="text-[10px] uppercase font-bold text-primary/70">CN:</span>
                              <span>{staff.homeroomClasses.map((c) => c.name).join(', ')}</span>
                            </div>
                          )}
                          {staff.assistantClasses.length > 0 && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <span className="text-[10px] uppercase font-bold text-muted-foreground/70">PT:</span>
                              <span>{staff.assistantClasses.map((c) => c.name).join(', ')}</span>
                            </div>
                          )}
                          {staff.homeroomClasses.length === 0 && staff.assistantClasses.length === 0 && (
                            <span className="text-muted-foreground italic text-[11px]">Chưa phân lớp</span>
                          )}
                        </div>
                      </td>

                      {/* Cột 5: Trạng thái */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusBadge}`}
                        >
                          {statusText}
                        </span>
                      </td>

                      {/* Cột 6: Nút thao tác */}
                      <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <Link
                          href={`/${schoolSlug}/staff/${staff.id}`}
                          className="inline-flex items-center gap-1 text-primary hover:underline font-semibold text-xs py-1 px-2 rounded-lg hover:bg-primary/5 transition-colors"
                        >
                          <span>Hồ sơ</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Tiếp nhận Nhân sự Mới */}
      {showAddModal && (
        <div id="modal-add-staff" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border bg-card p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">Tiếp nhận Nhân sự Mới</h3>
                  <p className="text-xs text-muted-foreground">Thêm giáo viên hoặc nhân viên vào cơ sở trường học.</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {modalError && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleAddStaff} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label htmlFor="staffFullName" className="font-semibold text-foreground">
                  Họ và tên nhân sự <span className="text-destructive">*</span>
                </label>
                <Input
                  id="staffFullName"
                  placeholder="Ví dụ: Nguyễn Thị Mai"
                  value={fullName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="staffPhone" className="font-semibold text-foreground">
                    Số điện thoại <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="staffPhone"
                    placeholder="0912345678"
                    value={phone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="staffEmail" className="font-semibold text-foreground">
                    Email liên hệ (Tùy chọn)
                  </label>
                  <Input
                    id="staffEmail"
                    placeholder="mai.nguyen@example.com"
                    type="email"
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="staffEmployeeCode" className="font-semibold text-foreground">
                    Mã nhân viên (Tự sinh nếu để trống)
                  </label>
                  <Input
                    id="staffEmployeeCode"
                    placeholder="Ví dụ: GV-001"
                    value={employeeCode}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmployeeCode(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="staffHiredAt" className="font-semibold text-foreground">
                    Ngày vào làm
                  </label>
                  <Input
                    id="staffHiredAt"
                    type="date"
                    value={hiredAt}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHiredAt(e.target.value)}
                  />
                </div>
              </div>

              {/* Phân bổ Vai trò (Multi-select Chips) */}
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
                        className={`py-2 px-2.5 rounded-xl border text-left font-medium transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary shadow-xs font-bold'
                            : 'border-border bg-card text-muted-foreground hover:bg-muted/50'
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
                <label htmlFor="staffNotes" className="font-semibold text-foreground">
                  Ghi chú chuyên môn
                </label>
                <textarea
                  id="staffNotes"
                  rows={2}
                  placeholder="Bằng cấp sư phạm mầm non, chứng chỉ, kinh nghiệm..."
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
                  onClick={() => setShowAddModal(false)}
                  disabled={isPending}
                >
                  Hủy bỏ
                </Button>
                <Button
                  id="btn-confirm-add-staff"
                  type="submit"
                  size="sm"
                  disabled={isPending}
                  className="font-semibold"
                >
                  {isPending ? 'Đang lưu...' : 'Xác nhận tiếp nhận'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
