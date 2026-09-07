# Module 13: Parent Portal (Cổng phụ huynh)

> **Mục đích:** Đặc tả cổng thông tin dành cho phụ huynh để xem dữ liệu được nhà trường cho phép và gửi các yêu cầu liên quan đến trẻ.
> **Đối tượng sử dụng tài liệu:** Zcode / AI Code Agent khi thực hiện Phase 10 trong `PLAN.md`.
> **Quy tắc kèm theo bắt buộc:** `RULES_CODING.md`, `RULES_TENANCY.md`, `RULES_SECURITY.md`.

---

## 1. Ranh giới ứng dụng & Đăng nhập

- **Đường dẫn (Route):** `apps/web/src/app/(parent)/...`
- **Phương thức đăng nhập:** Phụ huynh đăng nhập bằng **số điện thoại**.
- **Chuyển đổi con:** Một phụ huynh có thể có nhiều con / nhiều trường, và có thể **switch qua lại** giữa các trẻ đã được liên kết hợp lệ.
- **Không cần profile phụ huynh riêng:** Không tạo màn hình profile phụ huynh độc lập.

---

## 2. Phạm vi hiển thị (Read-only Scope)

Phụ huynh chỉ được xem các module sau khi nhà trường cho phép hiển thị:
- **Tuition**: chỉ xem hóa đơn / thông báo học phí được gửi đến phụ huynh.
- **Health**: xem chỉ số sức khỏe, biểu đồ tăng trưởng, BMI của con.
- **Menu**: xem thực đơn được nhà trường công bố.
- **Requests**: xem và gửi yêu cầu phụ huynh.

### Không được xem
- **Attendance**: phụ huynh **không được xem** dữ liệu điểm danh.
- Không xem dữ liệu của trẻ không thuộc quyền liên kết.
- Không xem toàn bộ lịch sử nếu nhà trường chưa publish.

---

## 3. Luồng chọn con (Child Switcher)
- Sau khi đăng nhập bằng số điện thoại, hệ thống trả về danh sách các trẻ mà số điện thoại đó được liên kết hợp lệ.
- Phụ huynh chọn 1 trẻ để vào ngữ cảnh làm việc.
- Có thể switch giữa các trẻ bất kỳ lúc nào.
- Mọi dữ liệu hiển thị đều phải lọc theo `selectedChild` + `schoolId`.

---

## 4. Các màn hình chính (Pages)

### 4.1 Home / Child Overview
- Hiển thị trẻ đang chọn.
- Các card truy cập nhanh tới Tuition, Health, Menu, Requests.

### 4.2 Tuition
- Chỉ hiển thị hóa đơn / thông báo học phí do nhà trường đã gửi đến phụ huynh.
- Không hiển thị dữ liệu nháp nội bộ chưa publish.

### 4.3 Health
- Hiển thị chiều cao, cân nặng, BMI, biểu đồ tăng trưởng.
- Chỉ read-only.

### 4.4 Menu
- Hiển thị thực đơn được publish cho tuần / kỳ hiển thị theo cấu hình nhà trường.
- Không có thao tác sửa.

### 4.5 Requests
- Danh sách yêu cầu đã gửi.
- Nút tạo yêu cầu mới.
- Trạng thái: pending / approved / rejected / cancelled / expired.

---

## 5. Quy tắc dữ liệu & bảo mật
- Phụ huynh chỉ nhìn thấy dữ liệu của trẻ đã liên kết với số điện thoại đang đăng nhập.
- Không có quyền đọc dữ liệu của học sinh khác.
- Không có quyền xem attendance.
- Mọi truy vấn phải có tenant isolation và child authorization.
- Không cache chéo giữa các trẻ hoặc các trường.

---

## 6. Database Entities liên quan

```prisma
model ParentIdentity {
  id            String   @id @default(uuid())
  phone         String   @unique
  displayName   String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  deletedAt     DateTime?
}

model ParentChildLink {
  id            String   @id @default(uuid())
  parentId      String
  parent        ParentIdentity @relation(fields: [parentId], references: [id])
  studentSchoolRelationshipId String
  studentSchoolRelationship StudentSchoolRelationship @relation(fields: [studentSchoolRelationshipId], references: [id])
  relationType  String? // Father / Mother / Guardian / Other
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  deletedAt     DateTime?
}
```

---

## 7. API & Procedure Design (tRPC)
- `parentAuth.loginByPhone`: Xác thực phụ huynh bằng SĐT.
- `parentPortal.listChildren`: Trả danh sách trẻ thuộc phụ huynh.
- `parentPortal.switchChild`: Chọn trẻ đang xem.
- `parentPortal.getTuition`: Trả hóa đơn/học phí đã publish.
- `parentPortal.getHealth`: Trả dữ liệu sức khỏe.
- `parentPortal.getMenu`: Trả menu được publish.
- `parentPortal.getRequests`: Trả lịch sử yêu cầu.

---

## 8. Definition of Done (DoD)
- [ ] Phụ huynh đăng nhập bằng số điện thoại.
- [ ] Một phụ huynh có thể switch giữa nhiều trẻ.
- [ ] Phụ huynh chỉ xem Tuition được publish, Health, Menu, Requests.
- [ ] Attendance không hiển thị cho phụ huynh.
- [ ] Không có profile phụ huynh riêng.
- [ ] Không hiển thị dữ liệu của trẻ không thuộc quyền.
- [ ] RLS tenant isolation + child authorization pass.
