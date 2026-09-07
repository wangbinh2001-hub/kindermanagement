# Module 08: Fees & Tuition (Học phí, Biểu phí & Hóa đơn)

> **Mục đích:** Đặc tả hệ thống cấu hình biểu phí, chính sách giảm trừ, chu kỳ thu học phí đầu tháng kèm kết chuyển cộng/trừ tháng cũ, và tính bất biến của hóa đơn tài chính.
> **Đối tượng sử dụng tài liệu:** Zcode / AI Code Agent khi thực hiện Phase 7 trong `PLAN.md`.
> **Quy tắc kèm theo bắt buộc:** `RULES_CODING.md`, `RULES_TENANCY.md`, `RULES_SECURITY.md`.

---

## 1. Ranh giới ứng dụng & Phân quyền
- **Đường dẫn (Route):** `apps/web/src/app/(school)/[schoolSlug]/tuition/...`
- **Phân quyền:** Chỉ vai trò `School Admin` hoặc nhân viên có quyền `tuition:manage` / `tuition:read` mới được truy cập.
- **Quy tắc tiền tệ:** Bắt buộc lưu trữ dưới dạng số nguyên (`BigInt` / `Int` đơn vị VNĐ) hoặc `Decimal(12, 0)` để tránh lỗi làm tròn số thực.

---

## 2. Cấu trúc nghiệp vụ chi tiết

### 2.1 Cấu hình Biểu phí của trường (Fee Schedules)
Trường tự tạo các danh mục khoản thu trong năm học:
- **Loại khoản thu:**
  - `MANDATORY` (Bắt buộc): Áp dụng cho toàn bộ học sinh theo khối/lớp (VD: Học phí cơ bản, Tiền ăn tháng, Phí cơ sở vật chất).
  - `OPTIONAL` (Tùy chọn):
    - Đăng ký môn học thêm / Năng khiếu: Cấu hình trực tiếp trong hồ sơ học sinh (`StudentSchoolRelationship`).
    - Phí tăng ca giữ ngoài giờ: Tự động tổng hợp từ dữ liệu điểm danh ra về sau 18:00 của module Điểm danh.
    - Xe đưa đón, dã ngoại...
- **Chu kỳ thu:** `MONTHLY` (Hàng tháng), `TERMLY` (Theo kỳ), `YEARLY` (Đầu năm), `ONE_TIME` (Một lần).

### 2.2 Chính sách Giảm trừ học phí (Student Reductions)
- Cấu hình theo từng học sinh tại hồ sơ:
  - Giảm theo tỷ lệ phần trăm (`PERCENTAGE`, VD: Giảm 20% học phí).
  - Giảm theo số tiền cố định (`FIXED_AMOUNT`, VD: Giảm 500.000 VNĐ).
  - Chỉ định phạm vi giảm: Áp dụng trên toàn bộ hóa đơn HOẶC chỉ áp dụng trên một khoản thu cụ thể (VD: Chỉ giảm học phí chính, không giảm tiền ăn).
- **Tính bất biến của cấu hình:** Mức giảm trừ áp dụng tại thời điểm tạo hóa đơn. Việc thay đổi mức giảm trừ trong hồ sơ sau này TUYỆT ĐỐI KHÔNG làm thay đổi số tiền của các hóa đơn đã phát hành trong quá khứ.

### 2.3 Chu kỳ thanh toán & Công thức tính hóa đơn (Đầu tháng N)
Hóa đơn được phát hành vào đầu mỗi tháng để thu trước các khoản phí của **Tháng N** và kết chuyển bù trừ của **Tháng N-1**:

$$\text{Tổng thanh toán} = \text{Phí cố định tháng N} - \text{Mức giảm trừ} + \text{Phí tăng ca tháng N-1} - \text{Hoàn tiền vắng tháng N-1} + \text{Nợ cũ}$$

1. **Phí tăng ca tháng N-1:**
   - $\sum (\text{overtimeHours}) \times \text{Đơn giá tăng ca mỗi giờ quy định của trường}$.
2. **Quy tắc hoàn tiền ngày nghỉ tháng N-1:**
   - Chỉ áp dụng đối với các ngày có trạng thái `ABSENT_EXCUSED` (Vắng có phép).
   - Mức hoàn tiền do trường cấu hình: Tính theo đơn giá tiền ăn/ngày HOẶC mức hoàn cố định/ngày nghỉ.
3. **Cộng dồn nợ cũ:**
   - Nếu hóa đơn tháng N-1 còn số dư chưa thanh toán (`unpaidBalance > 0`), hệ thống tự động cộng số dư này vào mục "Nợ kỳ trước" của hóa đơn tháng N.

