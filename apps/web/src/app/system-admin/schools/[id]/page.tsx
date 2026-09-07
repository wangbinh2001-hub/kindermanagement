import { notFound } from "next/navigation";
import { prisma } from "@km/db";
import { SchoolDetailClient } from "./school-detail-client";

export const dynamic = "force-dynamic";

export default async function SchoolDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const school = await prisma.school.findUnique({
    where: { id },
    include: {
      setting: true,
      auditLogs: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!school || school.deletedAt) {
    notFound();
  }

  const serializedSchool = {
    id: school.id,
    code: school.code,
    name: school.name,
    slug: school.slug,
    ownerName: school.ownerName,
    phone: school.phone,
    email: school.email,
    address: school.address,
    status: school.status,
    createdAt: school.createdAt.toLocaleDateString("vi-VN"),
    setting: {
      enableAttendance: school.setting?.enableAttendance ?? true,
      enableTuition: school.setting?.enableTuition ?? true,
      enableHealth: school.setting?.enableHealth ?? true,
      enableNutrition: school.setting?.enableNutrition ?? false,
    },
    auditLogs: school.auditLogs.map((log) => ({
      id: log.id,
      action: log.action,
      userRole: log.userRole,
      createdAt: log.createdAt.toLocaleDateString("vi-VN"),
      metadata: log.metadata,
    })),
  };

  return <SchoolDetailClient school={serializedSchool} />;
}
