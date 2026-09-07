'use client';

import { useState } from 'react';
import {
  AUDIT_ENTITY_TYPE_LABELS,
  AUDIT_ACTION_LABELS,
  AUDIT_ENTITY_TYPES,
} from '@km/validators';
import { 
  History, 
  ShieldCheck, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  Code2, 
  User, 
  Sparkles,
  Lock
} from 'lucide-react';

// Mock data — in production comes from auditLog.list (PII already masked server-side)
const mockLogs = [
  {
    id: 'log-1',
    userId: 'user-1',
    userName: 'Nguyễn Văn Hiệu Trưởng',
    userRole: 'SCHOOL_ADMIN',
    entityType: 'Student',
    entityId: 'stu-1',
    action: 'CREATE',
    beforeJson: null,
    afterJson: { fullName: 'Nguyễn Minh Anh', className: 'Lớp Lá A', phone: '096*****67', cccd: '0791****6789' },
    createdAt: '2026-09-07T08:00:00.000Z',
  },
  {
    id: 'log-2',
    userId: 'user-2',
    userName: 'Kế toán Thu Hà',
    userRole: 'SCHOOL_ADMIN',
    entityType: 'Invoice',
    entityId: 'inv-1',
    action: 'CREATE',
    beforeJson: null,
    afterJson: { invoiceNumber: 'HD-2026-09-001', totalAmount: 3500000, status: 'ISSUED' },
    createdAt: '2026-09-06T14:30:00.000Z',
  },
  {
    id: 'log-3',
    userId: 'user-1',
    userName: 'Nguyễn Văn Hiệu Trưởng',
    userRole: 'SCHOOL_ADMIN',
    entityType: 'ParentRequest',
    entityId: 'req-1',
    action: 'APPROVE_PARENT_REQUEST',
    beforeJson: { status: 'PENDING', reviewedBy: null },
    afterJson: { status: 'APPROVED', reviewNotes: 'Đã duyệt đơn xin nghỉ 2 ngày', reviewedBy: 'user-1' },
    createdAt: '2026-09-06T09:00:00.000Z',
  },
  {
    id: 'log-4',
    userId: 'user-3',
    userName: 'Y tế Thu Cúc',
    userRole: 'TEACHER',
    entityType: 'HealthRecord',
    entityId: 'hr-1',
    action: 'CREATE',
    beforeJson: null,
    afterJson: { heightCm: 110.5, weightKg: 19.2, bmi: 15.7, bmiCategory: 'NORMAL' },
    createdAt: '2026-09-05T10:00:00.000Z',
  },
  {
    id: 'log-5',
    userId: 'user-1',
    userName: 'Nguyễn Văn Hiệu Trưởng',
    userRole: 'SCHOOL_ADMIN',
    entityType: 'StaffMember',
    entityId: 'staff-1',
    action: 'UPDATE',
    beforeJson: { role: 'TEACHER', email: 'n***@gmail.com' },
    afterJson: { role: 'SCHOOL_ADMIN', email: 'n***@gmail.com' },
    createdAt: '2026-09-04T16:00:00.000Z',
  },
];

