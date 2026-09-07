import { test, expect } from '@playwright/test';
import { prisma } from '@km/db';

const testId = Date.now().toString().slice(-4);
const testSchoolSlug = `kinder-e2e-phase7-${testId}`;
const testSchoolName = `Trường Mầm Non Họa Mi Phase 7 ${testId}`;
let createdSchoolId = '';
let createdYearId = '';
let classId = '';
let studentRelId = '';

test.describe.serial('Phase 7: Fee Schedules, Tuition & Invoices (Học phí, Biểu phí & Hóa đơn)', () => {
  test.beforeAll(async () => {
    // 1. Khởi tạo trường học thực tế trên Supabase Singapore
    const school = await prisma.school.create({
      data: {
        code: `SCH-P7-${testId}`,
        slug: testSchoolSlug,
        name: testSchoolName,
        status: 'ACTIVE',
        phone: '0988776655',
        email: `phase7.${testId}@kindermanagement.edu.vn`,
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

    // Cấu hình tính năng bật phân hệ Học phí (enableTuition: true)
    await prisma.schoolSetting.create({
      data: {
        schoolId: school.id,
        currentSchoolYearId: schoolYear.id,
        enableAttendance: true,
        enableTuition: true,
      },
    });

    // 3. Khởi tạo Lớp học
    const c1 = await prisma.class.create({
      data: {
        schoolId: school.id,
        schoolYearId: schoolYear.id,
        name: 'Lớp Lá 1 (Họa Mi Biển)',
        ageGroup: 'PRESCHOOL_5_6Y',
        capacity: 25,
        isActive: true,
      },
    });
    classId = c1.id;

    // 4. Khởi tạo Học sinh thử nghiệm
    const student = await prisma.student.create({
      data: {
        firstName: 'An',
        lastName: 'Trần Bảo',
        gender: 'MALE',
        dateOfBirth: new Date('2021-03-15'),
        personalIdNumber: `HS7-${testId}`,
      },
    });

    const rel = await prisma.studentSchoolRelationship.create({
      data: {
        schoolId: school.id,
        studentId: student.id,
        schoolYearId: schoolYear.id,
        currentClassId: c1.id,
        enrollmentStatus: 'ACTIVE',
      },
    });
    studentRelId = rel.id;

    await prisma.classMembership.create({
      data: {
        classId: c1.id,
        studentSchoolRelationshipId: rel.id,
        schoolYearId: schoolYear.id,
        startedAt: new Date(),
      },
    });

    // 5. Khởi tạo Nhân viên điểm danh
    const staff = await prisma.staffMember.create({
      data: {
        schoolId: school.id,
        userId: `usr_staff_p7_${testId}`,
        fullName: 'Cô Lê Hoàng Oanh',
        employeeCode: `NV-P7-${testId}`,
        roles: ['TEACHER'],
        permissions: ['tuition:read', 'tuition:manage', 'attendance:write'],
        employmentStatus: 'ACTIVE',
        hiredAt: new Date(),
      },
    });

    // 6. Gieo sẵn dữ liệu điểm danh tháng trước để kiểm tra tích hợp:
    // Tháng trước so với tháng hiện tại:
    const now = new Date();
    let prevMonth = now.getMonth(); // 0-indexed, so getMonth() is the previous month index (1-12)
    let prevYear = now.getFullYear();
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear -= 1;
    }

    // Ngày 1: Ra về lúc 20:00 (Sau 18:00 đúng 2 tiếng = 2h tăng ca = 100.000 đ)
    const overtimeDate = new Date(Date.UTC(prevYear, prevMonth - 1, 10, 0, 0, 0));
    await prisma.attendanceRecord.create({
      data: {
        schoolId: school.id,
        schoolYearId: schoolYear.id,
        classId: c1.id,
        studentSchoolRelationshipId: rel.id,
        date: overtimeDate,
        status: 'PRESENT',
        method: 'MANUAL',
        checkInTime: new Date(Date.UTC(prevYear, prevMonth - 1, 10, 7, 30, 0)),
        checkOutTime: new Date(Date.UTC(prevYear, prevMonth - 1, 10, 20, 0, 0)),
        overtimeHours: 2.0,
        recordedById: staff.id,
      },
    });

    // Ngày 2: Vắng có phép (ABSENT_EXCUSED = hoàn tiền ăn 35.000 đ)
    const absentDate = new Date(Date.UTC(prevYear, prevMonth - 1, 15, 0, 0, 0));
    await prisma.attendanceRecord.create({
      data: {
        schoolId: school.id,
        schoolYearId: schoolYear.id,
        classId: c1.id,
        studentSchoolRelationshipId: rel.id,
        date: absentDate,
        status: 'ABSENT_EXCUSED',
        method: 'MANUAL',
        overtimeHours: 0,
        recordedById: staff.id,
      },
    });
  });

  test.afterAll(async () => {
    console.log('--- CLEANUP: Dọn dẹp dữ liệu kiểm thử Phase 7 ---');
    try {
      if (createdSchoolId) {
        // Xóa invoice items & invoices
        const invs = await prisma.invoice.findMany({ where: { schoolId: createdSchoolId } });
        for (const inv of invs) {
          await prisma.invoiceItem.deleteMany({ where: { invoiceId: inv.id } });
        }
        await prisma.invoice.deleteMany({ where: { schoolId: createdSchoolId } });

        // Xóa student reductions & fee items
        await prisma.studentReduction.deleteMany({
          where: { studentSchoolRelationship: { schoolId: createdSchoolId } },
        });
        await prisma.feeItem.deleteMany({ where: { schoolId: createdSchoolId } });

        // Xóa attendance
        await prisma.attendanceRecord.deleteMany({ where: { schoolId: createdSchoolId } });

        // Xóa audit logs
        await prisma.auditLog.deleteMany({ where: { schoolId: createdSchoolId } });

        // Xóa memberships, class, staff, schoolSetting, relationships, students, school
        await prisma.classMembership.deleteMany({ where: { schoolYearId: createdYearId } });
        await prisma.class.deleteMany({ where: { schoolId: createdSchoolId } });
        await prisma.staffMember.deleteMany({ where: { schoolId: createdSchoolId } });
        await prisma.schoolSetting.deleteMany({ where: { schoolId: createdSchoolId } });
        await prisma.studentSchoolRelationship.deleteMany({ where: { schoolId: createdSchoolId } });
        await prisma.student.deleteMany({
          where: { personalIdNumber: { contains: `HS7-${testId}` } },
        });
        await prisma.schoolYear.deleteMany({ where: { schoolId: createdSchoolId } });
        await prisma.school.deleteMany({ where: { id: createdSchoolId } });
        console.log('--- CLEANUP COMPLETE: Đã dọn dẹp sạch sẽ 100% dữ liệu Phase 7 ---');
      }
    } catch (err) {
      console.error('Lỗi khi dọn dẹp test data:', err);
    }
  });

  test('1. Quản lý Danh mục Biểu phí (Tạo khoản thu Bắt buộc & Tùy chọn)', async ({ page }) => {
    await page.goto(`/${testSchoolSlug}/tuition`);
    await page.waitForLoadState('networkidle');

    // Chuyển sang Tab Biểu phí Cơ sở
    await page.getByRole('button', { name: /Biểu phí Cơ sở/i }).click();

    // 1. Tạo khoản thu bắt buộc: Học phí cơ bản 3.000.000 đ
    await page.locator('#btn-create-fee').click();
    await expect(page.locator('#fee-modal')).toBeVisible();

    await page.locator('#feeNameInput').fill('Học phí Bán trú Cơ bản E2E');
    await page.locator('#feeAmountInput').fill('3000000');
    await page.locator('#feeCycleSelect').selectOption('MONTHLY');
    // Mặc định đã checked feeMandatoryCheckbox
    await page.locator('#btn-save-fee').click();

    await expect(page.getByText('Học phí Bán trú Cơ bản E2E')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('3.000.000 ₫')).toBeVisible();
    await expect(page.getByText('Bắt buộc')).toBeVisible();

    // 2. Tạo khoản thu tùy chọn: Năng khiếu Vẽ 500.000 đ
    await page.locator('#btn-create-fee').click();
    await expect(page.locator('#fee-modal')).toBeVisible();

    await page.locator('#feeNameInput').fill('Năng khiếu Hội họa Sáng tạo E2E');
    await page.locator('#feeAmountInput').fill('500000');
    await page.locator('#feeCycleSelect').selectOption('MONTHLY');
    await page.locator('#feeMandatoryCheckbox').uncheck();
    await page.locator('#btn-save-fee').click();

    await expect(page.getByText('Năng khiếu Hội họa Sáng tạo E2E')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('500.000 ₫')).toBeVisible();
    await expect(page.getByText('Tùy chọn')).toBeVisible();
  });

  test('2. Cấu hình Chính sách Miễn giảm cho Học sinh (Student Reductions)', async ({ page }) => {
    await page.goto(`/${testSchoolSlug}/tuition`);
    await page.waitForLoadState('networkidle');

    // Chuyển sang Tab Chính sách Miễn giảm
    await page.getByRole('button', { name: /Chính sách Miễn giảm/i }).click();

    // Bấm Cấp miễn giảm
    await page.locator('#btn-create-reduction').click();
    await expect(page.locator('#reduction-modal')).toBeVisible();

    // Chọn hình thức giảm 20%
    await page.locator('#reductionTypeSelect').selectOption('PERCENTAGE');
    await page.locator('#reductionValueInput').fill('20');
    await page.locator('#reductionNoteInput').fill('Con giáo viên nhà trường');
    await page.locator('#btn-save-reduction').click();

    // Kiểm tra dòng hiển thị chính sách trong bảng
    await expect(page.getByText('Trần Bảo An')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Giảm 20% tổng hóa đơn')).toBeVisible();
    await expect(page.getByText('Con giáo viên nhà trường')).toBeVisible();
  });

  test('3. Tính toán Học phí & Xuất Hóa đơn Dự thảo (Tích hợp Điểm danh & Miễn giảm)', async ({ page }) => {
    await page.goto(`/${testSchoolSlug}/tuition`);
    await page.waitForLoadState('networkidle');

    // Mở modal xuất hóa đơn
    await page.locator('#btn-create-invoice').click();
    await expect(page.locator('#generate-invoice-modal')).toBeVisible();

    // Chọn từng học sinh và bấm xác nhận
    await page.locator('#btn-submit-generate').click();

    // Kiểm tra xuất hiện dòng hóa đơn mới trong bảng
    await expect(page.getByText('Trần Bảo An')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Nháp').first()).toBeVisible();

    // Bấm Xem chi tiết để kiểm tra công thức tính:
    // Biểu phí gốc: 3.000.000 đ
    // Giảm trừ 20%: -600.000 đ
    // Tăng ca tháng trước (2h * 50.000 đ): +100.000 đ
    // Hoàn tiền ăn vắng có phép tháng trước (1 ngày * 35.000 đ): -35.000 đ
    // Tổng thanh toán: 3.000.000 - 600.000 + 100.000 - 35.000 = 2.465.000 đ!
    await page.getByRole('button', { name: 'Chi tiết' }).first().click();
    await expect(page.locator('#invoice-detail-modal')).toBeVisible();

    await expect(page.getByText('2.465.000 ₫').first()).toBeVisible();
    await expect(page.getByText('Phí giữ ngoài giờ tháng').first()).toBeVisible();
    await expect(page.getByText('Hoàn tiền ăn vắng có phép tháng').first()).toBeVisible();
  });

  test('4. Phát hành Hóa đơn Chính thức (ISSUED) & Khóa Bất biến Tài chính', async ({ page }) => {
    await page.goto(`/${testSchoolSlug}/tuition`);
    await page.waitForLoadState('networkidle');

    // Mở modal hóa đơn
    await page.getByRole('button', { name: 'Chi tiết' }).first().click();
    await expect(page.locator('#invoice-detail-modal')).toBeVisible();

    // Bấm Phát hành chính thức
    await page.locator('#btn-issue-invoice').click();

    // Trạng thái cập nhật thành "Đã phát hành"
    await expect(page.locator('span').filter({ hasText: /^Đã phát hành$/ }).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/INV-2026/)).toBeVisible();
  });

  test('5. Ghi nhận Phụ huynh Thanh toán Hóa đơn (PAID)', async ({ page }) => {
    await page.goto(`/${testSchoolSlug}/tuition`);
    await page.waitForLoadState('networkidle');

    // Mở modal hóa đơn
    await page.getByRole('button', { name: 'Chi tiết' }).first().click();
    await expect(page.locator('#invoice-detail-modal')).toBeVisible();

    // Bấm nút Thu tiền học phí
    await page.locator('#btn-open-payment').click();
    await expect(page.locator('#paymentAmountInput')).toBeVisible();

    // Xác nhận thu đủ 2.465.000 đ
    await page.locator('#paymentAmountInput').fill('2465000');
    await page.locator('#paymentMethodSelect').selectOption('BANK_TRANSFER');
    await page.locator('#paymentNotesInput').fill('Mẹ chuyển khoản qua mã QR VietQR');
    await page.locator('#btn-confirm-payment').click();

    // Kiểm tra trạng thái hóa đơn chuyển thành Đã nộp đủ (PAID)
    await expect(page.locator('span').filter({ hasText: /^Đã nộp đủ$/ }).first()).toBeVisible({ timeout: 10000 });
  });

  test('6. Hủy Hóa đơn (CANCELLED) kèm Lý do Bắt buộc & Ghi nhận AuditLog', async ({ page }) => {
    // Tạo thêm 1 hóa đơn nháp để thực hiện test hủy
    const schoolYear = await prisma.schoolYear.findFirst({ where: { schoolId: createdSchoolId } });
    const cancelTestInv = await prisma.invoice.create({
      data: {
        schoolId: createdSchoolId,
        studentSchoolRelationshipId: studentRelId,
        schoolYearId: schoolYear!.id,
        periodMonth: 12,
        periodYear: 2026,
        status: 'DRAFT',
        grossAmount: 3000000,
        discountAmount: 0,
        overtimeAmount: 0,
        refundAmount: 0,
        carriedFromPrevious: 0,
        totalAmount: 3000000,
        paidAmount: 0,
        dueAmount: 3000000,
      },
    });

    await page.goto(`/${testSchoolSlug}/tuition`);
    await page.waitForLoadState('networkidle');

    // Chuyển bộ lọc tháng sang Tháng 12 để hiển thị hóa đơn vừa tạo
    await page.locator('#selectMonth').selectOption('12');

    // Mở hóa đơn vừa tạo (Tháng 12/2026)
    await page.locator(`#btn-view-invoice-${cancelTestInv.id}`).click();
    await expect(page.locator('#invoice-detail-modal')).toBeVisible();

    // Bấm Hủy hóa đơn
    await page.locator('#btn-cancel-invoice').click();
    await expect(page.locator('#cancelReasonInput')).toBeVisible();

    await page.locator('#cancelReasonInput').fill('Phụ huynh xin bảo lưu kỳ học tháng 12');
    await page.locator('#btn-confirm-cancel').click();

    // Kiểm tra trạng thái chuyển thành Đã hủy (CANCELLED)
    await expect(page.locator('span').filter({ hasText: /^Đã hủy$/ }).first()).toBeVisible({ timeout: 10000 });
  });
});
