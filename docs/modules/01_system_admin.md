# Module 01: System Admin (Platform Management)

> **Mục đích:** Đặc tả nghiệp vụ và kỹ thuật dành riêng cho khu vực Quản trị Nền tảng (System Admin).
> **Đối tượng sử dụng tài liệu:** Zcode / AI Code Agent khi thực hiện các task thuộc Phase 2 trong `PLAN.md`.
> **Quy tắc kèm theo bắt buộc:** `RULES_CODING.md`, `RULES_TENANCY.md`, `RULES_SECURITY.md`.

---

## 1. Ranh giới ứng dụng (Application Boundary)
- **Đường dẫn (Route Group):** `apps/web/src/app/system-admin/...`
- **Layout & Xác thực:** Hoàn toàn độc lập với `(school)` và `(parent)`.
- **Nguyên tắc cô lập:** System Admin KHÔNG mang ngữ cảnh `school_id` mặc định. Không có quyền truy cập dữ liệu vận hành trường học trừ khi phiên Support Access đang hoạt động.

---

## 2. Các chức năng cốt lõi (Core Capabilities)

### 2.1 Khởi tạo trường học & Tài khoản School Admin (School Provisioning)
- **Endpoint / Procedure:** `systemAdmin.schools.provision`
- **Dữ liệu đầu vào (Zod Schema):**
  - `name`: string (Tên trường, bắt buộc)
  - `ownerName`: string (Họ tên chủ trường, bắt buộc)
  - `phone`: string (Số điện thoại chủ trường, bắt buộc, format VN, dùng để đăng nhập)
  - `email`: string.email() (Email liên hệ, tùy chọn)
  - `address`: string (Địa chỉ trường, tùy chọn)
  - `initialUsername`: string (Tên đăng nhập cho School Admin, bắt buộc)
  - `initialPassword`: string (Mật khẩu khởi tạo, bắt buộc)
- **Hành vi hệ thống:**
  1. Tự động sinh `school_code` (duy nhất, format: `SCH-YYYY-XXXX`).
  2. Tạo bản ghi trường học với trạng thái ban đầu: `ACTIVE` (hoặc `PENDING_SETUP`).
  3. Tạo tài khoản School Admin gắn với trường này.
  4. Đánh dấu cờ `is_temporary_password = true` trên User.
  5. Bắt buộc đổi mật khẩu ở lần đầu đăng nhập, chặn truy cập dashboard nếu chưa đổi.
  6. Ghi `AuditLog` hành động `CREATE_SCHOOL`.

### 2.2 Quản lý vòng đời trường học (School Lifecycle)
- **Các trạng thái:**
  - `ACTIVE`: Hoạt động bình thường.
  - `SUSPENDED` (Tạm khóa):
    - Tài khoản thuộc trường (Admin, Teacher, Staff, Parent) vẫn đăng nhập và xem được dữ liệu cũ (Read-only).
    - Chặn mọi thao tác thêm/sửa/xóa mới từ phía trường.
  - `DELETED`: Đã xóa mềm.
- **Xác thực 2 lớp khi xóa trường (2-Step Verification Deletion):**
  - **Bước 1:** Yêu cầu người dùng gõ lại chính xác `school_code` hoặc tên trường để xác nhận mục tiêu.
  - **Bước 2:** Nhập mật khẩu xác thực của System Admin (hoặc mã OTP).
  - Cập nhật `deleted_at = NOW()` trên bản ghi trường (Soft delete). Tuyệt đối không xóa vật lý trong database.

### 2.3 Cơ chế Support Access (Hỗ trợ trường học)
- **Luồng thông thường:**
  1. School Admin tạo yêu cầu hỗ trợ từ dashboard trường -> Bản ghi `SupportRequest` tạo với trạng thái `OPEN`.
  2. System Admin xem danh sách request -> Chọn **Nhận hỗ trợ** -> Kích hoạt phiên `SupportSession` (`status = ACTIVE`).
  3. Khi có session ACTIVE, System Admin được cấp quyền truy cập tạm thời vào trường đó.
  4. Kết thúc: School Admin bấm **Đóng yêu cầu** (hoặc System Admin bấm **Hoàn tất hỗ trợ**) -> Session chuyển `CLOSED`.
