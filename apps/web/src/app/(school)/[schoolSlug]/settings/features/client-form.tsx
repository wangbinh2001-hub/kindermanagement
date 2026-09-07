'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SchoolFeaturesForm({
  initialData,
}: {
  initialData: {
    enableAttendance: boolean;
    enableTuition: boolean;
    enableHealth: boolean;
    enableNutrition: boolean;
  };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const body = {
      enableAttendance: formData.get('enableAttendance') === 'on',
      enableTuition: formData.get('enableTuition') === 'on',
      enableHealth: formData.get('enableHealth') === 'on',
      enableNutrition: formData.get('enableNutrition') === 'on',
    };

    try {
      const res = await fetch('/api/trpc/schoolOps.updateSchoolSettings?batch=1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ '0': { json: body } }),
      });
      const data = await res.json();
      if (data.error) {
        setMessage({ type: 'error', text: data.error.json?.message ?? 'Cập nhật thất bại' });
      } else {
        setMessage({ type: 'success', text: 'Cập nhật tính năng trường thành công' });
        router.refresh();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Lỗi kết nối' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">Tính năng & Module</h2>
        <p className="text-sm text-muted-foreground">Bật/tắt các tính năng khả dụng cho trường học của bạn.</p>
      </header>

      {message && (
        <div
          className={`rounded-md border p-4 text-sm ${
            message.type === 'success'
              ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
              : 'border-red-500 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-lg border border-border bg-card p-5 space-y-4">
          <div className="space-y-4">
            <ToggleField name="enableAttendance" label="Quản lý điểm danh" description="Theo dõi sĩ số, quét mã QR và báo cáo chuyên cần." defaultChecked={initialData.enableAttendance} />
            <ToggleField name="enableTuition" label="Quản lý học phí" description="Lập danh sách khoản thu, in hóa đơn và quản lý giảm trừ." defaultChecked={initialData.enableTuition} />
            <ToggleField name="enableHealth" label="Sức khỏe & BMI" description="Theo dõi chiều cao, cân nặng, sức khỏe thể chất định kỳ." defaultChecked={initialData.enableHealth} />
            <ToggleField name="enableNutrition" label="Dinh dưỡng & Bếp ăn" description="Lên thực đơn, quản lý phiếu báo ăn và danh sách đi chợ." defaultChecked={initialData.enableNutrition} />
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent">
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </div>
  );
}

function ToggleField({ name, label, description, defaultChecked }: { name: string; label: string; description: string; defaultChecked: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0">
      <div>
        <h4 className="text-sm font-medium">{label}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <label className="relative inline-flex cursor-pointer items-center">
        <input type="checkbox" name={name} defaultChecked={defaultChecked} className="peer sr-only" />
        <div className="h-6 w-11 rounded-full bg-muted after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-border after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-ring dark:border-gray-600 dark:bg-gray-700"></div>
      </label>
    </div>
  );
}