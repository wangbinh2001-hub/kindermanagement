# Module 03: School Years & Classes

> **Mục đích:** Gộp quản lý Năm học và Lớp học vào cùng một module duy nhất.
> **Mô hình sử dụng:** Khi vào danh mục Năm học, School Admin chọn một năm học cụ thể; hệ thống sẽ hiển thị toàn bộ lớp học thuộc năm đó.
> **Đối tượng sử dụng tài liệu:** Zcode / AI Code Agent khi thực hiện Phase 3 trong `PLAN.md`.
> **Quy tắc kèm theo bắt buộc:** `RULES_CODING.md`, `RULES_TENANCY.md`, `RULES_PLANNING.md`.

---

## 1. Ranh giới ứng dụng
- **Đường dẫn (Route):** `apps/web/src/app/(school)/[schoolSlug]/settings/school-years/`
- **Luồng UI:**
  1. Hiển thị danh sách năm học.
  2. Khi chọn một năm học, hiển thị danh sách lớp thuộc năm học đó.
  3. Trong bối cảnh năm học đang chọn, cho phép tạo / sửa / xóa mềm lớp học.
- **Ngữ cảnh (Context):** Bắt buộc inject `schoolId` và `currentSchoolYearId`.

---

## 2. Mục tiêu nghiệp vụ
- Mỗi trường có nhiều năm học.
- Chỉ một năm học được đánh dấu là hiện tại tại một thời điểm.
- Lớp học luôn thuộc về một năm học cụ thể.
- Danh sách lớp hiển thị theo năm học đang chọn.
- Khi tạo lớp mới, hệ thống phải hỗ trợ cấu hình theo độ tuổi mầm non tại Việt Nam.

---

## 3. Phần A — School Years (Quản lý năm học)

### 3.1 Chức năng cốt lõi
- Tạo năm học mới.
- Cập nhật năm học.
- Chọn năm học hiện tại.
- Kết thúc / lưu trữ năm học cũ.
- Không cho phép xóa vật lý năm học đang được tham chiếu.

### 3.2 Quy tắc hiển thị
- Danh sách năm học hiển thị theo thứ tự thời gian mới nhất lên đầu.
- Năm học hiện tại phải được đánh dấu rõ ràng.
- Khi chọn một năm học, toàn bộ dữ liệu lớp học phía dưới phải đổi theo năm đó.

### 3.3 API / tRPC
- `schoolYears.list`
- `schoolYears.create`
- `schoolYears.update`
- `schoolYears.setCurrent`
- `schoolYears.archive`

### 3.4 DoD cho phần năm học
- [ ] Có thể tạo năm học mới với format chuẩn `YYYY-YYYY`.
- [ ] Chỉ một năm học được gắn `current` trong cùng một trường.
- [ ] Đổi năm học hiện tại là thao tác atomic.
- [ ] Không cho phép xóa mềm năm học đang bị tham chiếu bởi lớp hoặc lịch sử lớp.
- [ ] Mọi mutation đều ghi audit log.

---

## 4. Phần B — Classes (Quản lý lớp học theo năm học)

### 4.1 Cách vận hành
- Sau khi chọn một năm học, màn hình hiển thị toàn bộ lớp của năm đó.
- Nút tạo lớp mới nằm ngay trong ngữ cảnh năm học đang chọn.
- Lớp mới sinh ra luôn gắn vào năm học đang chọn.

### 4.2 Chức năng cốt lõi
- Tạo lớp.
- Cập nhật lớp.
- Xóa mềm lớp.
- Phân công giáo viên chủ nhiệm.
- Phân công giáo viên phụ trách.
- Kiểm soát sức chứa.
- Hiển thị lớp theo trạng thái hoạt động.

### 4.3 Cấu hình lớp theo độ tuổi mầm non Việt Nam
Khi tạo lớp mới, hệ thống phải hỗ trợ nhóm tuổi chuẩn mầm non tại Việt Nam. Mặc định đề xuất các nhóm sau:

