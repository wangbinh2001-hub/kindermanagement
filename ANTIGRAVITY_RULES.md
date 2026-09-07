# ANTIGRAVITY MASTER RULES & SYSTEM PROMPT
# Preschool & Kindergarten Management Multi-Tenant SaaS (KinderManagement)

> **MỤC ĐÍCH CỦA TÀI LIỆU NÀY:**
> Đây là bộ quy tắc vận hành bắt buộc (Non-negotiable Rules) dành riêng cho Antigravity IDE (và AI code agents).
> AI khi đọc file này PHẢI tuân thủ 100% tất cả các ràng buộc bên dưới. Không được tự ý suy diễn, không được bỏ qua validation, không được bypass tenancy, không được sinh code thừa (YAGNI).

---

## MỤC LỤC
1. [QUY TẮC THI HÀNH CỦA AI (AI EXECUTION RULES)](#1-quy-tac-thi-hanh-cua-ai-ai-execution-rules)
2. [QUY TẮC QUẢN LÝ KẾ HOẠCH & TIẾN ĐỘ (PLANNING RULES)](#2-quy-tac-quan-ly-ke-hoach--tien-do-planning-rules)
3. [QUY TẮC KIẾN TRÚC & TECH STACK (ARCHITECTURE RULES)](#3-quy-tac-kien-truc--tech-stack-architecture-rules)
4. [QUY TẮC ĐA KHÁCH HÀNG & BẢO MẬT (TENANCY & SECURITY RULES)](#4-quy-tac-da-khach-hang--bao-mat-tenancy--security-rules)
5. [CÁC BẤT BIẾN NGHIỆP VỤ CỐT LÕI (DOMAIN INVARIANTS)](#5-cac-bat-bien-nghiep-vu-cot-loi-domain-invariants)
6. [QUY TẮC LẬP TRÌNH (CODING STANDARDS)](#6-quy-tac-lap-trinh-coding-standards)
7. [QUY TẮC THIẾT KẾ DESIGN SYSTEM & UX/UI (DESIGN & UX RULES)](#7-quy-tac-thiet-ke-design-system--uxui-design--ux-rules)
8. [QUY TẮC KIỂM THỬ & TIÊU CHUẨN HOÀN THÀNH (TESTING & DOD)](#8-quy-tac-kiem-thu--tieu-chuan-hoan-thanh-testing--dod)

---

## 1. QUY TẮC THI HÀNH CỦA AI (AI EXECUTION RULES)

### 1.1 Nguyên tắc chống suy diễn & lan man (Anti-Hallucination)
- **Không tự bịa tính năng:** Chỉ triển khai đúng yêu cầu trong task hiện tại. Nếu có chi tiết chưa được định nghĩa rõ ràng, xem như *UNRESOLVED* và hỏi lại người dùng, KHÔNG tự biến giả định thành code.
- **Không viết code thừa (YAGNI):** Không tạo generic patterns, không tạo class/interface chỉ có 1 implementation, không tạo layer trung gian không cần thiết.
- **Không giải thích dài dòng:** Trả lời trực diện vào vấn đề: Nêu lỗi/việc cần làm -> Đưa code -> Nêu test verify.

### 1.2 Nguyên tắc can thiệp file
- Mọi file code được tạo ra phải hoàn chỉnh, có thể biên dịch (compile) và chạy được, KHÔNG được để comment kiểu `// TODO: implement later` hoặc placeholder rỗng ở các logic cốt lõi.
- Khi sửa đổi code, bảo đảm backward compatibility cho các module đã hoàn thành trước đó.

---

## 2. QUY TẮC QUẢN LÝ KẾ HOẠCH & TIẾN ĐỘ (PLANNING RULES)

- **Tuân thủ thứ tự Phase trong `PLAN.md`:** Không code nhảy cóc từ Phase 1 sang Phase 6 khi Phase nền tảng chưa pass tests.
- **Quy trình thực hiện 1 Module/Task:**
  1. **Đọc Entity & Constraints:** Đối chiếu với `RULES_DOMAIN.md` và `PLAN.md`.
  2. **Viết Zod Validation & Database Schema:** Schema là single source of truth.
  3. **Viết Data Access / tRPC Router / Service:** Có tenancy check và audit logging.
  4. **Viết UI Component:** Dùng shadcn/ui, hỗ trợ đầy đủ 4 trạng thái (Loading, Empty, Error, Success).
  5. **Viết Automated Tests:** Tối thiểu 1 unit test logic nghiệp vụ và 1 integration test kiểm tra cô lập dữ liệu (Tenancy Isolation Test).
  6. **Cập nhật Phase Checklist** trong `PLAN.md`.

---

## 3. QUY TẮC KIẾN TRÚC & TECH STACK (ARCHITECTURE RULES)

### 3.1 Tech Stack cố định
- **Framework:** Next.js 16 (App Router, Server Actions cho forms, React Server Components).
- **API & RPC:** tRPC v11 (End-to-end Type Safety).
- **Database & Auth:** Supabase PostgreSQL + Row Level Security (RLS) + Better-Auth (hỗ trợ multi-tenancy & phone/username login).
- **ORM & Migrations:** Prisma ORM.
- **UI & Styling:** Tailwind CSS + Radix UI + shadcn/ui (không dùng CSS module, không inline style).
- **Validation:** Zod (dùng chung cho client-side và server-side).
- **Icons:** `lucide-react`.

### 3.2 Phân định ranh giới ứng dụng (Application Boundaries)
Cấu trúc Next.js App Router PHẢI tách biệt 3 khu vực độc lập:
```
apps/web/src/app/
├── (auth)/                 # Login (phone/username), first-time password change
├── (school)/               # School Admin, Teachers, Staff dashboard
│   └── [schoolSlug]/       # Context trường học hiện tại
├── (parent)/               # Parent Portal (Mobile-first view)
└── system-admin/           # Nền tảng quản trị SaaS (Hoàn toàn tách biệt)
```

**Quy tắc ranh giới:**
- `system-admin` KHÔNG nằm chung layout với `(school)`.
- System Admin KHÔNG có quyền tự động đọc/ghi dữ liệu của các trường học trừ khi có phiên **Support Access** được cấp phép cụ thể.

---

## 4. QUY TẮC ĐA KHÁCH HÀNG & BẢO MẬT (TENANCY & SECURITY RULES)

### 4.1 Cô lập dữ liệu tuyệt đối (Tenancy Isolation)
- **MỌI bảng dữ liệu vận hành** (students, classes, attendance, tuition, health, nutrition, staff...) BẮT BUỘC có cột `school_id UUID NOT NULL REFERENCES schools(id)`.
- **Bắt buộc bật PostgreSQL Row Level Security (RLS)** trên tất cả các bảng dữ liệu vận hành.
- **Không bao giờ dùng Supabase `service_role` key trên client** hoặc để bypass tenancy trong code xử lý thông thường. Mọi truy vấn phải chạy dưới ngữ cảnh tenant authenticated.

### 4.2 Ghi log kiểm toán tự động (Audit by Default)
Mọi thao tác thay đổi dữ liệu (Create, Update, Delete, Restore) BẮT BUỘC gọi service `AuditLog`:
```typescript
interface AuditEntry {
  schoolId: string;
  userId: string;
  entityType: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE';
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  metadata?: { ip?: string; userAgent?: string; reason?: string };
}
```

### 4.3 Xóa mềm (Soft Delete)
- Mọi entity vận hành PHẢI có cột `deleted_at TIMESTAMP WITH TIME ZONE NULL`.
- Không bao giờ chạy lệnh `DELETE FROM ...` vật lý trên dữ liệu trường học.
- Mọi query mặc định phải có điều kiện `WHERE deleted_at IS NULL`.
- Unique constraints phải dùng partial index: `CREATE UNIQUE INDEX ... WHERE deleted_at IS NULL;`.

---

## 5. CÁC BẤT BIẾN NGHIỆP VỤ CỐT LÕI (DOMAIN INVARIANTS)

AI KHÔNG ĐƯỢC PHÉP thay đổi hoặc vi phạm các quy tắc nghiệp vụ sau trong bất kỳ hoàn cảnh nào:

1. **Định danh học sinh ≠ Quan hệ trường học:**
   - Học sinh thật được định danh duy nhất toàn hệ thống bằng **CCCD/Mã định danh cá nhân**.
   - Việc trùng CCCD không tự động cho phép trường này xem dữ liệu vận hành của trường khác.
   - Bảng `Student` (identity) tách biệt với bảng `StudentSchoolRelationship` (enrollment tại từng trường).

2. **Lịch sử lớp học là bất biến (Append-only History):**
   - Lịch sử phân lớp học sinh qua từng năm học (`ClassMembership`) phải được lưu nối tiếp theo thời gian.
   - KHÔNG ĐƯỢC ghi đè chỉ lưu 1 giá trị `current_class_id` duy nhất mà làm mất dữ liệu các năm học cũ.

3. **Thông tin người chịu trách nhiệm (Responsible Persons):**
   - Hồ sơ học sinh tại trường gồm 3 mục: **Cha (Father)**, **Mẹ (Mother)**, **Người giám hộ (Guardian)**.
   - Mỗi mục gồm: Họ tên, Năm sinh, CCCD, Số điện thoại.
   - Bắt buộc tối thiểu một trong 3 mục phải có đầy đủ dữ liệu hợp lệ.

4. **Tái sử dụng định danh Phụ huynh (Parent Identity Reuse):**
   - Phụ huynh có con học ở nhiều trường khác nhau (hoặc nhiều con trong cùng 1 trường) sử dụng **duy nhất một số điện thoại** để đăng nhập Parent Portal, thấy danh sách tất cả các con được phân quyền.

5. **Tính bất biến của dữ liệu tài chính lịch sử (Financial Immutability):**
   - Học sinh có thể có cấu hình giảm trừ học phí (theo % hoặc số tiền cố định).
   - Khi chỉnh sửa mức giảm trừ học phí hiện tại của học sinh, **TUYỆT ĐỐI KHÔNG** được tự động tính toán lại hoặc ghi đè hóa đơn/học phí của các tháng/kỳ học trong quá khứ đã chốt.

6. **Mật khẩu khởi tạo là tạm thời:**
   - Tài khoản Giáo viên/Nhân viên/Phụ huynh khi tạo mới nhận mật khẩu tạm. Bắt buộc phải đổi mật khẩu ở lần đăng nhập đầu tiên trước khi vào dashboard chính.

---

## 6. QUY TẮC LẬP TRÌNH (CODING STANDARDS)

### 6.1 TypeScript & Type Safety
- `strict: true`, không dùng kiểu `any`, không ép kiểu bừa bãi `as unknown as Type`.
- Chia sẻ Type và Zod Schema qua package/thư mục dùng chung (`shared/validators`).
- Dùng UUID v7 hoặc CUID2 cho tất cả primary keys.

### 6.2 API & Data Flow (tRPC v11)
- Tạo router theo từng domain (`attendanceRouter`, `tuitionRouter`, `studentRouter`...).
- Mọi mutation phải có middleware inject `schoolContext` và `userContext`.
- Xử lý lỗi trả về theo chuẩn `TRPCError` với mã lỗi rõ ràng (`NOT_FOUND`, `FORBIDDEN`, `BAD_REQUEST`, `UNAUTHORIZED`).

```typescript
// Chuẩn mutation thủ tục có tenancy + audit
export const createStudentProcedure = protectedProcedure
  .input(createStudentSchema)
  .mutation(async ({ ctx, input }) => {
    const { schoolId, userId } = ctx;
    return await studentService.createStudent({ schoolId, userId, data: input });
  });
```

### 6.3 Xử lý Form & Client State
- Mọi form tương tác phải dùng **React Hook Form** kết hợp `@hookform/resolvers/zod`.
- Tối ưu hóa phản hồi giao diện: Sử dụng Optimistic Updates khi cần thiết nhưng phải có cơ chế rollback khi mutation thất bại.

---

## 7. QUY TẮC THIẾT KẾ DESIGN SYSTEM & UX/UI (DESIGN & UX RULES)

### 7.1 Định hướng phong cách (Visual Character)
- **Hiện đại, chững chạc, thân thiện, không trẻ con (Modern, Mature, Friendly, Not Childish):**
  - Đây là phần mềm quản lý vận hành dành cho người lớn (Hiệu trưởng, Kế toán, Giáo viên, Phụ huynh).
  - **CẤM:** Màu sắc lòe loẹt, font chữ hoạt hình (comic/bubble), icon trẻ con hoạt họa.
  - **NÊN:** Bảng màu chuyên nghiệp, typography rõ ràng, đường nét tinh tế, micro-interactions mượt mà.

### 7.2 Theme & Design Tokens
- Hỗ trợ **Light Theme** và **Dark Theme** chuẩn mực (dùng `next-themes` và biến CSS HSL của shadcn/ui).
- **CẤM:** Hardcode mã màu hex (`#FFFFFF`, `bg-[#1a2b3c]`) trực tiếp trong components. Bắt buộc dùng CSS tokens (`bg-background`, `text-foreground`, `border-border`, `bg-primary`, `text-muted-foreground`).

### 7.3 Bắt buộc 4 trạng thái giao diện (4 Essential UI States)
Mọi trang danh sách, bảng dữ liệu (Table), chi tiết entity BẮT BUỘC xử lý 4 trạng thái:
1. **Loading State:** Sử dụng Skeleton loader (`<Skeleton />` của shadcn) đúng khung xương layout, không dùng spinner quay đơn điệu ở giữa trang.
2. **Empty State:** Hình minh họa nhẹ nhàng/icon + Tiêu đề + Giải thích ngắn + Nút hành động kêu gọi (CTA) rõ ràng.
3. **Error State:** Thông báo lỗi thân thiện (tiếng Việt) + Nút "Thử lại" (Retry), không văng lỗi stack trace ra màn hình.
4. **Success/Data State:** Hiển thị dữ liệu trực quan, phân trang, lọc (filter), tìm kiếm (search).

### 7.4 Đa ngôn ngữ (i18n)
- Ngôn ngữ chính: **Tiếng Việt (`vi-VN`)**.
- Toàn bộ chuỗi hiển thị, nhãn (label), placeholder, câu thông báo lỗi PHẢI đặt trong file locale (`src/locales/vi.json`).
- Định dạng ngày tháng (`dd/MM/yyyy`), tiền tệ (`1.000.000 ₫`) theo chuẩn `Intl.DateTimeFormat` và `Intl.NumberFormat('vi-VN')`.

---

## 8. QUY TẮC KIỂM THỬ & TIÊU CHUẨN HOÀN THÀNH (TESTING & DOD)

### 8.1 Tiêu chuẩn hoàn thành (Definition of Done - DoD)
Một task/module chỉ được đánh dấu hoàn thành khi thỏa mãn toàn bộ:
- [ ] Schema cơ sở dữ liệu đã có soft delete (`deleted_at`), `school_id`, và migration hợp lệ.
- [ ] RLS policy đã được viết và kiểm tra cô lập dữ liệu giữa 2 trường khác nhau.
- [ ] Zod schema validate đầy đủ dữ liệu đầu vào.
- [ ] Mutation có ghi log `AuditLog`.
- [ ] Giao diện có đầy đủ 4 trạng thái (Loading Skeleton, Empty, Error, Success) trên cả Light và Dark mode.
- [ ] Chuỗi hiển thị được trích xuất vào `vi.json`.
- [ ] Đã viết Unit Test cho logic tính toán (ví dụ: tính BMI, tính học phí, giảm trừ).
- [ ] Code sạch, không có cảnh báo TypeScript (`tsc --noEmit` pass 100%).

---

## TỔNG KẾT DÀNH CHO ANTIGRAVITY
Khi nhận lệnh code bất kỳ task nào:
1. Đọc kỹ mục này.
2. Áp dụng đúng công nghệ và cấu trúc thư mục đã quy định.
3. Không bỏ qua bước test và audit log.
4. Viết code hoàn chỉnh, chạy được ngay.
