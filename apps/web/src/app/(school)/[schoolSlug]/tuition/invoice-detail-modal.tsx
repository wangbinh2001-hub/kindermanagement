'use client';

import React, { useState } from 'react';
import {
  X,
  FileText,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Ban,
  Clock,
  Send,
  Calendar,
  User,
  School,
  DollarSign,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  issueInvoiceAction,
  recordInvoicePaymentAction,
  cancelInvoiceAction,
} from './actions';

export interface SerializedInvoice {
  id: string;
  schoolId: string;
  studentSchoolRelationshipId: string;
  schoolYearId: string;
  periodMonth: number;
  periodYear: number;
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'PARTIALLY_PAID' | 'CANCELLED';
  grossAmount: number;
  discountAmount: number;
  overtimeAmount: number;
  refundAmount: number;
  carriedFromPrevious: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  invoiceNumber: string | null;
  issuedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  studentName: string;
  studentCode: string;
  className: string;
  items: Array<{
    id: string;
    name: string;
    amount: number;
  }>;
}

interface InvoiceDetailModalProps {
  invoice: SerializedInvoice | null;
  schoolSlug: string;
  schoolName: string;
  onClose: () => void;
  onSuccess: (updated?: Partial<SerializedInvoice> & { id: string }) => void;
}

export function InvoiceDetailModal({
  invoice,
  schoolSlug,
  schoolName,
  onClose,
  onSuccess,
}: InvoiceDetailModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(invoice?.dueAmount || 0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'CREDIT_CARD' | 'E_WALLET'>('BANK_TRANSFER');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  if (!invoice) return null;

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(num);
  };

  const handleIssue = async () => {
    setIsProcessing(true);
    try {
      const res = await issueInvoiceAction(schoolSlug, invoice.schoolId, {
        invoiceId: invoice.id,
      });
      toast.success('Đã phát hành hóa đơn thành công!');
      onSuccess({
        id: invoice.id,
        status: 'ISSUED',
        invoiceNumber: res.invoice.invoiceNumber,
        issuedAt: res.invoice.issuedAt ? res.invoice.issuedAt.toISOString() : new Date().toISOString(),
      });
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi phát hành hóa đơn');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAmount <= 0) {
      toast.error('Số tiền thanh toán phải lớn hơn 0');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await recordInvoicePaymentAction(schoolSlug, invoice.schoolId, {
        invoiceId: invoice.id,
        amount: Number(paymentAmount),
        paymentMethod,
        notes: paymentNotes || undefined,
      });
      toast.success('Ghi nhận thanh toán thành công!');
      onSuccess({
        id: invoice.id,
        status: res.invoice.status as SerializedInvoice['status'],
        paidAmount: Number(res.invoice.paidAmount),
        dueAmount: Number(res.invoice.dueAmount),
      });
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi ghi nhận thanh toán');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelReason.trim()) {
      toast.error('Vui lòng nhập lý do hủy hóa đơn');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await cancelInvoiceAction(schoolSlug, invoice.schoolId, {
        invoiceId: invoice.id,
        cancelReason: cancelReason.trim(),
      });
      toast.success('Đã hủy hóa đơn thành công!');
      onSuccess({
        id: invoice.id,
        status: 'CANCELLED',
        cancelledAt: res.invoice.cancelledAt ? res.invoice.cancelledAt.toISOString() : new Date().toISOString(),
        cancelReason: cancelReason.trim(),
      });
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lỗi hủy hóa đơn');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: SerializedInvoice['status']) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            Bản nháp
          </span>
        );
      case 'ISSUED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Send className="w-3.5 h-3.5 text-blue-600" />
            Đã phát hành
          </span>
        );
      case 'PARTIALLY_PAID':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <CreditCard className="w-3.5 h-3.5 text-amber-600" />
            Thanh toán 1 phần
          </span>
        );
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Đã thanh toán đủ
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <Ban className="w-3.5 h-3.5 text-rose-600" />
            Đã hủy bỏ
          </span>
        );
    }
  };

  return (
    <div
      id="invoice-detail-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card rounded-2xl border border-border shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border/80 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-foreground">
                {invoice.invoiceNumber || 'HÓA ĐƠN HỌC PHÍ TẠM THỜI'}
              </h3>
              {getStatusBadge(invoice.status)}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <span>{schoolName}</span>
              <span>•</span>
              <span className="font-mono">
                Kỳ: Tháng {invoice.periodMonth}/{invoice.periodYear}
              </span>
            </p>
          </div>
          <button
            id="btn-close-invoice-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Student & Class Info */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-muted/40 border border-border/60 text-xs">
          <div>
            <span className="text-muted-foreground block mb-0.5">Học sinh:</span>
            <strong className="text-foreground text-sm font-semibold">{invoice.studentName}</strong>
          </div>
          <div>
            <span className="text-muted-foreground block mb-0.5">Mã học sinh:</span>
            <strong className="text-foreground font-mono">{invoice.studentCode}</strong>
          </div>
          <div>
            <span className="text-muted-foreground block mb-0.5">Lớp học:</span>
            <strong className="text-foreground">{invoice.className}</strong>
          </div>
        </div>

        {/* Cancelled Notice */}
        {invoice.status === 'CANCELLED' && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1">
            <div className="font-semibold flex items-center gap-1.5 text-rose-700">
              <Ban className="w-4 h-4" />
              <span>Hóa đơn đã bị hủy vào {invoice.cancelledAt ? new Date(invoice.cancelledAt).toLocaleDateString('vi-VN') : ''}</span>
            </div>
            <p className="italic">Lý do: &quot;{invoice.cancelReason}&quot;</p>
          </div>
        )}

        {/* Itemized Line items */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Bảng kê các khoản thu chi tiết
          </h4>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-2.5 px-3.5 text-left font-medium">STT</th>
                  <th className="py-2.5 px-3.5 text-left font-medium">Hạng mục thu</th>
                  <th className="py-2.5 px-3.5 text-right font-medium">Số tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoice.items.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-muted/20">
                    <td className="py-2 px-3.5 text-muted-foreground">{idx + 1}</td>
                    <td className="py-2 px-3.5 font-medium text-foreground">{item.name}</td>
                    <td
                      className={`py-2 px-3.5 text-right font-mono tabular-nums font-semibold ${
                        item.amount < 0 ? 'text-rose-600' : 'text-foreground'
                      }`}
                    >
                      {formatVND(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Calculation summary */}
        <div className="p-4 rounded-xl bg-muted/30 border border-border/80 space-y-2 text-xs">
          <div className="flex justify-between text-muted-foreground">
            <span>Tổng biểu phí gốc:</span>
            <span className="font-mono tabular-nums font-medium text-foreground">
              {formatVND(invoice.grossAmount)}
            </span>
          </div>

          {invoice.discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600 font-medium">
              <span>Miễn giảm học sinh:</span>
              <span className="font-mono tabular-nums">-{formatVND(invoice.discountAmount)}</span>
            </div>
          )}

          {invoice.overtimeAmount > 0 && (
            <div className="flex justify-between text-blue-600 font-medium">
              <span>Phí giữ ngoài giờ tháng trước:</span>
              <span className="font-mono tabular-nums">+{formatVND(invoice.overtimeAmount)}</span>
            </div>
          )}

          {invoice.refundAmount > 0 && (
            <div className="flex justify-between text-amber-600 font-medium">
              <span>Hoàn tiền ăn vắng có phép tháng trước:</span>
              <span className="font-mono tabular-nums">-{formatVND(invoice.refundAmount)}</span>
            </div>
          )}

          {invoice.carriedFromPrevious > 0 && (
            <div className="flex justify-between text-rose-600 font-medium">
              <span>Nợ cũ tháng trước dồn sang:</span>
              <span className="font-mono tabular-nums">+{formatVND(invoice.carriedFromPrevious)}</span>
            </div>
          )}

          <div className="pt-2 border-t border-border flex justify-between items-center text-sm font-bold text-foreground">
            <span>TỔNG PHẢI NỘP:</span>
            <span className="text-base text-primary font-mono tabular-nums">
              {formatVND(invoice.totalAmount)}
            </span>
          </div>

          <div className="flex justify-between text-xs pt-1">
            <span className="text-muted-foreground">Đã thanh toán:</span>
            <span className="font-mono tabular-nums font-semibold text-emerald-600">
              {formatVND(invoice.paidAmount)}
            </span>
          </div>

          <div className="flex justify-between text-xs font-bold pt-1 border-t border-dashed border-border">
            <span className="text-destructive">CÒN PHẢI NỘP:</span>
            <span className="font-mono tabular-nums text-sm text-destructive">
              {formatVND(invoice.dueAmount)}
            </span>
          </div>
        </div>

        {/* Payment Form (if open) */}
        {showPaymentForm && (
          <form
            onSubmit={handlePayment}
            className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase text-primary flex items-center gap-1.5">
                <CreditCard className="w-4 h-4" />
                <span>Ghi nhận phụ huynh thanh toán</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowPaymentForm(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Đóng form
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Số tiền nộp (VNĐ):
                </label>
                <Input
                  id="paymentAmountInput"
                  type="number"
                  min="1000"
                  max={invoice.dueAmount}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="font-mono text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Phương thức:
                </label>
                <select
                  id="paymentMethodSelect"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as 'CASH' | 'BANK_TRANSFER')}
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs"
                >
                  <option value="BANK_TRANSFER">Chuyển khoản Ngân hàng</option>
                  <option value="CASH">Tiền mặt tại văn phòng</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Ghi chú giao dịch (Tùy chọn):
              </label>
              <Input
                id="paymentNotesInput"
                placeholder="VD: Mẹ đóng tiền mặt tại lớp..."
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="submit"
                id="btn-confirm-payment"
                disabled={isProcessing}
                size="sm"
                className="gap-1.5"
              >
                {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Xác nhận thu tiền
              </Button>
            </div>
          </form>
        )}

        {/* Cancel Form (if open) */}
        {showCancelForm && (
          <form
            onSubmit={handleCancel}
            className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase text-rose-700 flex items-center gap-1.5">
                <Ban className="w-4 h-4" />
                <span>Hủy hóa đơn học phí</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowCancelForm(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Đóng
              </button>
            </div>

            <p className="text-xs text-rose-600">
              * Hóa đơn tài chính không thể chỉnh sửa trực tiếp. Để điều chỉnh sai sót, vui lòng hủy hóa đơn hiện tại và lập lại hóa đơn mới.
            </p>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Lý do hủy bắt buộc:
              </label>
              <Input
                id="cancelReasonInput"
                placeholder="VD: Cập nhật lại số buổi nghỉ có phép..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="text-xs"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="submit"
                id="btn-confirm-cancel"
                variant="destructive"
                disabled={isProcessing}
                size="sm"
                className="gap-1.5"
              >
                {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Xác nhận Hủy hóa đơn
              </Button>
            </div>
          </form>
        )}

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <Button variant="outline" size="sm" onClick={onClose}>
            Đóng
          </Button>

          <div className="flex items-center gap-2">
            {invoice.status === 'DRAFT' && (
              <>
                <Button
                  id="btn-cancel-invoice"
                  variant="ghost"
                  size="sm"
                  className="text-rose-600 hover:bg-rose-50"
                  onClick={() => {
                    setShowCancelForm(true);
                    setShowPaymentForm(false);
                  }}
                >
                  <Ban className="w-4 h-4 mr-1.5" />
                  Hủy bản nháp
                </Button>
                <Button
                  id="btn-issue-invoice"
                  size="sm"
                  disabled={isProcessing}
                  onClick={handleIssue}
                  className="gap-1.5 shadow-xs"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Phát hành chính thức
                </Button>
              </>
            )}

            {(invoice.status === 'ISSUED' || invoice.status === 'PARTIALLY_PAID') && (
              <>
                <Button
                  id="btn-cancel-invoice"
                  variant="ghost"
                  size="sm"
                  className="text-rose-600 hover:bg-rose-50"
                  onClick={() => {
                    setShowCancelForm(true);
                    setShowPaymentForm(false);
                  }}
                >
                  <Ban className="w-4 h-4 mr-1.5" />
                  Hủy hóa đơn
                </Button>
                <Button
                  id="btn-open-payment"
                  size="sm"
                  onClick={() => {
                    setShowPaymentForm(true);
                    setShowCancelForm(false);
                  }}
                  className="gap-1.5 shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <DollarSign className="w-4 h-4" />
                  Thu tiền học phí
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