- **Nhà trẻ:**
  - 12–18 tháng
  - 18–24 tháng
  - 24–36 tháng
- **Mẫu giáo:**
  - 3–4 tuổi
  - 4–5 tuổi
  - 5–6 tuổi

Quy tắc:
- Tên nhóm tuổi có thể hiển thị theo nhãn nghiệp vụ của trường.
- Mỗi lớp phải thuộc một nhóm tuổi chính.
- Hệ thống có thể cho phép chỉnh tên hiển thị lớp, nhưng nhóm tuổi gốc phải được lưu để phục vụ lọc và báo cáo.
- Nếu trường dùng mô hình riêng, vẫn phải map được về nhóm tuổi chuẩn mầm non.

### 4.4 Gợi ý khi tạo lớp mới
Form tạo lớp mới phải có tối thiểu:
- Tên lớp.
- Năm học.
- Nhóm tuổi.
- Sức chứa.
- Giáo viên chủ nhiệm.
- Giáo viên phụ trách phụ.

### 4.5 Lịch sử phân lớp
- Lịch sử phân lớp là append-only.
- Khi học sinh chuyển lớp hoặc lên lớp theo năm học mới, phải tạo bản ghi lịch sử mới.
- Không ghi đè lịch sử cũ.

### 4.6 API / tRPC
- `classes.listBySchoolYear`
- `classes.create`
- `classes.update`
- `classes.delete`
- `classes.assignHomeroomTeacher`
- `classes.assignAssistantTeacher`
- `classes.transferStudent`

### 4.7 DoD cho phần lớp học
- [ ] Chọn năm học nào thì lớp của năm học đó hiển thị đúng.
- [ ] Tạo lớp mới luôn gắn với năm học đang chọn.
- [ ] Có hỗ trợ nhóm tuổi mầm non Việt Nam.
- [ ] Có thể gán giáo viên chủ nhiệm và giáo viên phụ trách.
- [ ] Không cho xóa vật lý lớp còn lịch sử hoặc còn học sinh active.
- [ ] Lịch sử phân lớp được bảo toàn.
- [ ] Mọi mutation đều có audit log.

---

## 5. Database Entities liên quan

```prisma
model SchoolYear {
  id             String        @id @default(uuid())
  schoolId       String
  school         School        @relation(fields: [schoolId], references: [id])
  name           String        // e.g. "2026-2027"
  startDate      DateTime
  endDate        DateTime
  isCurrent      Boolean       @default(false)
  isArchived     Boolean       @default(false)
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
  deletedAt      DateTime?

  classes        Class[]
}

model Class {
  id                String      @id @default(uuid())
  schoolId          String
  school            School      @relation(fields: [schoolId], references: [id])
  schoolYearId      String
  schoolYear        SchoolYear  @relation(fields: [schoolYearId], references: [id])
  name              String
  ageGroup          AgeGroup
  capacity          Int         @default(30)
  homeroomTeacherId String?
  isActive          Boolean     @default(true)
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  deletedAt         DateTime?

  memberships       ClassMembership[]
}

enum AgeGroup {
  NURSERY_12_18M
  NURSERY_18_24M
  NURSERY_24_36M
  PRESCHOOL_3_4Y
  PRESCHOOL_4_5Y
  PRESCHOOL_5_6Y
}

model ClassMembership {
  id              String    @id @default(uuid())
  studentSchoolRelationshipId String
  classId         String
  schoolYearId    String
  startedAt       DateTime
  endedAt         DateTime?
  createdAt       DateTime  @default(now())
}
```

---

## 6. Ghi chú triển khai cho Zcode
- Module này thay thế cách tách riêng `03_school_years.md` và `04_classes.md`.
- Khi code, Zcode chỉ cần đọc file này cho toàn bộ nghiệp vụ năm học + lớp học.
- UI nên thể hiện theo luồng: chọn năm học -> xem lớp học -> tạo lớp mới trong năm học đó.
