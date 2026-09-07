'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createEmergencySupportAction } from '../../actions';
import { 
  Headset, 
  AlertTriangle, 
  ArrowLeft, 
  ShieldAlert, 
  Clock, 
  Building2, 
  Send 
} from 'lucide-react';

interface SchoolOption {
  id: string;
  code: string;
  name: string;
  status: string;
}

export function NewSupportClient({ schools }: { schools: SchoolOption[] }) {
  const router = useRouter();
  const [schoolId, setSchoolId] = useState(schools[0]?.id || '');
  const [duration, setDuration] = useState(60);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const charCount = reason.trim().length;
  const isReasonValid = charCount >= 20;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!schoolId) {
      setError('Vui lòng chọn trường học cần hỗ trợ');
      return;
    }
    if (!isReasonValid) {
      setError('Lý do truy cập khẩn cấp phải có tối thiểu 20 ký tự');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await createEmergencySupportAction(schoolId, reason.trim(), duration);
      if (!res.success) {
        setError(res.error ?? 'Không thể khởi tạo phiên hỗ trợ khẩn cấp');
      } else {
        router.push('/system-admin/support');
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/system-admin/support"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại danh sách hỗ trợ
      </Link>

      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center font-bold">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Mở Phiên Truy Cập Khẩn Cấp (Emergency Access)
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Dành cho System Admin khi cần can thiệp xử lý sự cố cấp bách tại cơ sở trường học.
          </p>
        </div>
      </div>

      {/* Domain Invariant Alert */}
      <div className="p-4 rounded-2xl border border-destructive/20 bg-destructive/5 dark:bg-destructive/10 text-xs text-destructive space-y-2">
        <div className="font-bold flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Quy tắc bảo mật Zero Data Leak & Kiểm toán Bắt buộc
        </div>
        <p className="text-muted-foreground leading-relaxed">
          - Mọi phiên hỗ trợ đều được giới hạn theo thời gian và tự động thu hồi quyền sau khi hết hạn.<br />
          - Lý do giải trình phải rõ ràng (tối thiểu 20 ký tự) và được ghi vĩnh viễn vào Platform Audit Log.<br />
          - School Admin của trường sẽ được thông báo về phiên can thiệp này.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 rounded-2xl border border-border bg-card space-y-5 shadow-xs">
        {/* Trường mục tiêu */}
        <div className="space-y-1.5">
          <label htmlFor="schoolSelect" className="block text-sm font-semibold text-foreground">
            Trường học mục tiêu <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <select
              id="schoolSelect"
              value={schoolId}
              onChange={(e) => setSchoolId(e.target.value)}
              required
              className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  [{s.code}] {s.name} ({s.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Thời lượng */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-foreground">
            Thời lượng cấp quyền <span className="text-destructive">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: '30 phút', val: 30 },
              { label: '1 giờ', val: 60 },
              { label: '2 giờ', val: 120 },
              { label: '4 giờ', val: 240 },
            ].map((item) => (
              <button
                key={item.val}
                type="button"
                onClick={() => setDuration(item.val)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  duration === item.val
                    ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                    : 'bg-background border-border text-foreground hover:bg-muted'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lý do */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="supportReason" className="block text-sm font-semibold text-foreground">
              Lý do truy cập khẩn cấp <span className="text-destructive">*</span>
            </label>
            <span className={`text-xs font-mono font-medium ${isReasonValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {charCount}/20 ký tự tối thiểu
            </span>
          </div>
          <textarea
            id="supportReason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            rows={4}
            placeholder="Ví dụ: Khắc phục lỗi đăng nhập của hiệu trưởng sau khi cấp lại tài khoản, sự cố đồng bộ dữ liệu điểm danh..."
            className="w-full p-3.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <p className="text-xs text-muted-foreground">
            Giải trình chi tiết mục đích can thiệp để làm căn cứ hậu kiểm kiểm toán.
          </p>
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-border flex items-center justify-end gap-3">
          <Link
            href="/system-admin/support"
            className="px-4 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            Hủy bỏ
          </Link>
          <button
            type="submit"
            id="btn-submit-support"
            disabled={loading || !isReasonValid}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-semibold shadow-xs hover:bg-destructive/90 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Send className="h-4 w-4" />
            {loading ? 'Đang kích hoạt...' : 'Kích hoạt phiên hỗ trợ'}
          </button>
        </div>
      </form>
    </div>
  );
}
