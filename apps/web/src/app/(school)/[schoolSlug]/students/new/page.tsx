import { notFound } from "next/navigation";
import { prisma } from "@km/db";
import { StudentIntakeClient } from "./student-intake-client";

export const metadata = {
  title: "Tiếp nhận Học sinh Mới | KinderManagement",
  description: "Quy trình tiếp nhận và số hóa hồ sơ học sinh mầm non",
};

export default async function NewStudentPage({
  params,
}: {
  params: Promise<{ schoolSlug: string }>;
}) {
  const { schoolSlug } = await params;

  const school = await prisma.school.findUnique({
    where: { slug: schoolSlug },
    include: {
      setting: true,
      schoolYears: {
        where: { deletedAt: null },
        select: { id: true, name: true, isCurrent: true },
        orderBy: { startDate: "desc" },
      },
      classes: {
        where: { deletedAt: null, isActive: true },
        select: { id: true, name: true, ageGroup: true, capacity: true },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!school || school.deletedAt) {
    notFound();
  }

  return (
    <StudentIntakeClient
      schoolId={school.id}
      schoolSlug={schoolSlug}
      schoolYears={school.schoolYears}
      classes={school.classes}
      currentYearId={school.setting?.currentSchoolYearId ?? undefined}
    />
  );
}
