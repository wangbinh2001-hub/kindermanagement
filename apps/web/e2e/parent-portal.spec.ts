import { test, expect } from '@playwright/test';

test.describe('Phase 12: Parent Portal Mobile-First E2E Verification', () => {
  test('1. Parent Portal Home — Child Profile & Live Highlights', async ({ page }) => {
    await page.goto('/parent');
    await page.waitForLoadState('networkidle');

    // Header & branding
    await expect(page.getByText('KinderManagement')).toBeVisible();
    await expect(page.getByText(/Trường Mầm non Ban Mai/i)).toBeVisible();

    // Child profile card
    await expect(page.getByText('Nguyễn Gia An')).toBeVisible();
    await expect(page.getByText(/Lớp Mầm A1/i)).toBeVisible();
    await expect(page.getByText(/Đã đến lớp/i)).toBeVisible();

    // Quick feature cards
    await expect(page.getByText('Sức khỏe & BMI')).toBeVisible();
    await expect(page.getByText('Thực đơn hôm nay')).toBeVisible();
    await expect(page.getByText('Học phí điện tử')).toBeVisible();
    await expect(page.getByText('Gửi đơn trực tuyến')).toBeVisible();

    // Bottom Navigation Bar
    const bottomNav = page.locator('nav.fixed.bottom-0');
    await expect(bottomNav).toBeVisible();
    await expect(bottomNav.getByText('Tổng quan')).toBeVisible();
    await expect(bottomNav.getByText('Sức khỏe')).toBeVisible();
    await expect(bottomNav.getByText('Thực đơn')).toBeVisible();
    await expect(bottomNav.getByText('Học phí')).toBeVisible();
    await expect(bottomNav.getByText('Gửi đơn')).toBeVisible();
  });

  test('2. Health Screen — WHO BMI Spectrum Bar & Metrics', async ({ page }) => {
    await page.goto('/parent/health');
    await page.waitForLoadState('networkidle');

    // Heading
    await expect(page.getByRole('heading', { name: /Sức khỏe & Thể trạng/i })).toBeVisible();

    // KPI cards
    await expect(page.getByText('105.5')).toBeVisible();
    await expect(page.getByText('17.8')).toBeVisible();
    await expect(page.getByText('16.0')).toBeVisible();

    // WHO Standard BMI bar
    await expect(page.getByText(/Phổ phân loại BMI \(Chuẩn WHO\)/i)).toBeVisible();
    await expect(page.getByText(/Phát triển chuẩn WHO/i)).toBeVisible();
    await expect(page.getByText(/Chuẩn WHO \(14 - 17.5\)/i)).toBeVisible();

    // Allergy Alert
    await expect(page.getByText(/Cảnh báo Dị ứng & Lưu ý Y tế/i)).toBeVisible();
    await expect(page.getByText('Tôm, cua biển')).toBeVisible();
    await expect(page.getByText('Đậu phộng')).toBeVisible();
  });

  test('3. Nutrition Screen — Day Switcher & MoET Standards', async ({ page }) => {
    await page.goto('/parent/menu');
    await page.waitForLoadState('networkidle');

    // Heading
    await expect(page.getByRole('heading', { name: /Thực đơn Dinh dưỡng Tuần/i })).toBeVisible();

    // MoET Calorie standard badge
    await expect(page.getByText(/820 kcal/i)).toBeVisible();
    await expect(page.getByText(/Chuẩn Bộ GD&ĐT/i)).toBeVisible();

    // Day tabs
    const monBtn = page.getByRole('button', { name: /Thứ 2/i });
    const tueBtn = page.getByRole('button', { name: /Thứ 3/i });
    await expect(monBtn).toBeVisible();
    await expect(tueBtn).toBeVisible();

    // Switch day tab
    await tueBtn.click();
    await page.waitForTimeout(200);

    // Meals slots
    await expect(page.getByText('Bữa Sáng')).toBeVisible();
    await expect(page.getByText('Bữa Trưa (Chính)')).toBeVisible();
    await expect(page.getByText('Bữa Xế Chiều')).toBeVisible();
  });

  test('4. Tuition Screen — Itemized Invoice & VietQR Payment Modal', async ({ page }) => {
    await page.goto('/parent/tuition');
    await page.waitForLoadState('networkidle');

    // Heading
    await expect(page.getByRole('heading', { name: /Học phí & Các khoản thu/i })).toBeVisible();

    // Tuition balance card
    await expect(page.getByText('Số dư cần thanh toán')).toBeVisible();
    await expect(page.getByText('3,500,000 đ').first()).toBeVisible();

    // Open VietQR modal
    const qrBtn = page.getByRole('button', { name: /Mở mã VietQR/i });
    await expect(qrBtn).toBeVisible();
    await qrBtn.click();

    // Modal verification
    await expect(page.getByRole('heading', { name: /Thanh toán qua VietQR/i })).toBeVisible();
    await expect(page.getByText('VIETCOMBANK')).toBeVisible();
    await expect(page.getByText('1029384756')).toBeVisible();

    // Copy account button
    const copyBtn = page.getByRole('button', { name: /Sao chép STK/i });
    await expect(copyBtn).toBeVisible();

    // Close modal
    const closeBtn = page.getByRole('button', { name: /Đóng/i });
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();
    await expect(page.getByRole('heading', { name: /Thanh toán qua VietQR/i })).toBeHidden();
  });

  test('5. Parent Requests — Submission Flow with Stepper Timeline', async ({ page }) => {
    await page.goto('/parent/requests');
    await page.waitForLoadState('networkidle');

    // Heading & Create Button
    await expect(page.getByRole('heading', { name: /Đơn từ & Dặn dò/i })).toBeVisible();
    const createBtn = page.getByRole('button', { name: /Tạo đơn mới/i });
    await expect(createBtn).toBeVisible();
    await createBtn.click();

    // Dialog verification
    await expect(page.getByRole('heading', { name: /Gửi đơn \/ Dặn dò tới Nhà trường/i })).toBeVisible();

    // Select medication type
    const medType = page.getByRole('button', { name: /Dặn thuốc uống/i });
    await expect(medType).toBeVisible();
    await medType.click();

    // Fill form
    await page.locator('#title').fill('Dặn thuốc siro ho bổ phế');
    await page.locator('#description').fill('Nhờ cô giáo cho bé uống 5ml siro ho sau giờ ăn trưa.');

    // Submit
    const submitBtn = page.getByRole('button', { name: /Gửi đơn ngay/i });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Verify submitted request in timeline
    await expect(page.getByText('Dặn thuốc siro ho bổ phế')).toBeVisible();
    await expect(page.getByText(/Gửi đơn/i).first()).toBeVisible();
    await expect(page.getByText(/Tiếp nhận/i).first()).toBeVisible();
  });
});
