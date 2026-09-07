'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  Send,
  FileText,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Ban,
  Search,
  Filter,
  Users,
  Settings,
  ArrowUpDown,
  Calendar,
  Layers,
  Percent,
  Trash2,
  Edit2,
  Loader2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  InvoiceDetailModal,
  SerializedInvoice,
} from './invoice-detail-modal';

export type { SerializedInvoice };
import {
  createFeeItemAction,
  deleteFeeItemAction,
  createStudentReductionAction,
  deleteStudentReductionAction,
  generateInvoiceAction,
  bulkGenerateInvoicesAction,
} from './actions';

export interface SerializedFeeItem {
  id: string;
  name: string;
  amount: number;
  billingCycle: 'MONTHLY' | 'TERMLY' | 'YEARLY' | 'ONE_TIME';
  isMandatory: boolean;
  createdAt: string;
}

export interface SerializedReduction {
  id: string;
  studentSchoolRelationshipId: string;
  studentName: string;
  studentCode: string;
  className: string;
  reductionType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  appliedToFeeItemId: string | null;
  note: string | null;
  createdAt: string;
}

export interface SerializedStudentEnrollment {
  id: string; // studentSchoolRelationshipId
  studentName: string;
  studentCode: string;
  className: string;
  classId: string;
}

interface TuitionClientProps {
  schoolSlug: string;
  schoolId: string;
  schoolName: string;
  schoolYearId: string;
  schoolYears: Array<{ id: string; name: string }>;
  classes: Array<{ id: string; name: string }>;
  initialFeeItems: SerializedFeeItem[];
  initialInvoices: SerializedInvoice[];
  initialReductions: SerializedReduction[];
  students: SerializedStudentEnrollment[];
}

