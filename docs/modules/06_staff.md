# Module 06: Staff & Teachers (Giáo viên & Nhân viên)

> **Mục đích:** Đặc tả quản lý nhân sự trường học, phân công lớp, phân quyền động, và hỗ trợ đa trường.
> **Đối tượng sử dụng tài liệu:** Zcode / AI Code Agent khi thực hiện Phase 5 trong `PLAN.md`.
> **Quy tắc kèm theo bắt buộc:** `RULES_CODING.md`, `RULES_TENANCY.md`, `RULES_SECURITY.md`.

---

## 1. Ranh giới ứng dụng
- **Đường dẫn (Route):** `apps/web/src/app/(school)/[schoolSlug]/staff/`
- **Ngữ cảnh (Context):** Bắt buộc inject `schoolId`, `currentSchoolYearId`.

---

## 2. Mô hình dữ liệu nhân sự

### 2.1 Vai trò nhân sự (Staff Roles)
School Admin tự định nghĩa và phân bổ vai trò. Hệ thống cung cấp danh sách vai trò chuẩn mầm non để tham khảo:

| Role Key | Tên hiển thị | Mô tả |
|---|---|---|
| `TEACHER` | Giáo viên chủ nhiệm | Được phân công chủ nhiệm 1 lớp/năm học |
| `ASSISTANT_TEACHER` | Giáo viên phụ trách | Có thể phụ trách nhiều lớp cùng lúc |
| `ACCOUNTANT` | Kế toán | Quyền truy cập module Học phí, Hóa đơn |
| `KITCHEN_STAFF` | Nhân viên nhà bếp | Quyền truy cập module Dinh dưỡng, Phiếu đi chợ |
| `NURSE` | Y tá | Quyền truy cập module Sức khỏe |
| `DRIVER` | Tài xế | Quyền xem danh sách học sinh xe đưa rước |
| `SECURITY` | Bảo vệ | Quyền điểm danh vào/ra cổng |
| `VICE_PRINCIPAL` | Phó hiệu trưởng | Quyền gần như School Admin (tùy cấp) |
| `OTHER` | Khác | Vai trò tùy chỉnh |

> **Lưu ý:** School Admin có thể tạo vai trò mới hoặc ẩn các vai trò không dùng. Mỗi vai trò là tập hợp các `permission keys`.

### 2.2 StaffMember (Quan hệ nhân sự - trường)
Một User có thể làm việc ở nhiều trường → mỗi trường là một `StaffMember` riêng.

| Trường | Kiểu | Mô tả |
|---|---|---|
| `id` | UUID | Khóa chính |
| `userId` | UUID | FK → User (global identity) |
| `schoolId` | UUID | FK → School (tenant) |
| `employeeCode` | string? | Mã nhân viên nội bộ |
| `roles` | string[] | Mảng role keys (VD: `["TEACHER", "VICE_PRINCIPAL"]`) |
| `permissions` | string[] | Danh sách permission keys riêng (override/cụ thể) |
| `employmentStatus` | enum (ACTIVE, ON_LEAVE, RESIGNED, TERMINATED) | Trạng thái làm việc |
| `hiredAt` | DateTime | Ngày vào làm |
| `resignedAt` | DateTime? | Ngày nghỉ việc |
| `notes` | string? | Ghi chú |
| `createdAt` | DateTime | Tự động |
| `updatedAt` | DateTime | Tự động |
| `deletedAt` | DateTime? | Soft delete |

**Ràng buộc:**
- Một User có thể có nhiều `StaffMember` ở các `schoolId` khác nhau.
- Trong cùng một trường, một User chỉ có một `StaffMember`.

---

## 3. Phân công lớp học (Class Assignment)

### 3.1 Giáo viên chủ nhiệm (Homeroom Teacher)
- Mỗi lớp có **tối đa 1** `homeroomTeacherId` (FK → StaffMember).
- Một StaffMember với role `TEACHER` chỉ được làm chủ nhiệm **tối đa 1 lớp** trong cùng một `schoolYearId`.
- Có thể là chủ nhiệm lớp này, đồng thời là phụ trách lớp khác (nếu có role `ASSISTANT_TEACHER`).

### 3.2 Giáo viên phụ trách (Assistant Teacher)
- Mảng `assistantTeacherIds` trên bảng `Class`.
- Không giới hạn số lượng lớp phụ trách.
- Có thể là phụ trách của lớp mà người đó không chủ nhiệm.

### 3.3 API phân công
```ts
classes.assignHomeroomTeacher: protectedProcedure
  .input(z.object({ classId: z.string().uuid(), staffId: z.string().uuid() }))
  .mutation(...) // validate: staff có role TEACHER, chưa chủ nhiệm lớp khác trong năm học này

classes.assignAssistantTeachers: protectedProcedure
  .input(z.object({ classId: z.string().uuid(), staffIds: z.array(z.string().uuid()) }))
  .mutation(...)
```

---

## 4. Phân quyền động (Dynamic RBAC/ABAC)

