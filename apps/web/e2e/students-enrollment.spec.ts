import { test, expect } from '@playwright/test';
import path from 'path';
import { prisma } from '@km/db';

const ARTIFACT_DIR = 'C:/Users/binh/.gemini/antigravity-ide/brain/ba0157c6-626b-4f30-ae98-d3a6a038bbb5';
const testId = Date.now().toString().slice(-4);
const testSchoolSlug = `kinder-e2e-phase4-${testId}`;
const testSchoolName = `Trường Mầm Non Ban Mai Phase 4 ${testId}`;

test.describe.serial('Phase 4 — Students, Families & Enrollment History E2E Tests', () => {
  let createdSchoolId = '';
  let createdYearId = '';
  let class1Id = '';
  let class2Id = '';
  let createdRelationshipId = '';
  const testCccd = `001202${Math.floor(100000 + Math.random() * 900000)}`;

  test.beforeAll(async () => {
    // Khởi tạo trường học và 2 lớp học phục vụ test thực tế
    const school = await prisma.school.create({
      data: {
        code: `SCH-P4-${testId}`,
        slug: testSchoolSlug,
        name: testSchoolName,
        status: 'ACTIVE',
        phone: '0988776655',
        email: `phase4.${testId}@kindermanagement.edu.vn`,
      },
    });
    createdSchoolId = school.id;

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

    const c1 = await prisma.class.create({
      data: {
        schoolId: school.id,
        schoolYearId: schoolYear.id,
        name: 'Mầm 1 (Hoa Sen)',
        ageGroup: 'PRESCHOOL_3_4Y',
        capacity: 25,
      },
    });
    class1Id = c1.id;

    const c2 = await prisma.class.create({
      data: {
        schoolId: school.id,
        schoolYearId: schoolYear.id,
        name: 'Mầm 2 (Hoa Cúc)',
        ageGroup: 'PRESCHOOL_3_4Y',
        capacity: 25,
      },
    });
    class2Id = c2.id;
  });

  test.afterAll(async () => {
    // Dọn dẹp sạch sẽ toàn bộ test data trong database sau khi test xong
    console.log('--- CLEANUP: Dọn dẹp test data Phase 4 từ Database ---');
    try {
      if (createdSchoolId) {
        // Xóa class memberships
        await prisma.classMembership.deleteMany({
          where: { class: { schoolId: createdSchoolId } },
        });

        // Xóa responsible persons
        await prisma.responsiblePerson.deleteMany({
          where: { relationship: { schoolId: createdSchoolId } },
        });

        // Xóa relationships
        const rels = await prisma.studentSchoolRelationship.findMany({
          where: { schoolId: createdSchoolId },
          select: { studentId: true },
        });
        await prisma.studentSchoolRelationship.deleteMany({
          where: { schoolId: createdSchoolId },
        });

        // Xóa students
        for (const r of rels) {
          await prisma.student.deleteMany({ where: { id: r.studentId } });
        }

        // Xóa classes, years, settings, audit logs, school
        await prisma.class.deleteMany({ where: { schoolId: createdSchoolId } });
        await prisma.schoolSetting.deleteMany({ where: { schoolId: createdSchoolId } });
        await prisma.schoolYear.deleteMany({ where: { schoolId: createdSchoolId } });
        await prisma.auditLog.deleteMany({ where: { schoolId: createdSchoolId } });
        await prisma.school.deleteMany({ where: { id: createdSchoolId } });
      }
      console.log('--- CLEANUP COMPLETE: Đã xóa 100% test data Phase 4 ---');
    } catch (e) {
      console.error('Lỗi dọn dẹp test data:', e);
    }
  });

  test('1. Student Directory Initial State & Navigation', async ({ page }) => {
    await page.goto(`/${testSchoolSlug}/students`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Hồ sơ & Danh sách Học sinh' })).toBeVisible();
    await expect(page.getByText('Chưa có học sinh nào trong trường')).toBeVisible();

    // Chụp ảnh màn hình trạng thái ban đầu
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'visual_18_students_empty_list.png'),
    });
  });

  test('2. Student Intake (Tiếp nhận hồ sơ học sinh mới)', async ({ page }) => {
    await page.goto(`/${testSchoolSlug}/students/new`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Tiếp nhận Hồ sơ Học sinh Mới' })).toBeVisible();

    // Điền thông tin nhân thân bé
    await page.locator('#studentLastName').fill('Nguyễn');
    await page.locator('#studentMiddleName').fill('Bảo');
    await page.locator('#studentFirstName').fill('An');
    await page.locator('#studentGender').selectOption('MALE');
    await page.locator('#studentDob').fill('2022-03-15');
    await page.locator('#studentCccd').fill(testCccd);

    // Điền thông tin người giám hộ (Cha và Mẹ)
    await page.locator('#fatherName').fill('Nguyễn Văn Hùng');
    await page.locator('#fatherPhone').fill('0912345678');
    await page.locator('#fatherOccupation').fill('Kỹ sư phần mềm');

    await page.locator('#motherName').fill('Trần Thị Lan');
    await page.locator('#motherPhone').fill('0987654321');
    await page.locator('#motherOccupation').fill('Bác sĩ nhi khoa');

    // Chọn lớp ban đầu: Mầm 1 (Hoa Sen)
    await page.locator('#classSelect').selectOption(class1Id);

    // Bật chế độ miễn học phí
    await page.locator('text=Miễn 100% học phí').click();

    // Submit form tiếp nhận
    page.on('dialog', (d) => d.accept());
    await page.locator('#btn-submit-enrollment').click();

    // Chờ điều hướng đến trang chi tiết học sinh (không phải /new)
    await page.waitForURL(
      (url) => url.pathname.includes(`/${testSchoolSlug}/students/`) && !url.pathname.endsWith('/new'),
      { timeout: 15000 }
    );
    await expect(page.getByRole('heading', { name: 'Nguyễn Bảo An' })).toBeVisible({ timeout: 10000 });

    // Lấy relationshipId từ URL
    const url = page.url();
    createdRelationshipId = url.split('/').pop() || '';
    expect(createdRelationshipId).not.toBe('');

    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'visual_19_student_detail_profile.png'),
      fullPage: true,
    });
  });

  test('3. Student Detail Profile & Guardian Cards Verification', async ({ page }) => {
    await page.goto(`/${testSchoolSlug}/students/${createdRelationshipId}`);
    await page.waitForLoadState('networkidle');

    // Xác nhận họ tên và trạng thái
    await expect(page.getByRole('heading', { name: 'Nguyễn Bảo An' })).toBeVisible();
    await expect(page.getByText('Đang học (ACTIVE)')).toBeVisible();

    // Xác nhận thông tin gia đình
    await expect(page.getByText('Nguyễn Văn Hùng')).toBeVisible();
    await expect(page.getByText(/912345678/)).toBeVisible();
    await expect(page.getByText('Trần Thị Lan')).toBeVisible();
    await expect(page.getByText(/987654321/)).toBeVisible();

    // Xác nhận lịch sử lớp ban đầu
    await expect(page.getByText('Mầm 1 (Hoa Sen)', { exact: true })).toBeVisible();
    await expect(page.getByText('Hiện tại', { exact: true })).toBeVisible();
  });

  test('4. Class Transfer (Chuyển lớp học sinh & Append-Only History)', async ({ page }) => {
    await page.goto(`/${testSchoolSlug}/students/${createdRelationshipId}`);
    await page.waitForLoadState('networkidle');

    // Mở modal chuyển lớp
    await page.locator('#btn-transfer-class').click();
    await expect(page.getByRole('heading', { name: 'Chuyển Lớp Học' })).toBeVisible();

    // Chọn lớp mới: Mầm 2 (Hoa Cúc)
    await page.locator('#targetClassSelect').selectOption(class2Id);
    await page.locator('#btn-confirm-transfer').click();

    // Xác nhận thông báo thành công
    await expect(page.getByText('Đã chuyển lớp và lưu dòng thời gian học tập thành công!')).toBeVisible({ timeout: 15000 });

    // Kiểm tra dòng thời gian hiển thị lớp mới là Hiện tại
    await page.waitForTimeout(1000);
    await expect(page.getByText('Mầm 2 (Hoa Cúc)', { exact: true })).toBeVisible();

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'visual_20_student_class_transferred.png'),
      fullPage: true,
    });
  });

  test('5. Enrollment Status Transition (Ghi nhận Thôi học / WITHDRAWN)', async ({ page }) => {
    await page.goto(`/${testSchoolSlug}/students/${createdRelationshipId}`);
    await page.waitForLoadState('networkidle');

    // Mở modal cập nhật trạng thái
    await page.locator('#btn-update-status').click();
    await expect(page.getByRole('heading', { name: 'Cập nhật Trạng thái Học sinh' })).toBeVisible();

    // Chọn trạng thái thôi học
    await page.locator('#targetStatusSelect').selectOption('WITHDRAWN');
    await page.locator('#withdrawalReason').fill('Gia đình chuyển nơi cư trú sang Đà Nẵng');

    await page.locator('#btn-confirm-status').click();

    // Xác nhận thông báo cập nhật thành công
    await expect(page.getByText('Đã cập nhật trạng thái học sinh thành công!')).toBeVisible({ timeout: 15000 });

    // Huy hiệu trạng thái đổi sang WITHDRAWN
    await page.waitForTimeout(1000);
    await expect(page.getByText('Đã thôi học (WITHDRAWN)')).toBeVisible();

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'visual_21_student_status_withdrawn.png'),
      fullPage: true,
    });
  });

  test('6. Student Directory Filter & Search Verification', async ({ page }) => {
    await page.goto(`/${testSchoolSlug}/students`);
    await page.waitForLoadState('networkidle');

    // Học sinh xuất hiện trong bảng danh sách
    await expect(page.getByText('Nguyễn Bảo An')).toBeVisible();
    await expect(page.getByText('Thôi học', { exact: true })).toBeVisible();

    // Tìm kiếm bằng tên học sinh
    await page.locator('#student-search-input').fill('Bảo An');
    await expect(page.getByText('Nguyễn Bảo An')).toBeVisible();

    // Tìm kiếm bằng số điện thoại phụ huynh
    await page.locator('#student-search-input').fill('0912345678');
    await expect(page.getByText('Nguyễn Bảo An')).toBeVisible();

    // Tìm kiếm không tồn tại
    await page.locator('#student-search-input').fill('KhongTonTai999');
    await expect(page.getByText('Không tìm thấy học sinh phù hợp với bộ lọc')).toBeVisible();

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'visual_22_students_filtered_directory.png'),
      fullPage: true,
    });
  });
});
