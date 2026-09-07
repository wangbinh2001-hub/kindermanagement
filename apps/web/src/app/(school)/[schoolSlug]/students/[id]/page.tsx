import { notFound } from "next/navigation";
import { prisma } from "@km/db";
import { StudentDetailClient } from "./student-detail-client";

export const metadata = {
  title: "Hồ sơ Học sinh | KinderManagement",
  description: "Chi tiết hồ sơ học sinh, gia đình và lịch sử chuyển lớp",
};

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ schoolSlug: string; id: string }>;
}) {
  const { schoolSlug, id } = await params;

  const school = await prisma.school.findUnique({
    where: { slug: schoolSlug },
    include: {
      classes: {
        where: { deletedAt: null, isActive: true },
        select: { id: true, name: true, ageGroup: true },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!school || school.deletedAt) {
    notFound();
  }

  const relationship = await prisma.studentSchoolRelationship.findUnique({
    where: { id },
    include: {
      student: true,
      responsiblePersons: {
        where: { deletedAt: null },
      },
      classMemberships: {
        include: { class: true },
        orderBy: { startedAt: "desc" },
      },
    },
  });

  if (!relationship || relationship.schoolId !== school.id || relationship.deletedAt) {
    notFound();
  }

  const activeMembership = relationship.classMemberships.find((m) => m.endedAt === null);

  const formattedRelationship = {
    id: relationship.id,
    enrollmentStatus: relationship.enrollmentStatus,
    enrolledAt: relationship.enrolledAt.toISOString(),
    withdrawnAt: relationship.withdrawnAt?.toISOString() ?? null,
    withdrawalReason: relationship.withdrawalReason,
    currentClass: activeMembership?.class
      ? {
          id: activeMembership.class.id,
          name: activeMembership.class.name,
          ageGroup: activeMembership.class.ageGroup,
        }
      : null,
    student: {
      id: relationship.student.id,
      firstName: relationship.student.firstName,
      middleName: relationship.student.middleName,
      lastName: relationship.student.lastName,
      gender: relationship.student.gender,
      dateOfBirth: relationship.student.dateOfBirth.toISOString(),
      cccd: relationship.student.cccd,
      personalIdNumber: relationship.student.personalIdNumber,
      phoneContact: relationship.student.phoneContact,
      permanentAddressProvince: relationship.student.permanentAddressProvince,
      permanentAddressDistrict: relationship.student.permanentAddressDistrict,
      permanentAddressWard: relationship.student.permanentAddressWard,
      permanentAddressDetail: relationship.student.permanentAddressDetail,
      currentAddressProvince: relationship.student.currentAddressProvince,
      currentAddressDistrict: relationship.student.currentAddressDistrict,
      currentAddressWard: relationship.student.currentAddressWard,
      currentAddressDetail: relationship.student.currentAddressDetail,
      policyObject: relationship.student.policyObject,
      disabilityType: relationship.student.disabilityType,
      tuitionExempt: relationship.student.tuitionExempt,
      tuitionReduced: relationship.student.tuitionReduced,
      studyCostSupport: relationship.student.studyCostSupport,
      lunchSupport: relationship.student.lunchSupport,
    },
    responsiblePersons: relationship.responsiblePersons.map((p) => ({
      id: p.id,
      type: p.type,
      fullName: p.fullName,
      yearOfBirth: p.yearOfBirth,
      phone: p.phone,
      cccd: p.cccd,
      occupation: p.occupation,
      noInfo: p.noInfo,
    })),
    classMemberships: relationship.classMemberships.map((m) => ({
      id: m.id,
      startedAt: m.startedAt.toISOString(),
      endedAt: m.endedAt?.toISOString() ?? null,
      class: {
        id: m.class.id,
        name: m.class.name,
        ageGroup: m.class.ageGroup,
      },
    })),
  };

  return (
    <StudentDetailClient
      schoolId={school.id}
      schoolSlug={schoolSlug}
      relationship={formattedRelationship}
      availableClasses={school.classes}
    />
  );
}