### 4.1 Cơ chế
- Hệ thống định nghĩa sẵn bộ `PERMISSION_KEYS` (VD: `attendance:write`, `tuition:read`, `health:write`, `students:manage`, `reports:export`...).
- Mỗi **Role** mặc định map tới một tập permission keys.
- School Admin có thể:
  - Xem danh sách permission của từng role.
  - **Cấp/bỏ permission** trực tiếp cho một `StaffMember` cụ thể (ghi đè role).
  - Tạo role mới bằng cách chọn tập permission.

### 4.2 Kiểm tra quyền (Guard)
- Mọi tRPC procedure / Server Action đều có middleware `requirePermission('permission_key')`.
- Kiểm tra: user hiện tại có `StaffMember` trong `schoolId` hiện tại, và `permissions` (hoặc qua role) chứa key yêu cầu.
- School Admin bypass mọi guard (trong tenant của mình).

---

## 5. Trạng thái nhân sự (Employment Lifecycle)

| Trạng thái | Ý nghĩa | Hành vi |
|---|---|---|
| `ACTIVE` | Đang làm việc | Truy cập bình thường |
| `ON_LEAVE` | Nghỉ phép/tạm nghỉ | Vẫn giữ tài khoản, không phân công lớp mới |
| `RESIGNED` | Đã nghỉ việc (tự nguyện) | Vô hiệu hóa tài khoản trường, giữ lịch sử |
| `TERMINATED` | Sa thải | Tương tự RESIGNED, có ghi chú lý do |

Khi chuyển sang `RESIGNED`/`TERMINATED`:
- Tự động gỡ phân công chủ nhiệm/phụ trách.
- Khóa đăng nhập vào workspace trường này.
- Ghi `AuditLog`.

---

## 6. Đa trường (Multi-School Staff)
- User đăng nhập một lần, chọn trường để làm việc (Active School Selector).
- Mỗi trường có `StaffMember` riêng, `roles` riêng, `permissions` riêng.
- Dữ liệu nhân sự, phân công, lịch sử hoàn toàn cô lập giữa các trường.

---

## 7. API & Procedure Design (tRPC)

```ts
staff.list: protectedProcedure
  .input(z.object({
    role: z.string().optional(),
    status: z.enum(['ACTIVE','ON_LEAVE','RESIGNED','TERMINATED']).optional(),
    search: z.string().optional(),
  }))
  .query(...)

staff.getById: protectedProcedure
  .input(z.object({ staffId: z.string().uuid() }))
  .query(...)

staff.create: protectedProcedure
  .input(z.object({
    userId: z.string().uuid(), // có thể tạo mới User nếu chưa có
    employeeCode: z.string().optional(),
    roles: z.array(z.string()).min(1),
    permissions: z.array(z.string()).optional(),
    hiredAt: z.coerce.date(),
  }))
  .mutation(...)

staff.update: protectedProcedure
  .input(z.object({ staffId: z.string().uuid(), data: z.object({...}) }))
  .mutation(...)

staff.updatePermissions: protectedProcedure
  .input(z.object({ staffId: z.string().uuid(), permissions: z.array(z.string()) }))
  .mutation(...)

staff.changeStatus: protectedProcedure
  .input(z.object({ staffId: z.string().uuid(), status: z.enum([...]), note: z.string().optional() }))
  .mutation(...)

staff.assignments: protectedProcedure
  .input(z.object({ staffId: z.string().uuid() }))
  .query(...) // trả về danh sách lớp chủ nhiệm, phụ trách, lịch sử phân công
```

---

## 7. Giao diện (UI) – Staff Workspace
- **Staff List:** Bảng lọc theo vai trò, trạng thái, tìm kiếm tên/SĐT. Hiển thị avatar, role badge, trạng thái.
- **Staff Detail:** Thông tin cá nhân, danh sách quyền (role + permissions override), lịch sử phân công lớp theo năm học.
- **Permission Matrix (Advanced):** Bảng ma trận Role x Permission, School Admin tick/un tick để cấp quyền.
- **Invite/Onboard:** Mời User hiện có hoặc tạo mới tài khoản (username/phone + temp password).

---

## 8. Definition of Done (DoD)
- [ ] School Admin tạo/sửa/xóa mềm nhân sự, phân vai trò đa role cho 1 người.
- [ ] Giáo viên chủ nhiệm tối đa 1 lớp/năm học; phụ trách nhiều lớp.
- [ ] Nhân sự cùng User hoạt động độc lập ở nhiều trường.
- [ ] Phân quyền động: School Admin cấp/bỏ permission cho từng staff mà không bị gán cố định.
- [ ] Middleware guard kiểm tra permission trên mọi endpoint nhạy cảm.
- [ ] Mọi thay đổi (tạo, cập nhật, đổi trạng thái, phân công, cấp quyền) ghi `AuditLog`.
- [ ] Soft delete, RLS tenant isolation pass test.
- [ ] UI responsive, Light/Dark, i18n vi-VN, 4 trạng thái Loading/Empty/Error/Success.