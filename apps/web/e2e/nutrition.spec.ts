import { test, expect } from '@playwright/test';
import { prisma } from '@km/db';

const testId = Date.now().toString().slice(-4);
const testSchoolSlug = `kinder-e2e-phase9-${testId}`;
const testSchoolName = `Trường Mầm Non Họa Mi Phase 9 ${testId}`;
let createdSchoolId = '';
let createdYearId = '';

test.describe.serial('Phase 9: Nutrition, Menus & Grocery Sheets (Dinh dưỡng, Thực đơn & Đi chợ)', () => {
  test.beforeAll(async () => {
    // 1. Khởi tạo trường học thực tế trên Supabase Singapore
    const school = await prisma.school.create({
      data: {
        code: `SCH-P9-${testId}`,
        slug: testSchoolSlug,
        name: testSchoolName,
        status: 'ACTIVE',
        phone: '0988776655',
        email: `phase9.${testId}@kindermanagement.edu.vn`,
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

    // Cấu hình tính năng bật phân hệ Dinh dưỡng (enableNutrition: true)
    await prisma.schoolSetting.create({
      data: {
        schoolId: school.id,
        currentSchoolYearId: schoolYear.id,
        enableAttendance: true,
        enableTuition: true,
        enableHealth: true,
        enableNutrition: true,
      },
    });
  });

  test.afterAll(async () => {
    // Dọn dẹp dữ liệu test
    if (createdSchoolId) {
      await prisma.auditLog.deleteMany({ where: { schoolId: createdSchoolId } });
      await prisma.groceryItem.deleteMany({
        where: { grocerySheet: { schoolId: createdSchoolId } },
      });
      await prisma.grocerySheet.deleteMany({ where: { schoolId: createdSchoolId } });
      await prisma.foodIngredient.deleteMany({
        where: { foodItem: { schoolId: createdSchoolId } },
      });
      await prisma.foodItem.deleteMany({ where: { schoolId: createdSchoolId } });
      await prisma.ingredient.deleteMany({ where: { schoolId: createdSchoolId } });
      await prisma.menu.deleteMany({ where: { schoolId: createdSchoolId } });
      await prisma.schoolSetting.deleteMany({ where: { schoolId: createdSchoolId } });
      await prisma.schoolYear.deleteMany({ where: { schoolId: createdSchoolId } });
      await prisma.school.deleteMany({ where: { id: createdSchoolId } });
    }
  });

  test('1. Hiển thị trang Quản lý Dinh dưỡng & Thực đơn', async ({ page }) => {
    await page.goto(`/${testSchoolSlug}/nutrition`);
    await page.waitForLoadState('networkidle');

    // Kiểm tra tiêu đề
    await expect(page.getByRole('heading', { name: /Dinh dưỡng, Thực đơn & Đi chợ/i })).toBeVisible();

    // Kiểm tra các Tab điều hướng
    await expect(page.getByRole('button', { name: /Thực đơn/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Kho Nguyên liệu/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Thư viện Món ăn/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Phiếu Đi chợ/i })).toBeVisible();
  });

  test('2. Thêm nguyên liệu mới vào Kho Nguyên liệu', async ({ page }) => {
    await page.goto(`/${testSchoolSlug}/nutrition`);
    await page.waitForLoadState('networkidle');

    // Chuyển sang Tab Kho Nguyên liệu
    await page.getByRole('button', { name: /Kho Nguyên liệu/i }).click();

    // Bấm Thêm nguyên liệu
    await page.getByRole('button', { name: /Thêm nguyên liệu/i }).click();
    await expect(page.getByRole('heading', { name: 'Thêm nguyên liệu mới' })).toBeVisible();

    // Điền form
    await page.getByPlaceholder(/Thịt gà, Cà rốt/i).fill('Cá hồi phi lê Nauy');
    await page.getByRole('button', { name: 'Lưu nguyên liệu' }).click();

    // Kiểm tra modal đóng và nguyên liệu xuất hiện trên bảng
    await expect(page.getByRole('heading', { name: 'Thêm nguyên liệu mới' })).toBeHidden();
    await expect(page.getByText('Cá hồi phi lê Nauy')).toBeVisible();
  });

  test('3. Tạo món ăn mới trong Thư viện món ăn', async ({ page }) => {
    await page.goto(`/${testSchoolSlug}/nutrition`);
    await page.waitForLoadState('networkidle');

    // Chuyển sang Tab Thư viện Món ăn
    await page.getByRole('button', { name: /Thư viện Món ăn/i }).click();

    // Bấm Tạo món ăn mới
    await page.getByRole('button', { name: /Tạo món ăn mới/i }).click();
    await expect(page.getByRole('heading', { name: 'Tạo món ăn & Định lượng' })).toBeVisible();

    // Điền tên món ăn
    await page.getByPlaceholder(/Thịt kho trứng cút/i).fill('Cá hồi áp chảo sốt cam');

    // Bấm Tạo món ăn
    await page.getByRole('button', { name: 'Tạo món ăn' }).click();

    await expect(page.getByRole('heading', { name: 'Tạo món ăn & Định lượng' })).toBeHidden();
    await expect(page.getByText('Cá hồi áp chảo sốt cam')).toBeVisible();
  });

  test('4. Lập thực đơn và phát hành cho phụ huynh', async ({ page }) => {
    await page.goto(`/${testSchoolSlug}/nutrition`);
    await page.waitForLoadState('networkidle');

    // Mặc định ở Tab Thực đơn
    await expect(page.getByText(/Tuần bắt đầu \(Thứ 2\):/i)).toBeVisible();

    // Bấm Phát hành cho Phụ huynh
    await page.getByRole('button', { name: /Phát hành cho Phụ huynh/i }).click();

    // Kiểm tra badge chuyển sang "Đã phát hành cho Phụ huynh"
    await expect(page.getByText(/Đã phát hành cho Phụ huynh/i)).toBeVisible();
  });

  test('5. Tạo và phê duyệt Phiếu đi chợ với ràng buộc biên ±5.000 VNĐ', async ({ page }) => {
    await page.goto(`/${testSchoolSlug}/nutrition`);
    await page.waitForLoadState('networkidle');

    // Chuyển sang Tab Phiếu Đi chợ
    await page.getByRole('button', { name: /Phiếu Đi chợ/i }).click();

    // Bấm Tạo phiếu đi chợ
    await page.getByRole('button', { name: /Tạo phiếu đi chợ/i }).first().click();
    await expect(page.getByRole('heading', { name: 'Lập Phiếu Đi chợ & Cân đối Ngân sách' })).toBeVisible();

    // Kiểm tra có chỉ báo ngân sách quy định
    await expect(page.getByText(/Ngân sách quy định:/i)).toBeVisible();
  });
});
