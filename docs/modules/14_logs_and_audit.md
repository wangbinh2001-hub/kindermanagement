# Module 14: Logs & Audit (Nhật ký kiểm toán)

> **Mục đích:** Đặc tả hệ thống ghi log và hiển thị audit trail cho trường học và nền tảng.
> **Đối tượng sử dụng tài liệu:** Zcode / AI Code Agent khi thực hiện Phase 11 trong `PLAN.md`.
> **Quy tắc kèm theo bắt buộc:** `RULES_CODING.md`, `RULES_TENANCY.md`, `RULES_SECURITY.md`.

---

## 1. Phạm vi quyền xem

| Vai trò | Phạm vi xem |
|---|---|
| **School Admin** | Toàn bộ log của trường mình quản lý. |
| **System Admin** | Toàn bộ log nền tảng (platform-wide). |
| **Staff / Giáo viên** | **Không được xem** audit log. |

---

## 2. Các sự kiện được ghi log

Ghi log đầy đủ các hành động sau (trừ điểm danh thường ngày):

- Tạo / Cập nhật / Xóa mềm **Học sinh** (`Student`, `StudentSchoolRelationship`).
- Tạo / Cập nhật / Xóa **Hóa đơn học phí** (`Invoice`).
- Tạo / Cập nhật / Xóa **Biểu phí** (`FeeItem`).
- Tạo / Cập nhật / Xóa **Giảm trừ học sinh** (`StudentReduction`).
- Cập nhật **Cấu hình trường** (`SchoolSetting`).
- Tạo / Cập nhật / Xóa **Năm học / Lớp học** (`SchoolYear`, `Class`).
- Phân quyền / Cấp quyền **Nhân sự** (`StaffMember`).
- Tạo / Kết thúc **Support Access** (System Admin).
- **Đăng nhập / Đăng xuất / Đổi mật khẩu / Quên mật khẩu**.
- Duyệt / Từ chối **Yêu cầu phụ huynh** (`ParentRequest`).

> **Không ghi log:** Các bản ghi điểm danh thường ngày (`AttendanceRecord`) để tránh làm quá nhiều dữ liệu.

---

## 3. Lưu trữ & Thời gian giữ (Retention)

- Mọi bản ghi audit log được lưu trong bảng `AuditLog`.
- Thời gian giữ mặc định: **6 tháng** (180 ngày).
- Sau 6 tháng, bản ghi có thể được dọn dẹp (soft delete hoặc archive) theo job định kỳ.

---

## 4. Che giấu PII trong UI (PII Masking)

- **CCCD / CMND / Định danh cá nhân**: Hiển thị dạng `0963******2477` (giữ 4 số đầu và 4 số cuối).
- **Số điện thoại**: Hiển thị dạng `098****6003`.
- **Email**: Hiển thị dạng `h***@gmail.com`.
- Giá trị đầy đủ (unmasked) **không hiển thị** trên UI log. Chỉ dùng nội bộ khi cần điều tra.

---

## 5. Không hỗ trợ Export

- **Không cung cấp** tính năng xuất file CSV/Excel/PDF từ giao diện audit log.
- Dữ liệu chỉ xem được trên UI với phân trang, tìm kiếm, lọc.

---

## 6. Database Entity liên quan

```prisma
model AuditLog {
  id            String   @id @default(uuid())
  schoolId      String?
  school        School?  @relation(fields: [schoolId], references: [id])
  userId        String
  userRole      String
  entityType    String
  entityId      String
  action        AuditAction
  beforeState   Json?
  afterState    Json?
  metadata      Json?    // ip, userAgent, correlationId, reason...
  createdAt     DateTime @default(now())
}

enum AuditAction {
  CREATE
  UPDATE
  DELETE
  RESTORE
  LOGIN
  LOGOUT
  PASSWORD_CHANGE
  PASSWORD_RESET
  SUPPORT_ACCESS_START
  SUPPORT_ACCESS_END
  APPROVE
  REJECT
}
```

---

## 7. API & Procedure Design (tRPC)

```ts
// Chỉ School Admin và System Admin mới có quyền truy cập
audit.list: protectedProcedure
  .input(z.object({
    schoolId: z.string().uuid().optional(),
    entityType: z.string().optional(),
    action: z.nativeEnum(AuditAction).optional(),
    userId: z.string().optional(),
    fromDate: z.coerce.date().optional(),
    toDate: z.coerce.date().optional(),
    page: z.number().default(1),
    pageSize: z.number().default(50),
  }))
  .query(...)

audit.getById: protectedProcedure
  .input(z.object({ id: z.string().uuid() }))
  .query(...)
```

---

## 8. Definition of Done (DoD)

- [ ] School Admin xem được log của trường mình; System Admin xem log toàn nền tảng.
- [ ] Staff không có nút hay menu truy cập audit log.
- [ ] Tất cả sự kiện trong §2 đều được ghi log tự động qua middleware/service.
- [ ] Điểm danh thường ngày không tạo bản ghi audit log.
- [ ] UI hiển thị PII đã được mask (CCCD, SĐT, Email).
- [ ] Không có nút Export (CSV/Excel/PDF).
- [ ] Tự động dọn dẹp bản ghi sau 6 tháng (job định kỳ).
- [ ] RLS tenant isolation pass.