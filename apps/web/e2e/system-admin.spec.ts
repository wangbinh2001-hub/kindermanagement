import { test, expect } from '@playwright/test';
import path from 'path';
import { prisma } from '@km/db';

const ARTIFACT_DIR = 'C:/Users/binh/.gemini/antigravity-ide/brain/ba0157c6-626b-4f30-ae98-d3a6a038bbb5';
const testId = Date.now().toString().slice(-4);
const testSchoolName = `Trường Mầm Non Ban Mai E2E ${testId}`;
const testEmail = `banmai.${testId}@kindermanagement.edu.vn`;
const testUsername = `admin_bm_${testId}`;

test.describe.serial('Phase 2 — System Admin Portal E2E Real Data Tests', () => {
  let createdSchoolCode = '';
  let createdSchoolId = '';

  test.afterAll(async () => {
    // Dọn dẹp sạch sẽ toàn bộ test data trong database sau khi test xong
    console.log('--- CLEANUP: Dọn dẹp test data từ Database ---');
    try {
      const testSchools = await prisma.school.findMany({
        where: { name: { contains: 'Ban Mai E2E' } },
      });
      for (const s of testSchools) {
        await prisma.supportSession.deleteMany({ where: { schoolId: s.id } });
        await prisma.supportRequest.deleteMany({ where: { schoolId: s.id } });
        await prisma.auditLog.deleteMany({ where: { schoolId: s.id } });
        await prisma.schoolSetting.deleteMany({ where: { schoolId: s.id } });
        await prisma.schoolAdmin.deleteMany({ where: { schoolId: s.id } });
        await prisma.school.deleteMany({ where: { id: s.id } });
      }
      console.log('--- CLEANUP COMPLETE: Đã xóa toàn bộ test data ---');
    } catch (e) {
      console.error('Lỗi dọn dẹp test data:', e);
    }
  });

  test('1. System Admin Login Flow with admin / admin', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Đăng nhập bằng tài khoản admin / admin theo yêu cầu
    await page.getByPlaceholder('Số điện thoại hoặc tên đăng nhập').fill('admin');
    await page.getByPlaceholder('Nhập mật khẩu').fill('admin');

    await page.getByRole('button', { name: 'Đăng nhập' }).click();

    // Hệ thống xác thực và điều hướng tới /system-admin
    await page.waitForURL('**/system-admin', { timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'Tổng quan nền tảng' })).toBeVisible();

    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'visual_07_sysadmin_dashboard.png'),
      fullPage: true,
    });
  });

  test('2. School Provisioning Flow (Khởi tạo trường mới)', async ({ page }) => {
    await page.goto('/system-admin/schools/new');
    await page.waitForLoadState('networkidle');

    // Điền form khởi tạo trường học với dữ liệu độc nhất
    await page.locator('#name').fill(testSchoolName);
    await page.locator('#ownerName').fill('Cô Hoàng Mai Hương');
    await page.locator('#phone').fill(`0988${testId}66`);
    await page.locator('#email').fill(testEmail);
    await page.locator('#address').fill('123 Đường Hoa Hồng, Cầu Giấy, Hà Nội');
    await page.locator('#initialUsername').fill(testUsername);
    await page.locator('#initialPassword').fill('BanMai@2026!');

    // Submit form
    await page.locator('#btn-submit-provision').click();

    // Chờ xuất hiện Modal bàn giao thông tin đăng nhập tạm thời
    await expect(page.locator('#credentials-modal')).toBeVisible({ timeout: 15000 });

    // Lấy mã trường được sinh tự động
    const codeElem = page.locator('#modal-school-code');
    await expect(codeElem).toBeVisible();
    createdSchoolCode = (await codeElem.textContent())?.trim() || '';
    console.log('Provisioned School Code:', createdSchoolCode);

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'visual_08_school_provisioned_modal.png'),
    });

    // Bấm nút Hoàn tất để chuyển về danh sách trường
    await page.locator('#btn-modal-close').click();
    await page.waitForURL('**/system-admin/schools');
  });

  test('3. Schools List & Status Toggle (Quản lý trạng thái trường)', async ({ page }) => {
    await page.goto('/system-admin/schools');
    await page.waitForLoadState('networkidle');

    // Tìm kiếm trường vừa tạo
    await page.locator('#searchSchool').fill(createdSchoolCode);
    await page.waitForTimeout(500);

    const schoolRow = page.locator(`tr:has-text("${createdSchoolCode}")`);
    await expect(schoolRow).toBeVisible();

    // Bấm kích hoạt trường (chuyển PENDING_SETUP -> ACTIVE)
    const activateBtn = schoolRow.locator('button:has-text("Kích hoạt")');
    if (await activateBtn.isVisible()) {
      await activateBtn.click();
      await page.waitForTimeout(1000);
    }

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'visual_09_schools_list_active.png'),
      fullPage: true,
    });
  });

  test('4. School Detail & Feature Flags Management', async ({ page }) => {
    const schoolInDb = await prisma.school.findFirst({
      where: { code: createdSchoolCode },
    });
    expect(schoolInDb).not.toBeNull();
    createdSchoolId = schoolInDb!.id;

    await page.goto(`/system-admin/schools/${createdSchoolId}`);
    await page.waitForLoadState('networkidle');

    // Kiểm tra và chụp ảnh Feature Flags
    await expect(page.locator('#flag-tuition')).toBeVisible();
    await page.locator('#flag-tuition').click();
    await page.waitForTimeout(800);

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'visual_10_school_feature_flags.png'),
    });
  });

  test('4b. Reset School Admin Password in School Detail Configuration', async ({ page }) => {
    await page.goto(`/system-admin/schools/${createdSchoolId}`);
    await page.waitForLoadState('networkidle');

    // Mở modal đặt lại mật khẩu School Admin
    const resetModalBtn = page.locator('#btn-open-reset-pass-modal');
    await expect(resetModalBtn).toBeVisible({ timeout: 10000 });
    await resetModalBtn.click();

    await expect(page.locator('#reset-pass-modal')).toBeVisible();

    // Nhấn xác nhận đặt lại mật khẩu ngẫu nhiên
    await page.locator('#btn-confirm-reset-pass').click();

    // Xác nhận hiển thị thông báo thành công và mật khẩu tạm thời
    await expect(page.getByText('Đặt lại mật khẩu thành công!')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('button:has-text("Sao chép")')).toBeVisible();

    // Đóng modal
    await page.getByRole('button', { name: 'Đóng' }).click();
    await expect(page.locator('#reset-pass-modal')).not.toBeVisible();
  });

  test('4c. System Admin Profile & Password Change Information', async ({ page }) => {
    await page.goto('/system-admin/profile');
    await page.waitForLoadState('networkidle');

    // Kiểm tra thông tin hiển thị
    await expect(page.getByText('admin@kindermanagement.edu.vn')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Đổi Mật khẩu Admin' })).toBeVisible();

    // Cập nhật thông tin admin
    await page.locator('#adminFullName').fill('Quản trị viên Hệ thống Cấp cao');
    await page.locator('#adminPhone').fill('0909888999');
    await page.locator('#btn-save-profile').click();

    // Kiểm tra thông báo cập nhật thành công
    await expect(page.getByText('Đã cập nhật thông tin quản trị viên thành công!')).toBeVisible({ timeout: 15000 });
  });

  test('5. Emergency Support Session Creation & Termination', async ({ page }) => {
    await page.goto('/system-admin/support/new');
    await page.waitForLoadState('networkidle');

    // Nhập lý do >= 20 ký tự
    await page.locator('#supportReason').fill('Khắc phục sự cố khẩn cấp: Hỗ trợ kiểm toán đồng bộ dữ liệu E2E test');
    await page.waitForTimeout(300);

    await page.locator('#btn-submit-support').click();

    // Chờ điều hướng về /system-admin/support
    await page.waitForURL('**/system-admin/support', { timeout: 15000 });
    await expect(page.getByText('Phiên hỗ trợ đang kích hoạt')).toBeVisible();

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'visual_12_support_session_active.png'),
      fullPage: true,
    });

    // Bấm kết thúc phiên
    page.on('dialog', (dialog) => dialog.accept());
    const closeBtn = page.locator('button:has-text("Kết thúc phiên")').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
      await page.waitForTimeout(1000);
    }
  });

  test('6. Platform Audit Log Viewer & JSON Modal Inspection', async ({ page }) => {
    await page.goto('/system-admin/audit');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Nhật ký Kiểm toán Toàn hệ thống' })).toBeVisible();

    // Mở modal xem JSON của bản ghi đầu tiên
    const viewJsonBtn = page.locator('button:has-text("Xem JSON")').first();
    await expect(viewJsonBtn).toBeVisible({ timeout: 10000 });
    await viewJsonBtn.click();

    await expect(page.getByText('Chi tiết bản ghi kiểm toán')).toBeVisible();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'visual_13_audit_log_viewer.png'),
    });

    // Đóng modal JSON
    await page.getByRole('button', { name: 'Đóng' }).click();
  });

  test('7. 2-Step Soft Delete Verification Flow', async ({ page }) => {
    await page.goto(`/system-admin/schools/${createdSchoolId}`);
    await page.waitForLoadState('networkidle');

    // Mở modal xóa trường 2 bước
    await page.locator('#btn-open-delete-modal').click();
    await expect(page.locator('#delete-school-modal')).toBeVisible();

    // Nhập mã trường và mật khẩu xác thực của System Admin
    await page.locator('#confirmSchoolCode').fill(createdSchoolCode);
    await page.locator('#adminPassword').fill('Admin@Kinder2026!');

    page.on('dialog', (dialog) => dialog.accept());
    await page.locator('#btn-confirm-delete').click();

    // Chờ điều hướng về danh sách trường sau khi xóa
    await page.waitForURL('**/system-admin/schools', { timeout: 15000 });
    await page.waitForTimeout(800);

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'visual_11_school_deleted_2step.png'),
      fullPage: true,
    });
  });
});
