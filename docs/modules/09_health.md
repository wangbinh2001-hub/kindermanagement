# Module 09: Health (Sức khỏe & Chỉ số phát triển)

> **Mục đích:** Đặc tả ghi nhận và theo dõi các chỉ số sức khỏe của học sinh (chiều cao, cân nặng, BMI) theo lịch đo định kỳ của trường.
> **Đối tượng sử dụng tài liệu:** Zcode / AI Code Agent khi thực hiện Phase 8 trong `PLAN.md`.
> **Quy tắc kèm theo bắt buộc:** `RULES_CODING.md`, `RULES_TENANCY.md`, `RULES_SECURITY.md`.

---

## 1. Ranh giới ứng dụng & Phân quyền

- **Đường dẫn (Route):** `apps/web/src/app/(school)/[schoolSlug]/health/...`
- **Người nhập/sửa chỉ số:** Giáo viên chủ nhiệm/phụ trách của lớp, và School Admin.
- **Tần suất đo:** Tùy trường cấu hình (`MONTHLY`, `QUARTERLY`, hoặc tùy chỉnh) trong School Settings.
- **Phụ huynh:** Chỉ xem (read-only) các chỉ số của con mình qua Parent Portal.

---

## 2. Chức năng cốt lõi

### 2.1 Ghi nhận chỉ số (Health Measurements)
- Mỗi lần đo sẽ ghi một bản ghi `HealthRecord` mới (append-only, không ghi đè lịch sử).
- Trường dữ liệu:
  - `heightCm`: Chiều cao (cm, decimal).
  - `weightKg`: Cân nặng (kg, decimal).
  - `measuredAt`: Ngày đo.
  - `recordedBy`: StaffMember thực hiện đo/ghi.
  - `notes?`: Ghi chú.
- **Tính BMI tự động:**
  - Công thức: `BMI = weightKg / (heightCm/100)^2`
  - BMI được tính tự động khi nhập chiều cao + cân nặng, hiển thị kèm 1 số lẻ (VD: `15.2`).

### 2.2 Phân loại theo chuẩn WHO
- BMI được đối chiếu với chuẩn WHO (theo tuổi và giới tính) để phân nhóm:
  - `UNDERWEIGHT` (Suy dinh dưỡng)
  - `NORMAL` (Bình thường)
  - `OVERWEIGHT` (Thừa cân)
  - `OBESE` (Béo phì)
- Bảng tham chiếu chuẩn WHO phải được lưu rõ phiên bản (VD: `WHO 2006` / `WHO 2007`) để đảm bảo traceable.

### 2.3 Lịch sử & Biểu đồ tăng trưởng
- Hiển thị lịch sử theo thời gian (append-only) dạng bảng hoặc biểu đồ đường (Growth Chart).
- Chỉ số cũ không bao giờ bị thay đổi/sửa lại; việc nhập sai chỉ tạo bản ghi điều chỉnh mới nếu cần.

---

## 3. Database Entities liên quan

```prisma
model HealthRecord {
  id              String   @id @default(uuid())
  schoolId        String
  school          School   @relation(fields: [schoolId], references: [id])
  studentSchoolRelationshipId String
  studentSchoolRelationship StudentSchoolRelationship @relation(fields: [studentSchoolRelationshipId], references: [id])
  classId         String?
  class           Class?   @relation(fields: [classId], references: [id])

  heightCm        Decimal  @db.Decimal(5, 1)
  weightKg        Decimal  @db.Decimal(5, 2)
  bmi             Decimal  @db.Decimal(4, 1) // auto-calculated
  bmiCategory     BmiCategory? // WHO-based
  whoReference    String?  // e.g. "WHO 2006", "WHO 2007"

  measuredAt      DateTime
  recordedBy      String
  notes           String?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  deletedAt       DateTime?
}

enum BmiCategory {
  UNDERWEIGHT
  NORMAL
  OVERWEIGHT
  OBESE
}
```

---

## 4. Definition of Done (DoD)
- [ ] Nhập chiều cao/cân nặng, hệ thống tự động tính BMI.
- [ ] Phân loại BMI theo chuẩn WHO chuẩn (theo tuổi + giới tính).
- [ ] Lịch sử đo là append-only; không có thao tác sửa bản ghi cũ trực tiếp.
- [ ] Giáo viên lớp và School Admin nhập được; staff khác không có quyền.
- [ ] Tần suất đo được cấu hình theo trường (tháng/quý).
- [ ] Phụ huynh chỉ xem được (read-only) chỉ số của con mình.
- [ ] Biểu đồ tăng trưởng hiển thị đúng thứ tự thời gian.
- [ ] RLS tenant isolation + Audit ghi nhận ai nhập chỉ số.