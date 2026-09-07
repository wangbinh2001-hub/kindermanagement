'use client';

import { useState, useMemo } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  ShieldCheck, 
  Eye, 
  X, 
  Building2, 
  User, 
  Calendar, 
  Tag 
} from 'lucide-react';

interface AuditLogItem {
  id: string;
  schoolId: string;
  userId: string;
  userRole: string;
  entityType: string;
  entityId: string;
  action: string;
  beforeJson?: unknown;
  afterJson?: unknown;
  metadata?: unknown;
  createdAt: string | Date;
  school?: {
    code: string;
    name: string;
  } | null;
}

const ACTION_CONFIG: Record<string, { label: string; style: string }> = {
  CREATE_SCHOOL: {
    label: 'Khởi tạo trường',
    style: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  },
  ACTIVATE_SCHOOL: {
    label: 'Kích hoạt trường',
    style: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  },
  SUSPEND_SCHOOL: {
    label: 'Đình chỉ trường',
    style: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  },
  DELETE_SCHOOL: {
    label: 'Xóa trường (2-bước)',
    style: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
  },
  UPDATE_FEATURE_FLAGS: {
    label: 'Cập nhật Feature Flags',
    style: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20',
  },
  SUPPORT_ACCESS_START: {
    label: 'Bắt đầu truy cập hỗ trợ',
    style: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
  },
  SUPPORT_ACCESS_END: {
    label: 'Kết thúc truy cập hỗ trợ',
    style: 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-400 border-zinc-500/20',
  },
};

export function AuditClient({ logs }: { logs: AuditLogItem[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [activeLog, setActiveLog] = useState<AuditLogItem | null>(null);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchSearch =
        searchTerm === '' ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entityId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.school?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.school?.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userId.toLowerCase().includes(searchTerm.toLowerCase());

      const matchAction = selectedAction === 'ALL' || log.action === selectedAction;

      return matchSearch && matchAction;
    });
  }, [logs, searchTerm, selectedAction]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <History className="h-6 w-6 text-primary" />
          Nhật ký Kiểm toán Toàn hệ thống (Platform Audit Log)
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Theo dõi toàn bộ biến động dữ liệu cấp độ nền tảng, đảm bảo tính toàn vẹn và tuân thủ nguyên tắc Zero Data Leak.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            id="auditSearch"
            type="text"
            placeholder="Tìm theo hành động, trường học, người thực hiện..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        <div className="relative sm:w-64">
          <select
            id="actionFilter"
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="w-full h-11 px-3.5 rounded-xl border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="ALL">Tất cả hành động ({logs.length})</option>
            {Object.entries(ACTION_CONFIG).map(([key, val]) => (
              <option key={key} value={key}>
                {val.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Thời gian</th>
                <th className="px-5 py-3.5 font-semibold">Hành động</th>
                <th className="px-5 py-3.5 font-semibold">Thực thể</th>
                <th className="px-5 py-3.5 font-semibold">Trường liên quan</th>
                <th className="px-5 py-3.5 font-semibold">Người thực hiện</th>
                <th className="px-5 py-3.5 font-semibold text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">
                    Không tìm thấy bản ghi kiểm toán nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const cfg = ACTION_CONFIG[log.action] ?? {
                    label: log.action,
                    style: 'bg-muted text-muted-foreground border-border',
                  };
                  return (
                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.style}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs font-medium text-foreground bg-muted px-2 py-0.5 rounded">
                          {log.entityType}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {log.school ? (
                          <div>
                            <div className="font-medium text-foreground text-xs">{log.school.name}</div>
                            <div className="font-mono text-[11px] text-muted-foreground">{log.school.code}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground font-mono">{log.schoolId}</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-xs font-medium text-foreground">{log.userId}</div>
                        <div className="text-[11px] text-muted-foreground font-mono">{log.userRole}</div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => setActiveLog(log)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-border bg-background hover:bg-accent text-foreground transition-colors cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Xem JSON
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON Detail Modal */}
      {activeLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="font-bold text-foreground text-base flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Chi tiết bản ghi kiểm toán #{activeLog.id.slice(0, 8)}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(activeLog.createdAt).toLocaleString('vi-VN')} — {activeLog.action}
                </p>
              </div>
              <button
                onClick={() => setActiveLog(null)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/40 border border-border">
                <div>
                  <span className="text-muted-foreground">Thực thể:</span>{' '}
                  <span className="font-mono font-semibold text-foreground">{activeLog.entityType} ({activeLog.entityId})</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Người thao tác:</span>{' '}
                  <span className="font-semibold text-foreground">{activeLog.userId} ({activeLog.userRole})</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Trường học:</span>{' '}
                  <span className="font-semibold text-foreground">{activeLog.school?.name ?? activeLog.schoolId}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Mã trường:</span>{' '}
                  <span className="font-mono text-foreground">{activeLog.school?.code ?? 'N/A'}</span>
                </div>
              </div>

              {Boolean(activeLog.beforeJson) && (
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Dữ liệu trước (beforeJson):</h4>
                  <pre className="p-3 rounded-xl bg-muted font-mono text-[11px] overflow-x-auto border border-border">
                    {JSON.stringify(activeLog.beforeJson, null, 2)}
                  </pre>
                </div>
              )}

              {Boolean(activeLog.afterJson) && (
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Dữ liệu sau (afterJson):</h4>
                  <pre className="p-3 rounded-xl bg-muted font-mono text-[11px] overflow-x-auto border border-border">
                    {JSON.stringify(activeLog.afterJson, null, 2)}
                  </pre>
                </div>
              )}

              {Boolean(activeLog.metadata) && (
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Siêu dữ liệu bổ sung (metadata):</h4>
                  <pre className="p-3 rounded-xl bg-muted font-mono text-[11px] overflow-x-auto border border-border">
                    {JSON.stringify(activeLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-border flex justify-end">
              <button
                onClick={() => setActiveLog(null)}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
