'use server';

import { prisma, Prisma, Gender, EnrollmentStatus, ResponsiblePersonType } from '@km/db';
import { revalidatePath } from 'next/cache';
import {
  createStudentSchema,
  updateStudentGlobalSchema,
  transferStudentClassSchema,
  withdrawStudentSchema,
  updateEnrollmentSchema,
  CreateStudentInput,
} from '@km/validators/schemas/students';

function jsonValue(value: unknown): Prisma.InputJsonValue {
  if (value === undefined || value === null) return null as unknown as Prisma.InputJsonValue;
  return value as Prisma.InputJsonValue;
}

async function writeAuditLog(opts: {
  schoolId: string;
  userId?: string;
  userRole?: string;
  entityType: string;
  entityId: string;
  action: string;
  beforeJson?: unknown;
  afterJson?: unknown;
  metadata?: unknown;
}) {
  const {
    schoolId,
    userId = 'school-admin-current',
    userRole = 'SCHOOL_ADMIN',
    entityType,
    entityId,
    action,
    beforeJson,
    afterJson,
    metadata,
  } = opts;

  await prisma.auditLog.create({
    data: {
      schoolId,
      userId,
      userRole,
      entityType,
      entityId,
      action,
      beforeJson: jsonValue(beforeJson),
      afterJson: jsonValue(afterJson),
      metadata: jsonValue(metadata),
    },
  });
}

// 1. Nhập học học sinh mới (Enrollment Transaction - P4.2)
export async function enrollStudentAction(schoolId: string, rawInput: unknown) {
  const parsed = createStudentSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Dữ liệu học sinh không hợp lệ',
    };
  }

  const input: CreateStudentInput = parsed.data;

  try {
    // Zero Data Leak: Kiểm tra định danh CCCD / Định danh cá nhân nếu có
    let existingStudentId: string | null = null;
    if (input.cccd) {
      const existing = await prisma.student.findFirst({
        where: { cccd: input.cccd, deletedAt: null },
        select: { id: true },
      });
      if (existing) existingStudentId = existing.id;
    } else if (input.personalIdNumber) {
      const existing = await prisma.student.findFirst({
        where: { personalIdNumber: input.personalIdNumber, deletedAt: null },
        select: { id: true },
      });
      if (existing) existingStudentId = existing.id;
    }

    // Nếu học sinh đã có trên hệ thống toàn cục, kiểm tra xem đã nhập học ở trường này chưa
    if (existingStudentId) {
      const activeEnrollment = await prisma.studentSchoolRelationship.findFirst({
        where: {
          studentId: existingStudentId,
          schoolId,
          enrollmentStatus: 'ACTIVE',
          deletedAt: null,
        },
      });

      if (activeEnrollment) {
        return {
          success: false,
          error: 'Học sinh với định danh này hiện đang theo học tại trường',
        };
      }
    }

    // Thực hiện trong Transaction an toàn
    const result = await prisma.$transaction(async (tx) => {
      let studentId = existingStudentId;

      if (!studentId) {
        const student = await tx.student.create({
          data: {
            firstName: input.firstName,
            middleName: input.middleName ?? null,
            lastName: input.lastName,
            gender: input.gender as Gender,
            dateOfBirth: new Date(input.dateOfBirth),
            cccd: input.cccd ?? null,
            cccdIssuedAt: input.cccdIssuedAt ? new Date(input.cccdIssuedAt) : null,
            cccdIssuedBy: input.cccdIssuedBy ?? null,
            personalIdNumber: input.personalIdNumber ?? null,
            passportNumber: input.passportNumber ?? null,
            passportIssuedAt: input.passportIssuedAt ? new Date(input.passportIssuedAt) : null,
            passportIssuedBy: input.passportIssuedBy ?? null,
            permanentAddressProvince: input.permanentAddressProvince ?? null,
            permanentAddressDistrict: input.permanentAddressDistrict ?? null,
            permanentAddressWard: input.permanentAddressWard ?? null,
            permanentAddressDetail: input.permanentAddressDetail ?? null,
            currentAddressProvince: input.currentAddressProvince ?? null,
            currentAddressDistrict: input.currentAddressDistrict ?? null,
            currentAddressWard: input.currentAddressWard ?? null,
            currentAddressDetail: input.currentAddressDetail ?? null,
            phoneContact: input.phoneContact ?? null,
            disabilityType: input.disabilityType ?? null,
            policyObject: input.policyObject ?? null,
            tuitionExempt: input.tuitionExempt ?? false,
            tuitionReduced: input.tuitionReduced ?? false,
            studyCostSupport: input.studyCostSupport ?? false,
            lunchSupport: input.lunchSupport ?? false,
          },
        });
        studentId = student.id;
      }

      // 2. Tạo quan hệ StudentSchoolRelationship (Tenant-scoped)
      const relationship = await tx.studentSchoolRelationship.create({
        data: {
          studentId,
          schoolId,
          schoolYearId: input.schoolYearId,
          idempotencyKey: input.idempotencyKey,
          enrollmentStatus: 'ACTIVE',
          enrolledAt: input.enrolledAt ? new Date(input.enrolledAt) : new Date(),
          initialClassId: input.initialClassId ?? null,
          currentClassId: input.initialClassId ?? null,
        },
      });

      // 3. Tạo ResponsiblePerson và ParentIdentity
      for (const person of input.responsiblePersons) {
        let parentIdentityId: string | null = null;
        if (person.phone) {
          const parentIdentity = await tx.parentIdentity.upsert({
            where: { phone: person.phone },
            create: { phone: person.phone },
            update: {},
          });
          parentIdentityId = parentIdentity.id;
        }

        await tx.responsiblePerson.create({
          data: {
            studentSchoolRelationshipId: relationship.id,
            type: person.type as ResponsiblePersonType,
            fullName: person.fullName ?? null,
            yearOfBirth: person.yearOfBirth ?? null,
            occupation: person.occupation ?? null,
            phone: person.phone ?? null,
            cccd: person.cccd ?? null,
            parentIdentityId,
            noInfo: person.noInfo ?? false,
          },
        });
      }

      // 4. Nếu có lớp ban đầu, tạo ClassMembership
      if (input.initialClassId) {
        await tx.classMembership.create({
          data: {
            studentSchoolRelationshipId: relationship.id,
            classId: input.initialClassId,
            schoolYearId: input.schoolYearId,
            startedAt: input.enrolledAt ? new Date(input.enrolledAt) : new Date(),
          },
        });
      }

      return { studentId, relationshipId: relationship.id };
    });

    await writeAuditLog({
      schoolId,
      entityType: 'StudentSchoolRelationship',
      entityId: result.relationshipId,
      action: 'ENROLL_STUDENT',
      afterJson: {
        studentId: result.studentId,
        schoolYearId: input.schoolYearId,
        initialClassId: input.initialClassId,
      },
    });

    revalidatePath(`/(school)/[schoolSlug]/students`, 'page');

    return { success: true, data: result };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Lỗi hệ thống khi nhập học cho trẻ',
    };
  }
}

