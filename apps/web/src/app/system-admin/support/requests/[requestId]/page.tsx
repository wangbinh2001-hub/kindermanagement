import { prisma } from '@km/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SupportRequestDetailPage({ params }: { params: { requestId: string } }) {
  const request = await prisma.supportRequest.findUnique({
    where: { id: params.requestId },
    include: {
      school: { select: { code: true, name: true } },
      sessions: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!request) {
    return <div className="rounded-lg border border-border bg-card p-6">Không tìm thấy yêu cầu.</div>;
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Link href="/system-admin/support" className="text-sm text-muted-foreground hover:text-foreground">
          ← Quay lại hỗ trợ
        </Link>
        <h2 className="text-2xl font-semibold">Chi tiết yêu cầu hỗ trợ</h2>
        <p className="text-sm text-muted-foreground">
          {request.school.name} · {request.school.code}
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-lg font-medium">Thông tin yêu cầu</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="Tiêu đề" value={request.title} />
            <Row label="Mô tả" value={request.description} />
            <Row label="Trạng thái" value={request.status} />
            <Row label="Khẩn cấp" value={request.isEmergency ? 'Có' : 'Không'} />
            <Row label="Tạo lúc" value={request.createdAt.toLocaleString('vi-VN')} />
          </dl>
        </article>

        <article className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-lg font-medium">Phiên hỗ trợ</h3>
          {request.sessions.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Chưa có phiên hỗ trợ.</p>
          ) : (
            <ul className="mt-4 space-y-3 text-sm">
              {request.sessions.map((session) => (
                <li key={session.id} className="rounded-md border border-border p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{session.status}</span>
                    <Link href={`/system-admin/support/sessions/${session.id}`} className="text-xs underline">
                      Mở phiên
                    </Link>
                  </div>
                  <div className="mt-2 text-muted-foreground">{session.reason}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Hết hạn: {session.expiresAt.toLocaleString('vi-VN')}
                  </div>
                </li>
              ))}
            </ul>
          )}
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
