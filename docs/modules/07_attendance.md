# Module 07: Attendance (Điểm danh & Tăng ca)

> **Mục đích:** Đặc tả quy trình ghi nhận điểm danh, tăng ca ngoài giờ, và quản lý in mã QR điểm danh của học sinh.
> **Đối tượng sử dụng tài liệu:** Zcode / AI Code Agent khi thực hiện Phase 6 trong `PLAN.md`.
> **Quy tắc kèm theo bắt buộc:** `RULES_CODING.md`, `RULES_TENANCY.md`.

---

## 1. Ranh giới ứng dụng
- **Đường dẫn (Route):** `apps/web/src/app/(school)/[schoolSlug]/attendance/`
- **Ngữ cảnh (Context):** Bắt buộc inject `schoolId` và `currentSchoolYearId`.

---

## 2. Các chức năng cốt lõi

### 2.1 Các hình thức điểm danh (Modes)
1. **Điểm danh thủ công theo lớp (List view):** Giáo viên tích trạng thái từng bé.
2. **Điểm danh ma trận (Matrix view):** Hiển thị danh sách học sinh theo hàng dọc, các ngày trong tháng theo hàng ngang.
3. **Điểm danh qua QR Code:**
   - Mỗi học sinh có một mã QR cá nhân cố định do hệ thống tạo (không dùng số CCCD để làm nội dung mã).
   - Hệ thống cung cấp tính năng in hàng loạt mã QR theo lớp (PDF/Print view).
   - Giáo viên, nhân viên, hoặc School Admin quét mã.
   - Giao diện quét có hai chế độ: `Đến lớp (Check-in)` và `Về nhà (Check-out)`.

### 2.2 Trạng thái và tính toán tăng ca (Overtime)
- Trạng thái cơ bản: `PRESENT` (có mặt), `ABSENT_EXCUSED` (vắng có phép), `ABSENT_UNEXCUSED` (vắng không phép), `LATE` (đi muộn), `EARLY_LEAVE` (về sớm).
- Khi check-out, nếu thời gian từ 18:00 trở đi, hệ thống tính giờ tăng ca (Overtime).
- Quy tắc làm tròn tăng ca (30 phút một nấc, mốc bắt đầu tính là 18:00):
  - Trước 18:00: `0` giờ.
  - 18:00 – 18:29: `0.5` giờ.
  - 18:30 – 18:59: `1.0` giờ.
  - 19:00 – 19:29: `1.5` giờ.
  - 19:30 – 19:59: `2.0` giờ.
- Số giờ tăng ca được lưu trực tiếp vào bản ghi điểm danh ngày hôm đó.

### 2.3 Phân quyền điểm danh và chỉnh sửa
- **Tạo mới điểm danh:** Giáo viên chủ nhiệm lớp, giáo viên phụ trách lớp, School Admin, và các Staff có quyền `attendance:write`.
- **Yêu cầu xin nghỉ từ Phụ huynh:** Khi School Admin / Giáo viên duyệt yêu cầu xin nghỉ từ ứng dụng phụ huynh, hệ thống tự động tạo bản ghi điểm danh trạng thái `ABSENT_EXCUSED`.
- **Sửa điểm danh ngày cũ:**
  - Giáo viên lớp **không** có quyền sửa bản ghi điểm danh của các ngày trước.
  - Chỉ School Admin hoặc các Staff có quyền `attendance:edit_history` mới được sửa điểm danh và thời gian tăng ca của quá khứ.

### 2.4 Tích hợp module khác
- Dữ liệu `Attendance` chỉ chịu trách nhiệm ghi nhận số liệu và số giờ tăng ca.
- Việc tính tiền dựa trên ngày vắng (hoàn tiền ăn) và số giờ tăng ca (nhân đơn giá) sẽ do module **Tuition & Fees** xử lý ở cuối kỳ.

---

## 3. Database Entities liên quan

```prisma
model AttendanceRecord {
  id              String           @id @default(uuid())
  schoolId        String
  school          School           @relation(fields: [schoolId], references: [id])
  schoolYearId    String
  schoolYear      SchoolYear       @relation(fields: [schoolYearId], references: [id])
  classId         String
  class           Class            @relation(fields: [classId], references: [id])
  studentSchoolRelationshipId String
  studentSchoolRelationship StudentSchoolRelationship @relation(fields: [studentSchoolRelationshipId], references: [id])
  
  date            DateTime         @db.Date
  status          AttendanceStatus @default(PRESENT)
  method          AttendanceMethod @default(MANUAL)
  
  checkInTime     DateTime?        @db.Timestamptz
  checkOutTime    DateTime?        @db.Timestamptz
  overtimeHours   Decimal          @db.Decimal(4,1) @default(0)
  
  recordedById    String           // StaffMember ID
  notes           String?
  
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  deletedAt       DateTime?

  @@unique([studentSchoolRelationshipId, date], name: "unique_student_date")
}

enum AttendanceStatus {
  PRESENT
  ABSENT_EXCUSED
  ABSENT_UNEXCUSED
  LATE
  EARLY_LEAVE
}

enum AttendanceMethod {
  MANUAL
  MATRIX
  QR_CODE
  PARENT_REQUEST
}
```

---

## 4. API & Procedure Design (tRPC)
- `attendance.recordDaily`: Ghi nhận điểm danh hàng loạt cho 1 lớp.
- `attendance.scanQr`: Điểm danh qua quét QR (yêu cầu chế độ in/out). Tính toán và lưu `overtimeHours` nếu check-out.
- `attendance.updateRecord`: Chỉ định riêng cho người có quyền `attendance:edit_history`.
- `attendance.getMatrix`: Trả về dữ liệu điểm danh lưới theo lớp và tháng.
- `attendance.generateQrCodes`: Trả về PDF/Image hoặc link in mã QR cá nhân cho toàn bộ lớp.

---

## 5. Definition of Done (DoD)
- [ ] Tính năng in mã QR cho học sinh hoạt động, mã không chứa CCCD hay PII nhạy cảm trực tiếp.
- [ ] Quét mã QR có 2 chế độ Check-in/Check-out rõ ràng.
- [ ] Thuật toán tính tăng ca đúng mốc 30 phút, bắt đầu tính từ 18:00.
- [ ] Giáo viên không tự ý sửa điểm danh ngày cũ nếu không có quyền `edit_history`.
- [ ] Parent gửi đơn xin nghỉ (nếu duyệt) tự sinh bản ghi `ABSENT_EXCUSED`.
- [ ] View ma trận điểm danh tải mượt, phân tách rõ ràng từng học sinh theo ngày.
- [ ] Ghi Audit Log cho mọi thay đổi điểm danh lịch sử.
