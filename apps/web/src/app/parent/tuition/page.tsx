'use client';

import { useState } from 'react';
import { 
  CreditCard, 
  QrCode, 
  CheckCircle2, 
  Clock, 
  Copy, 
  Check, 
  ShieldCheck, 
  ArrowRight,
  Sparkles,
  Receipt,
  X,
  type LucideIcon
} from 'lucide-react';

const STATUS_LABELS: Record<string, { label: string; badge: string; icon: LucideIcon }> = {
  ISSUED: { 
    label: 'Chờ thanh toán', 
    badge: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-200', 
    icon: Clock 
  },
  PARTIALLY_PAID: { 
    label: 'Thanh toán 1 phần', 
    badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200', 
    icon: Clock 
  },
  PAID: { 
    label: 'Đã hoàn tất', 
    badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200', 
    icon: CheckCircle2 
  },
};

const mockInvoices = [
  {
    id: 'inv-1',
    invoiceNumber: 'HD-2026-09-001',
    period: 'Tháng 09/2026',
    status: 'ISSUED',
    totalAmount: 3500000,
    paidAmount: 0,
    balance: 3500000,
    issuedAt: '2026-09-01',
    dueDate: '2026-09-15',
    items: [
      { id: 'i1', name: 'Học phí chương trình mầm non', quantity: 1, unitPrice: 2500000 },
      { id: 'i2', name: 'Tiền ăn bán trú (bữa sáng + trưa + xế)', quantity: 22, unitPrice: 1000000 },
    ],
  },
  {
    id: 'inv-2',
    invoiceNumber: 'HD-2026-08-001',
    period: 'Tháng 08/2026',
    status: 'PAID',
    totalAmount: 3500000,
    paidAmount: 3500000,
    balance: 0,
    issuedAt: '2026-08-01',
    dueDate: '2026-08-15',
    items: [
      { id: 'i3', name: 'Học phí chương trình mầm non', quantity: 1, unitPrice: 2500000 },
      { id: 'i4', name: 'Tiền ăn bán trú', quantity: 22, unitPrice: 1000000 },
    ],
  },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

export default function ParentTuitionPage() {
  const [selectedPaymentInv, setSelectedPaymentInv] = useState<typeof mockInvoices[0] | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground">Học phí & Hóa đơn</h1>
            <p className="text-xs text-muted-foreground">Biểu phí minh bạch & Cổng thanh toán chuyển khoản</p>
          </div>
        </div>
      </div>

      {/* Summary Highlight */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Kỳ thanh toán gần nhất: Tháng 09/2026</span>
          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            Hạn đóng: 15/09/2026
          </span>
        </div>

        <div className="flex items-baseline justify-between pt-1">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Số tiền cần đóng:</p>
            <p className="text-2xl font-extrabold text-foreground tracking-tight">
              {formatCurrency(3500000)}
            </p>
          </div>
          <button
            onClick={() => setSelectedPaymentInv(mockInvoices[0] ?? null)}
            className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md hover:bg-primary/90 transition-all active:scale-[0.98] cursor-pointer"
          >
            <QrCode className="h-4 w-4" />
            <span>Mở mã VietQR</span>
          </button>
        </div>
      </div>

      {/* Invoices Feed */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
          Danh sách hóa đơn ({mockInvoices.length})
        </h3>

        <div className="space-y-3">
          {mockInvoices.map((inv) => {
            const status = (STATUS_LABELS[inv.status as keyof typeof STATUS_LABELS] ?? STATUS_LABELS.ISSUED)!;
            const isUnpaid = inv.balance > 0;

            return (
              <div key={inv.id} className="rounded-2xl border border-border/80 bg-card p-4 space-y-3 shadow-xs card-hover">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-foreground">{inv.invoiceNumber}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                        {inv.period}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Ngày phát hành: {new Date(inv.issuedAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>

                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${status.badge}`}>
                    <status.icon className="h-3 w-3" />
                    {status.label}
                  </span>
                </div>

                {/* Items */}
                <div className="border-t border-border/60 pt-2.5 space-y-1.5">
                  {inv.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground truncate max-w-[200px]">{item.name}</span>
                      <span className="font-semibold text-foreground">{formatCurrency(item.unitPrice)}</span>
                    </div>
                  ))}
                </div>

                {/* Total & Action */}
                <div className="border-t border-border/60 pt-2.5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground">Tổng tiền:</p>
                    <p className="text-sm font-extrabold text-foreground">{formatCurrency(inv.totalAmount)}</p>
                  </div>

                  {isUnpaid ? (
                    <button
                      onClick={() => setSelectedPaymentInv(inv)}
                      className="inline-flex items-center gap-1 py-1.5 px-3 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground font-bold text-xs transition-colors cursor-pointer"
                    >
                      <QrCode className="h-3.5 w-3.5" />
                      <span>Thanh toán ngay</span>
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Đã quyết toán</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* VietQR Payment Modal */}
      {selectedPaymentInv && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-card border border-border p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-sm text-foreground">Chuyển khoản VietQR</h3>
              </div>
              <button 
                onClick={() => setSelectedPaymentInv(null)}
                className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* QR Mockup */}
            <div className="rounded-2xl border-2 border-primary/20 bg-muted/20 p-4 text-center space-y-2">
              <div className="w-44 h-44 mx-auto rounded-xl bg-background border border-border/80 flex flex-col items-center justify-center p-2 shadow-inner">
                {/* SVG QR Code Simulation */}
                <div className="w-full h-full flex flex-col items-center justify-center space-y-1">
                  <QrCode className="h-28 w-28 text-primary opacity-90" />
                  <span className="text-[10px] font-mono font-bold text-muted-foreground">VietQR - NAPAS 247</span>
                </div>
              </div>

              <p className="text-xs font-extrabold text-foreground">
                Số tiền: <span className="text-primary">{formatCurrency(selectedPaymentInv.balance)}</span>
              </p>
            </div>

            {/* Transfer details */}
            <div className="rounded-xl bg-muted/40 p-3 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Ngân hàng:</span>
                <span className="font-bold text-foreground">MB Bank (Quân Đội)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Số tài khoản:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-foreground">0987654321</span>
                  <button 
                    onClick={() => handleCopy('0987654321')}
                    className="h-6 w-6 rounded bg-card flex items-center justify-center hover:bg-muted cursor-pointer"
                    title="Sao chép"
                  >
                    {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Nội dung CK:</span>
                <span className="font-mono font-bold text-primary">{selectedPaymentInv.invoiceNumber} HS042</span>
              </div>
            </div>

            <button
              onClick={() => {
                alert('Hệ thống đang kiểm tra giao dịch chuyển khoản...');
                setSelectedPaymentInv(null);
              }}
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-bold text-xs shadow-md hover:bg-primary/90 transition-all cursor-pointer"
            >
              Tôi đã chuyển khoản
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
