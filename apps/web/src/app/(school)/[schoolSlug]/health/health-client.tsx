'use client';

import React, { useState, useMemo } from 'react';
import {
  HeartPulse,
  Plus,
  Search,
  Filter,
  TrendingUp,
  Activity,
  Calendar,
  User,
  Scale,
  Ruler,
  AlertTriangle,
  CheckCircle2,
  FileText,
  LineChart,
  X,
  Loader2,
  RefreshCw,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  calculateBmi,
  getWhoBmiCategory,
} from '@km/validators';
import {
  recordHealthMeasurementAction,
  getStudentHealthHistoryAction,
} from './actions';

export interface SerializedHealthRecord {
  id: string;
  studentSchoolRelationshipId: string;
  studentName: string;
  studentCode: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth: string;
  className: string;
  classId: string | null;
  heightCm: number;
  weightKg: number;
  bmi: number;
  bmiCategory: 'UNDERWEIGHT' | 'NORMAL' | 'OVERWEIGHT' | 'OBESE';
  whoReference: string;
  measuredAt: string;
  notes: string | null;
  recordedBy: string;
}

export interface StudentOption {
  relationshipId: string;
  studentName: string;
  studentCode: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth: string;
  className: string;
  classId: string;
}

interface HealthClientProps {
  schoolSlug: string;
  schoolId: string;
  schoolName: string;
  classes: Array<{ id: string; name: string }>;
  students: StudentOption[];
  initialRecords: SerializedHealthRecord[];
}

