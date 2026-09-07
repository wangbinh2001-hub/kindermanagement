# Module 05: Students & Families (Học sinh & Gia đình)

> **Mục đích:** Đặc tả quản lý hồ sơ học sinh, định danh toàn cầu (CCCD/Định danh cá nhân), quan hệ trường học, người chịu trách nhiệm (Cha, Mẹ, Người giám hộ), và liên kết phụ huynh đa trường.
> **Đối tượng sử dụng tài liệu:** Zcode / AI Code Agent khi thực hiện Phase 4 trong `PLAN.md`.
> **Quy tắc kèm theo bắt buộc:** `RULES_CODING.md`, `RULES_TENANCY.md`, `RULES_DOMAIN.md`.

---

## 1. Ranh giới ứng dụng
- **Đường dẫn (Route):** `apps/web/src/app/(school)/[schoolSlug]/students/`
- **Ngữ cảnh (Context):** Bắt buộc inject `schoolId` và `currentSchoolYearId`.

---

## 2. Các thực thể dữ liệu cốt lõi (Core Entities)

### 2.1 Student (Định danh toàn cầu – Global Identity)
Lưu trong bảng `Student` (ngoài tenant, không có `schoolId`). Dùng để deduplicate học sinh thực tế trên toàn hệ thống.

| Trường | Kiểu | Mô tả |
|---|---|---|
| `id` | UUID | Khóa chính |
| `fullName` | string | Họ tên học sinh |
| `dateOfBirth` | DateTime | Ngày sinh |
| `gender` | enum (MALE, FEMALE, OTHER) | Giới tính |
| `ethnicity` | string? | Dân tộc |
| `nationality` | string? | Quốc tịch |
| `religion` | string? | Tôn giáo |
| `birthPlaceProvince` | string? | Nơi sinh - Tỉnh |
| `birthPlaceDistrict` | string? | Nơi sinh - Huyện |
| `birthPlaceWard` | string? | Nơi sinh - Xã |
| `birthPlaceDetail` | string? | Nơi sinh chi tiết |
| `permanentAddressProvince` | string? | Thường trú - Tỉnh |
| `permanentAddressDistrict` | string? | Thường trú - Huyện |
| `permanentAddressWard` | string? | Thường trú - Xã |
| `permanentAddressDetail` | string? | Thường trú chi tiết |
| `currentAddressProvince` | string? | Chỗ ở hiện nay - Tỉnh |
| `currentAddressDistrict` | string? | Chỗ ở hiện nay - Huyện |
| `currentAddressWard` | string? | Chỗ ở hiện nay - Xã |
| `currentAddressDetail` | string? | Chỗ ở hiện nay chi tiết |
| `phoneContact` | string? | SĐT liên hệ gia đình |
| `passportNumber` | string? | Số hộ chiếu |
| `passportIssuedAt` | DateTime? | Ngày cấp hộ chiếu |
| `passportIssuedBy` | string? | Nơi cấp hộ chiếu |
| `cccd` | string? **Unique** | Số CCCD / CMND / Định danh cá nhân (khóa duy nhất toàn cầu) |
| `cccdIssuedAt` | DateTime? | Ngày cấp CCCD |
| `cccdIssuedBy` | string? | Nơi cấp CCCD |
| `personalIdNumber` | string? | Số định danh cá nhân (nếu khác CCCD) |
| `disabilityType` | string? | Loại khuyết tật |
| `policyObject` | string? | Đối tượng chính sách |
| `tuitionExempt` | boolean | Miễn học phí |
| `tuitionReduced` | boolean | Giảm học phí |
| `studyCostSupport` | boolean | Hỗ trợ chi phí học tập |
| `lunchSupport` | boolean | Hỗ trợ ăn trưa |
| `languageProgram` | boolean | Học chương trình làm quen ngôn ngữ |
| `isNewEnrollment` | boolean | Học sinh tuyển mới |
| `newEnrollmentDate` | DateTime? | Ngày tuyển mới |
| `twoSessionsPerDay` | boolean | Học 2 buổi/ngày |
| `isBoarding` | boolean | Học sinh lớp bán trú |
| `boardType` | string? | Loại bán trú |
| `hasMotherEthnic` | boolean | Có mẹ dân tộc |
| `motherEthnicity` | string? | Dân tộc mẹ |
| `hasFatherEthnic` | boolean | Có cha dân tộc |
| `fatherEthnicity` | string? | Dân tộc cha |
| `canSwim` | boolean | Biết bơi |
| `eyeDisease` | boolean | Bệnh về mắt |
| `parentHasSmartphone` | boolean | Phụ huynh có smartphone |
| `parentHasInternet` | boolean | Phụ huynh có máy tính kết nối internet |
| `childDevelopment` | string? | Giáo dục phát triển của trẻ |
| `createdAt` | DateTime | Tự động |
| `updatedAt` | DateTime | Tự động |
| `deletedAt` | DateTime? | Soft delete |

