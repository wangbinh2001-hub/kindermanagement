'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SchoolProfileForm({
  initialData,
}: {
  initialData: {
    name: string;
    logoUrl: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    taxCode: string | null;
    legalRepresentative: string | null;
    description: string | null;
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
    const body: Record<string, string> = {};
    for (const field of [
      'name',
      'logoUrl',
      'phone',
      'email',
      'address',
      'taxCode',
      'legalRepresentative',
      'description',
    ]) {
      const value = String(formData.get(field) ?? '').trim();
      if (value) body[field] = value;
    }

    try {
      const res = await fetch('/api/trpc/schoolOps.updateSchoolProfile?batch=1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ '0': { json: body } }),
      });
      const data = await res.json();
      if (data.error) {
        setMessage({ type: 'error', text: data.error.json?.message ?? 'Cập nhật thất bại' });
      } else {
        setMessage({ type: 'success', text: 'Cập nhật thông tin trường thành công' });
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
        <h2 className="text-2xl font-semibold">Thông tin trường học</h2>
        <p className="text-sm text-muted-foreground">Cập nhật thông tin liên hệ và giấy phép cơ sở.</p>
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
        <section className="space-y-4 rounded-lg border border-border bg-card p-5">
          <h3 className="text-lg font-medium">Thông tin cơ bản</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="name" label="Tên trường" required value={initialData.name} />
            <Field name="logoUrl" label="URL Logo" type="url" value={initialData.logoUrl ?? ''} placeholder="https://example.com/logo.png" />
            <Field name="phone" label="Điện thoại" required value={initialData.phone ?? ''} placeholder="024 1234 5678" />
            <Field name="email" label="Email" type="email" required value={initialData.email ?? ''} placeholder="info@school.edu.vn" />
          </div>

          <Field name="address" label="Địa chỉ" textarea value={initialData.address ?? ''} />
          <Field name="description" label="Giới thiệu ngắn" textarea value={initialData.description ?? ''} />
        </section>

        <section className="space-y-4 rounded-lg border border-border bg-card p-5">
          <h3 className="text-lg font-medium">Thông tin pháp lý</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="taxCode" label="Mã số thuế" value={initialData.taxCode ?? ''} />
            <Field name="legalRepresentative" label="Người đại diện pháp luật" value={initialData.legalRepresentative ?? ''} />
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

export function Field({
  name,
  label,
  type = 'text',
  required = false,
  placeholder,
  value = '',
  textarea = false,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  value?: string;
  textarea?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {textarea ? (
        <textarea
          id={name}
          name={name}
          defaultValue={value}
          required={required}
          placeholder={placeholder}
          className="min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          defaultValue={value}
          required={required}
          placeholder={placeholder}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      )}
    </div>
  );
}