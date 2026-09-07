import { prisma } from '@km/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SupportSessionDetailPage({ params }: { params: { sessionId: string } }) {
  const session = await prisma.supportSession.findUnique({
    where: { id: params.sessionId },
    include: {
      school: { select: { code: true, name: true } },
      request: { select: { title: true, description: true, isEmergency: true, status: true } },
    },
  });

  if (!session) {
    return <div className="rounded-lg border border-border bg-card p-6">Không tìm thấy phiên hỗ trợ.</div>;
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Link href="/system-admin/support" className="text-sm text-muted-foreground hover:text-foreground">
          ← Quay lại hỗ trợ
        </Link>
        <h2 className="text-2xl font-semibold">Chi tiết phiên hỗ trợ</h2>
        <p className="text-sm text-muted-foreground">
          {session.school.name} · {session.school.code}
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-lg font-medium">Thông tin phiên</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="Trạng thái" value={session.status} />
            <Row label="Phạm vi" value={session.scope} />
            <Row label="Lý do" value={session.reason} />
            <Row label="Bắt đầu" value={session.startedAt.toLocaleString('vi-VN')} />
            <Row label="Hết hạn" value={session.expiresAt.toLocaleString('vi-VN')} />
            <Row label="Kết thúc" value={session.endedAt ? session.endedAt.toLocaleString('vi-VN') : 'Chưa đóng'} />
          </dl>
        </article>

        <article className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-lg font-medium">Yêu cầu gốc</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="Tiêu đề" value={session.request.title} />
            <Row label="Mô tả" value={session.request.description} />
            <Row label="Trạng thái" value={session.request.status} />
            <Row label="Khẩn cấp" value={session.request.isEmergency ? 'Có' : 'Không'} />
          </dl>
        </article>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border pb-2 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="max-w-[60%] text-right">{value}</dd>
    </div>
  );
}
