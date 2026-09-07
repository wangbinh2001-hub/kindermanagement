import { test, expect } from '@playwright/test';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/binh/.gemini/antigravity-ide/brain/ba0157c6-626b-4f30-ae98-d3a6a038bbb5';

test.describe('KinderManagement - Visual E2E Tests with Screenshots', () => {

  test('1. Landing Page Visual Test: Hero, Pillars, Modules and Navigation', async ({ page }) => {
    // 1. Tải trang chủ
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Chụp ảnh phần Hero & Header
    await page.screenshot({ 
      path: path.join(ARTIFACT_DIR, 'visual_01_landing_hero.png'),
      fullPage: false 
    });

    // Cuộn xuống xem 14 phân hệ & 3 trụ cột
    await page.locator('[id="3-tru-cot"]').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await page.screenshot({ 
      path: path.join(ARTIFACT_DIR, 'visual_02_landing_pillars.png') 
    });

    await page.locator('[id="14-phan-he"]').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await page.screenshot({ 
      path: path.join(ARTIFACT_DIR, 'visual_03_landing_14_modules.png') 
    });

    // Cuộn lên đầu và click nút Đăng nhập
    await page.locator('header').scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: 'Đăng nhập' }).first().click();

    await page.waitForURL('**/login');
    await expect(page.getByRole('heading', { level: 1, name: 'Đăng nhập hệ thống' })).toBeVisible();
  });

  test('2. Login Page Visual Test: Empty Validation Errors', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Click Đăng nhập khi chưa điền dữ liệu để kích hoạt validate Zod
    await page.getByRole('button', { name: 'Đăng nhập' }).click();

    await expect(page.getByText('Vui lòng nhập tài khoản')).toBeVisible();
    await expect(page.getByText('Vui lòng nhập mật khẩu')).toBeVisible();

    // Chụp ảnh xác nhận lỗi hiển thị tiếng Việt chuẩn
    await page.screenshot({ 
      path: path.join(ARTIFACT_DIR, 'visual_04_login_validation_errors.png') 
    });
  });

  test('3. Login Page Visual Test: Password Toggle & Remember Me', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.getByPlaceholder('Số điện thoại hoặc tên đăng nhập').fill('0912345678');
    const passwordInput = page.getByPlaceholder('Nhập mật khẩu');
    await passwordInput.fill('MatKhauAnToan123!');

    // Toggle hiện mật khẩu
    await page.getByLabel('Hiện mật khẩu').click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Tick ghi nhớ đăng nhập
    await page.getByRole('checkbox').check();

    // Chụp ảnh form hoàn chỉnh với mật khẩu hiển thị
    await page.screenshot({ 
      path: path.join(ARTIFACT_DIR, 'visual_05_login_password_toggled.png') 
    });
  });

  test('4. Login Page Visual Test: Loading & Submitting State', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.getByPlaceholder('Số điện thoại hoặc tên đăng nhập').fill('0912345678');
    await page.getByPlaceholder('Nhập mật khẩu').fill('MatKhauAnToan123!');

    // Click nút đăng nhập
    await page.getByRole('button', { name: 'Đăng nhập' }).click();

    // Xác nhận trạng thái Loading xuất hiện
    await expect(page.getByText('Đang xử lý...')).toBeVisible();

    // Chụp ảnh trạng thái Loading với spinner xoay
    await page.screenshot({ 
      path: path.join(ARTIFACT_DIR, 'visual_06_login_loading_state.png') 
    });
  });

});
