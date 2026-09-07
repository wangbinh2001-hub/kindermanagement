import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@km/db';
import { appRouter } from '../../src/server/root';
import { TRPCError } from '@trpc/server';
import { maskPhone, maskEmail, maskIdNumber, maskAuditLogEntry } from '@km/validators';

const PREFIX = `KM_SEC_REV_${Date.now()}`;

describe('Phase 12: Security & Tenancy Comprehensive Review (P12.2)', () => {
  let schoolAId: string;
  let schoolBId: string;
  let adminAUserId: string;
  let adminBUserId: string;
  let teacherAUserId: string;
  let sysAdminUserId: string;

  let schoolYearAId: string;
  let classAId: string;
  let studentAId: string;
  let enrollmentAId: string;
  let invoiceAId: string;
  let parentReqAId: string;

  beforeAll(async () => {
    // 1. Tạo 2 trường A và B biệt lập
    const schoolA = await prisma.school.create({
      data: {
        code: `${PREFIX}_SCH_A`,
        slug: `${PREFIX.toLowerCase()}-sch-a`,
        name: `${PREFIX} Trường A`,
      },
    });
    schoolAId = schoolA.id;

    const schoolB = await prisma.school.create({
      data: {
        code: `${PREFIX}_SCH_B`,
        slug: `${PREFIX.toLowerCase()}-sch-b`,
        name: `${PREFIX} Trường B`,
      },
    });
    schoolBId = schoolB.id;

    // 2. Tạo School Year & Class tại Trường A
    const syA = await prisma.schoolYear.create({
      data: {
        schoolId: schoolAId,
        name: `${PREFIX} 2026-2027`,
        startDate: new Date('2026-09-01'),
        endDate: new Date('2027-05-31'),
        isCurrent: true,
      },
    });
    schoolYearAId = syA.id;

    const clsA = await prisma.class.create({
      data: {
        schoolId: schoolAId,
        schoolYearId: schoolYearAId,
        name: `${PREFIX} Lớp Mầm A`,
        ageGroup: 'PRESCHOOL_3_4Y',
        capacity: 20,
        isActive: true,
      },
    });
    classAId = clsA.id;

    // 3. Tạo User ID & Roles
    adminAUserId = `admin_a_${Date.now()}`;
    adminBUserId = `admin_b_${Date.now()}`;
    teacherAUserId = `teacher_a_${Date.now()}`;
    sysAdminUserId = `sysadmin_${Date.now()}`;

    await prisma.schoolAdmin.create({
      data: { schoolId: schoolAId, userId: adminAUserId },
    });
    await prisma.schoolAdmin.create({
      data: { schoolId: schoolBId, userId: adminBUserId },
    });
    await prisma.staffMember.create({
      data: {
        schoolId: schoolAId,
        userId: teacherAUserId,
        fullName: 'Cô Mai Trường A',
        employeeCode: `TEA_${Date.now().toString().slice(-4)}`,
        phone: '0912345678',
        roles: ['TEACHER'],
        hiredAt: new Date(),
      },
    });

    // 4. Tạo Học sinh tại Trường A
    const student = await prisma.student.create({
      data: {
        firstName: 'An',
        lastName: 'Nguyễn',
        gender: 'FEMALE',
        dateOfBirth: new Date('2023-01-10'),
        cccd: `07920300${Date.now().toString().slice(-4)}`,
        enrollments: {
          create: {
            schoolId: schoolAId,
            schoolYearId: schoolYearAId,
            enrollmentStatus: 'ACTIVE',
            currentClassId: classAId,
            classMemberships: {
              create: {
                classId: classAId,
                schoolYearId: schoolYearAId,
                startedAt: new Date('2026-09-01'),
              },
            },
          },
        },
      },
      include: { enrollments: true },
    });
    studentAId = student.id;
    enrollmentAId = student.enrollments[0]?.id || '';

    // 5. Tạo Hóa đơn học phí tại Trường A
    const invoice = await prisma.invoice.create({
      data: {
        schoolId: schoolAId,
        schoolYearId: schoolYearAId,
        studentSchoolRelationshipId: enrollmentAId,
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
        periodMonth: 9,
        periodYear: 2026,
        status: 'ISSUED',
        grossAmount: 3000000,
        discountAmount: 0,
        totalAmount: 3000000,
        dueAmount: 3000000,
        issuedAt: new Date(),
      },
    });
    invoiceAId = invoice.id;

    // 6. Tạo Yêu cầu Phụ huynh tại Trường A
    const parentReq = await prisma.parentRequest.create({
      data: {
        schoolId: schoolAId,
        studentSchoolRelationshipId: enrollmentAId,
        submittedBy: '0987654321 (Mẹ An)',
        type: 'ABSENCE_LEAVE',
        title: 'Xin nghỉ ốm',
        description: 'Bé bị ốm cần nghỉ 1 ngày',
        status: 'PENDING',
      },
    });
    parentReqAId = parentReq.id;

    // 7. Tạo Thực phẩm dinh dưỡng tại Trường A
    await prisma.foodItem.create({
      data: {
        schoolId: schoolAId,
        name: `${PREFIX} Cháo Yến Mạch`,
        mealSlot: 'MORNING',
        totalKcal: 250,
      },
    });
  });

  afterAll(async () => {
    // Dọn dẹp sạch sẽ toàn bộ test data
    const schoolIds = [schoolAId, schoolBId].filter(Boolean);
    if (schoolIds.length > 0) {
      await prisma.auditLog.deleteMany({ where: { schoolId: { in: schoolIds } } });
      await prisma.foodItem.deleteMany({ where: { schoolId: { in: schoolIds } } });
      await prisma.parentRequest.deleteMany({ where: { schoolId: { in: schoolIds } } });
      await prisma.invoice.deleteMany({ where: { schoolId: { in: schoolIds } } });
      await prisma.classMembership.deleteMany({ where: { relationship: { schoolId: { in: schoolIds } } } });
      await prisma.studentSchoolRelationship.deleteMany({ where: { schoolId: { in: schoolIds } } });
      if (studentAId) {
        await prisma.student.deleteMany({ where: { id: studentAId } });
      }
      await prisma.staffMember.deleteMany({ where: { schoolId: { in: schoolIds } } });
      await prisma.schoolAdmin.deleteMany({ where: { schoolId: { in: schoolIds } } });
      await prisma.class.deleteMany({ where: { schoolId: { in: schoolIds } } });
      await prisma.schoolYear.deleteMany({ where: { schoolId: { in: schoolIds } } });
      await prisma.school.deleteMany({ where: { id: { in: schoolIds } } });
    }
  });

  const callerFor = (userId: string, role: string, activeSchoolId?: string) =>
    appRouter.createCaller({
      prisma,
      user: { id: userId, role: role as any, activeSchoolId: activeSchoolId ?? null },
    });

  it('1. Tenancy Boundary: School Admin B cannot access School A students', async () => {
    const adminBCaller = callerFor(adminBUserId, 'SCHOOL_ADMIN', schoolBId);

    // Không tìm thấy học sinh của Trường A từ context Trường B
    await expect(
      adminBCaller.students.getById({ studentId: studentAId })
    ).rejects.toThrow();

    // Danh sách học sinh của Trường B không bao gồm học sinh Trường A
    const listB = await adminBCaller.students.list({});
    const foundAInB = listB.items.some((item) => item.student.id === studentAId);
    expect(foundAInB).toBe(false);
  });

  it('2. Tenancy Boundary: School Admin B cannot access School A tuition invoices', async () => {
    const adminBCaller = callerFor(adminBUserId, 'SCHOOL_ADMIN', schoolBId);

    // Hủy hoặc thao tác hóa đơn của Trường A từ Trường B bị từ chối NOT_FOUND do vi phạm tenancy
    await expect(
      adminBCaller.tuition.cancelInvoice({ invoiceId: invoiceAId, cancelReason: 'Cross-tenant probe' })
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('3. Tenancy Boundary: School Admin B cannot view or review School A parent requests', async () => {
    const adminBCaller = callerFor(adminBUserId, 'SCHOOL_ADMIN', schoolBId);

    // Review đơn của Trường A từ Trường B bị từ chối NOT_FOUND
    await expect(
      adminBCaller.parentRequests.review({
        requestId: parentReqAId,
        action: 'APPROVE',
        reviewNotes: 'Hacker attack',
      })
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('4. Tenancy Boundary: School Admin B cannot access School A nutrition food items', async () => {
    const adminBCaller = callerFor(adminBUserId, 'SCHOOL_ADMIN', schoolBId);

    const foodsInB = await adminBCaller.nutrition.listFoodItems();
    const hasSchoolAFood = foodsInB.some((f) => f.name.includes(`${PREFIX} Cháo Yến Mạch`));
    expect(hasSchoolAFood).toBe(false);
  });

  it('5. PII Masking: Non-PII readers and Audit Logs never expose raw sensitive data', () => {
    // Test helper che PII
    expect(maskPhone('0963124567')).toBe('096*****67');
    expect(maskEmail('phuhuynh@gmail.com')).toBe('p***@gmail.com');
    expect(maskIdNumber('079123456789')).toBe('0791****6789');

    // Test đệ quy trong Audit Log
    const rawAudit = {
      id: 'log-1',
      action: 'UPDATE',
      beforeJson: {
        parentPhone: '0987654321',
        parentCccd: '001200001234',
        email: 'secret@edu.vn',
        childName: 'Bé Lan',
      },
      afterJson: {
        parentPhone: '0912345678',
        parentCccd: '001200001234',
      },
    };

    const masked = maskAuditLogEntry(rawAudit);
    expect(masked.beforeJson.parentPhone).toBe('098*****21');
    expect(masked.beforeJson.parentCccd).toBe('0012****1234');
    expect(masked.beforeJson.email).toBe('s***@edu.vn');
    expect(masked.beforeJson.childName).toBe('Bé Lan'); // Không phải trường nhạy cảm thì giữ nguyên
    expect(masked.afterJson.parentPhone).toBe('091*****78');
  });

  it('6. Soft Delete Isolation: Deleted records are never returned by active queries', async () => {
    const adminACaller = callerFor(adminAUserId, 'SCHOOL_ADMIN', schoolAId);

    // Tạo một FoodItem tại Trường A rồi soft delete
    const tempFood = await prisma.foodItem.create({
      data: {
        schoolId: schoolAId,
        name: `${PREFIX} Món ăn tạm`,
        mealSlot: 'AFTERNOON',
        totalKcal: 100,
        deletedAt: new Date(),
      },
    });

    const activeFoods = await adminACaller.nutrition.listFoodItems();
    const foundDeleted = activeFoods.some((f) => f.id === tempFood.id);
    expect(foundDeleted).toBe(false);

    // Cleanup tempFood
    await prisma.foodItem.delete({ where: { id: tempFood.id } });
  });
});
