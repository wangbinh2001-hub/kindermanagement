import { prisma } from '@km/db';
import { getSchoolOrNull } from '../layout';

export default async function ClassesPage({ params }: { params: { schoolSlug: string } }) {
  const school = await getSchoolOrNull(params.schoolSlug);
  if (!school) return <div>Không tìm thấy trường học.</div>;

  const currentYearId = school.setting?.currentSchoolYearId;
  const classes = await prisma.class.findMany({
    where: { schoolId: school.id, deletedAt: null, ...(currentYearId ? { schoolYearId: currentYearId } : {}) },
    include: { memberships: true },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold">Classes Management (Phase 3)</h2>
        <p className="text-sm text-muted-foreground">Quản lý lớp học, sức chứa và phân công học sinh.</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {classes.map((c) => (
          <article key={c.id} className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-lg font-medium">{c.name}</h3>
            <p className="text-xs text-muted-foreground">Nhóm tuổi: {c.ageGroup}</p>
            <div className="mt-4 flex justify-between text-sm">
              <span>Sĩ số:</span>
              <span className="font-semibold">{c.memberships.length} / {c.capacity}</span>
            </div>
          </article>
        ))}
        {classes.length === 0 && (
          <p className="text-sm text-muted-foreground">Không có lớp học nào cho năm học hiện tại.</p>
        )}
      </section>
    </div>
  );
}