// 2. Cập nhật hồ sơ học sinh (P4.1)
export async function updateStudentProfileAction(schoolId: string, rawInput: unknown) {
  const parsed = updateStudentGlobalSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Dữ liệu cập nhật không hợp lệ',
    };
  }

  const input = parsed.data;

  try {
    const student = await prisma.student.update({
      where: { id: input.studentId },
      data: {
        firstName: input.firstName,
        middleName: input.middleName,
        lastName: input.lastName,
        gender: input.gender as Gender | undefined,
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
        cccd: input.cccd,
        cccdIssuedAt: input.cccdIssuedAt ? new Date(input.cccdIssuedAt) : undefined,
        cccdIssuedBy: input.cccdIssuedBy,
        personalIdNumber: input.personalIdNumber,
        passportNumber: input.passportNumber,
        passportIssuedAt: input.passportIssuedAt ? new Date(input.passportIssuedAt) : undefined,
        passportIssuedBy: input.passportIssuedBy,
        permanentAddressProvince: input.permanentAddressProvince,
        permanentAddressDistrict: input.permanentAddressDistrict,
        permanentAddressWard: input.permanentAddressWard,
        permanentAddressDetail: input.permanentAddressDetail,
        currentAddressProvince: input.currentAddressProvince,
        currentAddressDistrict: input.currentAddressDistrict,
        currentAddressWard: input.currentAddressWard,
        currentAddressDetail: input.currentAddressDetail,
        phoneContact: input.phoneContact,
        disabilityType: input.disabilityType,
        policyObject: input.policyObject,
        tuitionExempt: input.tuitionExempt,
        tuitionReduced: input.tuitionReduced,
        studyCostSupport: input.studyCostSupport,
        lunchSupport: input.lunchSupport,
      },
    });

    await writeAuditLog({
      schoolId,
      entityType: 'Student',
      entityId: student.id,
      action: 'UPDATE_STUDENT_PROFILE',
      afterJson: { studentId: student.id },
    });

    return { success: true, data: student };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Lỗi cập nhật hồ sơ học sinh',
    };
  }
}

