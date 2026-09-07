# Module 12: School Settings (Cấu hình trường)

> **Mục đích:** Đặc tả các cài đặt vận hành và thông tin của trường học, bao gồm đồng bộ dữ liệu 2 chiều với nền tảng và quản lý cấu hình nâng cao.
> **Đối tượng sử dụng tài liệu:** Zcode / AI Code Agent khi thực hiện Phase 3 trong `PLAN.md`.
> **Quy tắc kèm theo bắt buộc:** `RULES_CODING.md`, `RULES_TENANCY.md`, `RULES_SECURITY.md`.

---

## 1. Ranh giới ứng dụng & Phân quyền
- **Đường dẫn (Route):** `apps/web/src/app/(school)/[schoolSlug]/settings/...`
- **Phân quyền:** Chỉ duy nhất vai trò **School Admin** mới có quyền truy cập và chỉnh sửa trang Settings. Mọi thay đổi đều phải ghi `AuditLog`.

---

## 2. Các chức năng cấu hình chi tiết

### 2.1 Cài đặt cơ bản (Basic Info - Đồng bộ 2 chiều với System Admin)
- **Các trường thông tin:**
  - `name`: Tên trường (string, bắt buộc)
  - `logoUrl`: URL ảnh logo trường (tùy chọn)
  - `phone`: Số điện thoại liên hệ chính của trường (bắt buộc)
  - `email`: Email liên hệ (email format, bắt buộc)
  - `address`: Địa chỉ cơ sở (string, tùy chọn)
  - `taxCode`: Mã số thuế của trường/công ty chủ quản (tùy chọn)
  - `legalRepresentative`: Người đại diện pháp luật (tùy chọn)
  - `description`: Giới thiệu ngắn về trường (tùy chọn)
- **Cơ chế Đồng bộ 2 chiều (Bi-directional Sync):**
  - Mọi trường dữ liệu cơ bản (Tên, SĐT, Email, Địa chỉ) được lưu trực tiếp tại bảng `School`.
  - Khi School Admin cập nhật -> Dữ liệu ở System Admin lập tức cập nhật theo.
  - Khi System Admin cập nhật -> School Admin thấy thông tin mới nhất.
  - Luôn ghi `AuditLog` rõ ràng: Ai là người sửa (`userId`, `role`).

### 2.2 Cài đặt nâng cao (Advanced Settings)
Lưu trong bảng `SchoolSetting` (dạng key-value hoặc cột cấu hình theo trường):

1. **Năm học hiện tại (Active School Year):**
   - Chọn năm học đang hoạt động chính thức (`currentSchoolYearId`).
   - Mọi hoạt động điểm danh, phân lớp, tính học phí mặc định sẽ liên kết vào năm học này.
2. **Quản lý Module (Feature Toggles):**
   - Bật/tắt các module tùy theo nhu cầu vận hành của trường:
     - `enableNutrition`: Module Dinh dưỡng & Phiếu đi chợ.
     - `enableHealthTracking`: Module Sức khỏe & BMI.
     - `enableQRAttendance`: Module Quét mã QR điểm danh.
     - `enableTuitionManagement`: Module Quản lý Học phí.
3. **Mẫu phân quyền (Permission Templates):**
   - Thiết lập quyền mặc định cho các nhóm vai trò trong trường (`Teacher`, `Staff`, `Accountant`, `Kitchen`, `Nurse`).
4. **Cấu hình thông báo & Mẫu liên lạc (Notifications & Templates):**
   - Cài đặt email người gửi thông báo.
   - Các template tin nhắn gửi phụ huynh (Chào mừng năm học mới, Thông báo học phí, Thông báo nghỉ học...).

---

## 3. Database Entities liên quan

```prisma
model SchoolSetting {
  id                  String    @id @default(uuid())
  schoolId            String    @unique
  school              School    @relation(fields: [schoolId], references: [id])
  
  currentSchoolYearId String?   // FK tới SchoolYear
  
  // Feature Toggles
  enableNutrition     Boolean   @default(true)
  enableHealthTracking Boolean  @default(true)
  enableQRAttendance  Boolean   @default(true)
  enableTuition       Boolean   @default(true)
  
  // Notification config (JSON)
  notificationConfig  Json?     // { emailSenderName: string, templates: { ... } }
  
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  deletedAt           DateTime?
}
```

---

## 4. Definition of Done (DoD)
- [ ] Chỉ School Admin mới truy cập được các endpoint settings (Bảo vệ bằng middleware + tRPC guard).
- [ ] Cập nhật thông tin trường thành công và đồng bộ tức thì với bảng `School` của System Admin.
- [ ] Bật/tắt feature flag làm ẩn/hiện module tương ứng trên sidebar của trường đó.
- [ ] Chọn năm học hiện tại cập nhật thành công và phản ánh trên toàn bộ hệ thống trường.
- [ ] Mọi thay đổi đều được ghi lại trong `AuditLog` với `beforeState` và `afterState`.
- [ ] UI có đầy đủ thông báo thành công (toast message) và hỗ trợ Dark/Light mode.
