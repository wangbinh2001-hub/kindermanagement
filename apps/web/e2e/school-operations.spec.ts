import { test, expect } from '@playwright/test';
import path from 'path';
import { prisma } from '@km/db';

const ARTIFACT_DIR = 'C:/Users/binh/.gemini/antigravity-ide/brain/ba0157c6-626b-4f30-ae98-d3a6a038bbb5';
const testId = Date.now().toString().slice(-4);
const testSchoolName = `Trường Mầm Non Ban Mai Ops ${testId}`;
const testSchoolCode = `BMO-${testId}`;
const testSchoolSlug = `truong-ban-mai-ops-${testId}`;

test.describe.serial('Phase 3 — School Operations Foundation E2E Real Data Tests', () => {
  let createdSchoolId = '';

  test.beforeAll(async () => {
    // 1. Tạo trước một cơ sở trường học mẫu hoàn chỉnh trong Database
    console.log(`--- SETUP: Khởi tạo trường học test: ${testSchoolName} (${testSchoolCode}) ---`);
    const school = await prisma.school.create({
      data: {
        code: testSchoolCode,
        slug: testSchoolSlug,
        name: testSchoolName,
        status: 'ACTIVE',
        ownerName: 'Hiệu trưởng Hoàng Mai',
        phone: '0987654321',
        email: `banmai.ops.${testId}@kindermanagement.edu.vn`,
        address: 'Tòa nhà Sunshine, Cầu Giấy, Hà Nội',
        taxCode: `01099${testId}`,
        legalRepresentative: 'Hoàng Mai',
        setting: {
          create: {
            enableAttendance: true,
            enableTuition: true,
            enableHealth: true,
            enableNutrition: false,
          },
        },
      },
    });
    createdSchoolId = school.id;
    console.log(`Đã tạo trường ID: ${createdSchoolId}, slug: ${testSchoolSlug}`);
  });

  test.afterAll(async () => {
    // 2. Dọn dẹp sạch sẽ 100% test data trong database sau khi test xong
    console.log('--- CLEANUP: Dọn dẹp Phase 3 test data từ Database ---');
    try {
      const testSchools = await prisma.school.findMany({
        where: { slug: { contains: `ban-mai-ops-${testId}` } },
      });
      for (const s of testSchools) {
        await prisma.class.deleteMany({ where: { schoolId: s.id } });
        await prisma.schoolYear.deleteMany({ where: { schoolId: s.id } });
        await prisma.auditLog.deleteMany({ where: { schoolId: s.id } });
        await prisma.schoolSetting.deleteMany({ where: { schoolId: s.id } });
        await prisma.schoolAdmin.deleteMany({ where: { schoolId: s.id } });
        await prisma.school.deleteMany({ where: { id: s.id } });
      }

      const remaining = await prisma.school.count({
        where: { slug: { contains: `ban-mai-ops-${testId}` } },
      });
      console.log(`--- CLEANUP HOÀN TẤT: Số trường test còn lại trong DB: ${remaining} ---`);
    } catch (e) {
      console.error('Lỗi khi dọn dẹp test data:', e);
    }
  });

  test('1. School Workspace Shell & Dashboard Overview', async ({ page }) => {
    await page.goto(`/${testSchoolSlug}`);
    await page.waitForLoadState('networkidle');

    // Kiểm tra thông tin Sidebar thương hiệu trường
    await expect(page.locator(`text=${testSchoolName}`).first()).toBeVisible();
    await expect(page.locator(`text=${testSchoolCode}`).first()).toBeVisible();
    await expect(page.locator('text=Multi-tenant RLS Active')).toBeVisible();

    // Kiểm tra 6 KPI cards
    await expect(page.locator('text=Năm học hiện tại').first()).toBeVisible();
    await expect(page.locator('text=Tổng số lớp học').first()).toBeVisible();
    await expect(page.locator('text=Học sinh đang theo học').first()).toBeVisible();

    // Kiểm tra Setup Checklist 3 bước
    await expect(page.locator('text=Khởi động cơ sở trường học mới — Thiết lập 3 bước')).toBeVisible();
    await expect(page.locator('text=Bước 1: Tạo Năm học')).toBeVisible();

    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'visual_14_school_dashboard.png'),
      fullPage: true,
    });
  });

  test('2. School Settings & Bi-directional Sync', async ({ page }) => {
    await page.goto(`/${testSchoolSlug}/settings`);
    await page.waitForLoadState('networkidle');

    // Kiểm tra tiêu đề và thông tin hiện tại
    await expect(page.getByRole('heading', { name: 'Cài đặt Cơ sở Trường học' })).toBeVisible();

    // Tab 1: Cập nhật thông tin trường
    await page.locator('#schoolPhoneInput').fill('0912345678');
    await page.locator('#schoolAddressInput').fill('Số 88 Phố Cầu Giấy, Quận Cầu Giấy, Hà Nội');
    await page.locator('#legalRepInput').fill('Bà Hoàng Thị Mai');

    // Bấm lưu
    await page.locator('#btn-save-profile').click();

    // Kiểm tra Toast thành công
    const toast = page.locator('#toast-notification');
    await expect(toast).toBeVisible({ timeout: 10000 });
    await expect(toast).toContainText('Đã lưu thông tin trường học thành công');

    // Kiểm tra trực tiếp trong DB xem dữ liệu đã được cập nhật đồng bộ
    const updatedSchool = await prisma.school.findUnique({
      where: { id: createdSchoolId },
    });
    expect(updatedSchool?.phone).toBe('0912345678');
    expect(updatedSchool?.address).toBe('Số 88 Phố Cầu Giấy, Quận Cầu Giấy, Hà Nội');

    // Kiểm tra Audit Log đã được ghi
    const auditLogs = await prisma.auditLog.findMany({
      where: { schoolId: createdSchoolId, action: 'UPDATE_SCHOOL_PROFILE' },
    });
    expect(auditLogs.length).toBeGreaterThan(0);

    // Chuyển sang Tab 2: Cài đặt nâng cao & Tính năng
    await page.locator('#tab-advanced').click();
    await expect(page.locator('text=Cấu hình Module Vận hành Nội bộ')).toBeVisible();

    // Bật module Dinh dưỡng
    await page.locator('#toggle-nutrition').click();
    await page.locator('#btn-save-advanced').click();

    await expect(page.locator('#toast-notification')).toBeVisible({ timeout: 10000 });

    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'visual_15_school_settings.png'),
      fullPage: true,
    });
  });

  test('3. School Years Workspace (Tạo năm học mới & đặt làm hiện tại)', async ({ page }) => {
    await page.goto(`/${testSchoolSlug}/school-years`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Quản trị Năm học & Lớp học' })).toBeVisible();

    // Mở modal tạo năm học
    await page.locator('#btn-open-create-year').click();
    await expect(page.locator('#modal-create-year')).toBeVisible();

    // Điền thông tin năm học
    await page.locator('#input-year-name').fill(`Niên khóa 2026 - 2027`);
    await page.locator('#input-year-start-date').fill('2026-09-01');
    await page.locator('#input-year-end-date').fill('2027-05-31');

    await page.locator('#btn-submit-create-year').click();

    // Chờ xuất hiện năm học trong danh sách
    await expect(page.locator('text=Niên khóa 2026 - 2027')).toBeVisible({ timeout: 10000 });

    // Vì là năm học đầu tiên, hệ thống tự động gán là Hiện tại
    await expect(page.locator('text=Hiện tại').first()).toBeVisible();

    // Kiểm tra trong DB
    const yearInDb = await prisma.schoolYear.findFirst({
      where: { schoolId: createdSchoolId, name: 'Niên khóa 2026 - 2027' },
    });
    expect(yearInDb).not.toBeNull();
    expect(yearInDb?.isCurrent).toBe(true);

    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'visual_16_school_years_and_classes.png'),
      fullPage: true,
    });
  });

  test('4. Classes Workspace (Tạo lớp học theo độ tuổi mầm non & quản lý sĩ số)', async ({ page }) => {
    await page.goto(`/${testSchoolSlug}/school-years`);
    await page.waitForLoadState('networkidle');

    // Mở modal thêm lớp học
    await page.locator('#btn-open-create-class').click();
    await expect(page.locator('#modal-create-class')).toBeVisible();

    // Điền thông tin lớp 1: Lớp Mầm 1 (Mẫu giáo 3-4 tuổi)
    await page.locator('#input-class-name').fill('Lớp Mầm 1 (Hoa Sen)');
    await page.locator('#select-age-group').selectOption('PRESCHOOL_3_4Y');
    await page.locator('#input-class-capacity').fill('25');

    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'visual_17_create_class_modal.png'),
    });

    await page.locator('#btn-submit-create-class').click();

    // Chờ lớp học hiển thị trên danh sách
    await expect(page.locator('text=Lớp Mầm 1 (Hoa Sen)')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Mẫu giáo bé (3 - 4 tuổi / Lớp Mầm)')).toBeVisible();
    await expect(page.locator('text=25').first()).toBeVisible();

    // Tạo thêm lớp 2: Nhà trẻ (18-24 tháng)
    await page.locator('#btn-open-create-class').click();
    await expect(page.locator('#modal-create-class')).toBeVisible();

    await page.locator('#input-class-name').fill('Nhà Trẻ Bông Cúc');
    await page.locator('#select-age-group').selectOption('NURSERY_18_24M');
    await page.locator('#input-class-capacity').fill('15');

    await page.locator('#btn-submit-create-class').click();
    await expect(page.locator('text=Nhà Trẻ Bông Cúc')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Nhà trẻ 18 - 24 tháng')).toBeVisible();

    // Kiểm tra tổng sĩ số tính toán: 25 + 15 = 40
    await expect(page.locator('text=40 trẻ')).toBeVisible();

    // Kiểm tra trong DB có 2 lớp học
    const classesInDb = await prisma.class.findMany({
      where: { schoolId: createdSchoolId, deletedAt: null },
    });
    expect(classesInDb.length).toBe(2);

    // Xóa mềm 1 lớp học
    const classToDelete = classesInDb.find((c) => c.name === 'Nhà Trẻ Bông Cúc');
    expect(classToDelete).toBeDefined();

    // Bấm nút xóa lớp Nhà Trẻ Bông Cúc
    const deleteBtn = page.locator(`div:has-text("Nhà Trẻ Bông Cúc") button[title="Xóa lớp học"]`).last();
    await deleteBtn.click();

    await expect(page.locator('#modal-confirm-delete-class')).toBeVisible();
    await page.locator('#btn-confirm-delete-class').click();

    // Kiểm tra Toast và biến mất khỏi UI
    await expect(page.locator('#toast-notification')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('#classes-grid').getByRole('heading', { name: 'Nhà Trẻ Bông Cúc' })).not.toBeVisible();

    // Kiểm tra trong DB: Lớp đã bị soft-delete (deletedAt != null, isActive = false)
    const softDeletedClass = await prisma.class.findUnique({
      where: { id: classToDelete!.id },
    });
    expect(softDeletedClass?.deletedAt).not.toBeNull();
    expect(softDeletedClass?.isActive).toBe(false);
  });
});
