import { prisma } from '@km/db';
import { getSchoolOrNull } from '../../layout';

export default async function HealthGrowthChartPage({
  params,
  searchParams,
}: {
  params: Promise<{ schoolSlug: string }>;
  searchParams: { studentId?: string; classId?: string };
}) {
  const { schoolSlug } = await params;
  const { studentId, classId } = await searchParams;
  const school = await getSchoolOrNull(schoolSlug);

  if (!school) return <div>Không tìm thấy trường học.</div>;

  // Get current school year
  const currentYearId = school.setting?.currentSchoolYearId;
  const currentYear = currentYearId
    ? await prisma.schoolYear.findUnique({ where: { id: currentYearId } })
    : null;

  // Get classes filter dropdown
  const classes = currentYear
    ? await prisma.class.findMany({
        where: { schoolId: school.id, schoolYearId: currentYear.id, deletedAt: null, isActive: true },
        orderBy: { name: 'asc' },
      })
    : [];

  // Get students filter dropdown (from selected class all)
  type StudentOption = {
    id: string;
    name: string;
    gender: string;
    dateOfBirth: Date | null;
  };
  const students: StudentOption[] = [];
  if (classId) {
    const memberships = await prisma.classMembership.findMany({
      where: { classId, endedAt: null },
      include: { relationship: { include: { student: true } } },
    });
    students.push(
      ...memberships.map((m) => ({
        id: m.studentSchoolRelationshipId,
        name: `${m.relationship.student.lastName} ${m.relationship.student.firstName}`,
        gender: m.relationship.student.gender,
        dateOfBirth: m.relationship.student.dateOfBirth,
      }))
    );
  }

  // specific student selected, fetch growth history
  type GrowthRecord = {
    measuredAt: Date;
    heightCm: number;
    weightKg: number;
    bmi: number;
    bmiCategory: string;
  };
  const growthData: GrowthRecord[] = [];
  type SelectedStudent = {
    id: string;
    lastName: string;
    firstName: string;
    gender: string;
    dateOfBirth: Date | null;
  } | null;
  let selectedStudent: SelectedStudent = null;
  if (studentId) {
    const studentRel = await prisma.studentSchoolRelationship.findUnique({
      where: { id: studentId },
      include: { student: true },
    });
    if (studentRel) {
      selectedStudent = {
        id: studentRel.id,
        lastName: studentRel.student.lastName,
        firstName: studentRel.student.firstName,
        gender: studentRel.student.gender,
        dateOfBirth: studentRel.student.dateOfBirth,
      };
      const records = await prisma.healthRecord.findMany({
        where: { studentSchoolRelationshipId: studentId, schoolId: school.id },
        orderBy: { measuredAt: 'asc' },
      });
      growthData.push(
        ...records.map((r) => ({
          measuredAt: r.measuredAt,
          heightCm: r.heightCm.toNumber(),
          weightKg: r.weightKg.toNumber(),
          bmi: r.bmi.toNumber(),
          bmiCategory: r.bmiCategory ?? 'UNKNOWN',
        }))
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold">Biểu đồ tăng trưởng</h1>
        <div className="flex flex-wrap gap-2">
          <select
            name="classId"
            className="border rounded px-3 py-2 text-sm"
            onChange={(e) => {
              window.location.href = `/${schoolSlug}/health/growth-chart?classId=${e.target.value}`;
            }}
            value={classId || ''}
          >
            <option value="">-- Chọn lớp --</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
          <select
            name="studentId"
            className="border rounded px-3 py-2 text-sm"
            onChange={(e) => {
              window.location.href = `/${schoolSlug}/health/growth-chart?classId=${classId || ''}&studentId=${e.target.value}`;
            }}
            value={studentId || ''}
          >
            <option value="">-- Chọn học sinh --</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.gender})
              </option>
            ))}
          </select>
        </div>
      </div>

      {studentId && selectedStudent && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium mb-4">
            {selectedStudent.lastName} {selectedStudent.firstName} ({selectedStudent.gender})
          </h2>
          {growthData.length === 0 ? (
            <p className="text-gray-500">Chưa có dữ liệu tăng trưởng.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Ngày đo</th>
                  <th className="text-left p-2">Chiều cao (cm)</th>
                  <th className="text-left p-2">Cân nặng (kg)</th>
                  <th className="text-left p-2">BMI</th>
                  <th className="text-left p-2">Phân loại</th>
                </tr>
              </thead>
              <tbody>
                {growthData.map((record, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-2">{record.measuredAt.toLocaleDateString('vi-VN')}</td>
                    <td className="p-2">{record.heightCm}</td>
                    <td className="p-2">{record.weightKg}</td>
                    <td className="p-2">{record.bmi.toFixed(1)}</td>
                    <td className="p-2">{record.bmiCategory}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {!studentId && (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          Chọn học sinh để xem biểu đồ tăng trưởng.
        </div>
      )}
    </div>
  );
}