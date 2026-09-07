import { test, expect } from '@playwright/test';
import path from 'path';
import { prisma } from '@km/db';

const ARTIFACT_DIR = 'C:/Users/binh/.gemini/antigravity-ide/brain/ba0157c6-626b-4f30-ae98-d3a6a038bbb5';
const testId = Date.now().toString().slice(-4);
const testSchoolSlug = `kinder-e2e-phase5-${testId}`;
const testSchoolName = `Trường Mầm Non Họa Mi Phase 5 ${testId}`;

test.describe.serial('Phase 5 — Teachers, Staff & School Authorization E2E Tests', () => {
  let createdSchoolId = '';
  let createdYearId = '';
  let class1Id = '';
  let class2Id = '';
  let teacherStaffId = '';
  let assistantStaffId = '';

  test.beforeAll(async () => {
    // 1. Tạo trường học thực tế trên Supabase Singapore
    const school = await prisma.school.create({
      data: {
        code: `SCH-P5-${testId}`,
        slug: testSchoolSlug,
        name: testSchoolName,
        status: 'ACTIVE',
        phone: '0977889900',
        email: `phase5.${testId}@kindermanagement.edu.vn`,
      },
    });
    createdSchoolId = school.id;

    // 2. Tạo năm học
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

    await prisma.schoolSetting.create({
      data: {
        schoolId: school.id,
        currentSchoolYearId: schoolYear.id,
      },
    });

    // 3. Tạo 2 lớp học phục vụ test phân công giáo viên
    const c1 = await prisma.class.create({
      data: {
        schoolId: school.id,
        schoolYearId: schoolYear.id,
        name: 'Lớp Chồi 1 (Họa Mi Vàng)',
        ageGroup: 'PRESCHOOL_4_5Y',
        capacity: 25,
      },
    });
    class1Id = c1.id;

    const c2 = await prisma.class.create({
      data: {
        schoolId: school.id,
        schoolYearId: schoolYear.id,
        name: 'Lớp Chồi 2 (Sơn Ca Xanh)',
        ageGroup: 'PRESCHOOL_4_5Y',
        capacity: 25,
      },
    });
    class2Id = c2.id;
  });

  test.afterAll(async () => {
    console.log('--- CLEANUP: Dọn dẹp test data Phase 5 từ Database Supabase Singapore ---');
    try {
      if (createdSchoolId) {
        // Xóa class assignments
        await prisma.class.updateMany({
          where: { schoolId: createdSchoolId },
          data: { homeroomTeacherId: null, assistantTeacherIds: [] },
        });

        // Xóa staff members
        await prisma.staffMember.deleteMany({
          where: { schoolId: createdSchoolId },
        });

        // Xóa classes, settings, years, audit logs, school
        await prisma.class.deleteMany({ where: { schoolId: createdSchoolId } });
        await prisma.schoolSetting.deleteMany({ where: { schoolId: createdSchoolId } });
        await prisma.schoolYear.deleteMany({ where: { schoolId: createdSchoolId } });
        await prisma.auditLog.deleteMany({ where: { schoolId: createdSchoolId } });
        await prisma.school.deleteMany({ where: { id: createdSchoolId } });
      }
      console.log('--- CLEANUP COMPLETE: Đã xóa 100% test data Phase 5 ---');
    } catch (e: unknown) {
      console.error('Lỗi dọn dẹp test data Phase 5:', e);
    }
  });

  test('1. Staff Directory Initial State & Navigation', async ({ page }) => {
    await page.goto(`/${testSchoolSlug}/staff`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Đội ngũ Giáo viên & Nhân sự' })).toBeVisible();
    await expect(page.getByText('Chưa có nhân sự nào được tiếp nhận')).toBeVisible();

    // Xác nhận 4 thẻ thống kê hiển thị 0
    await expect(page.locator('#stat-total-staff')).toHaveText('0');
  });

  test('2. Onboard Homeroom Teacher (Tiếp nhận Giáo viên Chủ nhiệm)', async ({ page }) => {
    await page.goto(`/${testSchoolSlug}/staff`);
    await page.waitForLoadState('networkidle');

    // Mở modal tiếp nhận nhân sự mới
    await page.locator('#btn-add-staff-empty').click();
    await expect(page.locator('#modal-add-staff')).toBeVisible();

    // Điền thông tin nhân sự
    await page.locator('#staffFullName').fill('Cô Hoàng Thu Trang');
    await page.locator('#staffPhone').fill('0912345678');
    await page.locator('#staffEmail').fill('thutrang.hoang@kindermanagement.edu.vn');
    await page.locator('#staffEmployeeCode').fill('GV-2026-001');

    // Xác nhận vai trò mặc định TEACHER đã được chọn
    await expect(
      page.locator('#modal-add-staff').getByRole('button', { name: 'Giáo viên Chủ nhiệm' })
    ).toBeVisible();

    // Submit form
    await page.locator('#btn-confirm-add-staff').click();

    // Chờ modal đóng và nhân sự xuất hiện trong danh sách
    await expect(page.locator('#modal-add-staff')).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Cô Hoàng Thu Trang')).toBeVisible();
    await expect(page.getByText('GV-2026-001')).toBeVisible();
    await expect(page.getByText('0912345678')).toBeVisible();

    // Lưu lại staff ID từ DB
    const staff = await prisma.staffMember.findFirst({
      where: { schoolId: createdSchoolId, phone: '0912345678' },
    });
    expect(staff).not.toBeNull();
    if (staff) {
      teacherStaffId = staff.id;
      expect(staff.roles).toContain('TEACHER');
      expect(staff.employmentStatus).toBe('ACTIVE');
    }
  });

  test('3. Onboard Assistant Teacher (Tiếp nhận Giáo viên Phụ trách)', async ({ page }) => {
    await page.goto(`/${testSchoolSlug}/staff`);
    await page.waitForLoadState('networkidle');

    await page.locator('#btn-add-staff').click();
    await expect(page.locator('#modal-add-staff')).toBeVisible();

    await page.locator('#staffFullName').fill('Thầy Lê Quốc Tuấn');
    await page.locator('#staffPhone').fill('0987654321');
    await page.locator('#staffEmail').fill('quoctuan.le@kindermanagement.edu.vn');
    await page.locator('#staffEmployeeCode').fill('GV-2026-002');

    // Chuyển vai trò sang Giáo viên Phụ trách (ASSISTANT_TEACHER)
    // Bỏ chọn TEACHER
    await page
      .locator('#modal-add-staff')
      .getByRole('button', { name: 'Giáo viên Chủ nhiệm' })
      .click();
    // Chọn ASSISTANT_TEACHER
    await page
      .locator('#modal-add-staff')
      .getByRole('button', { name: 'Giáo viên Phụ trách' })
      .click();

    await page.locator('#btn-confirm-add-staff').click();
    await expect(page.locator('#modal-add-staff')).not.toBeVisible({ timeout: 10000 });

    await expect(page.getByText('Thầy Lê Quốc Tuấn')).toBeVisible();

    const staff = await prisma.staffMember.findFirst({
      where: { schoolId: createdSchoolId, phone: '0987654321' },
    });
    expect(staff).not.toBeNull();
    if (staff) {
      assistantStaffId = staff.id;
      expect(staff.roles).toContain('ASSISTANT_TEACHER');
    }

    // Chụp ảnh màn hình danh bạ nhân sự hoàn thiện
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'visual_23_staff_directory.png'),
    });
  });

  test('4. Assign Staff to Class & Enforce 1 Homeroom Teacher Rule', async ({ page }) => {
    await page.goto(`/${testSchoolSlug}/school-years`);
    await page.waitForLoadState('networkidle');

    // Click nút "Phân công GV" cho Lớp Chồi 1
    const assignBtnClass1 = page.locator(`#btn-assign-staff-${class1Id}`);
    await expect(assignBtnClass1).toBeVisible();
    await assignBtnClass1.click();

    await expect(page.locator('#modal-assign-class-staff')).toBeVisible();

    // Chọn GV Chủ nhiệm: Cô Hoàng Thu Trang
    await page.locator('#select-homeroom-teacher').selectOption(teacherStaffId);

    // Chọn GV Phụ trách: Thầy Lê Quốc Tuấn
    await page.locator('label:has-text("Thầy Lê Quốc Tuấn")').click();

    // Lưu phân công
    await page.locator('#btn-confirm-assign-staff').click();
    await expect(page.locator('#modal-assign-class-staff')).not.toBeVisible({ timeout: 10000 });

    // Xác minh giao diện cập nhật tên GVCN và GVPT trên thẻ Lớp Chồi 1
    await expect(page.getByText('Cô Hoàng Thu Trang')).toBeVisible();
    await expect(page.getByText('Thầy Lê Quốc Tuấn')).toBeVisible();

    // Chụp ảnh màn hình Lớp học đã được phân công giáo viên
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'visual_25_class_staff_assigned.png'),
    });

    // TEST RULE: Thử phân công Cô Hoàng Thu Trang làm GVCN cho Lớp Chồi 2 trong cùng năm học
    const assignBtnClass2 = page.locator(`#btn-assign-staff-${class2Id}`);
    await assignBtnClass2.click();
    await expect(page.locator('#modal-assign-class-staff')).toBeVisible();

    await page.locator('#select-homeroom-teacher').selectOption(teacherStaffId);
    await page.locator('#btn-confirm-assign-staff').click();

    // Phải hiển thị lỗi vi phạm quy tắc: 1 GVCN chỉ được chủ nhiệm 1 lớp trong 1 năm học
    await expect(page.getByText('Mỗi giáo viên chỉ được chủ nhiệm 1 lớp/năm học.')).toBeVisible();

    // Đóng modal
    await page.locator('button:has-text("Hủy bỏ")').click();
  });

  test('5. Dynamic Granular Permission Matrix Management', async ({ page }) => {
    // Điều hướng vào trang chi tiết hồ sơ Cô Hoàng Thu Trang
    await page.goto(`/${testSchoolSlug}/staff/${teacherStaffId}`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Cô Hoàng Thu Trang' })).toBeVisible();
    await expect(page.getByText('Ma trận Phân quyền Chi tiết')).toBeVisible();

    // Kiểm tra và bật thêm quyền Học phí (tuition:read)
    await page.locator('#perm-card-tuition-read').click();

    // Lưu cập nhật phân quyền
    await page.locator('#btn-save-permissions').click();

    // Chờ thông báo thành công
    await expect(page.getByText('Đã lưu ma trận phân quyền thành công')).toBeVisible({ timeout: 10000 });

    // Kiểm tra DB đã lưu quyền mới
    const updatedStaff = await prisma.staffMember.findUnique({
      where: { id: teacherStaffId },
    });
    expect(updatedStaff?.permissions).toContain('tuition:read');

    // Chụp ảnh màn hình Ma trận phân quyền chi tiết
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'visual_24_staff_detail_permissions.png'),
    });
  });

  test('6. Employment Status Transition & Class Unassignment Cascade', async ({ page }) => {
    await page.goto(`/${testSchoolSlug}/staff/${teacherStaffId}`);
    await page.waitForLoadState('networkidle');

    // Mở modal cập nhật trạng thái làm việc
    await page.locator('#btn-change-staff-status').click();
    await expect(page.locator('#modal-change-staff-status')).toBeVisible();

    // Chọn trạng thái: Đã thôi việc (RESIGNED)
    await page.locator('#selectTargetStatus').selectOption('RESIGNED');
    await page.locator('#statusChangeNote').fill('Chuyển công tác theo nguyện vọng gia đình');

    // Xác nhận cập nhật trạng thái
    await page.locator('#btn-confirm-change-status').click();
    await expect(page.locator('#modal-change-staff-status')).not.toBeVisible({ timeout: 10000 });

    // Xác nhận badge trên hồ sơ đã chuyển sang Đã thôi việc (RESIGNED)
    await expect(page.getByText('Đã thôi việc (RESIGNED)')).toBeVisible();

    // Kiểm tra Database: Lớp Chồi 1 đã được gỡ GVCN tự động theo cơ chế Transactional Cascade
    const class1 = await prisma.class.findUnique({
      where: { id: class1Id },
    });
    expect(class1?.homeroomTeacherId).toBeNull();
  });

  test('7. Staff Directory Search & Role Filtering', async ({ page }) => {
    await page.goto(`/${testSchoolSlug}/staff`);
    await page.waitForLoadState('networkidle');

    // Tìm kiếm theo tên "Lê Quốc Tuấn"
    const searchInput = page.locator('#staff-search-input');
    await searchInput.fill('Lê Quốc Tuấn');

    await expect(page.getByText('Thầy Lê Quốc Tuấn')).toBeVisible();
    await expect(page.getByText('Cô Hoàng Thu Trang')).not.toBeVisible();

    // Xóa ô tìm kiếm
    await searchInput.fill('');
    await expect(page.getByText('Cô Hoàng Thu Trang')).toBeVisible();

    // Lọc theo trạng thái làm việc: RESIGNED
    await page.locator('#filter-staff-status').selectOption('RESIGNED');
    await expect(page.getByText('Cô Hoàng Thu Trang')).toBeVisible();
    await expect(page.getByText('Thầy Lê Quốc Tuấn')).not.toBeVisible();
  });
});
