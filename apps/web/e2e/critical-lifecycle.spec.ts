import { test, expect } from '@playwright/test';
import { prisma } from '@km/db';

const testId = Date.now().toString().slice(-4);
const testSchoolCode = `SCH-CRIT-${testId}`;
const testSchoolSlug = `kinder-e2e-critical-${testId}`;
const testSchoolName = `Trường Mầm Non Thực Nghiệm Critical ${testId}`;

let schoolId = '';
let schoolYearId = '';
let classId = '';
let studentId = '';
let enrollmentId = '';

test.describe.serial('Phase 12: Critical End-to-End Operational Lifecycle (P12.1)', () => {
  test.beforeAll(async () => {
    // 1. Khởi tạo Trường mầm non (System Admin provisioning simulated)
    const school = await prisma.school.create({
      data: {
        code: testSchoolCode,
        slug: testSchoolSlug,
        name: testSchoolName,
        status: 'ACTIVE',
        phone: '0912345678',
        email: `critical.${testId}@kindermanagement.edu.vn`,
        setting: {
          create: {
            enableAttendance: true,
            enableTuition: true,
            enableHealth: true,
            enableNutrition: true,
          },
        },
      },
    });
    schoolId = school.id;

    // 2. Khởi tạo Năm học
    const schoolYear = await prisma.schoolYear.create({
      data: {
        schoolId,
        name: 'Năm học 2026 - 2027',
        startDate: new Date('2026-09-01'),
        endDate: new Date('2027-05-31'),
        isCurrent: true,
      },
    });
    schoolYearId = schoolYear.id;

    await prisma.schoolSetting.update({
      where: { schoolId },
      data: { currentSchoolYearId: schoolYearId },
    });

    // 3. Khởi tạo Lớp học
    const cls = await prisma.class.create({
      data: {
        schoolId,
        schoolYearId,
        name: 'Lớp Mầm 1 (Ban Mai)',
        ageGroup: 'TODDLER_18_36M',
        capacity: 20,
        isActive: true,
      },
    });
    classId = cls.id;

    // 4. Khởi tạo Học sinh, Phụ huynh & Phân lớp
    const student = await prisma.student.create({
      data: {
        firstName: 'Gia',
        lastName: 'Trần',
        gender: 'MALE',
        dateOfBirth: new Date('2023-03-15'),
        cccd: `00120300${testId}`,
        enrollments: {
          create: {
            schoolId,
            schoolYearId,
            enrollmentStatus: 'ACTIVE',
            currentClassId: classId,
            classMemberships: {
              create: {
                classId,
                schoolYearId,
                startedAt: new Date('2026-09-01'),
              },
            },
            responsiblePersons: {
              create: [
                {
                  type: 'MOTHER',
                  fullName: 'Nguyễn Thu Trang',
                  phone: `0987${testId}12`,
                  yearOfBirth: 1994,
                  noInfo: false,
                },
              ],
            },
          },
        },
      },
      include: {
        enrollments: true,
      },
    });
    studentId = student.id;
    enrollmentId = student.enrollments[0]?.id || '';
  });

  test.afterAll(async () => {
    // Dọn dẹp sạch sẽ toàn bộ test data
    if (schoolId) {
      await prisma.auditLog.deleteMany({ where: { schoolId } });
      await prisma.parentRequest.deleteMany({ where: { schoolId } });
      await prisma.invoiceItem.deleteMany({ where: { invoice: { schoolId } } });
      await prisma.invoice.deleteMany({ where: { schoolId } });
      await prisma.attendanceRecord.deleteMany({ where: { schoolId } });
      await prisma.classMembership.deleteMany({ where: { classId } });
      await prisma.responsiblePerson.deleteMany({ where: { relationship: { schoolId } } });
      await prisma.studentSchoolRelationship.deleteMany({ where: { schoolId } });
      if (studentId) {
        await prisma.student.deleteMany({ where: { id: studentId } });
      }
      await prisma.class.deleteMany({ where: { schoolId } });
      await prisma.schoolSetting.deleteMany({ where: { schoolId } });
      await prisma.schoolYear.deleteMany({ where: { schoolId } });
      await prisma.school.deleteMany({ where: { id: schoolId } });
    }
  });

  test('1. Bảng điều hành số của Cơ sở mới (Executive Overview)', async ({ page }) => {
    await page.goto(`/${testSchoolSlug}`);
    await page.waitForLoadState('networkidle');

    // Tên trường & Mã cơ sở
    await expect(page.getByText(testSchoolName)).toBeVisible();
    await expect(page.getByText(testSchoolCode)).toBeVisible();

    // RLS Status badge
    await expect(page.getByText(/Multi-tenant RLS Active/i)).toBeVisible();

    // 6 KPI thẻ nổi
    await expect(page.getByText('Tổng số Học sinh')).toBeVisible();
    await expect(page.getByText('Điểm danh Hôm nay')).toBeVisible();
    await expect(page.getByText('Đơn nghỉ & Thuốc')).toBeVisible();
  });

  test('2. Điểm danh 1-chạm & Sĩ số lớp (Teacher Attendance Flow)', async ({ page }) => {
    await page.goto(`/${testSchoolSlug}/attendance`);
    await page.waitForLoadState('networkidle');

    // Header & Tỷ lệ chuyên cần
    await expect(page.getByRole('heading', { name: /Điểm danh & Chuyên cần/i })).toBeVisible();
    await expect(page.getByText(/Tỷ lệ chuyên cần hôm nay/i)).toBeVisible();

    // Thẻ lớp học đã tạo
    await expect(page.getByText('Lớp Mầm 1 (Ban Mai)')).toBeVisible();
  });

  test('3. Tạo & Giám sát Hóa đơn Học phí (Finance Tuition Flow)', async ({ page }) => {
    await page.goto(`/${testSchoolSlug}/tuition`);
    await page.waitForLoadState('networkidle');

    // Tiêu đề & Danh mục biểu phí
    await expect(page.getByRole('heading', { name: /Quản lý Thu phí & Học phí/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Phát hành hóa đơn/i })).toBeVisible();
  });

  test('4. Cổng Phụ huynh Học sinh & Gửi đơn Trực tuyến (Parent Portal Flow)', async ({ page }) => {
    await page.goto('/parent');
    await page.waitForLoadState('networkidle');

    // Kiểm tra thông tin con
    await expect(page.getByText('Nguyễn Gia An')).toBeVisible();

    // Chuyển sang trang sức khỏe
    await page.goto('/parent/health');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /Sức khỏe & Thể trạng/i })).toBeVisible();
    await expect(page.getByText(/Chuẩn WHO/i).first()).toBeVisible();

    // Chuyển sang trang học phí VietQR
    await page.goto('/parent/tuition');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Mở mã VietQR/i)).toBeVisible();

    // Chuyển sang trang gửi đơn
    await page.goto('/parent/requests');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('button', { name: /Tạo đơn mới/i })).toBeVisible();
  });
});
