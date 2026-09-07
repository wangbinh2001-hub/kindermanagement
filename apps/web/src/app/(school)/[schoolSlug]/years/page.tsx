import { prisma } from '@km/db';
import { getSchoolOrNull } from '../layout';

export default async function SchoolYearsPage({ params }: { params: { schoolSlug: string } }) {
  const school = await getSchoolOrNull(params.schoolSlug);
  if (!school) return <div>Không tìm thấy trường học.</div>;

  const years = await prisma.schoolYear.findMany({
    where: { schoolId: school.id, deletedAt: null },
    orderBy: { startDate: 'desc' },
  });

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">School Years (Phase 3)</h2>
          <p className="text-sm text-muted-foreground">Quản lý các niên khóa, thiết lập năm học hiện tại.</p>
        </div>
      </header>

      <section className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-lg font-medium">Danh sách năm học ({years.length})</h3>
        {years.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Chưa có năm học nào.</p>
        ) : (
          <div className="mt-4 divide-y divide-border">
            {years.map((year) => (
              <div key={year.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="font-medium">{year.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {year.startDate.toLocaleDateString('vi-VN')} – {year.endDate.toLocaleDateString('vi-VN')}
                  </div>
                </div>
                <div className="flex gap-2">
                  {year.isCurrent && (
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">Hiện tại</span>
                  )}
                  {year.isArchived && (
                    <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">Lưu trữ</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}