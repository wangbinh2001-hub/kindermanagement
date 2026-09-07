import { test, expect } from '@playwright/test';
import { prisma } from '@km/db';

const testId = Date.now().toString().slice(-4);
const testSchoolSlug = `kinder-e2e-phase6-${testId}`;
const testSchoolName = `Trường Mầm Non Họa Mi Phase 6 ${testId}`;
let createdSchoolId = '';
let createdYearId = '';
let classId = '';
let studentRels: any[] = [];

test.describe.serial('Phase 6: Attendance (Điểm danh & Đón trả)', () => {
  test.beforeAll(async () => {
    // 1. Tạo trường học thực tế trên Supabase Singapore
    const school = await prisma.school.create({
      data: {
        code: `SCH-P6-${testId}`,
        slug: testSchoolSlug,
        name: testSchoolName,
        status: 'ACTIVE',
        phone: '0977889900',
        email: `phase6.${testId}@kindermanagement.edu.vn`,
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
        enableAttendance: true,
      },
    });

    // 3. Tạo lớp học
    const c1 = await prisma.class.create({
      data: {
        schoolId: school.id,
        schoolYearId: schoolYear.id,
        name: 'Lớp Chồi 1 (Họa Mi Vàng)',
        ageGroup: 'PRESCHOOL_4_5Y',
        capacity: 25,
        isActive: true,
      },
    });
    classId = c1.id;

    // 4. Tạo học sinh
    for (let i = 1; i <= 3; i++) {
        const s = await prisma.student.create({
            data: {
                firstName: `Học sinh`,
                lastName: `${i}`,
                gender: 'MALE',
                dateOfBirth: new Date('2022-01-01'),
                enrollments: {
                    create: {
                        schoolId: createdSchoolId,
                        schoolYearId: createdYearId,
                        enrollmentStatus: 'ACTIVE',
                        currentClassId: classId,
                        classMemberships: {
                            create: {
                                classId: classId,
                                schoolYearId: createdYearId,
                                startedAt: new Date(),
                            }
                        }
                    }
                }
            },
            include: {
                enrollments: true
            }
        });
        studentRels.push(s.enrollments[0]);
    }

    // 5. Tạo Staff (để làm admin)
    await prisma.staffMember.create({
        data: {
            userId: `admin-${testId}`,
            schoolId: createdSchoolId,
            fullName: 'Admin Phase 6',
            employeeCode: 'ADMIN-P6',
            phone: `099999${testId}`,
            roles: ['SCHOOL_ADMIN'],
            hiredAt: new Date(),
        }
    });
  });

  test.afterAll(async () => {
    try {
      if (createdSchoolId) {
        await prisma.attendanceRecord.deleteMany({ where: { schoolId: createdSchoolId } });
        await prisma.classMembership.deleteMany({ where: { class: { schoolId: createdSchoolId } } });
        await prisma.studentSchoolRelationship.deleteMany({ where: { schoolId: createdSchoolId } });
        await prisma.student.deleteMany({ where: { enrollments: { some: { schoolId: createdSchoolId } } } });
        
        await prisma.class.deleteMany({ where: { schoolId: createdSchoolId } });
        await prisma.schoolSetting.deleteMany({ where: { schoolId: createdSchoolId } });
        await prisma.schoolYear.deleteMany({ where: { schoolId: createdSchoolId } });
        await prisma.auditLog.deleteMany({ where: { schoolId: createdSchoolId } });
        await prisma.staffMember.deleteMany({ where: { schoolId: createdSchoolId } });
        await prisma.school.deleteMany({ where: { id: createdSchoolId } });
      }
    } catch (e: unknown) {
      console.error('Lỗi dọn dẹp test data Phase 6:', e);
    }
  });

  test.beforeEach(async ({ page }) => {
    // Navigate straight to the attendance page
    await page.goto(`/${testSchoolSlug}/attendance`);
  });

  test('Hiển thị danh sách lớp trên trang tổng quan điểm danh', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Điểm danh & Đón trả' })).toBeVisible();
    await expect(page.getByText('Lớp Chồi 1')).toBeVisible();
    await expect(page.getByText('3 HS')).toBeVisible(); 
  });

  test('Điểm danh thủ công (Daily List)', async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') console.log(`BROWSER ERROR: ${msg.text()}`);
      else console.log(`BROWSER LOG: ${msg.text()}`);
    });
    page.on('pageerror', err => console.log(`BROWSER PAGE ERROR: ${err.message}`));
    
    await page.getByRole('button', { name: 'Điểm danh' }).first().click();
    await expect(page.getByRole('heading', { name: /Lớp:/ })).toBeVisible({ timeout: 15000 });

    // Đánh dấu học sinh đầu tiên Vắng không phép
    await page.locator('table tbody tr').first().locator('button[role="combobox"]').click();
    await page.getByRole('option', { name: 'Vắng không phép' }).click();
    
    // Ghi chú
    const firstRowNotes = page.locator('table tbody tr').first().locator('input').last();
    await firstRowNotes.fill('Bệnh');

    await page.getByRole('button', { name: 'Lưu điểm danh' }).click();
    await expect(page.getByText('Lưu điểm danh thành công!')).toBeVisible({ timeout: 15000 });

    // Verify trong DB
    const studentRelId = studentRels[0].id;
    // Ensure today matches the UTC midnight format generated by the server
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const today = new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`);
    
    const record = await prisma.attendanceRecord.findUnique({
      where: {
        unique_student_date: {
          studentSchoolRelationshipId: studentRelId,
          date: today,
        }
      }
    });
    
    if (!record) {
      const allRecords = await prisma.attendanceRecord.findMany({
        where: { studentSchoolRelationshipId: studentRelId }
      });
      console.log('EXPECTED DATE:', today);
      console.log('ALL RECORDS IN DB:', allRecords);
    }
    
    expect(record).not.toBeNull();
    expect(record?.status).toBe('ABSENT_UNEXCUSED');
    expect(record?.notes).toBe('Bệnh');
  });

  test('Quét QR Check-in', async ({ page }) => {
    await page.getByRole('button', { name: 'Điểm danh' }).first().click();
    await page.getByRole('tab', { name: 'Quét QR Code' }).click({ timeout: 15000 });
    
    await page.getByRole('button', { name: 'Mô phỏng Check-IN' }).click();
    await expect(page.getByText(/Đã CHECK-IN cho/)).toBeVisible({ timeout: 15000 });

    // Verify trong DB
    const studentRelId = studentRels[0].id;
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const today = new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`);
    const record = await prisma.attendanceRecord.findUnique({
      where: {
        unique_student_date: {
          studentSchoolRelationshipId: studentRelId,
          date: today,
        }
      }
    });
    
    expect(record?.status).toBe('PRESENT');
    expect(record?.method).toBe('QR_CODE');
    expect(record?.checkInTime).toBeDefined();
  });
});
