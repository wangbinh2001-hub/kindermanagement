import { z } from 'zod';

export const genderEnum = z.enum(['MALE', 'FEMALE', 'OTHER']);
export type Gender = z.infer<typeof genderEnum>;

export const enrollmentStatusEnum = z.enum(['ACTIVE', 'WITHDRAWN', 'GRADUATED', 'ON_LEAVE']);
export type EnrollmentStatus = z.infer<typeof enrollmentStatusEnum>;

export const responsiblePersonTypeEnum = z.enum(['FATHER', 'MOTHER', 'GUARDIAN']);
export type ResponsiblePersonType = z.infer<typeof responsiblePersonTypeEnum>;

function compactString(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const compacted = value.trim();
  return compacted.length === 0 ? undefined : compacted;
}

function compactIdentifier(value: unknown): unknown {
  const compacted = compactString(value);
  return typeof compacted === 'string'
    ? compacted.replace(/[\s-]/g, '').toUpperCase()
    : compacted;
}

export function normalizeVietnamesePhoneNumber(value: unknown): unknown {
  const compacted = compactString(value);
  if (typeof compacted !== 'string') return compacted;

  const digits = compacted.replace(/[^\d+]/g, '');
  if (/^0\d{9}$/.test(digits)) return `+84${digits.slice(1)}`;
  if (/^84\d{9}$/.test(digits)) return `+${digits}`;
  return digits;
}

const optionalText = (maximum: number) =>
  z.preprocess(compactString, z.string().max(maximum).optional());

const cccdSchema = z.preprocess(
  compactIdentifier,
  z.string().regex(/^\d{12}$/, 'CCCD phải gồm đúng 12 chữ số').optional(),
);

const personalIdSchema = z.preprocess(
  compactIdentifier,
  z.string().min(6).max(20).regex(/^[A-Z0-9]+$/, 'Số định danh không hợp lệ').optional(),
);

const passportSchema = z.preprocess(
  compactIdentifier,
  z.string().min(6).max(20).regex(/^[A-Z0-9]+$/, 'Số hộ chiếu không hợp lệ').optional(),
);

const phoneSchema = z.preprocess(
  normalizeVietnamesePhoneNumber,
  z.string().regex(/^\+84\d{9}$/, 'Số điện thoại Việt Nam không hợp lệ').optional(),
);

export const responsiblePersonSchema = z
  .object({
    type: responsiblePersonTypeEnum,
    fullName: optionalText(200),
    yearOfBirth: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
    occupation: optionalText(200),
    phone: phoneSchema,
    cccd: cccdSchema,
    noInfo: z.boolean().default(false),
  })
  .superRefine((person, ctx) => {
    const hasAnyInformation = Boolean(
      person.fullName || person.yearOfBirth || person.occupation || person.phone || person.cccd,
    );

    if (person.noInfo && hasAnyInformation) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['noInfo'],
        message: 'Không thể vừa đánh dấu không có thông tin vừa nhập dữ liệu',
      });
      return;
    }

    if (!person.noInfo && hasAnyInformation) {
      if (!person.fullName) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['fullName'], message: 'Họ tên là bắt buộc' });
      }
      if (!person.yearOfBirth) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['yearOfBirth'], message: 'Năm sinh là bắt buộc' });
      }
      if (!person.phone) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['phone'], message: 'Số điện thoại là bắt buộc' });
      }
    }
  });

export type ResponsiblePersonInput = z.infer<typeof responsiblePersonSchema>;

export function validateResponsiblePersons(persons: ResponsiblePersonInput[]): boolean {
  return persons.some(
    (person) => !person.noInfo && Boolean(person.fullName && person.yearOfBirth && person.phone),
  );
}

const responsiblePersonsSchema = z
  .array(responsiblePersonSchema)
  .min(1, 'Cần ít nhất một người chịu trách nhiệm')
  .max(3, 'Chỉ hỗ trợ Cha, Mẹ và Người giám hộ')
  .superRefine((persons, ctx) => {
    const types = new Set<ResponsiblePersonType>();
    persons.forEach((person, index) => {
      if (types.has(person.type)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index, 'type'],
          message: 'Mỗi loại người chịu trách nhiệm chỉ được khai báo một lần',
        });
      }
      types.add(person.type);
    });

    if (!validateResponsiblePersons(persons)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Cần ít nhất một người chịu trách nhiệm có đủ họ tên, năm sinh và số điện thoại',
      });
    }
  });