- **Cơ chế Khẩn cấp (Emergency Access):**
  - Dành cho tình huống khẩn cấp (School Admin mất quyền login không tạo request được).
  - System Admin tự mở phiên, BẮT BUỘC nhập `reason` chi tiết (tối thiểu 20 ký tự).
  - Hệ thống ghi `AuditLog` mức độ `CRITICAL` và gửi thông báo cảnh báo.

### 2.4 Dashboard & Giới hạn hiển thị (Zero Data Leak)
- **Được hiển thị:**
  - Chỉ số tổng hợp toàn nền tảng: Tổng số trường, phân bổ trạng thái (`ACTIVE`, `SUSPENDED`), dung lượng lưu trữ đã dùng, trạng thái DB/Server, danh sách lỗi hệ thống (System Error Logs).
  - Danh sách trường: Tên trường, mã trường, chủ trường, SĐT, ngày tạo, trạng thái.
- **Bị chặn tuyệt đối (khi không có Support Session ACTIVE):**
  - Không hiển thị danh sách học sinh, phụ huynh, giáo viên của trường.
  - Không hiển thị bảng điểm danh, hóa đơn học phí, thông tin sức khỏe, thực đơn của trường.

---

## 3. Database Entities liên quan

```prisma
model School {
  id          String        @id @default(uuid())
  code        String        @unique // e.g. SCH-2026-0001
  name        String
  ownerName   String
  phone       String
  email       String?
  address     String?
  status      SchoolStatus  @default(ACTIVE)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  deletedAt   DateTime?

  supportRequests SupportRequest[]
  auditLogs       AuditLog[]
}

enum SchoolStatus {
  PENDING_SETUP
  ACTIVE
  SUSPENDED
}

model SupportRequest {
  id          String               @id @default(uuid())
  schoolId    String
  school      School               @relation(fields: [schoolId], references: [id])
  requestedBy String               // UserId of School Admin
  title       String
  description String
  status      SupportRequestStatus @default(OPEN)
  isEmergency Boolean              @default(false)
  createdAt   DateTime             @default(now())
  closedAt    DateTime?
  closedBy    String?

  sessions    SupportSession[]
}

enum SupportRequestStatus {
  OPEN
  IN_PROGRESS
  RESOLVED
  CLOSED
}

model SupportSession {
  id               String         @id @default(uuid())
  supportRequestId String
  supportRequest   SupportRequest @relation(fields: [supportRequestId], references: [id])
  systemAdminId    String         // UserId of System Admin
  startedAt        DateTime       @default(now())
  endedAt          DateTime?
  reason           String?
  isActive         Boolean        @default(true)
}
```

---

## 4. Definition of Done (DoD) cho Module này
- [ ] Endpoint tạo trường sinh mã tự động và tạo kèm tài khoản School Admin với cờ đổi mật khẩu tạm.
- [ ] Đăng nhập lần đầu của School Admin bị chặn điều hướng cho đến khi hoàn tất đổi mật khẩu.
- [ ] Chức năng tạm khóa (`SUSPENDED`) cho phép xem nhưng chặn ghi đối với tài khoản trường.
- [ ] Xóa trường bắt buộc xác nhận 2 lớp (nhập mã trường + mật khẩu System Admin).
- [ ] Luồng Support Access hoạt động: chỉ truy cập được dữ liệu trường khi có session hợp lệ.
- [ ] Mọi thao tác thay đổi đều được ghi vào `AuditLog`.
- [ ] Đạt chuẩn giao diện: Light/Dark mode, tiếng Việt (`vi-VN`), đủ 4 trạng thái (Loading, Empty, Error, Success).