// 3. Chuyển lớp học sinh (Class Transfer History - P4.3)
export async function transferStudentClassAction(schoolId: string, rawInput: unknown) {
  const parsed = transferStudentClassSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Dữ liệu chuyển lớp không hợp lệ',
    };
  }

  const { enrollmentId, targetClassId, effectiveAt } = parsed.data;

  try {
    const relationship = await prisma.studentSchoolRelationship.findUnique({
      where: { id: enrollmentId },
    });

    if (!relationship || relationship.schoolId !== schoolId) {
      return { success: false, error: 'Không tìm thấy hồ sơ học sinh tại trường' };
    }

    if (relationship.currentClassId === targetClassId) {
      return { success: false, error: 'Học sinh hiện đã đang theo học lớp này' };
    }

    const targetClass = await prisma.class.findUnique({
      where: { id: targetClassId },
    });

    if (!targetClass || targetClass.schoolId !== schoolId) {
      return { success: false, error: 'Lớp học mục tiêu không thuộc trường' };
    }

    const effectiveDate = new Date(effectiveAt);

    await prisma.$transaction(async (tx) => {
      // Đóng ClassMembership hiện tại
      await tx.classMembership.updateMany({
        where: {
          studentSchoolRelationshipId: enrollmentId,
          endedAt: null,
        },
        data: {
          endedAt: effectiveDate,
        },
      });

      // Mở ClassMembership mới
      await tx.classMembership.create({
        data: {
          studentSchoolRelationshipId: enrollmentId,
          classId: targetClassId,
          schoolYearId: relationship.schoolYearId,
          startedAt: effectiveDate,
        },
      });

      // Cập nhật currentClassId
      await tx.studentSchoolRelationship.update({
        where: { id: enrollmentId },
        data: { currentClassId: targetClassId },
      });
    });

    await writeAuditLog({
      schoolId,
      entityType: 'StudentSchoolRelationship',
      entityId: enrollmentId,
      action: 'TRANSFER_CLASS',
      beforeJson: { currentClassId: relationship.currentClassId },
      afterJson: { currentClassId: targetClassId, effectiveAt: effectiveDate },
    });

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Lỗi khi thực hiện chuyển lớp',
    };
  }
}

// 4. Cập nhật trạng thái nhập học / Thôi học (Status Transitions - P4.4)
export async function updateEnrollmentStatusAction(
  schoolId: string,
  rawInput: unknown
) {
  // Check if withdraw or generic update
  const isWithdraw = typeof rawInput === 'object' && rawInput !== null && 'withdrawalReason' in rawInput;

  if (isWithdraw) {
    const parsed = withdrawStudentSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Lý do thôi học không hợp lệ',
      };
    }

    const { enrollmentId, withdrawalReason, withdrawnAt } = parsed.data;

    try {
      const relationship = await prisma.studentSchoolRelationship.findUnique({
        where: { id: enrollmentId },
      });

      if (!relationship || relationship.schoolId !== schoolId) {
        return { success: false, error: 'Không tìm thấy hồ sơ học sinh' };
      }

      const withdrawDate = new Date(withdrawnAt);

      await prisma.$transaction(async (tx) => {
        // Đóng class membership
        await tx.classMembership.updateMany({
          where: {
            studentSchoolRelationshipId: enrollmentId,
            endedAt: null,
          },
          data: {
            endedAt: withdrawDate,
          },
        });

        // Cập nhật status sang WITHDRAWN
        await tx.studentSchoolRelationship.update({
          where: { id: enrollmentId },
          data: {
            enrollmentStatus: 'WITHDRAWN',
            withdrawnAt: withdrawDate,
            withdrawalReason,
          },
        });
      });

      await writeAuditLog({
        schoolId,
        entityType: 'StudentSchoolRelationship',
        entityId: enrollmentId,
        action: 'WITHDRAW_STUDENT',
        afterJson: { enrollmentStatus: 'WITHDRAWN', withdrawalReason, withdrawnAt: withdrawDate },
      });

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Lỗi khi ghi nhận thôi học',
      };
    }
  } else {
    const parsed = updateEnrollmentSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? 'Trạng thái nhập học không hợp lệ',
      };
    }

    const { enrollmentId, enrollmentStatus } = parsed.data;

    try {
      const relationship = await prisma.studentSchoolRelationship.findUnique({
        where: { id: enrollmentId },
      });

      if (!relationship || relationship.schoolId !== schoolId) {
        return { success: false, error: 'Không tìm thấy hồ sơ học sinh' };
      }

      await prisma.studentSchoolRelationship.update({
        where: { id: enrollmentId },
        data: {
          enrollmentStatus: enrollmentStatus as EnrollmentStatus | undefined,
        },
      });

      await writeAuditLog({
        schoolId,
        entityType: 'StudentSchoolRelationship',
        entityId: enrollmentId,
        action: 'UPDATE_ENROLLMENT_STATUS',
        beforeJson: { enrollmentStatus: relationship.enrollmentStatus },
        afterJson: { enrollmentStatus },
      });

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Lỗi khi cập nhật trạng thái',
      };
    }
  }
}