const studentGlobalFields = {
  firstName: z.string().trim().min(1).max(100),
  middleName: optionalText(100),
  lastName: z.string().trim().min(1).max(100),
  gender: genderEnum,
  dateOfBirth: z.coerce.date(),
  cccd: cccdSchema,
  cccdIssuedAt: z.coerce.date().optional(),
  cccdIssuedBy: optionalText(200),
  personalIdNumber: personalIdSchema,
  passportNumber: passportSchema,
  passportIssuedAt: z.coerce.date().optional(),
  passportIssuedBy: optionalText(200),
  permanentAddressProvince: optionalText(100),
  permanentAddressDistrict: optionalText(100),
  permanentAddressWard: optionalText(100),
  permanentAddressDetail: optionalText(500),
  currentAddressProvince: optionalText(100),
  currentAddressDistrict: optionalText(100),
  currentAddressWard: optionalText(100),
  currentAddressDetail: optionalText(500),
  phoneContact: phoneSchema,
  disabilityType: optionalText(200),
  policyObject: optionalText(200),
  tuitionExempt: z.boolean().default(false),
  tuitionReduced: z.boolean().default(false),
  studyCostSupport: z.boolean().default(false),
  lunchSupport: z.boolean().default(false),
};

export const createStudentSchema = z.object({
  ...studentGlobalFields,
  idempotencyKey: z.string().trim().min(8).max(128),
  schoolYearId: z.string().min(1),
  initialClassId: z.string().min(1).optional(),
  enrolledAt: z.coerce.date().optional(),
  responsiblePersons: responsiblePersonsSchema,
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;

export const updateStudentGlobalSchema = z.object({
  studentId: z.string().min(1),
  firstName: studentGlobalFields.firstName.optional(),
  middleName: studentGlobalFields.middleName,
  lastName: studentGlobalFields.lastName.optional(),
  gender: genderEnum.optional(),
  dateOfBirth: z.coerce.date().optional(),
  cccd: cccdSchema,
  cccdIssuedAt: z.coerce.date().optional(),
  cccdIssuedBy: studentGlobalFields.cccdIssuedBy,
  personalIdNumber: personalIdSchema,
  passportNumber: passportSchema,
  passportIssuedAt: z.coerce.date().optional(),
  passportIssuedBy: studentGlobalFields.passportIssuedBy,
  phoneContact: phoneSchema,
  permanentAddressProvince: studentGlobalFields.permanentAddressProvince,
  permanentAddressDistrict: studentGlobalFields.permanentAddressDistrict,
  permanentAddressWard: studentGlobalFields.permanentAddressWard,
  permanentAddressDetail: studentGlobalFields.permanentAddressDetail,
  currentAddressProvince: studentGlobalFields.currentAddressProvince,
  currentAddressDistrict: studentGlobalFields.currentAddressDistrict,
  currentAddressWard: studentGlobalFields.currentAddressWard,
  currentAddressDetail: studentGlobalFields.currentAddressDetail,
  disabilityType: studentGlobalFields.disabilityType,
  policyObject: studentGlobalFields.policyObject,
  tuitionExempt: z.boolean().optional(),
  tuitionReduced: z.boolean().optional(),
  studyCostSupport: z.boolean().optional(),
  lunchSupport: z.boolean().optional(),
});

export const updateEnrollmentSchema = z.object({
  enrollmentId: z.string().min(1),
  enrollmentStatus: z.enum(['ACTIVE', 'GRADUATED', 'ON_LEAVE']).optional(),
});

export const withdrawStudentSchema = z.object({
  enrollmentId: z.string().min(1),
  withdrawalReason: z.string().trim().min(1).max(500),
  withdrawnAt: z.coerce.date(),
});

export const transferStudentClassSchema = z.object({
  enrollmentId: z.string().min(1),
  targetClassId: z.string().min(1),
  effectiveAt: z.coerce.date(),
});

export const studentByIdSchema = z.object({
  studentId: z.string().min(1),
});

export const enrollmentByIdSchema = z.object({
  enrollmentId: z.string().min(1),
});

export const updateResponsiblePersonsSchema = z.object({
  enrollmentId: z.string().min(1),
  responsiblePersons: responsiblePersonsSchema,
});

export const studentListFilterSchema = z.object({
  schoolYearId: z.string().min(1).optional(),
  classId: z.string().min(1).optional(),
  enrollmentStatus: enrollmentStatusEnum.optional(),
  search: z.string().trim().max(100).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});
