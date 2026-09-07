import { prisma } from '@km/db';
import { getSchoolOrNull } from '../layout';

export default async function SchoolManagementPage({ params }: { params: { schoolSlug: string } }) {
  const school = await getSchoolOrNull(params.schoolSlug);
  if (!school) return <div>Không tìm thấy trường học.</div>;

  const [allSchools, supportRequests] = await Promise.all([
    prisma.school.findMany({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' } }),
    prisma.supportRequest.findMany({ where: { schoolId: school.id }, orderBy: { createdAt: 'desc' } }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">School Management (Phase 1-2)</h2>
        <p className="text-sm text-muted-foreground">Quản lý cơ sở trường học, cấu hình hệ thống và yêu cầu hỗ trợ.</p>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-lg font-medium">Thông tin trường hiện tại</h3>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-muted-foreground">Tên trường</dt><dd className="font-medium">{school.name}</dd></div>
            <div><dt className="text-muted-foreground">Mã trường</dt><dd className="font-medium">{school.code}</dd></div>
            <div><dt className="text-muted-foreground">Trạng thái</dt><dd className="font-medium">{school.status}</dd></div>
            <div><dt className="text-muted-foreground">Email</dt><dd className="font-medium">{school.email ?? 'Chưa cập nhật'}</dd></div>
            <div><dt className="text-muted-foreground">Điện thoại</dt><dd className="font-medium">{school.phone ?? 'Chưa cập nhật'}</dd></div>
            <div><dt className="text-muted-foreground">Địa chỉ</dt><dd className="font-medium">{school.address ?? 'Chưa cập nhật'}</dd></div>
          </dl>
        </article>

        <article className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-lg font-medium">Cấu hình module</h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li className="flex justify-between border-b border-border pb-2"><span>Điểm danh</span><span>{school.setting?.enableAttendance ? 'Bật' : 'Tắt'}</span></li>
            <li className="flex justify-between border-b border-border pb-2"><span>Học phí</span><span>{school.setting?.enableTuition ? 'Bật' : 'Tắt'}</span></li>
            <li className="flex justify-between border-b border-border pb-2"><span>Sức khỏe</span><span>{school.setting?.enableHealth ? 'Bật' : 'Tắt'}</span></li>
            <li className="flex justify-between"><span>Dinh dưỡng</span><span>{school.setting?.enableNutrition ? 'Bật' : 'Tắt'}</span></li>
          </ul>
        </article>
      </section>

      <section className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-lg font-medium">Danh sách các trường trong hệ thống ({allSchools.length})</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase text-muted-foreground">
              <tr>
                <th className="py-2">Tên trường</th>
                <th className="py-2">Mã trường</th>
                <th className="py-2">Slug</th>
                <th className="py-2">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {allSchools.map((s) => (
                <tr key={s.id}>
                  <td className="py-2 font-medium">{s.name}</td>
                  <td className="py-2">{s.code}</td>
                  <td className="py-2">{s.slug}</td>
                  <td className="py-2">{s.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-lg font-medium">Yêu cầu hỗ trợ ({supportRequests.length})</h3>
        {supportRequests.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Không có yêu cầu hỗ trợ nào.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border text-sm">
            {supportRequests.map((req) => (
              <li key={req.id} className="py-2">
                <div className="font-medium">{req.title}</div>
                <div className="text-xs text-muted-foreground">{req.description} — Trạng thái: {req.status}</div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}