export function TuitionClient({
  schoolSlug,
  schoolId,
  schoolName,
  schoolYearId,
  schoolYears,
  classes,
  initialFeeItems,
  initialInvoices,
  initialReductions,
  students,
}: TuitionClientProps) {
  const [activeTab, setActiveTab] = useState<'invoices' | 'fees' | 'reductions'>('invoices');
  const [invoices, setInvoices] = useState<SerializedInvoice[]>(initialInvoices);
  const [feeItems, setFeeItems] = useState<SerializedFeeItem[]>(initialFeeItems);
  const [reductions, setReductions] = useState<SerializedReduction[]>(initialReductions);

  // Filters
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedInvoice, setSelectedInvoice] = useState<SerializedInvoice | null>(null);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [showReductionModal, setShowReductionModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fee Form State
  const [feeName, setFeeName] = useState('');
  const [feeAmount, setFeeAmount] = useState(1000000);
  const [feeCycle, setFeeCycle] = useState<'MONTHLY' | 'TERMLY' | 'YEARLY' | 'ONE_TIME'>('MONTHLY');
  const [feeMandatory, setFeeMandatory] = useState(true);

  // Reduction Form State
  const [reductionStudentId, setReductionStudentId] = useState(students[0]?.id || '');
  const [reductionType, setReductionType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT'>('PERCENTAGE');
  const [reductionValue, setReductionValue] = useState(20);
  const [reductionNote, setReductionNote] = useState('');

  // Generate Invoice Form State
  const [generateTarget, setGenerateTarget] = useState<'SINGLE' | 'CLASS'>('SINGLE');
  const [generateStudentId, setGenerateStudentId] = useState(students[0]?.id || '');
  const [generateClassId, setGenerateClassId] = useState(classes[0]?.id || '');
  const [generateMonth, setGenerateMonth] = useState(currentMonth);
  const [generateYear, setGenerateYear] = useState(currentYear);

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(num);
  };

  // Filtered invoices
  const filteredInvoices = invoices.filter((inv) => {
    if (selectedMonth !== 0 && inv.periodMonth !== selectedMonth) return false;
    if (selectedYear !== 0 && inv.periodYear !== selectedYear) return false;
    if (selectedStatus !== 'ALL' && inv.status !== selectedStatus) return false;
    if (selectedClass !== 'ALL' && inv.className !== selectedClass) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = inv.studentName.toLowerCase().includes(q);
      const matchCode = inv.studentCode.toLowerCase().includes(q);
      const matchNumber = (inv.invoiceNumber || '').toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchNumber) return false;
    }
    return true;
  });

  // Calculate high-level financial metrics
  const totalBilled = invoices
    .filter((i) => i.status !== 'CANCELLED')
    .reduce((sum, i) => sum + i.totalAmount, 0);
  const totalPaid = invoices
    .filter((i) => i.status !== 'CANCELLED')
    .reduce((sum, i) => sum + i.paidAmount, 0);
  const totalDue = invoices
    .filter((i) => i.status !== 'CANCELLED')
    .reduce((sum, i) => sum + i.dueAmount, 0);
  const draftCount = invoices.filter((i) => i.status === 'DRAFT').length;

  // Handlers
  const handleSaveFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feeName.trim()) {
      toast.error('Vui lòng nhập tên khoản thu');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await createFeeItemAction(schoolSlug, schoolId, {
        name: feeName.trim(),
        amount: Number(feeAmount),
        billingCycle: feeCycle,
        isMandatory: feeMandatory,
      });
      if (res.success && res.feeItem) {
        setFeeItems([
          {
            id: res.feeItem.id,
            name: res.feeItem.name,
            amount: Number(res.feeItem.amount),
            billingCycle: res.feeItem.billingCycle,
            isMandatory: res.feeItem.isMandatory,
            createdAt: res.feeItem.createdAt.toISOString(),
          },
          ...feeItems,
        ]);
        toast.success('Đã tạo mới khoản thu thành công!');
        setShowFeeModal(false);
        setFeeName('');
        setFeeAmount(1000000);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi tạo khoản thu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFee = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa khoản thu này?')) return;
    try {
      await deleteFeeItemAction(schoolSlug, schoolId, id);
      setFeeItems(feeItems.filter((f) => f.id !== id));
      toast.success('Đã xóa khoản thu!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi xóa khoản thu');
    }
  };

  const handleSaveReduction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reductionStudentId) {
      toast.error('Vui lòng chọn học sinh');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await createStudentReductionAction(schoolSlug, {
        studentSchoolRelationshipId: reductionStudentId,
        reductionType,
        value: Number(reductionValue),
        note: reductionNote || undefined,
      });
      if (res.success && res.reduction) {
        const studentInfo = students.find((s) => s.id === reductionStudentId);
        setReductions([
          {
            id: res.reduction.id,
            studentSchoolRelationshipId: reductionStudentId,
            studentName: studentInfo?.studentName || '',
            studentCode: studentInfo?.studentCode || '',
            className: studentInfo?.className || '',
            reductionType: res.reduction.reductionType,
            value: Number(res.reduction.value),
            appliedToFeeItemId: res.reduction.appliedToFeeItemId,
            note: res.reduction.note,
            createdAt: res.reduction.createdAt.toISOString(),
          },
          ...reductions,
        ]);
        toast.success('Đã cấu hình chính sách miễn giảm!');
        setShowReductionModal(false);
        setReductionNote('');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi tạo miễn giảm');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReduction = async (id: string) => {
    if (!confirm('Xóa chính sách miễn giảm này?')) return;
    try {
      await deleteStudentReductionAction(schoolSlug, id);
      setReductions(reductions.filter((r) => r.id !== id));
      toast.success('Đã xóa chính sách miễn giảm');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi xóa miễn giảm');
    }
  };

  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (generateTarget === 'SINGLE') {
        const res = await generateInvoiceAction(schoolSlug, schoolId, {
          studentSchoolRelationshipId: generateStudentId,
          schoolYearId,
          periodMonth: Number(generateMonth),
          periodYear: Number(generateYear),
        });
        if (res.success && res.invoice) {
          const studentInfo = students.find((s) => s.id === generateStudentId);
          const newInv: SerializedInvoice = {
            id: res.invoice.id,
            schoolId: res.invoice.schoolId,
            studentSchoolRelationshipId: res.invoice.studentSchoolRelationshipId,
            schoolYearId: res.invoice.schoolYearId,
            periodMonth: res.invoice.periodMonth,
            periodYear: res.invoice.periodYear,
            status: res.invoice.status,
            grossAmount: Number(res.invoice.grossAmount),
            discountAmount: Number(res.invoice.discountAmount),
            overtimeAmount: Number(res.invoice.overtimeAmount),
            refundAmount: Number(res.invoice.refundAmount),
            carriedFromPrevious: Number(res.invoice.carriedFromPrevious),
            totalAmount: Number(res.invoice.totalAmount),
            paidAmount: Number(res.invoice.paidAmount),
            dueAmount: Number(res.invoice.dueAmount),
            invoiceNumber: res.invoice.invoiceNumber,
            issuedAt: res.invoice.issuedAt ? res.invoice.issuedAt.toISOString() : null,
            cancelledAt: null,
            cancelReason: null,
            createdAt: res.invoice.createdAt.toISOString(),
            studentName: studentInfo?.studentName || '',
            studentCode: studentInfo?.studentCode || '',
            className: studentInfo?.className || '',
            items: res.invoice.items.map((it) => ({
              id: it.id,
              name: it.name,
              amount: Number(it.amount),
            })),
          };
          setInvoices([newInv, ...invoices]);
          toast.success('Đã lập hóa đơn học phí dự thảo thành công!');
          setShowGenerateModal(false);
        }
      } else {
        const res = await bulkGenerateInvoicesAction(schoolSlug, {
          schoolId,
          schoolYearId,
          classId: generateClassId || undefined,
          periodMonth: Number(generateMonth),
          periodYear: Number(generateYear),
        });
        toast.success(
          `Đã tạo hàng loạt ${res.createdCount} hóa đơn (Bỏ qua ${res.skippedCount} học sinh đã có hóa đơn)`
        );
        setShowGenerateModal(false);
        // Tải lại trang
        window.location.reload();
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi tạo hóa đơn');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Quản lý Học phí & Hóa đơn
              </h1>
              <p className="text-xs text-muted-foreground">
                Thiết lập biểu phí, chính sách miễn giảm và phát hành hóa đơn tài chính định kỳ
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            id="btn-create-fee"
            variant="outline"
            size="sm"
            onClick={() => {
              setShowFeeModal(true);
            }}
            className="text-xs gap-1.5 font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            Thêm khoản thu
          </Button>

          <Button
            id="btn-create-reduction"
            variant="outline"
            size="sm"
            onClick={() => {
              setShowReductionModal(true);
            }}
            className="text-xs gap-1.5 font-medium"
          >
            <Percent className="w-3.5 h-3.5" />
            Cấp miễn giảm
          </Button>

          <Button
            id="btn-create-invoice"
            size="sm"
            onClick={() => {
              setShowGenerateModal(true);
            }}
            className="text-xs gap-1.5 font-semibold shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Xuất hóa đơn tháng
          </Button>
        </div>
      </div>

      {/* Financial Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-1">
          <span className="text-[11px] font-medium text-muted-foreground flex items-center justify-between">
            <span>Tổng tiền lập hóa đơn</span>
            <FileText className="w-3.5 h-3.5 text-muted-foreground" />
          </span>
          <div className="text-lg font-bold font-mono tabular-nums text-foreground">
            {formatVND(totalBilled)}
          </div>
          <span className="text-[10px] text-muted-foreground">
            Tổng cộng các hóa đơn active
          </span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-1">
          <span className="text-[11px] font-medium text-emerald-600 flex items-center justify-between">
            <span>Đã thực thu</span>
            <CheckCircle2 className="w-3.5 h-3.5" />
          </span>
          <div className="text-lg font-bold font-mono tabular-nums text-emerald-600">
            {formatVND(totalPaid)}
          </div>
          <span className="text-[10px] text-muted-foreground">
            {totalBilled > 0
              ? `Đạt ${Math.round((totalPaid / totalBilled) * 100)}% kế hoạch thu`
              : 'Chưa có hóa đơn'}
          </span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-1">
          <span className="text-[11px] font-medium text-destructive flex items-center justify-between">
            <span>Công nợ còn lại</span>
            <AlertCircle className="w-3.5 h-3.5" />
          </span>
          <div className="text-lg font-bold font-mono tabular-nums text-destructive">
            {formatVND(totalDue)}
          </div>
          <span className="text-[10px] text-muted-foreground">
            Số tiền phụ huynh chưa thanh toán
          </span>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-1">
          <span className="text-[11px] font-medium text-amber-600 flex items-center justify-between">
            <span>Bản nháp chờ phát hành</span>
            <Clock className="w-3.5 h-3.5" />
          </span>
          <div className="text-lg font-bold font-mono tabular-nums text-amber-600">
            {draftCount} <span className="text-xs font-normal text-muted-foreground">hóa đơn</span>
          </div>
          <span className="text-[10px] text-muted-foreground">
            Cần rà soát và bấm phát hành
          </span>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-border text-xs font-semibold">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`pb-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'invoices'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Hóa đơn & Kỳ thu ({invoices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('fees')}
          className={`pb-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'fees'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Biểu phí Cơ sở ({feeItems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reductions')}
          className={`pb-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'reductions'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Percent className="w-4 h-4" />
          <span>Chính sách Miễn giảm ({reductions.length})</span>
        </button>
      </div>

      {/* TAB 1: INVOICES */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="p-3.5 rounded-xl border border-border bg-card flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search */}
              <div className="relative w-48 sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="searchInvoice"
                  placeholder="Tìm học sinh, mã HĐ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>

              {/* Month Selector */}
              <select
                id="selectMonth"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="h-8 px-2.5 rounded-lg border border-input bg-background text-xs"
              >
                <option value={0}>Tất cả tháng</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    Tháng {m}
                  </option>
                ))}
              </select>

              {/* Year Selector */}
              <select
                id="selectYear"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="h-8 px-2.5 rounded-lg border border-input bg-background text-xs"
              >
                <option value={2026}>Năm 2026</option>
                <option value={2025}>Năm 2025</option>
              </select>

              {/* Class Filter */}
              <select
                id="selectClass"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="h-8 px-2.5 rounded-lg border border-input bg-background text-xs"
              >
                <option value="ALL">Tất cả lớp học</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                id="selectStatus"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="h-8 px-2.5 rounded-lg border border-input bg-background text-xs"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="DRAFT">Bản nháp (DRAFT)</option>
                <option value="ISSUED">Đã phát hành (ISSUED)</option>
                <option value="PAID">Đã thanh toán (PAID)</option>
                <option value="PARTIALLY_PAID">Thanh toán 1 phần</option>
                <option value="CANCELLED">Đã hủy (CANCELLED)</option>
              </select>
            </div>

            <div className="text-xs text-muted-foreground font-medium">
              Hiển thị <strong>{filteredInvoices.length}</strong> / {invoices.length} hóa đơn
            </div>
          </div>

          {/* Invoices Table */}
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-3 px-4 text-left font-semibold">Mã HĐ / Kỳ</th>
                  <th className="py-3 px-4 text-left font-semibold">Học sinh</th>
                  <th className="py-3 px-4 text-left font-semibold">Lớp</th>
                  <th className="py-3 px-4 text-right font-semibold">Phí gốc</th>
                  <th className="py-3 px-4 text-right font-semibold">Giảm trừ</th>
                  <th className="py-3 px-4 text-right font-semibold">Tổng phải thu</th>
                  <th className="py-3 px-4 text-right font-semibold">Đã nộp</th>
                  <th className="py-3 px-4 text-center font-semibold">Trạng thái</th>
                  <th className="py-3 px-4 text-right font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    id={`invoice-row-${inv.id}`}
                    onClick={() => setSelectedInvoice(inv)}
                    className="hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono">
                      <div className="font-semibold text-foreground">
                        {inv.invoiceNumber || 'Bản nháp'}
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        Tháng {inv.periodMonth}/{inv.periodYear}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-foreground">{inv.studentName}</div>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {inv.studentCode}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-muted-foreground">{inv.className}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-muted-foreground">
                      {formatVND(inv.grossAmount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-600">
                      {inv.discountAmount > 0 ? `-${formatVND(inv.discountAmount)}` : '0 đ'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-foreground">
                      {formatVND(inv.totalAmount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-emerald-600">
                      {formatVND(inv.paidAmount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {inv.status === 'DRAFT' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          Nháp
                        </span>
                      )}
                      {inv.status === 'ISSUED' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          Đã phát hành
                        </span>
                      )}
                      {inv.status === 'PAID' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Đã nộp đủ
                        </span>
                      )}
                      {inv.status === 'PARTIALLY_PAID' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          Nộp 1 phần
                        </span>
                      )}
                      {inv.status === 'CANCELLED' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 line-through">
                          Đã hủy
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        id={`btn-view-invoice-${inv.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedInvoice(inv);
                        }}
                        className="h-7 px-2.5 text-xs font-semibold text-primary hover:bg-primary/10"
                      >
                        Chi tiết
                      </Button>
                    </td>
                  </tr>
                ))}

                {filteredInvoices.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-muted-foreground text-xs">
                      Không tìm thấy hóa đơn học phí nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: FEE ITEMS */}
      {activeTab === 'fees' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Các khoản thu được nhà trường cấu hình cho niên khóa hiện tại.
            </p>
            <Button
              size="sm"
              onClick={() => setShowFeeModal(true)}
              className="text-xs gap-1.5 font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              Thêm khoản thu mới
            </Button>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-3 px-4 text-left font-semibold">Tên khoản thu</th>
                  <th className="py-3 px-4 text-right font-semibold">Đơn giá quy định</th>
                  <th className="py-3 px-4 text-center font-semibold">Chu kỳ thu</th>
                  <th className="py-3 px-4 text-center font-semibold">Loại khoản thu</th>
                  <th className="py-3 px-4 text-right font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {feeItems.map((fee) => (
                  <tr key={fee.id} className="hover:bg-muted/20">
                    <td className="py-3 px-4 font-semibold text-foreground">{fee.name}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-foreground">
                      {formatVND(fee.amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-muted text-foreground">
                        {fee.billingCycle === 'MONTHLY' && 'Hàng tháng'}
                        {fee.billingCycle === 'TERMLY' && 'Theo học kỳ'}
                        {fee.billingCycle === 'YEARLY' && 'Đầu năm học'}
                        {fee.billingCycle === 'ONE_TIME' && 'Thu một lần'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {fee.isMandatory ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Bắt buộc
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          Tùy chọn
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteFee(fee.id)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}

                {feeItems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground text-xs">
                      Chưa có khoản thu nào được thiết lập. Hãy bấm &quot;Thêm khoản thu mới&quot;.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: REDUCTIONS */}
      {activeTab === 'reductions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Danh sách học sinh được hưởng chính sách miễn giảm học phí theo diện chính sách hoặc quan hệ.
            </p>
            <Button
              size="sm"
              onClick={() => setShowReductionModal(true)}
              className="text-xs gap-1.5 font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              Cấp miễn giảm cho học sinh
            </Button>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-3 px-4 text-left font-semibold">Học sinh</th>
                  <th className="py-3 px-4 text-left font-semibold">Lớp</th>
                  <th className="py-3 px-4 text-left font-semibold">Mức giảm trừ</th>
                  <th className="py-3 px-4 text-left font-semibold">Lý do / Diện chính sách</th>
                  <th className="py-3 px-4 text-right font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reductions.map((red) => (
                  <tr key={red.id} className="hover:bg-muted/20">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-foreground">{red.studentName}</div>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {red.studentCode}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-muted-foreground">{red.className}</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-600">
                      {red.reductionType === 'PERCENTAGE'
                        ? `Giảm ${red.value}% tổng hóa đơn`
                        : `Giảm ${formatVND(red.value)}`}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {red.note || 'Chính sách trường'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteReduction(red.id)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}

                {reductions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground text-xs">
                      Chưa có chính sách miễn giảm nào được cấu hình.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: TẠO KHOẢN THU (FEE ITEM) */}
      {showFeeModal && (
        <div
          id="fee-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
        >
          <div className="w-full max-w-md bg-card rounded-2xl border border-border shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" />
                <span>Thêm Khoản Thu Mới</span>
              </h3>
              <button
                onClick={() => setShowFeeModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFee} className="space-y-3.5 text-xs">
              <div>
                <label htmlFor="feeNameInput" className="font-semibold block mb-1">
                  Tên khoản thu:
                </label>
                <Input
                  id="feeNameInput"
                  placeholder="VD: Học phí chính, Tiền ăn bán trú..."
                  value={feeName}
                  onChange={(e) => setFeeName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="feeAmountInput" className="font-semibold block mb-1">
                  Số tiền quy định (VNĐ):
                </label>
                <Input
                  id="feeAmountInput"
                  type="number"
                  min="0"
                  step="1000"
                  value={feeAmount}
                  onChange={(e) => setFeeAmount(Number(e.target.value))}
                  className="font-mono text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="feeCycleSelect" className="font-semibold block mb-1">
                    Chu kỳ thu:
                  </label>
                  <select
                    id="feeCycleSelect"
                    value={feeCycle}
                    onChange={(e) =>
                      setFeeCycle(e.target.value as 'MONTHLY' | 'TERMLY' | 'YEARLY' | 'ONE_TIME')
                    }
                    className="w-full h-9 px-3 rounded-lg border border-input bg-background"
                  >
                    <option value="MONTHLY">Hàng tháng</option>
                    <option value="TERMLY">Theo học kỳ</option>
                    <option value="YEARLY">Đầu năm học</option>
                    <option value="ONE_TIME">Thu một lần</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="feeMandatoryCheckbox"
                    checked={feeMandatory}
                    onChange={(e) => setFeeMandatory(e.target.checked)}
                    className="h-4 w-4 rounded border-input text-primary"
                  />
                  <label htmlFor="feeMandatoryCheckbox" className="font-medium cursor-pointer">
                    Khoản thu bắt buộc
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFeeModal(false)}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  id="btn-save-fee"
                  size="sm"
                  disabled={isSubmitting}
                  className="gap-1.5"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Lưu khoản thu
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CẤP MIỄN GIẢM CHO HỌC SINH */}
      {showReductionModal && (
        <div
          id="reduction-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
        >
          <div className="w-full max-w-md bg-card rounded-2xl border border-border shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Percent className="w-4 h-4 text-emerald-600" />
                <span>Cấp Chính Sách Miễn Giảm</span>
              </h3>
              <button
                onClick={() => setShowReductionModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReduction} className="space-y-3.5 text-xs">
              <div>
                <label htmlFor="reductionStudentSelect" className="font-semibold block mb-1">
                  Chọn học sinh:
                </label>
                <select
                  id="reductionStudentSelect"
                  value={reductionStudentId}
                  onChange={(e) => setReductionStudentId(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background"
                  required
                >
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.studentName} ({st.className} - {st.studentCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="reductionTypeSelect" className="font-semibold block mb-1">
                    Hình thức giảm:
                  </label>
                  <select
                    id="reductionTypeSelect"
                    value={reductionType}
                    onChange={(e) =>
                      setReductionType(e.target.value as 'PERCENTAGE' | 'FIXED_AMOUNT')
                    }
                    className="w-full h-9 px-3 rounded-lg border border-input bg-background"
                  >
                    <option value="PERCENTAGE">Giảm theo % (Tỷ lệ)</option>
                    <option value="FIXED_AMOUNT">Giảm số tiền cố định</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="reductionValueInput" className="font-semibold block mb-1">
                    {reductionType === 'PERCENTAGE' ? 'Tỷ lệ giảm (%)' : 'Số tiền giảm (VNĐ)'}
                  </label>
                  <Input
                    id="reductionValueInput"
                    type="number"
                    min="1"
                    max={reductionType === 'PERCENTAGE' ? 100 : 100000000}
                    value={reductionValue}
                    onChange={(e) => setReductionValue(Number(e.target.value))}
                    className="font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reductionNoteInput" className="font-semibold block mb-1">
                  Lý do / Diện chính sách:
                </label>
                <Input
                  id="reductionNoteInput"
                  placeholder="VD: Con giáo viên trường, Con thương binh..."
                  value={reductionNote}
                  onChange={(e) => setReductionNote(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReductionModal(false)}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  id="btn-save-reduction"
                  size="sm"
                  disabled={isSubmitting}
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Lưu chính sách
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: XUẤT HÓA ĐƠN THÁNG (GENERATE INVOICES) */}
      {showGenerateModal && (
        <div
          id="generate-invoice-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
        >
          <div className="w-full max-w-md bg-card rounded-2xl border border-border shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span>Xuất Hóa Đơn Học Phí Tháng Mới</span>
              </h3>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateInvoice} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Tháng tính học phí:</label>
                  <select
                    id="genMonthSelect"
                    value={generateMonth}
                    onChange={(e) => setGenerateMonth(Number(e.target.value))}
                    className="w-full h-9 px-3 rounded-lg border border-input bg-background"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m}>
                        Tháng {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1">Năm:</label>
                  <select
                    id="genYearSelect"
                    value={generateYear}
                    onChange={(e) => setGenerateYear(Number(e.target.value))}
                    className="w-full h-9 px-3 rounded-lg border border-input bg-background"
                  >
                    <option value={2026}>2026</option>
                    <option value={2025}>2025</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Phạm vi lập hóa đơn:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGenerateTarget('SINGLE')}
                    className={`py-2 px-3 rounded-lg border font-medium text-xs transition-colors ${
                      generateTarget === 'SINGLE'
                        ? 'border-primary bg-primary/10 text-primary font-semibold'
                        : 'border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    Từng học sinh
                  </button>
                  <button
                    type="button"
                    onClick={() => setGenerateTarget('CLASS')}
                    className={`py-2 px-3 rounded-lg border font-medium text-xs transition-colors ${
                      generateTarget === 'CLASS'
                        ? 'border-primary bg-primary/10 text-primary font-semibold'
                        : 'border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    Theo lớp học
                  </button>
                </div>
              </div>

              {generateTarget === 'SINGLE' ? (
                <div>
                  <label className="font-semibold block mb-1">Chọn học sinh:</label>
                  <select
                    id="genStudentSelect"
                    value={generateStudentId}
                    onChange={(e) => setGenerateStudentId(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-input bg-background"
                  >
                    {students.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.studentName} ({st.className} - {st.studentCode})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="font-semibold block mb-1">Chọn lớp học:</label>
                  <select
                    id="genClassSelect"
                    value={generateClassId}
                    onChange={(e) => setGenerateClassId(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-input bg-background"
                  >
                    <option value="">Tất cả các lớp trong trường</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        Lớp {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <p className="text-[11px] text-muted-foreground leading-relaxed">
                * Hệ thống sẽ tự động tổng hợp phí tăng ca tháng trước và hoàn tiền ăn các ngày vắng có phép từ dữ liệu Điểm danh.
              </p>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowGenerateModal(false)}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  id="btn-submit-generate"
                  size="sm"
                  disabled={isSubmitting}
                  className="gap-1.5 shadow-xs"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Tiến hành lập hóa đơn
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: INVOICE DETAIL & PAYMENT & CANCELLATION */}
      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          schoolSlug={schoolSlug}
          schoolName={schoolName}
          onClose={() => setSelectedInvoice(null)}
          onSuccess={(updated) => {
            if (updated) {
              setInvoices((prev) =>
                prev.map((inv) => (inv.id === updated.id ? { ...inv, ...updated } : inv))
              );
            }
          }}
        />
      )}
    </div>
  );
}