**Ràng buộc:** `cccd` là unique (partial index where `deletedAt IS NULL`). Nếu học sinh chưa có CCCD, `personalIdNumber` hoặc `passportNumber` dùng làm khóa thay thế nhưng vẫn khuyến khích CCCD.

---

### 2.2 StudentSchoolRelationship (Quan hệ học sinh – trường)
Mỗi học sinh có thể học tại nhiều trường, mỗi quan hệ là một bản ghi riêng.

| Trường | Kiểu | Mô tả |
|---|---|---|
| `id` | UUID | Khóa chính |
| `studentId` | UUID | FK → Student |
| `schoolId` | UUID | FK → School (tenant) |
| `schoolYearId` | UUID | FK → SchoolYear (năm học hiện tại) |
| `enrollmentStatus` | enum (ACTIVE, WITHDRAWN, GRADUATED, ON_LEAVE) | Trạng thái học tập tại trường này |
| `enrolledAt` | DateTime | Ngày nhập học / chuyển đến |
| `withdrawnAt` | DateTime? | Ngày nghỉ học / chuyển đi |
| `withdrawalReason` | string? | Lý do thôi học |
| `previousProvince` | string? | Chuyển từ tỉnh/thành phố nào |
| `previousWard` | string? | Chuyển từ xã/phường nào |
| `classId` | UUID? | Lớp hiện tại (nullable) |
| `createdAt` | DateTime | Tự động |
| `updatedAt` | DateTime | Tự động |
| `deletedAt` | DateTime? | Soft delete |

**Quy tắc:**
- Một học sinh chỉ có **một quan hệ active** (`enrollmentStatus = ACTIVE`) tại một thời điểm trong cùng một trường.
- Khi chuyển trường: đóng quan hệ cũ (`WITHDRAWN`), tạo quan hệ mới cho trường mới. Dữ liệu vận hành **không sao chép** giữa hai trường.

---

### 2.3 Responsible Persons (Người chịu trách nhiệm) – Nhúng trong hồ sơ học sinh tại trường
Mỗi học sinh tại một trường có tối đa 3 mục: **Cha**, **Mẹ**, **Người giám hộ**. Mỗi mục chứa:

| Trường | Kiểu | Bắt buộc |
|---|---|---|
| `fullName` | string | Có (ít nhất 1 trong 3 mục) |
| `yearOfBirth` | int | Có (ít nhất 1) |
| `occupation` | string? | Không |
| `phone` | string | Có (ít nhất 1) – **Dùng làm định danh phụ huynh** |
| `cccd` | string? | Không (CMND/CCCD) |
| `noInfo` | boolean | True nếu không có thông tin người này |

**Ràng buộc nghiệp vụ:** Ít nhất **một** trong ba mục (Cha/Mẹ/NguoiGiamHo) phải có đủ `fullName`, `yearOfBirth`, `phone`. Không được để trống cả ba.

---

### 2.4 Parent Identity (Định danh phụ huynh toàn hệ thống)
- Phụ huynh được xác định bởi **số điện thoại** (`phone`).
- Cùng một số điện thoại → **một bản ghi Parent** duy nhất trên toàn platform.
- Parent có thể liên kết với nhiều `StudentSchoolRelationship` ở các trường khác nhau.
- Khi phụ huynh đăng nhập Parent Portal, hệ thống lấy tất cả học sinh mà `phone` xuất hiện trong mục Cha/Mẹ/NguoiGiamHo của các quan hệ học sinh.

