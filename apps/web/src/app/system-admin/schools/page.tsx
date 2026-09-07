import { prisma } from "@km/db";
import { SchoolsClient } from "./schools-client";

export const dynamic = "force-dynamic";

export default async function SchoolsListPage() {
  const rawSchools = await prisma.school.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      code: true,
      name: true,
      slug: true,
      ownerName: true,
      phone: true,
      email: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const schools = rawSchools.map((s) => ({
    ...s,
    createdAt: s.createdAt.toLocaleDateString("vi-VN"),
  }));

  return <SchoolsClient initialSchools={schools} />;
}
