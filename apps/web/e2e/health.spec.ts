import { test, expect } from '@playwright/test';
import { prisma } from '@km/db';

const testId = Date.now().toString().slice(-4);
const testSchoolSlug = `kinder-e2e-phase8-${testId}`;
const testSchoolName = `Trường Mầm Non Họa Mi Phase 8 ${testId}`;
let createdSchoolId = '';
let createdYearId = '';
let classId = '';
let studentId = '';
let studentRelId = '';

test.describe.serial('Phase 8: Health & Growth Tracking (Sức khỏe & Chỉ số phát triển)', () => {
  test.beforeAll(async () => {
    // 1. Khởi tạo trường học thực tế trên Supabase Singapore
    const school = await prisma.school.create({
      data: {
        code: `SCH-P8-${testId}`,
        slug: testSchoolSlug,
        name: testSchoolName,
        status: 'ACTIVE',
        phone: '0988776655',
        email: `phase8.${testId}@kindermanagement.edu.vn`,
      },
    });
    createdSchoolId = school.id;

    // 2. Khởi tạo năm học
    const schoolYear = await prisma.schoolYear.create({
      data: {
        schoolId: school.id,
        name: 'Năm học 2026 - 2027',
        startDate: new Date('2026-09-01'),
        endDate: new Date('2027-05-31'),
        isCurrent: true,
      },
    });
    createdYearId = schoolYear.id;

    // Cấu hình tính năng bật phân hệ Sức khỏe (enableHealth: true)
    await prisma.schoolSetting.create({
      data: {
        schoolId: school.id,
        currentSchoolYearId: schoolYear.id,
        enableAttendance: true,
        enableTuition: true,
        enableHealth: true,
      },
    });

    // 3. Khởi tạo Lớp học
    const c1 = await prisma.class.create({
      data: {
        schoolId: school.id,
        schoolYearId: schoolYear.id,
        name: 'Lớp Chồi 1 (Mặt Trời Bé Con)',
        ageGroup: 'PRESCHOOL_4_5Y',
        capacity: 25,
        isActive: true,
      },
    });
    classId = c1.id;

    // 4. Khởi tạo Học sinh (4 tuổi = 48 tháng tuổi, Nam)
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 4);

    const st1 = await prisma.student.create({
      data: {
        firstName: 'Dương',
        middleName: 'Bảo',
        lastName: 'Phạm',
        gender: 'MALE',
        dateOfBirth: birthDate,
        personalIdNumber: `ST-${testId}-001`,
      },
    });
    studentId = st1.id;

    const rel1 = await prisma.studentSchoolRelationship.create({
      data: {
        schoolId: school.id,
        studentId: st1.id,
        schoolYearId: schoolYear.id,
        enrollmentStatus: 'ACTIVE',
        currentClassId: c1.id,
      },
    });
    studentRelId = rel1.id;

    await prisma.classMembership.create({
      data: {
        studentSchoolRelationshipId: rel1.id,
        classId: c1.id,
        schoolYearId: schoolYear.id,
        startedAt: new Date(),
      },
    });
  });

  test.afterAll(async () => {
    // Dọn dẹp dữ liệu test
    if (createdSchoolId) {
      await prisma.auditLog.deleteMany({ where: { schoolId: createdSchoolId } });
      await prisma.healthRecord.deleteMany({ where: { schoolId: createdSchoolId } });
      await prisma.classMembership.deleteMany({ where: { classId } });
      await prisma.studentSchoolRelationship.deleteMany({ where: { schoolId: createdSchoolId } });
      if (studentId) {
        await prisma.student.deleteMany({ where: { id: studentId } });
      }
      await prisma.class.deleteMany({ where: { schoolId: createdSchoolId } });
      await prisma.schoolSetting.deleteMany({ where: { schoolId: createdSchoolId } });
      await prisma.schoolYear.deleteMany({ where: { schoolId: createdSchoolId } });
      await prisma.school.deleteMany({ where: { id: createdSchoolId } });
    }
  });

  test('1. Hiển thị trang Quản lý Sức khỏe & Chỉ số phát triển', async ({ page }) => {
    await page.goto(`/${testSchoolSlug}/health`);
    await page.waitForLoadState('networkidle');

    // Kiểm tra tiêu đề chính
    await expect(page.getByRole('heading', { name: /Sức khỏe & Chỉ số phát triển/i })).toBeVisible();

    // Kiểm tra các card thống kê
    await expect(page.getByText(/Tổng lượt đo/i)).toBeVisible();
    await expect(page.getByText(/Đạt chuẩn WHO/i)).toBeVisible();
    await expect(page.getByText(/Suy dinh dưỡng/i)).toBeVisible();
    await expect(page.getByText(/Thừa cân \/ Béo phì/i)).toBeVisible();

    // Nút ghi nhận chỉ số
    await expect(page.getByRole('button', { name: /Ghi nhận chỉ số/i })).toBeVisible();
  });

  test('2. Mở modal Ghi nhận chỉ số, tính toán trực tiếp BMI & chuẩn WHO', async ({ page }) => {
    await page.goto(`/${testSchoolSlug}/health`);
    await page.waitForLoadState('networkidle');

    // Mở modal ghi nhận chỉ số
    await page.getByRole('button', { name: /Ghi nhận chỉ số/i }).first().click();

    // Kiểm tra modal hiển thị
    await expect(page.getByRole('heading', { name: 'Ghi nhận chỉ số sức khỏe' })).toBeVisible();

    // Chọn học sinh
    const selectStudent = page.locator('select[aria-label="Chọn học sinh cần đo chỉ số"]');
    await selectStudent.selectOption(studentRelId);

    // Nhập chiều cao & cân nặng
    const heightInput = page.getByPlaceholder('VD: 98.5');
    await heightInput.fill('102.5');

    const weightInput = page.getByPlaceholder('VD: 14.2');
    await weightInput.fill('16.0');

    // Kiểm tra Card hiển thị dự kiến BMI tức thì
    await expect(page.getByText(/Kết quả tính toán tức thì:/i)).toBeVisible();
    await expect(page.getByText(/BMI: 15.2/i)).toBeVisible();
    await expect(page.getByText(/Đạt chuẩn WHO/i)).toBeVisible();

    // Nhập ghi chú
    const notesInput = page.getByPlaceholder(/bé ăn uống bình thường/i);
    await notesInput.fill('Khám sức khỏe định kỳ đầu năm học');

    // Bấm lưu
    await page.getByRole('button', { name: 'Lưu chỉ số' }).click();

    // Kiểm tra toast thành công hoặc modal đóng
    await expect(page.getByRole('heading', { name: 'Ghi nhận chỉ số sức khỏe' })).toBeHidden({ timeout: 10000 });

    // Kiểm tra bản ghi xuất hiện trên bảng dữ liệu
    await expect(page.getByText('Phạm Bảo Dương')).toBeVisible();
    await expect(page.getByText('102.5 cm')).toBeVisible();
    await expect(page.getByText('16.0 kg')).toBeVisible();
    await expect(page.getByText('15.2')).toBeVisible();
  });

  test('3. Xem Biểu đồ tăng trưởng và Lịch sử đo chi tiết', async ({ page }) => {
    await page.goto(`/${testSchoolSlug}/health`);
    await page.waitForLoadState('networkidle');

    // Click nút xem Tăng trưởng
    const growthBtn = page.getByRole('button', { name: /Tăng trưởng/i }).first();
    await expect(growthBtn).toBeVisible();
    await growthBtn.click();

    // Modal hiển thị
    await expect(page.getByRole('heading', { name: 'Biểu đồ tăng trưởng & Lịch sử' })).toBeVisible();

    // Kiểm tra thông tin học sinh trong modal
    await expect(page.getByText(/Phạm Bảo Dương/i).first()).toBeVisible();

    // Kiểm tra bảng lịch sử hiển thị bản ghi đã đo
    await expect(page.getByText('Bảng lịch sử chi tiết (Bất biến)')).toBeVisible();
    await expect(page.getByText('102.5 cm')).toBeVisible();
    await expect(page.getByText('16.0 kg')).toBeVisible();
  });
});
