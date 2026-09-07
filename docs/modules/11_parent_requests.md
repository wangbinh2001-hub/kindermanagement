# Module 11: Parent Requests (Yêu cầu từ phụ huynh)

> **Mục đích:** Đặc tả luồng phụ huynh gửi các yêu cầu liên quan đến trẻ, giáo viên/nhà trường duyệt, và hệ thống tự động cập nhật sang các module liên quan.
> **Đối tượng sử dụng tài liệu:** Zcode / AI Code Agent khi thực hiện Phase 10 trong `PLAN.md`.
> **Quy tắc kèm theo bắt buộc:** `RULES_CODING.md`, `RULES_TENANCY.md`, `RULES_SECURITY.md`.

---

## 1. Ranh giới ứng dụng
- **Đường dẫn (Route):** `apps/web/src/app/(parent)/requests/...`
- **Phân quyền tạo:** Chỉ Parent Portal của phụ huynh có trẻ được liên kết hợp lệ.
- **Phân quyền duyệt:** Giáo viên lớp và School Admin đều có thể duyệt độc lập theo quyền được cấp.

---

## 2. Loại yêu cầu (Request Types)
Giữ nguyên toàn bộ các loại yêu cầu sau:
- `LEAVE_REQUEST` — Xin nghỉ học.
- `MEDICATION_REQUEST` — Dặn thuốc.
- `LATE_PICKUP_REQUEST` — Đón muộn.
- `PICKUP_AUTHORIZATION_REQUEST` — Cấp quyền đón cho người khác.
- `HEALTH_NOTE_REQUEST` — Ghi chú sức khỏe / dị ứng.
- `OTHER_REQUEST` — Yêu cầu khác.

---

## 3. Luồng trạng thái (Workflow)

### 3.1 Trạng thái yêu cầu
- `PENDING`: Phụ huynh vừa gửi.
- `APPROVED`: Đã duyệt.
- `REJECTED`: Từ chối.
- `CANCELLED`: Phụ huynh tự hủy trước khi duyệt.
- `EXPIRED`: Quá hạn xử lý (nếu trường cấu hình).

### 3.2 Luồng xử lý
1. Phụ huynh gửi yêu cầu từ Parent Portal.
2. Yêu cầu hiển thị cho:
   - Giáo viên lớp liên quan.
   - School Admin.
3. Giáo viên hoặc School Admin có thể duyệt hoặc từ chối độc lập.
4. Hệ thống lưu rõ **ai là người duyệt** và **vai trò của người duyệt**.
5. Khi duyệt/từ chối, hệ thống gửi thông báo cho phụ huynh.

### 3.3 Duyệt nhiều cấp
- Không bắt buộc hai bước duyệt.
- Một yêu cầu có thể được duyệt bởi **một trong hai**: Giáo viên lớp hoặc School Admin.
- Nếu trường muốn, có thể cấu hình quy trình nội bộ mở rộng sau, nhưng mặc định là **một cấp duyệt**.

---

## 4. Hành vi tự động theo từng loại yêu cầu

### 4.1 Xin nghỉ học
- Khi `APPROVED`, hệ thống tự động tạo hoặc cập nhật bản ghi điểm danh trạng thái `ABSENT_EXCUSED` cho ngày liên quan.
- Nếu yêu cầu nhiều ngày, tạo nhiều bản ghi tương ứng.
- Dữ liệu này được module `Attendance` sử dụng để tính hoàn tiền theo quy tắc đã chốt.

### 4.2 Dặn thuốc
- Khi được gửi, hiển thị nhắc nhở trong dashboard giáo viên của ngày liên quan.
- Khi được `APPROVED`, yêu cầu hiển thị nổi bật hơn trong lớp của trẻ.

### 4.3 Đón muộn
- Khi `APPROVED`, hệ thống ghi nhận để liên kết với dữ liệu tăng ca / giờ đón muộn trong module `Attendance`.
- Không tự tính tiền tại module này; chỉ cung cấp dữ liệu đầu vào cho `Tuition & Fees`.