---

## 3. API & Procedure Design (tRPC)

```ts
// Danh sách học sinh của trường (có filter, phân trang)
students.list: protectedProcedure
  .input(z.object({
    schoolYearId: z.string().uuid().optional(),
    classId: z.string().uuid().optional(),
    status: z.enum(['ACTIVE','WITHDRAWN','GRADUATED','ON_LEAVE']).optional(),
    search: z.string().optional(),
    page: z.number().default(1),
    pageSize: z.number().default(20),
  }))
  .query(...)

// Xem chi tiết hồ sơ học sinh trong trường
students.getById: protectedProcedure
  .input(z.object({ studentSchoolRelationshipId: z.string().uuid() }))
  .query(...)

// Tạo mới học sinh (global + quan hệ trường)
students.create: protectedProcedure
  .input(z.object({
    // global student fields
    fullName: z.string().min(1),
    dateOfBirth: z.coerce.date(),
    gender: z.enum(['MALE','FEMALE','OTHER']),
    cccd: z.string().optional(),
    personalIdNumber: z.string().optional(),
    // ... other global fields
    // school relationship fields
    schoolYearId: z.string().uuid(),
    classId: z.string().uuid().optional(),
    // responsible persons
    father: z.object({ fullName: z.string().optional(), yearOfBirth: z.number().optional(), occupation: z.string().optional(), phone: z.string().optional(), cccd: z.string().optional(), noInfo: z.boolean().optional() }).optional(),
    mother: z.object({ ... }).optional(),
    guardian: z.object({ ... }).optional(),
  }))
  .mutation(...)

// Cập nhật hồ sơ (global hoặc quan hệ trường)
students.updateGlobal: protectedProcedure
  .input(z.object({ studentId: z.string().uuid(), data: /* global fields */ }))
  .mutation(...)

students.updateRelationship: protectedProcedure
  .input(z.object({ studentSchoolRelationshipId: z.string().uuid(), data: /* relationship fields */ }))
  .mutation(...)

// Chuyển trường / nghỉ học
students.withdraw: protectedProcedure
  .input(z.object({ studentSchoolRelationshipId: z.string().uuid(), reason: z.string(), withdrawnAt: z.coerce.date() }))
  .mutation(...)

// Lịch sử phân lớp (append-only)
students.classHistory: protectedProcedure
  .input(z.object({ studentSchoolRelationshipId: z.string().uuid() }))
  .query(...)
```

---

## 4. Giao diện (UI) – Student Workspace
- **Student List:** Bảng có tìm kiếm, lọc theo lớp, năm học, trạng thái. Hỗ trợ 4 trạng thái (Loading, Empty, Error, Success).
- **Student Profile:** Hiển thị toàn bộ thông tin global + quan hệ trường hiện tại + danh sách người chịu trách nhiệm.
- **Enrollment History:** Timeline các năm học, lớp học, trạng thái.
- **Family View:** Xem thông tin Cha, Mẹ, Người giám hộ; SĐT dùng làm link gọi/nhắn tin.
- **Responsive, Light/Dark mode, i18n vi-VN.**

---

## 5. Definition of Done (DoD)
- [ ] Global Student identity deduplicate bằng CCCD (hoặc PersonalId/Passport) – không cho trùng.
- [ ] Tạo học sinh tự động tạo quan hệ trường + gán lớp (nếu có).
- [ ] Ít nhất 1 người chịu trách nhiệm có đủ thông tin (validation server-side).
- [ ] Số điện thoại phụ huynh tái sử dụng – Parent identity duy nhất.
- [ ] Lịch sử phân lớp (ClassMembership) append-only, không ghi đè.
- [ ] Mọi mutation ghi `AuditLog`.
- [ ] Soft delete trên cả `Student` và `StudentSchoolRelationship`.
- [ ] RLS áp dụng: chỉ thấy học sinh của `schoolId` hiện tại.
- [ ] Test isolation: hai trường không nhìn thấy học sinh của nhau.