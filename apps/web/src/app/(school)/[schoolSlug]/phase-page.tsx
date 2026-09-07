import { prisma } from '@km/db';

const sections = [
  { title: 'Phase 1-2: School Management', items: ['List schools', 'Create / edit school', 'Settings', 'Support requests'] },
  { title: 'Phase 3: School Years & Classes', items: ['CRUD years', 'CRUD classes', 'Assign students'] },
  { title: 'Phase 4: Students & Enrollment', items: ['Student list', 'Detail', 'Enrollment history', 'Responsible persons'] },
  { title: 'Phase 5: Staff Management', items: ['Staff list', 'Roles', 'Employment status'] },
  { title: 'Phase 6: Attendance', items: ['Daily matrix', 'Per-class view', 'History'] },
  { title: 'Phase 7: Tuition & Fees', items: ['Fee items', 'Reductions', 'Invoice lifecycle'] },
  { title: 'Phase 8: Health', items: ['Health records', 'BMI', 'Growth chart', 'History'] },
] as const;

export async function loadSchoolShell(schoolSlug: string) {
  return prisma.school.findUnique({
    where: { slug: schoolSlug, deletedAt: null },
    include: {
      setting: true,
      schoolYears: true,
      classes: true,
      enrollments: true,
      staffMembers: true,
      feeItems: true,
      HealthRecord: true,
    },
  });
}

export function PhaseGrid() {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {sections.map((section) => (
        <article key={section.title} className="rounded-lg border border-border bg-card p-5">
          <h3 className="font-medium">{section.title}</h3>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {section.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      ))}
    </section>
  );
}