export function HealthClient({
  schoolSlug,
  schoolId,
  schoolName,
  classes,
  students,
  initialRecords,
}: HealthClientProps) {
  const [records, setRecords] = useState<SerializedHealthRecord[]>(initialRecords);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Modal states
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showChartModal, setShowChartModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Selected student for history / growth chart
  const [selectedStudentHistory, setSelectedStudentHistory] = useState<{
    student: StudentOption;
    history: Array<{
      id: string;
      className: string;
      heightCm: number;
      weightKg: number;
      bmi: number;
      bmiCategory: 'UNDERWEIGHT' | 'NORMAL' | 'OVERWEIGHT' | 'OBESE';
      whoReference: string;
      measuredAt: string;
      notes: string | null;
    }>;
  } | null>(null);

  // Form states for new measurement
  const [formStudentId, setFormStudentId] = useState('');
  const [formMeasuredAt, setFormMeasuredAt] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [formHeightCm, setFormHeightCm] = useState('');
  const [formWeightKg, setFormWeightKg] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Selected student for live preview in modal
  const activeFormStudent = useMemo(() => {
    return students.find((s) => s.relationshipId === formStudentId) || null;
  }, [students, formStudentId]);

  // Live BMI calculation
  const liveBmiData = useMemo(() => {
    const h = parseFloat(formHeightCm);
    const w = parseFloat(formWeightKg);
    const student = activeFormStudent;
    if (!h || !w || h <= 0 || w <= 0 || !student || !formMeasuredAt) {
      return null;
    }

    const bmi = calculateBmi(h, w);
    const mDate = new Date(formMeasuredAt);
    const bDate = new Date(student.dateOfBirth);
    const ageMonths = Math.max(
      0,
      (mDate.getFullYear() - bDate.getFullYear()) * 12 +
        (mDate.getMonth() - bDate.getMonth())
    );

    const who = getWhoBmiCategory(bmi, ageMonths, student.gender);
    return {
      bmi,
      ageMonths,
      category: who.category,
      reference: who.reference,
    };
  }, [formHeightCm, formWeightKg, formMeasuredAt, activeFormStudent]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      if (selectedClassId !== 'ALL' && rec.classId !== selectedClassId) {
        return false;
      }
      if (selectedCategory !== 'ALL' && rec.bmiCategory !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = rec.studentName.toLowerCase().includes(q);
        const matchCode = rec.studentCode.toLowerCase().includes(q);
        if (!matchName && !matchCode) return false;
      }
      return true;
    });
  }, [records, selectedClassId, selectedCategory, searchQuery]);

  // Metrics summary
  const metrics = useMemo(() => {
    const total = records.length;
    let normal = 0;
    let underweight = 0;
    let overweight = 0;
    let obese = 0;

    for (const r of records) {
      if (r.bmiCategory === 'NORMAL') normal++;
      else if (r.bmiCategory === 'UNDERWEIGHT') underweight++;
      else if (r.bmiCategory === 'OVERWEIGHT') overweight++;
      else if (r.bmiCategory === 'OBESE') obese++;
    }

    return { total, normal, underweight, overweightObese: overweight + obese };
  }, [records]);

  // Category badge helper
  const renderCategoryBadge = (cat: 'UNDERWEIGHT' | 'NORMAL' | 'OVERWEIGHT' | 'OBESE') => {
    switch (cat) {
      case 'NORMAL':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 font-medium">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Đạt chuẩn WHO
          </Badge>
        );
      case 'UNDERWEIGHT':
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 font-medium">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Suy dinh dưỡng
          </Badge>
        );
      case 'OVERWEIGHT':
        return (
          <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 font-medium">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Thừa cân
          </Badge>
        );
      case 'OBESE':
        return (
          <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 font-medium">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Béo phì
          </Badge>
        );
    }
  };

  // Handle open history/growth chart
  const handleOpenStudentHistory = async (studentId: string) => {
    const student = students.find((s) => s.relationshipId === studentId);
    if (!student) return;

    setLoadingHistory(true);
    setShowChartModal(true);
    try {
      const res = await getStudentHealthHistoryAction({
        schoolId,
        studentSchoolRelationshipId: studentId,
      });
      if (res.success) {
        setSelectedStudentHistory({
          student,
          history: res.history,
        });
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể tải lịch sử sức khỏe');
    } finally {
      setLoadingHistory(false);
    }
  };

  // Handle submit new record
  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStudentId) {
      toast.error('Vui lòng chọn học sinh');
      return;
    }
    if (!formMeasuredAt) {
      toast.error('Vui lòng chọn ngày đo');
      return;
    }
    const h = parseFloat(formHeightCm);
    const w = parseFloat(formWeightKg);
    if (isNaN(h) || h <= 0 || h > 250) {
      toast.error('Chiều cao không hợp lệ (1 - 250 cm)');
      return;
    }
    if (isNaN(w) || w <= 0 || w > 150) {
      toast.error('Cân nặng không hợp lệ (1 - 150 kg)');
      return;
    }

    setIsSubmitting(true);
    try {
      const student = students.find((s) => s.relationshipId === formStudentId);
      const res = await recordHealthMeasurementAction({
        schoolSlug,
        schoolId,
        studentSchoolRelationshipId: formStudentId,
        classId: student?.classId,
        heightCm: h,
        weightKg: w,
        measuredAt: new Date(formMeasuredAt),
        notes: formNotes.trim() || undefined,
      });

      if (res.success && res.record && student) {
        toast.success(`Đã ghi nhận chỉ số sức khỏe cho ${student.studentName}`);

        // Prepend new record to local list
        const newRecord: SerializedHealthRecord = {
          id: res.record.id,
          studentSchoolRelationshipId: student.relationshipId,
          studentName: student.studentName,
          studentCode: student.studentCode,
          gender: student.gender,
          dateOfBirth: student.dateOfBirth,
          className: student.className,
          classId: student.classId,
          heightCm: res.record.heightCm,
          weightKg: res.record.weightKg,
          bmi: res.record.bmi,
          bmiCategory: res.record.bmiCategory as 'UNDERWEIGHT' | 'NORMAL' | 'OVERWEIGHT' | 'OBESE',
          whoReference: res.record.whoReference,
          measuredAt: res.record.measuredAt,
          notes: res.record.notes ?? null,
          recordedBy: 'School Admin',
        };

        setRecords((prev) => [newRecord, ...prev]);
        setShowRecordModal(false);
        // Reset form
        setFormHeightCm('');
        setFormWeightKg('');
        setFormNotes('');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Có lỗi khi lưu chỉ số');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Sức khỏe & Chỉ số phát triển
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Theo dõi định kỳ chiều cao, cân nặng, BMI và chuẩn hóa dinh dưỡng theo tiêu chuẩn WHO.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => setShowRecordModal(true)}
            className="shadow-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Ghi nhận chỉ số</span>
          </Button>
        </div>
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Tổng lượt đo
            </span>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">{metrics.total}</span>
            <span className="text-xs text-muted-foreground">lần ghi nhận</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Đạt chuẩn WHO
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {metrics.normal}
            </span>
            <span className="text-xs text-muted-foreground">
              {metrics.total > 0
                ? `${Math.round((metrics.normal / metrics.total) * 100)}% tổng số`
                : '0%'}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Suy dinh dưỡng
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {metrics.underweight}
            </span>
            <span className="text-xs text-muted-foreground">
              {metrics.total > 0
                ? `${Math.round((metrics.underweight / metrics.total) * 100)}% tổng số`
                : '0%'}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Thừa cân / Béo phì
            </span>
            <TrendingUp className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {metrics.overweightObese}
            </span>
            <span className="text-xs text-muted-foreground">
              {metrics.total > 0
                ? `${Math.round((metrics.overweightObese / metrics.total) * 100)}% tổng số`
                : '0%'}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl border border-border bg-card shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-1 w-full md:w-auto items-center gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên hoặc mã học sinh..."
              className="pl-9 h-9 text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              aria-label="Lọc theo lớp học"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="ALL">Tất cả các lớp</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>

            <select
              aria-label="Lọc theo phân loại WHO"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="ALL">Tất cả phân loại WHO</option>
              <option value="NORMAL">Đạt chuẩn WHO</option>
              <option value="UNDERWEIGHT">Suy dinh dưỡng</option>
              <option value="OVERWEIGHT">Thừa cân</option>
              <option value="OBESE">Béo phì</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-muted-foreground self-end md:self-center">
          Hiển thị <strong>{filteredRecords.length}</strong> / {records.length} bản ghi
        </div>
      </div>

      {/* Health Records Table & Empty State */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-muted/60 mx-auto flex items-center justify-center text-muted-foreground mb-3">
              <HeartPulse className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              {searchQuery || selectedClassId !== 'ALL' || selectedCategory !== 'ALL'
                ? 'Không tìm thấy kết quả phù hợp'
                : 'Chưa có bản ghi sức khỏe nào'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
              {searchQuery || selectedClassId !== 'ALL' || selectedCategory !== 'ALL'
                ? 'Hãy thử thay đổi điều kiện tìm kiếm hoặc bộ lọc lớp, phân loại WHO.'
                : 'Bắt đầu ghi nhận chỉ số chiều cao, cân nặng định kỳ cho học sinh để theo dõi biểu đồ phát triển.'}
            </p>
            {!(searchQuery || selectedClassId !== 'ALL' || selectedCategory !== 'ALL') && (
              <Button
                onClick={() => setShowRecordModal(true)}
                variant="outline"
                className="mt-4 gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                Ghi nhận chỉ số đầu tiên
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="py-3 px-4">Học sinh</th>
                  <th className="py-3 px-4">Lớp</th>
                  <th className="py-3 px-4">Ngày đo</th>
                  <th className="py-3 px-4">Chiều cao</th>
                  <th className="py-3 px-4">Cân nặng</th>
                  <th className="py-3 px-4">Chỉ số BMI</th>
                  <th className="py-3 px-4">Phân loại WHO</th>
                  <th className="py-3 px-4">Ghi chú</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-muted/30 transition-colors group"
                  >
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-semibold text-foreground">
                          {record.studentName}
                        </span>
                        <div className="text-xs text-muted-foreground">
                          {record.studentCode} • {record.gender === 'MALE' ? 'Nam' : 'Nữ'}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-foreground font-medium">
                      {record.className}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {new Date(record.measuredAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-foreground">
                      {record.heightCm.toFixed(1)} cm
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-foreground">
                      {record.weightKg.toFixed(1)} kg
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-foreground">
                        {record.bmi.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {renderCategoryBadge(record.bmiCategory)}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground max-w-[200px] truncate">
                      {record.notes || '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          handleOpenStudentHistory(record.studentSchoolRelationshipId)
                        }
                        className="h-8 gap-1.5 text-xs text-primary hover:text-primary hover:bg-primary/10"
                      >
                        <LineChart className="w-3.5 h-3.5" />
                        Tăng trưởng
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Ghi nhận chỉ số sức khỏe mới */}
      {showRecordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  Ghi nhận chỉ số sức khỏe
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Nhập chiều cao, cân nặng để hệ thống tự động đánh giá thể trạng WHO.
                </p>
              </div>
              <button
                onClick={() => setShowRecordModal(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordSubmit} className="space-y-4">
              {/* Chọn học sinh */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Chọn học sinh <span className="text-rose-500">*</span>
                </label>
                <select
                  aria-label="Chọn học sinh cần đo chỉ số"
                  value={formStudentId}
                  onChange={(e) => setFormStudentId(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">-- Chọn học sinh cần đo --</option>
                  {students.map((s) => (
                    <option key={s.relationshipId} value={s.relationshipId}>
                      {s.studentName} ({s.studentCode}) - Lớp {s.className}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ngày đo */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Ngày đo <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="date"
                  value={formMeasuredAt}
                  onChange={(e) => setFormMeasuredAt(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  required
                  className="h-9 text-sm"
                />
              </div>

              {/* Chiều cao & Cân nặng */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Ruler className="w-3.5 h-3.5 text-primary" />
                    Chiều cao (cm) <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    min="20"
                    max="250"
                    placeholder="VD: 98.5"
                    value={formHeightCm}
                    onChange={(e) => setFormHeightCm(e.target.value)}
                    required
                    className="h-9 text-sm font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-primary" />
                    Cân nặng (kg) <span className="text-rose-500">*</span>
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    min="1"
                    max="150"
                    placeholder="VD: 14.2"
                    value={formWeightKg}
                    onChange={(e) => setFormWeightKg(e.target.value)}
                    required
                    className="h-9 text-sm font-mono"
                  />
                </div>
              </div>

              {/* Live BMI & WHO Classification Preview Card */}
              {liveBmiData && (
                <div className="p-3.5 rounded-lg border border-primary/20 bg-primary/5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-primary">
                      Kết quả tính toán tức thì:
                    </span>
                    <span className="font-mono font-bold text-foreground text-sm">
                      BMI: {liveBmiData.bmi}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-muted-foreground">
                      Chuẩn {liveBmiData.reference} ({liveBmiData.ageMonths} tháng tuổi):
                    </span>
                    {renderCategoryBadge(liveBmiData.category)}
                  </div>
                </div>
              )}

              {/* Ghi chú */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Ghi chú sức khỏe / thể trạng (tùy chọn)
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Ghi chú: bé ăn uống bình thường, đang mọc răng..."
                  className="w-full rounded-md border border-input bg-background p-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowRecordModal(false)}
                  disabled={isSubmitting}
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !formStudentId || !formHeightCm || !formWeightKg}
                  className="gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    'Lưu chỉ số'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Biểu đồ tăng trưởng & Lịch sử sức khỏe */}
      {showChartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-3xl rounded-xl border border-border bg-card p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    Biểu đồ tăng trưởng & Lịch sử
                  </h3>
                  {selectedStudentHistory && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {selectedStudentHistory.student.studentName} (
                      {selectedStudentHistory.student.studentCode}) • Lớp{' '}
                      {selectedStudentHistory.student.className}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setShowChartModal(false);
                  setSelectedStudentHistory(null);
                }}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingHistory ? (
              <div className="py-16 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                <p className="text-sm text-muted-foreground mt-3">
                  Đang tải lịch sử tăng trưởng...
                </p>
              </div>
            ) : selectedStudentHistory && selectedStudentHistory.history.length > 0 ? (
              <div className="space-y-6">
                {/* SVG Visual Growth Chart */}
                <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Tiến trình Chiều cao & Cân nặng qua các lần đo
                    </span>
                    <div className="flex items-center gap-4 text-xs font-medium">
                      <span className="flex items-center gap-1.5 text-blue-500">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        Chiều cao (cm)
                      </span>
                      <span className="flex items-center gap-1.5 text-emerald-500">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        Cân nặng (kg)
                      </span>
                    </div>
                  </div>

                  {/* SVG Chart Render */}
                  <div className="h-48 w-full">
                    {(() => {
                      const hList = selectedStudentHistory.history;
                      const firstItem = hList[0];
                      if (hList.length === 1 && firstItem) {
                        return (
                          <div className="h-full flex flex-col items-center justify-center text-xs text-muted-foreground">
                            <Info className="w-5 h-5 mb-1 text-primary/70" />
                            Đã ghi nhận 1 lần đo (Cao {firstItem.heightCm} cm, Nặng{' '}
                            {firstItem.weightKg} kg). Biểu đồ đường sẽ trực quan hóa rõ ràng khi có từ 2 lần đo trở lên.
                          </div>
                        );
                      }

                      const minH = Math.min(...hList.map((x) => x.heightCm)) * 0.95;
                      const maxH = Math.max(...hList.map((x) => x.heightCm)) * 1.05;
                      const minW = Math.min(...hList.map((x) => x.weightKg)) * 0.95;
                      const maxW = Math.max(...hList.map((x) => x.weightKg)) * 1.05;

                      const width = 600;
                      const height = 160;
                      const padX = 40;
                      const padY = 20;

                      const stepX = (width - 2 * padX) / (hList.length - 1);

                      const pointsHeight = hList.map((d, i) => {
                        const x = padX + i * stepX;
                        const y =
                          height -
                          padY -
                          ((d.heightCm - minH) / (maxH - minH || 1)) *
                            (height - 2 * padY);
                        return { x, y, val: d.heightCm, date: d.measuredAt };
                      });

                      const pointsWeight = hList.map((d, i) => {
                        const x = padX + i * stepX;
                        const y =
                          height -
                          padY -
                          ((d.weightKg - minW) / (maxW - minW || 1)) *
                            (height - 2 * padY);
                        return { x, y, val: d.weightKg, date: d.measuredAt };
                      });

                      const lineH = pointsHeight.map((p) => `${p.x},${p.y}`).join(' ');
                      const lineW = pointsWeight.map((p) => `${p.x},${p.y}`).join(' ');

                      return (
                        <svg
                          viewBox={`0 0 ${width} ${height}`}
                          className="w-full h-full overflow-visible"
                        >
                          {/* Grid Lines */}
                          <line
                            x1={padX}
                            y1={padY}
                            x2={width - padX}
                            y2={padY}
                            stroke="currentColor"
                            className="text-border"
                            strokeDasharray="3 3"
                          />
                          <line
                            x1={padX}
                            y1={height / 2}
                            x2={width - padX}
                            y2={height / 2}
                            stroke="currentColor"
                            className="text-border"
                            strokeDasharray="3 3"
                          />
                          <line
                            x1={padX}
                            y1={height - padY}
                            x2={width - padX}
                            y2={height - padY}
                            stroke="currentColor"
                            className="text-border"
                          />

                          {/* Height Polyline */}
                          <polyline
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="2.5"
                            points={lineH}
                          />
                          {pointsHeight.map((p, idx) => (
                            <g key={`h-${idx}`}>
                              <circle
                                cx={p.x}
                                cy={p.y}
                                r="4"
                                fill="#3b82f6"
                                stroke="#ffffff"
                                strokeWidth="2"
                              />
                              <text
                                x={p.x}
                                y={p.y - 8}
                                textAnchor="middle"
                                className="fill-blue-500 font-mono text-[10px] font-semibold"
                              >
                                {p.val}cm
                              </text>
                            </g>
                          ))}

                          {/* Weight Polyline */}
                          <polyline
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="2.5"
                            points={lineW}
                          />
                          {pointsWeight.map((p, idx) => (
                            <g key={`w-${idx}`}>
                              <circle
                                cx={p.x}
                                cy={p.y}
                                r="4"
                                fill="#10b981"
                                stroke="#ffffff"
                                strokeWidth="2"
                              />
                              <text
                                x={p.x}
                                y={p.y + 14}
                                textAnchor="middle"
                                className="fill-emerald-500 font-mono text-[10px] font-semibold"
                              >
                                {p.val}kg
                              </text>
                            </g>
                          ))}
                        </svg>
                      );
                    })()}
                  </div>
                </div>

                {/* Historical Table */}
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="bg-muted/40 p-3 border-b border-border">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Bảng lịch sử chi tiết (Bất biến)
                    </span>
                  </div>
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/20 text-muted-foreground font-semibold">
                        <th className="py-2.5 px-3">Ngày đo</th>
                        <th className="py-2.5 px-3">Chiều cao</th>
                        <th className="py-2.5 px-3">Cân nặng</th>
                        <th className="py-2.5 px-3">BMI</th>
                        <th className="py-2.5 px-3">Đánh giá WHO</th>
                        <th className="py-2.5 px-3">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {selectedStudentHistory.history.map((h) => (
                        <tr key={h.id} className="hover:bg-muted/30">
                          <td className="py-2 px-3 text-muted-foreground">
                            {new Date(h.measuredAt).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="py-2 px-3 font-mono font-medium text-foreground">
                            {h.heightCm} cm
                          </td>
                          <td className="py-2 px-3 font-mono font-medium text-foreground">
                            {h.weightKg} kg
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-foreground">
                            {h.bmi.toFixed(1)}
                          </td>
                          <td className="py-2 px-3">
                            {renderCategoryBadge(h.bmiCategory)}
                          </td>
                          <td className="py-2 px-3 text-muted-foreground">
                            {h.notes || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Học sinh này chưa có lịch sử đo nào.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