### 2.4 Quản lý Hóa đơn & Bất biến tài chính (Invoice Immutability)
- **Vòng đời hóa đơn:**
  - `DRAFT`: Bản nháp, có thể xem trước và chỉnh sửa.
  - `ISSUED`: Đã phát hành chính thức đến phụ huynh. **Khóa cứng toàn bộ số tiền.**
  - `PAID`: Đã thanh toán đủ.
  - `PARTIALLY_PAID`: Đã thanh toán một phần.
  - `CANCELLED`: Hóa đơn bị hủy bỏ.
- **Quy trình điều chỉnh sau khi phát hành (`ISSUED`):**
  - CẤM chỉnh sửa trực tiếp số tiền trên hóa đơn đã phát hành.
  - Khi cần sửa: Thực hiện thao tác **Hủy hóa đơn (`CANCELLED`)** kèm lý do bắt buộc -> Phát hành **Hóa đơn mới thay thế**.
  - Hệ thống tự động bắn thông báo đến School Admin và ghi lại `AuditLog` chi tiết.

---

## 3. Database Entities liên quan

```prisma
model FeeItem {
  id            String          @id @default(uuid())
  schoolId      String
  school        School          @relation(fields: [schoolId], references: [id])
  name          String          // e.g., "Học phí chính", "Tiền ăn trưa"
  amount        Decimal         @db.Decimal(12, 0)
  billingCycle  BillingCycle    @default(MONTHLY)
  isMandatory   Boolean         @default(true)
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
  deletedAt     DateTime?
}

enum BillingCycle {
  MONTHLY
  TERMLY
  YEARLY
  ONE_TIME
}

model StudentReduction {
  id                          String          @id @default(uuid())
  studentSchoolRelationshipId String
  studentSchoolRelationship   StudentSchoolRelationship @relation(fields: [studentSchoolRelationshipId], references: [id])
  reductionType               ReductionType   // PERCENTAGE hoặc FIXED_AMOUNT
  value                       Decimal         @db.Decimal(12, 2)
  applicableFeeItemId         String?         // Null nếu áp dụng trên tổng hóa đơn
  reason                      String
  isActive                    Boolean         @default(true)
  createdAt                   DateTime        @default(now())
}

enum ReductionType {
  PERCENTAGE
  FIXED_AMOUNT
}

model Invoice {
  id                          String          @id @default(uuid())
  schoolId                    String
  school                      School          @relation(fields: [schoolId], references: [id])
  invoiceCode                 String          @unique // e.g. INV-2026-10-0012
  studentSchoolRelationshipId String
  studentSchoolRelationship   StudentSchoolRelationship @relation(fields: [studentSchoolRelationshipId], references: [id])
  
  month                       Int             // Tháng tính học phí (1 - 12)
  year                        Int             // Năm tính học phí
  
  baseAmount                  Decimal         @db.Decimal(12, 0) // Tổng các phí cố định
  discountAmount              Decimal         @db.Decimal(12, 0) // Tổng tiền được giảm
  overtimeAmount              Decimal         @db.Decimal(12, 0) // Tiền tăng ca tháng trước
  refundAmount                Decimal         @db.Decimal(12, 0) // Tiền hoàn vắng có phép tháng trước
  previousDebt                Decimal         @db.Decimal(12, 0) // Nợ cũ dồn sang
  
  totalAmount                 Decimal         @db.Decimal(12, 0) // Số tiền thực tế phải nộp
  paidAmount                  Decimal         @db.Decimal(12, 0) @default(0)
  
  status                      InvoiceStatus   @default(DRAFT)
  itemsSnapshot               Json            // Chi tiết từng dòng phí tại thời điểm xuất
  cancellationReason          String?
  
  issuedAt                    DateTime?
  paidAt                      DateTime?
  createdAt                   DateTime        @default(now())
  updatedAt                   DateTime        @updatedAt
  deletedAt                   DateTime?
}

enum InvoiceStatus {
  DRAFT
  ISSUED
  PARTIALLY_PAID
  PAID
  CANCELLED
}
```

---

## 4. Definition of Done (DoD)
- [ ] CRUD danh mục Biểu phí (Bắt buộc & Tùy chọn) theo trường.
- [ ] Cấu hình Giảm trừ (theo % hoặc tiền mặt) gắn vào hồ sơ học sinh hoạt động chính xác.
- [ ] Logic tính toán hóa đơn đầu tháng tự động lấy đúng số giờ tăng ca và số ngày vắng có phép từ bảng Điểm danh tháng trước.
- [ ] Tự động cộng dồn nợ cũ nếu tháng trước thanh toán thiếu.
- [ ] Hóa đơn đã ở trạng thái `ISSUED` bị chặn hoàn toàn các thao tác sửa trực tiếp.
- [ ] Hủy hóa đơn bắt buộc nhập lý do, ghi `AuditLog` và bắn thông báo tới School Admin.
- [ ] Toàn bộ số tiền hiển thị chuẩn định dạng tiền tệ Việt Nam (`1.000.000 ₫`).
