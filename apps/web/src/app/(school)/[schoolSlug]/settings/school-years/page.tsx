import { prisma } from '@km/db';

export default async function SchoolYearsAndClassesPage({
  params,
  searchParams,
}: {
  params: { schoolSlug: string };
  searchParams: { year?: string };
}) {
  const school = await prisma.school.findUnique({
    where: { slug: params.schoolSlug, deletedAt: null },
    include: { setting: true, schoolYears: { orderBy: { startDate: 'desc' } } },
  });

  if (!school) return <div>Trường học không tồn tại.</div>;

  const years = school.schoolYears;
  const currentYearId = school.setting?.currentSchoolYearId;
  const selectedYearId = searchParams.year || currentYearId || years[0]?.id;

  const selectedYear = years.find((y) => y.id === selectedYearId);
  const classes = selectedYear
    ? await prisma.class.findMany({
        where: { schoolId: school.id, schoolYearId: selectedYear.id, deletedAt: null },
        orderBy: { name: 'asc' },
      })
    : [];

  return (
    <div className="flex gap-8">
      {/* Left: School Years List */}
      <div className="w-1/3 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Năm học</h2>
          <button className="text-sm text-primary hover:underline">Tạo mới</button>
        </div>
        <div className="space-y-2">
          {years.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có năm học nào.</p>
          ) : (
            years.map((year) => (
              <a
                key={year.id}
                href={`?year=${year.id}`}
                className={`block rounded-md border p-4 ${
                  year.id === selectedYearId
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card hover:bg-accent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{year.name}</span>
                  {year.id === currentYearId && (
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                      Hiện tại
                    </span>
                  )}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {year.startDate.toLocaleDateString('vi-VN')} - {year.endDate.toLocaleDateString('vi-VN')}
                </div>
              </a>
            ))
          )}
        </div>
      </div>

      {/* Right: Classes for selected year */}
      <div className="w-2/3 space-y-4">
        {selectedYear ? (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Lớp học — {selectedYear.name}
              </h2>
              <button className="rounded bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90">
                Thêm lớp học
              </button>
            </div>
            
            {classes.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
                Năm học này chưa có lớp nào.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {classes.map((cls) => (
                  <div key={cls.id} className="rounded-md border border-border bg-card p-4">
                    <h3 className="font-medium">{cls.name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">Nhóm tuổi: {cls.ageGroup}</p>
                    <p className="text-xs text-muted-foreground">Sức chứa: {cls.capacity} học sinh</p>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="rounded-lg border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            Vui lòng chọn hoặc tạo một năm học trước.
          </div>
        )}
      </div>
    </div>
  );
}