const ACTION_COLORS: Record<string, { badge: string; dot: string }> = {
  CREATE: { badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-500' },
  UPDATE: { badge: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20', dot: 'bg-blue-500' },
  DELETE: { badge: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/20', dot: 'bg-rose-500' },
  RESTORE: { badge: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/20', dot: 'bg-purple-500' },
  APPROVE: { badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-500' },
  REJECT: { badge: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/20', dot: 'bg-rose-500' },
  APPROVE_PARENT_REQUEST: { badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-500' },
  REJECT_PARENT_REQUEST: { badge: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/20', dot: 'bg-rose-500' },
  CREATE_PARENT_REQUEST: { badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20', dot: 'bg-amber-500' },
  CANCEL_PARENT_REQUEST: { badge: 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/20', dot: 'bg-orange-500' },
};

export default function AuditLogPage() {
  const [filterEntityType, setFilterEntityType] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = filterEntityType
    ? mockLogs.filter((l) => l.entityType === filterEntityType)
    : mockLogs;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header with Title & Security Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-slate-500/10 text-slate-600 dark:text-slate-400 flex items-center justify-center">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-foreground">Nhật ký Kiểm toán (Audit Logs)</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Ghi nhận minh bạch lịch sử thay đổi dữ liệu theo chuẩn bảo mật đa cơ sở.
              </p>
            </div>
          </div>
        </div>

        {/* PII Masking Shield Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-700 dark:text-emerald-400 self-start sm:self-center">
          <Lock className="h-3.5 w-3.5" />
          <span>PII Masking Active (***)</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border/80 text-xs shadow-2xs">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-bold text-foreground">Lọc theo đối tượng:</span>
          <select
            value={filterEntityType}
            onChange={(e) => setFilterEntityType(e.target.value)}
            className="bg-transparent border-none text-xs font-medium focus:outline-none cursor-pointer"
          >
            <option value="">Tất cả ({mockLogs.length})</option>
            {AUDIT_ENTITY_TYPES.map((type) => (
              <option key={type} value={type}>
                {AUDIT_ENTITY_TYPE_LABELS[type] || type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-3xl border border-border/80 bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/40 border-b border-border/70 text-muted-foreground font-bold">
                <th className="text-left px-5 py-3.5">Thời gian</th>
                <th className="text-left px-5 py-3.5">Hành động</th>
                <th className="text-left px-5 py-3.5">Đối tượng</th>
                <th className="text-left px-5 py-3.5">Người thực hiện</th>
                <th className="text-right px-5 py-3.5">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.map((log) => {
                const actionLabel = AUDIT_ACTION_LABELS[log.action] || log.action;
                const entityLabel = AUDIT_ENTITY_TYPE_LABELS[log.entityType] || log.entityType;
                const actionColor = ACTION_COLORS[log.action] || { badge: 'bg-muted text-muted-foreground', dot: 'bg-muted-foreground' };
                const isExpanded = expandedId === log.id;

                return (
                  <>
                    <tr
                      key={log.id}
                      className="hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : log.id)}
                    >
                      <td className="px-5 py-3.5 whitespace-nowrap text-muted-foreground font-mono">
                        {new Date(log.createdAt).toLocaleString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${actionColor.badge}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${actionColor.dot}`}></span>
                          {actionLabel}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-foreground">{entityLabel}</td>
                      <td className="px-5 py-3.5 text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3 w-3" />
                          <span className="font-medium text-foreground">{log.userName}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">({log.userRole})</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold text-primary">
                        <span className="inline-flex items-center gap-1">
                          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          <span>{isExpanded ? 'Thu gọn' : 'Xem diff'}</span>
                        </span>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${log.id}-detail`}>
                        <td colSpan={5} className="px-5 py-4 bg-muted/25 border-b border-border/60">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                              <Code2 className="h-4 w-4 text-primary" />
                              <span>Bản ghi dữ liệu (Snapshot JSON Diff):</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
                              <div>
                                <div className="flex items-center justify-between mb-1 text-[11px] font-bold text-muted-foreground">
                                  <span>Dữ liệu Trước (Before)</span>
                                  <span className="text-rose-600 font-mono">[-]</span>
                                </div>
                                <pre className="rounded-xl border border-border/80 bg-card p-3 overflow-x-auto text-[11px] font-mono text-muted-foreground shadow-2xs leading-relaxed">
                                  {log.beforeJson ? JSON.stringify(log.beforeJson, null, 2) : '// Chưa có bản ghi trước (Tạo mới)'}
                                </pre>
                              </div>

                              <div>
                                <div className="flex items-center justify-between mb-1 text-[11px] font-bold text-muted-foreground">
                                  <span>Dữ liệu Sau (After - PII Masked)</span>
                                  <span className="text-emerald-600 font-mono">[+]</span>
                                </div>
                                <pre className="rounded-xl border border-primary/20 bg-primary/[0.03] p-3 overflow-x-auto text-[11px] font-mono text-foreground shadow-2xs leading-relaxed">
                                  {log.afterJson ? JSON.stringify(log.afterJson, null, 2) : '// Dữ liệu đã bị xóa'}
                                </pre>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>Không có bản ghi nào.</p>
          </div>
        )}
      </div>

      {/* Info: No Export */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm">
        <p className="text-blue-800">
          <strong>Lưu ý:</strong> Nhật ký kiểm toán chỉ xem được trên giao diện, không hỗ trợ xuất file.
          Thông tin cá nhân (SĐT, Email, CCCD) đã được ẩn bớt để bảo mật.
        </p>
      </div>
    </div>
  );
}
