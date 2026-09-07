'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createSchoolYearSchema,
  createClassSchema,
} from '@km/validators/schemas/school-operations';
import {
  createSchoolYearAction,
  setCurrentSchoolYearAction,
  createClassAction,
  updateClassAction,
  deleteClassAction,
} from '../../actions';
import { assignClassStaffAction } from '@/app/(school)/staff/actions';
import {
  CalendarDays,
  GraduationCap,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Trash2,
  Edit2,
  Star,
  Users,
  Building2,
  Sparkles,
  X,
  Clock,
  Layers,
  UserCheck,
} from 'lucide-react';

export interface ClassData {
  id: string;
  name: string;
  ageGroup: string;
  capacity: number;
  isActive: boolean;
  schoolYearId: string;
  homeroomTeacherId?: string | null;
  assistantTeacherIds?: string[];
}

export interface SchoolYearData {
  id: string;
  name: string;
  startDate: string | Date;
  endDate: string | Date;
  isCurrent: boolean;
  isArchived: boolean;
  classes: ClassData[];
}

const AGE_GROUP_LABELS: Record<string, { label: string; group: 'NURSERY' | 'PRESCHOOL'; color: string }> = {
  NURSERY_12_18M: {
    label: 'Nhà trẻ 12 - 18 tháng',
    group: 'NURSERY',
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  NURSERY_18_24M: {
    label: 'Nhà trẻ 18 - 24 tháng',
    group: 'NURSERY',
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  NURSERY_24_36M: {
    label: 'Nhà trẻ 24 - 36 tháng',
    group: 'NURSERY',
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  PRESCHOOL_3_4Y: {
    label: 'Mẫu giáo bé (3 - 4 tuổi / Lớp Mầm)',
    group: 'PRESCHOOL',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  },
  PRESCHOOL_4_5Y: {
    label: 'Mẫu giáo nhỡ (4 - 5 tuổi / Lớp Chồi)',
    group: 'PRESCHOOL',
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
  },
  PRESCHOOL_5_6Y: {
    label: 'Mẫu giáo lớn (5 - 6 tuổi / Lớp Lá)',
    group: 'PRESCHOOL',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  },
};

export function YearsClassesClient({
  schoolId,
  schoolSlug,
  schoolYears,
  staffMembers = [],
}: {
  schoolId: string;
  schoolSlug: string;
  schoolYears: SchoolYearData[];
  staffMembers?: Array<{
    id: string;
    fullName: string | null;
    employeeCode: string | null;
    roles: string[];
    employmentStatus: string;
  }>;
}) {
  const router = useRouter();

  // Active School Year Selection
  const initialYear = schoolYears.find((y) => y.isCurrent) || schoolYears[0];
  const [selectedYearId, setSelectedYearId] = useState<string>(initialYear?.id ?? '');

  const selectedYear = schoolYears.find((y) => y.id === selectedYearId) || initialYear;
  const classesInSelectedYear = selectedYear?.classes || [];

  // Modals & Status
  const [isCreatingYearModal, setIsCreatingYearModal] = useState(false);
  const [isCreatingClassModal, setIsCreatingClassModal] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassData | null>(null);
  const [deletingClassId, setDeletingClassId] = useState<string | null>(null);
  const [assigningClassStaff, setAssigningClassStaff] = useState<ClassData | null>(null);
  const [assignHomeroomId, setAssignHomeroomId] = useState<string>('');
  const [assignAssistantIds, setAssignAssistantIds] = useState<string[]>([]);
  const [assignStaffError, setAssignStaffError] = useState<string | null>(null);
  const [isSubmittingStaffAssignment, setIsSubmittingStaffAssignment] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Form: Create Year
  type CreateYearFormData = import('zod').infer<typeof createSchoolYearSchema>;
  type CreateClassInput = import('zod').input<typeof createClassSchema>;
  type CreateClassOutput = import('zod').output<typeof createClassSchema>;

  const {
    register: regYear,
    handleSubmit: handleYearSubmit,
    reset: resetYearForm,
    formState: { errors: yearErrors, isSubmitting: isSubmittingYear },
  } = useForm<CreateYearFormData>({
    resolver: zodResolver(createSchoolYearSchema),
    defaultValues: {
      name: '',
      startDate: new Date('2026-09-01'),
      endDate: new Date('2027-05-31'),
    },
  });

  const onCreateYear = async (data: CreateYearFormData) => {
    setErrorMessage(null);
    try {
      const res = await createSchoolYearAction(schoolId, {
        name: data.name,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      });
      if (res.success && res.data) {
        showToast(`Đã tạo năm học "${res.data.name}" thành công!`);
        setIsCreatingYearModal(false);
        resetYearForm();
        setSelectedYearId(res.data.id);
        router.refresh();
      } else {
        setErrorMessage(res.error ?? 'Lỗi khi tạo năm học');
      }
    } catch (e: unknown) {
      setErrorMessage(e instanceof Error ? e.message : 'Lỗi hệ thống');
    }
  };

  // Switch Current Year
  const onSetCurrentYear = async (yearId: string) => {
    setActionLoading(true);
    setErrorMessage(null);
    try {
      const res = await setCurrentSchoolYearAction(schoolId, yearId);
      if (res.success) {
        showToast('Đã chuyển đổi năm học hiện tại của trường thành công!');
        router.refresh();
      } else {
        setErrorMessage(res.error ?? 'Lỗi khi đổi năm học');
      }
    } catch (e: unknown) {
      setErrorMessage(e instanceof Error ? e.message : 'Lỗi hệ thống');
    } finally {
      setActionLoading(false);
    }
  };

  // Form: Create Class
  const {
    register: regClass,
    handleSubmit: handleClassSubmit,
    reset: resetClassForm,
    formState: { errors: classErrors, isSubmitting: isSubmittingClass },
  } = useForm<CreateClassInput, unknown, CreateClassOutput>({
    resolver: zodResolver(createClassSchema),
    defaultValues: {
      schoolYearId: selectedYearId,
      name: '',
      ageGroup: 'PRESCHOOL_3_4Y',
      capacity: 30,
      isActive: true,
    },
  });

  const onCreateClass = async (data: CreateClassOutput) => {
    setErrorMessage(null);
    try {
      const res = await createClassAction(schoolId, {
        ...data,
        schoolYearId: selectedYearId,
      });
      if (res.success && res.data) {
        showToast(`Đã tạo lớp học "${res.data.name}" thành công!`);
        setIsCreatingClassModal(false);
        resetClassForm({
          schoolYearId: selectedYearId,
          name: '',
          ageGroup: 'PRESCHOOL_3_4Y',
          capacity: 30,
          isActive: true,
        });
        router.refresh();
      } else {
        setErrorMessage(res.error ?? 'Lỗi khi tạo lớp học');
      }
    } catch (e: unknown) {
      setErrorMessage(e instanceof Error ? e.message : 'Lỗi hệ thống');
    }
  };

  // Delete Class
  const onDeleteClass = async (classId: string) => {
    setActionLoading(true);
    setErrorMessage(null);
    try {
      const res = await deleteClassAction(schoolId, classId);
      if (res.success) {
        showToast('Đã xóa lớp học thành công!');
        setDeletingClassId(null);
        router.refresh();
      } else {
        setErrorMessage(res.error ?? 'Lỗi xóa lớp học');
      }
    } catch (e: unknown) {
      setErrorMessage(e instanceof Error ? e.message : 'Lỗi hệ thống');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          id="toast-notification"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-xl border border-emerald-500 animate-in fade-in slide-in-from-bottom-5 duration-300"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span className="font-semibold text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-3 text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span className="font-medium">{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="ml-auto text-xs underline font-semibold"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Header Workspace */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
            <Layers className="h-3.5 w-3.5" />
            <span>Phân hệ Vận hành 03</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Quản trị Năm học & Lớp học
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Thiết lập niên khóa và tổ chức danh sách lớp theo chuẩn nhóm tuổi mầm non Việt Nam.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="btn-open-create-year"
            onClick={() => setIsCreatingYearModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card text-foreground hover:bg-muted/80 text-xs font-semibold transition-all shadow-xs"
          >
            <CalendarDays className="h-4 w-4 text-primary" />
            <span>+ Tạo năm học mới</span>
          </button>

          <button
            id="btn-open-create-class"
            disabled={!selectedYear}
            onClick={() => {
              resetClassForm({
                schoolYearId: selectedYear?.id ?? '',
                name: '',
                ageGroup: 'PRESCHOOL_3_4Y',
                capacity: 30,
                isActive: true,
              });
              setIsCreatingClassModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            <span>+ Thêm lớp học mới</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Section A (Years) & Section B (Classes) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* SECTION A: Danh sách Năm học (4 cols on lg) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              <span>Niên khóa ({schoolYears.length})</span>
            </h2>
            <span className="text-xs text-muted-foreground">Chọn để xem lớp</span>
          </div>

          {schoolYears.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-border text-center bg-card space-y-3">
              <CalendarDays className="h-8 w-8 text-muted-foreground/50 mx-auto" />
              <p className="text-xs text-muted-foreground">
                Chưa có năm học nào được tạo. Hãy tạo năm học đầu tiên để kích hoạt lớp học.
              </p>
              <button
                onClick={() => setIsCreatingYearModal(true)}
                className="text-xs font-semibold text-primary underline"
              >
                + Tạo năm học ngay
              </button>
            </div>
          ) : (
            <div className="space-y-3" id="school-years-list">
              {schoolYears.map((year) => {
                const isSelected = year.id === selectedYearId;
                const startDateStr = new Date(year.startDate).toLocaleDateString('vi-VN');
                const endDateStr = new Date(year.endDate).toLocaleDateString('vi-VN');

                return (
                  <div
                    key={year.id}
                    onClick={() => setSelectedYearId(year.id)}
                    className={`cursor-pointer rounded-2xl p-4 transition-all border ${
                      isSelected
                        ? 'bg-primary/5 border-primary/50 shadow-xs ring-1 ring-primary/20'
                        : 'bg-card border-border hover:border-primary/30 hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground">
                            {year.name}
                          </span>
                          {year.isCurrent && (
                            <span
                              id={`badge-current-year-${year.id}`}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                            >
                              <Star className="h-2.5 w-2.5 fill-current" />
                              Hiện tại
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
                          <span>{startDateStr} — {endDateStr}</span>
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="inline-block px-2 py-1 rounded-lg bg-muted text-[11px] font-semibold text-muted-foreground">
                          {year.classes.length} lớp
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-muted-foreground">
                        {isSelected ? 'Đang chọn xem' : 'Bấm để xem lớp'}
                      </span>

                      {!year.isCurrent && (
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSetCurrentYear(year.id);
                          }}
                          className="text-[11px] font-semibold text-primary hover:underline hover:text-primary/90"
                        >
                          Đặt làm hiện tại
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION B: Danh sách Lớp học trong năm học đã chọn (8 cols on lg) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-card p-4 rounded-2xl border border-border">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                <span>
                  Lớp học trong niên khóa {selectedYear ? selectedYear.name : '—'}
                </span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tổng cộng: <strong className="text-foreground">{classesInSelectedYear.length}</strong> lớp
                {classesInSelectedYear.length > 0 && (
                  <span>
                    {' '}• Sĩ số thiết kế:{' '}
                    <strong className="text-foreground">
                      {classesInSelectedYear.reduce((acc, c) => acc + c.capacity, 0)}
                    </strong>{' '}
                    trẻ
                  </span>
                )}
              </p>
            </div>

            {selectedYear && (
              <button
                onClick={() => {
                  resetClassForm({
                    schoolYearId: selectedYear.id,
                    name: '',
                    ageGroup: 'PRESCHOOL_3_4Y',
                    capacity: 30,
                    isActive: true,
                  });
                  setIsCreatingClassModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold transition-all self-start sm:self-auto"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Thêm lớp</span>
              </button>
            )}
          </div>

          {classesInSelectedYear.length === 0 ? (
            <div className="p-12 rounded-2xl border border-dashed border-border text-center bg-card space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-sm text-foreground">
                Chưa có lớp học nào trong niên khóa này
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Hãy tạo các lớp học tương ứng với từng nhóm tuổi (Nhà trẻ hoặc Mẫu giáo) để chuẩn bị cho công tác tuyển sinh và xếp lớp.
              </p>
              {selectedYear && (
                <button
                  id="btn-create-first-class"
                  onClick={() => setIsCreatingClassModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs"
                >
                  <Plus className="h-4 w-4" />
                  <span>+ Tạo lớp học đầu tiên</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="classes-grid">
              {classesInSelectedYear.map((cls) => {
                const ageInfo = AGE_GROUP_LABELS[cls.ageGroup] || {
                  label: cls.ageGroup,
                  color: 'bg-muted text-muted-foreground border-border',
                };

                return (
                  <div
                    key={cls.id}
                    className="p-4 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all flex flex-col justify-between space-y-3 shadow-2xs"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-sm text-foreground">
                            {cls.name}
                          </h4>
                          <span
                            className={`inline-block mt-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${ageInfo.color}`}
                          >
                            {ageInfo.label}
                          </span>
                        </div>

                        <span
                          className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                            cls.isActive
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {cls.isActive ? 'Hoạt động' : 'Tạm dừng'}
                        </span>
                      </div>
                    </div>

                    {/* Phân công giáo viên */}
                    <div className="space-y-1.5 text-xs bg-muted/20 p-2.5 rounded-xl border border-border/60">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-[11px]">Chủ nhiệm:</span>
                        {(() => {
                          const teacher = staffMembers.find((s) => s.id === cls.homeroomTeacherId);
                          return teacher ? (
                            <span className="font-semibold text-primary">
                              {teacher.fullName || teacher.employeeCode}
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic text-[11px]">Chưa phân công</span>
                          );
                        })()}
                      </div>
                      {cls.assistantTeacherIds && cls.assistantTeacherIds.length > 0 && (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-muted-foreground">Phụ trách ({cls.assistantTeacherIds.length}):</span>
                          <span className="font-medium text-foreground truncate max-w-[140px]">
                            {cls.assistantTeacherIds
                              .map((id) => {
                                const s = staffMembers.find((m) => m.id === id);
                                return s?.fullName || s?.employeeCode || id;
                              })
                              .join(', ')}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-primary" />
                        <span>Sĩ số tối đa: <strong className="text-foreground font-semibold">{cls.capacity}</strong></span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          id={`btn-assign-staff-${cls.id}`}
                          onClick={() => {
                            setAssigningClassStaff(cls);
                            setAssignHomeroomId(cls.homeroomTeacherId || '');
                            setAssignAssistantIds(cls.assistantTeacherIds || []);
                            setAssignStaffError(null);
                          }}
                          className="px-2 py-1 text-[11px] font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors flex items-center gap-1"
                          title="Phân công giáo viên"
                        >
                          <UserCheck className="h-3 w-3" />
                          <span>Phân công GV</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeletingClassId(cls.id)}
                          className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          title="Xóa lớp học"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Tạo Năm Học Mới */}
      {isCreatingYearModal && (
        <div
          id="modal-create-year"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in"
        >
          <div className="relative w-full max-w-md rounded-2xl bg-card border border-border shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <CalendarDays className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">Tạo Niên Khóa Mới</h3>
                  <p className="text-xs text-muted-foreground">Thiết lập năm học đào tạo</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreatingYearModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleYearSubmit(onCreateYear)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Tên năm học <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  id="input-year-name"
                  {...regYear('name')}
                  placeholder="Ví dụ: 2026 - 2027"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                />
                {yearErrors.name && (
                  <p className="text-[11px] text-destructive mt-1">{yearErrors.name.message as string}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Ngày bắt đầu <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="date"
                    id="input-year-start-date"
                    {...regYear('startDate')}
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background text-xs font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                  {yearErrors.startDate && (
                    <p className="text-[11px] text-destructive mt-1">{yearErrors.startDate.message as string}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Ngày kết thúc <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="date"
                    id="input-year-end-date"
                    {...regYear('endDate')}
                    className="w-full px-3 py-2 rounded-xl border border-input bg-background text-xs font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                  {yearErrors.endDate && (
                    <p className="text-[11px] text-destructive mt-1">{yearErrors.endDate.message as string}</p>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreatingYearModal(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  id="btn-submit-create-year"
                  disabled={isSubmittingYear}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50"
                >
                  {isSubmittingYear ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  <span>Tạo năm học</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Tạo Lớp Học Mới */}
      {isCreatingClassModal && (
        <div
          id="modal-create-class"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in"
        >
          <div className="relative w-full max-w-md rounded-2xl bg-card border border-border shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <GraduationCap className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">Thêm Lớp Học Mới</h3>
                  <p className="text-xs text-muted-foreground">
                    Niên khóa: {selectedYear ? selectedYear.name : '—'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreatingClassModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleClassSubmit(onCreateClass)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Tên lớp học <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  id="input-class-name"
                  {...regClass('name')}
                  placeholder="Ví dụ: Lớp Mầm 1, Hoa Sen..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                />
                {classErrors.name && (
                  <p className="text-[11px] text-destructive mt-1">{classErrors.name.message as string}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Nhóm độ tuổi mầm non <span className="text-destructive">*</span>
                </label>
                <select
                  id="select-age-group"
                  {...regClass('ageGroup')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-xs font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <optgroup label="Khối Nhà Trẻ (12 - 36 tháng)">
                    <option value="NURSERY_12_18M">Nhà trẻ 12 - 18 tháng</option>
                    <option value="NURSERY_18_24M">Nhà trẻ 18 - 24 tháng</option>
                    <option value="NURSERY_24_36M">Nhà trẻ 24 - 36 tháng</option>
                  </optgroup>
                  <optgroup label="Khối Mẫu Giáo (3 - 6 tuổi)">
                    <option value="PRESCHOOL_3_4Y">Mẫu giáo bé (3 - 4 tuổi / Lớp Mầm)</option>
                    <option value="PRESCHOOL_4_5Y">Mẫu giáo nhỡ (4 - 5 tuổi / Lớp Chồi)</option>
                    <option value="PRESCHOOL_5_6Y">Mẫu giáo lớn (5 - 6 tuổi / Lớp Lá)</option>
                  </optgroup>
                </select>
                {classErrors.ageGroup && (
                  <p className="text-[11px] text-destructive mt-1">{classErrors.ageGroup.message as string}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Sĩ số tối đa (trẻ) <span className="text-destructive">*</span>
                </label>
                <input
                  type="number"
                  id="input-class-capacity"
                  {...regClass('capacity', { valueAsNumber: true })}
                  min={1}
                  max={100}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                />
                {classErrors.capacity && (
                  <p className="text-[11px] text-destructive mt-1">{classErrors.capacity.message as string}</p>
                )}
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreatingClassModal(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  id="btn-submit-create-class"
                  disabled={isSubmittingClass}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50"
                >
                  {isSubmittingClass ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  <span>Lưu lớp học</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deletingClassId && (
        <div
          id="modal-confirm-delete-class"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in"
        >
          <div className="relative w-full max-w-sm rounded-2xl bg-card border border-destructive/30 shadow-2xl p-6 space-y-4">
            <div className="h-10 w-10 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-base text-foreground">Xóa lớp học này?</h3>
              <p className="text-xs text-muted-foreground">
                Lớp học sẽ được chuyển vào trạng thái xóa mềm. Dữ liệu học sinh liên kết vẫn được lưu vết trên hệ thống kiểm toán.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingClassId(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                id="btn-confirm-delete-class"
                disabled={actionLoading}
                onClick={() => onDeleteClass(deletingClassId)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-xs font-semibold hover:bg-destructive/90"
              >
                {actionLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Xác nhận xóa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Phân công Giáo viên Lớp học */}
      {assigningClassStaff && (
        <div
          id="modal-assign-class-staff"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in"
        >
          <div className="relative w-full max-w-md rounded-2xl bg-card border border-border shadow-2xl p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <UserCheck className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">Phân công Giáo viên</h3>
                  <p className="text-xs text-muted-foreground">Lớp: {assigningClassStaff.name}</p>
                </div>
              </div>
              <button
                onClick={() => setAssigningClassStaff(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {assignStaffError && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{assignStaffError}</span>
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setAssignStaffError(null);
                setIsSubmittingStaffAssignment(true);
                try {
                  const res = await assignClassStaffAction(schoolId, {
                    classId: assigningClassStaff.id,
                    homeroomTeacherId: assignHomeroomId || null,
                    assistantTeacherIds: assignAssistantIds,
                  });
                  if (res.success) {
                    showToast(`Đã phân công giáo viên cho lớp ${assigningClassStaff.name}!`);
                    setAssigningClassStaff(null);
                    router.refresh();
                  } else {
                    setAssignStaffError(res.error ?? 'Lỗi khi phân công giáo viên');
                  }
                } catch (err: unknown) {
                  setAssignStaffError(err instanceof Error ? err.message : 'Lỗi hệ thống');
                } finally {
                  setIsSubmittingStaffAssignment(false);
                }
              }}
              className="space-y-4 text-xs"
            >
              <div className="space-y-1.5">
                <label htmlFor="select-homeroom-teacher" className="font-semibold text-foreground block">
                  Giáo viên Chủ nhiệm (Tối đa 1 GV / 1 lớp / 1 năm học)
                </label>
                <select
                  id="select-homeroom-teacher"
                  value={assignHomeroomId}
                  onChange={(e) => setAssignHomeroomId(e.target.value)}
                  className="w-full h-10 rounded-xl border border-input bg-background px-3 text-xs font-medium text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
                >
                  <option value="">-- Chưa phân công giáo viên chủ nhiệm --</option>
                  {staffMembers
                    .filter((s) => s.employmentStatus === 'ACTIVE')
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName || s.employeeCode} {s.employeeCode ? `(${s.employeeCode})` : ''} - {s.roles.join(', ')}
                      </option>
                    ))}
                </select>
              </div>

              {/* Danh sách giáo viên phụ trách */}
              <div className="space-y-2 pt-1">
                <label className="font-semibold text-foreground block">
                  Giáo viên Phụ trách (Có thể chọn nhiều)
                </label>
                <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 rounded-xl border bg-muted/20">
                  {staffMembers
                    .filter((s) => s.employmentStatus === 'ACTIVE' && s.id !== assignHomeroomId)
                    .map((s) => {
                      const isChecked = assignAssistantIds.includes(s.id);
                      return (
                        <label
                          key={s.id}
                          className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/50 cursor-pointer select-none text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setAssignAssistantIds(assignAssistantIds.filter((id) => id !== s.id));
                              } else {
                                setAssignAssistantIds([...assignAssistantIds, s.id]);
                              }
                            }}
                            className="h-3.5 w-3.5 rounded border-input text-primary focus:ring-primary"
                          />
                          <span className="font-medium text-foreground">
                            {s.fullName || s.employeeCode}
                          </span>
                          <span className="text-[10px] text-muted-foreground ml-auto">
                            {s.roles.join(', ')}
                          </span>
                        </label>
                      );
                    })}
                  {staffMembers.filter((s) => s.employmentStatus === 'ACTIVE').length === 0 && (
                    <p className="text-muted-foreground text-center py-2 italic text-xs">
                      Chưa có nhân sự nào đang hoạt động.
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAssigningClassStaff(null)}
                  disabled={isSubmittingStaffAssignment}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  id="btn-confirm-assign-staff"
                  disabled={isSubmittingStaffAssignment}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50"
                >
                  {isSubmittingStaffAssignment && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Lưu phân công</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
