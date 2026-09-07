'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { closeSupportSessionAction } from '../actions';
import { 
  Headset, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  PlusCircle, 
  PowerOff, 
  Building2, 
  ShieldAlert 
} from 'lucide-react';

interface SchoolInfo {
  code: string;
  name: string;
  status: string;
}

interface ActiveSession {
  id: string;
  schoolId: string;
  reason: string;
  scope: string;
  expiresAt: string | Date;
  school: {
    code: string;
    name: string;
  };
  request?: {
    title: string;
    isEmergency: boolean;
  } | null;
}

interface SupportRequestItem {
  id: string;
  schoolId: string;
  title: string;
  description: string;
  isEmergency: boolean;
  status: string;
  createdAt: string | Date;
  school: SchoolInfo;
}

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Đang mở',
  IN_PROGRESS: 'Đang xử lý',
  RESOLVED: 'Đã giải quyết',
  CLOSED: 'Đã đóng',
  ACTIVE: 'Đang hoạt động',
  EXPIRED: 'Đã hết hạn',
};

const STATUS_STYLES: Record<string, string> = {
  OPEN: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900',
  IN_PROGRESS: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900',
  RESOLVED: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900',
  CLOSED: 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800',
  ACTIVE: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900',
  EXPIRED: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900',
};

export function SupportClient({
  activeSessions,
  requests,
}: {
  activeSessions: ActiveSession[];
  requests: SupportRequestItem[];
}) {
  const router = useRouter();
  const [closingId, setClosingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCloseSession(sessionId: string) {
    if (!confirm('Bạn có chắc chắn muốn kết thúc phiên hỗ trợ này ngay lập tức?')) {
      return;
    }
    setClosingId(sessionId);
    setError(null);
    try {
      const res = await closeSupportSessionAction(sessionId, 'Đóng thủ công bởi System Admin');
      if (!res.success) {
        setError(res.error ?? 'Không thể đóng phiên hỗ trợ');
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối khi đóng phiên');
    } finally {
      setClosingId(null);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Headset className="h-6 w-6 text-primary" />
            Quản trị Phiên Hỗ trợ & Khắc phục Sự cố
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quy trình cấp quyền truy cập hỗ trợ khẩn cấp (Emergency Support Access) và kiểm toán phiên.
          </p>
        </div>
        <Link
          href="/system-admin/support/new"
          id="btn-create-support"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-xs hover:bg-primary/90 transition-all cursor-pointer w-fit"
        >
          <PlusCircle className="h-4 w-4" />
          Mở phiên khẩn cấp
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Active Sessions Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-foreground">Phiên hỗ trợ đang kích hoạt</h2>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {activeSessions.length} phiên
            </span>
          </div>
        </div>

        {activeSessions.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-border bg-card/50">
            <ShieldAlert className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium text-foreground">Không có phiên hỗ trợ nào đang hoạt động</p>
            <p className="text-xs text-muted-foreground mt-1">
              Hệ thống tuân thủ nghiêm ngặt nguyên tắc Zero Data Leak — Không tài khoản nào có quyền truy cập chéo tenant khi không có phiên.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {activeSessions.map((session) => (
              <div
                key={session.id}
                className="p-5 rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/10 space-y-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-emerald-500 text-white flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                        ACTIVE
                      </span>
                      <span className="font-mono text-xs text-muted-foreground font-semibold">
                        {session.school.code}
                      </span>
                    </div>
                    <h3 className="font-bold text-foreground text-base">{session.school.name}</h3>
                  </div>
                  <button
                    onClick={() => handleCloseSession(session.id)}
                    disabled={closingId === session.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <PowerOff className="h-3.5 w-3.5" />
                    {closingId === session.id ? 'Đang đóng...' : 'Kết thúc phiên'}
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-background/80 border border-border text-xs space-y-1.5">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    Lý do mở phiên:
                  </div>
                  <p className="text-muted-foreground italic">&ldquo;{session.reason}&rdquo;</p>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    Hết hạn: <span className="font-medium text-foreground">{new Date(session.expiresAt).toLocaleString('vi-VN')}</span>
                  </div>
                  <span className="font-mono text-[11px] bg-muted px-2 py-0.5 rounded">
                    Phạm vi: {session.scope}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Requests & Historical Records */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Lịch sử yêu cầu hỗ trợ</h2>
          <span className="text-xs text-muted-foreground">{requests.length} yêu cầu</span>
        </div>

        {requests.length === 0 ? (
          <div className="p-6 text-center rounded-2xl border border-border bg-card text-muted-foreground text-sm">
            Chưa có yêu cầu hỗ trợ nào được ghi nhận.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold">Trường học</th>
                    <th className="px-5 py-3.5 font-semibold">Tiêu đề & Nội dung</th>
                    <th className="px-5 py-3.5 font-semibold">Khẩn cấp</th>
                    <th className="px-5 py-3.5 font-semibold">Trạng thái</th>
                    <th className="px-5 py-3.5 font-semibold">Thời gian tạo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-foreground">{req.school.name}</div>
                        <div className="font-mono text-xs text-muted-foreground">{req.school.code}</div>
                      </td>
                      <td className="px-5 py-4 max-w-md">
                        <div className="font-medium text-foreground">{req.title}</div>
                        <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {req.description}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {req.isEmergency ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            <AlertTriangle className="h-3 w-3" />
                            Khẩn cấp
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Thường</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_STYLES[req.status] ?? 'bg-muted text-muted-foreground'}`}>
                          {STATUS_LABELS[req.status] ?? req.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-muted-foreground">
                        {new Date(req.createdAt).toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
