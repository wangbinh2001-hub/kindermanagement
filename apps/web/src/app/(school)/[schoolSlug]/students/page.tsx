import { notFound } from "next/navigation";
import { prisma } from "@km/db";
import { StudentsListClient, StudentListItem } from "./students-list-client";

export const metadata = {
  title: "Danh sách Học sinh | KinderManagement",
  description: "Quản lý hồ sơ học sinh, nhân khẩu và phân lớp",
};

export default async function StudentsPage({
  params,
}: {
  params: Promise<{ schoolSlug: string }>;
}) {
  const { schoolSlug } = await params;

  const school = await prisma.school.findUnique({
    where: { slug: schoolSlug },
    include: {
      setting: true,
      classes: {
        where: { deletedAt: null, isActive: true },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      },
      schoolYears: {
        where: { deletedAt: null },
        select: { id: true, name: true, isCurrent: true },
        orderBy: { startDate: "desc" },
      },
    },
  });

  if (!school || school.deletedAt) {
    notFound();
  }

  const relationships = await prisma.studentSchoolRelationship.findMany({
    where: {
      schoolId: school.id,
      deletedAt: null,
    },
    include: {
      student: true,
      responsiblePersons: {
        where: { deletedAt: null },
        take: 1,
      },
      classMemberships: {
        where: { endedAt: null },
        include: { class: true },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const students: StudentListItem[] = relationships.map((rel) => {
    const activeClass = rel.classMemberships[0]?.class;
    const primaryPerson = rel.responsiblePersons[0];
    const fullName = [rel.student.lastName, rel.student.middleName, rel.student.firstName]
      .filter(Boolean)
      .join(" ");

    return {
      relationshipId: rel.id,
      studentId: rel.student.id,
      fullName,
      gender: rel.student.gender,
      dateOfBirth: rel.student.dateOfBirth.toISOString(),
      className: activeClass?.name ?? null,
      classId: activeClass?.id ?? null,
      enrollmentStatus: rel.enrollmentStatus,
      enrolledAt: rel.enrolledAt.toISOString(),
      parentName: primaryPerson?.fullName ?? null,
      parentPhone: primaryPerson?.phone ?? null,
      tuitionExempt: rel.student.tuitionExempt,
      lunchSupport: rel.student.lunchSupport,
    };
  });

  return (
    <StudentsListClient
      schoolSlug={schoolSlug}
      students={students}
      classes={school.classes}
      schoolYears={school.schoolYears}
      currentYearId={school.setting?.currentSchoolYearId ?? undefined}
    />
  );
}