### 4.4 Cấp quyền đón cho người khác
- Lưu thông tin người được cấp quyền đón.
- Có thể bao gồm: Họ tên, SĐT, CCCD/CMND, quan hệ với trẻ.
- Sau khi `APPROVED`, người này được hiển thị trong danh sách người được phép đón của trẻ.

### 4.5 Ghi chú sức khỏe / dị ứng
- Khi `APPROVED`, ghi vào hồ sơ tham chiếu của trẻ để giáo viên xem thấy trong lớp và các module liên quan.
- Dữ liệu này không thay thế hồ sơ y tế chính thức nếu sau này có module chuyên sâu hơn.

### 4.6 Yêu cầu khác
- Lưu nội dung tự do của phụ huynh.
- Không tự sinh hành vi hệ thống, chỉ lưu trạng thái và thông báo.

---

## 5. Database Entities liên quan

```prisma
model ParentRequest {
  id              String            @id @default(uuid())
  schoolId        String
  school          School            @relation(fields: [schoolId], references: [id])
  studentSchoolRelationshipId String
  studentSchoolRelationship StudentSchoolRelationship @relation(fields: [studentSchoolRelationshipId], references: [id])

  requestType     ParentRequestType
  title           String
  content         String
  status          ParentRequestStatus @default(PENDING)

  requestedById   String // Parent identity
  requestedByPhone String

  reviewedById    String?
  reviewedByRole  String?
  reviewedAt     DateTime?
  reviewReason   String?

  startDate      DateTime?
  endDate        DateTime?

  metadata       Json?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  deletedAt      DateTime?
}

enum ParentRequestType {
  LEAVE_REQUEST
  MEDICATION_REQUEST
  LATE_PICKUP_REQUEST
  PICKUP_AUTHORIZATION_REQUEST
  HEALTH_NOTE_REQUEST
  OTHER_REQUEST
}

enum ParentRequestStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
  EXPIRED
}
```

---

## 6. API & Procedure Design (tRPC)
- `parentRequests.create`: Phụ huynh gửi yêu cầu mới.
- `parentRequests.listForSchool`: School Admin / Teacher xem danh sách yêu cầu.
- `parentRequests.listForParent`: Phụ huynh xem lịch sử yêu cầu của chính mình.
- `parentRequests.approve`: Giáo viên hoặc School Admin duyệt yêu cầu.
- `parentRequests.reject`: Giáo viên hoặc School Admin từ chối yêu cầu.
- `parentRequests.cancel`: Phụ huynh tự hủy yêu cầu chưa xử lý.

---

## 7. Quyền và thông báo
- Khi có yêu cầu mới:
  - Giáo viên lớp nhận thông báo.
  - School Admin nhận thông báo.
- Khi duyệt/từ chối:
  - Phụ huynh nhận thông báo kết quả.
- Hệ thống ghi rõ người duyệt và vai trò người duyệt trong lịch sử.

---

## 8. Definition of Done (DoD)
- [ ] Phụ huynh gửi được đủ 6 loại yêu cầu đã chốt.
- [ ] Giáo viên lớp và School Admin đều có thể duyệt độc lập.
- [ ] Hệ thống lưu rõ người duyệt và vai trò người duyệt.
- [ ] Yêu cầu xin nghỉ được map sang `AttendanceRecord = ABSENT_EXCUSED` khi duyệt.
- [ ] Yêu cầu dặn thuốc hiển thị nhắc việc cho giáo viên.
- [ ] Yêu cầu đón muộn / cấp quyền đón được lưu và hiển thị đúng trong hồ sơ trẻ.
- [ ] Phụ huynh nhận thông báo khi yêu cầu bị duyệt hoặc từ chối.
- [ ] Audit log ghi mọi thay đổi trạng thái.
- [ ] RLS tenant isolation pass.
