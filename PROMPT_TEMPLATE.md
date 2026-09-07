# ZCODE_GUIDE — KinderManagement

> Một file duy nhất cho Zcode / AI Code Agent: bối cảnh dự án, rule nền, cách đọc tài liệu, và mẫu prompt bàn giao task.

---

## 1. Bối cảnh dự án

KinderManagement là SaaS đa tenant cho trường mầm non / kindergarten.

Mỗi trường là một tenant độc lập. Dữ liệu vận hành của trường này không được lộ sang trường khác.

### Vai trò chính
- **System Admin**: quản trị nền tảng, tạo trường, cấp School Admin, support access có kiểm soát.
- **School Admin**: quyền vận hành cao nhất trong một trường.
- **Teacher**: thao tác trong lớp / trường được phân quyền.
- **Staff**: thao tác theo nhiệm vụ được cấp.
- **Parent / Guardian**: chỉ xem dữ liệu con hợp lệ của mình và gửi yêu cầu.

### Nguyên tắc không được phá
- Mọi query phải scope theo `school_id` hoặc cơ chế tenant tương đương.
- Student identity và school relationship là hai lớp khác nhau.
- CCCD / định danh hợp lệ dùng để tránh trùng học sinh toàn cục, nhưng không được mở dữ liệu vận hành của trường khác.
- Parent identity tái sử dụng theo số điện thoại.
- Class membership là lịch sử append-only, không ghi đè lịch sử bằng current class.
- Tuition history không bị rewrite âm thầm khi đổi cấu hình hiện tại.
- Audit log là mặc định cho mutation quan trọng.
- Soft delete dùng `deleted_at`.
- Không mock data trong test nghiệp vụ.
- Test phải chạy trên dữ liệu thật của môi trường test và cleanup sạch sau khi xong.

### Phong cách sản phẩm
- Web app cho người lớn, không childish.
- Modern, mature, friendly, rõ ràng.
- Light và Dark mode đều là yêu cầu.
- Sidebar navigation là hướng chính cho app vận hành.
- Parent Portal là website mobile-friendly, không phải app native.

### Stack nền
- Next.js 16
- TypeScript strict
- tRPC v11
- Prisma
- Supabase PostgreSQL + RLS
- Better Auth
- Tailwind CSS
- shadcn/ui
- Radix UI
- Zod
- React Hook Form

---

## 2. Tài liệu hiện có

### Rule files ở root
- `AGENT.md`
- `RULES_CODING.md`
- `RULES_TENANCY.md`
- `RULES_SECURITY.md`
- `RULES_TESTING.md`
- `RULES_DESIGN.md`

### Planning file
- `PLAN.md`

### Module files
- `docs/modules/01_system_admin.md`
- `docs/modules/02_school_overview.md`
- `docs/modules/03_school_years_and_classes.md`
- `docs/modules/05_students_and_families.md`
- `docs/modules/06_staff.md`
- `docs/modules/07_attendance.md`
- `docs/modules/08_fees_and_tuition.md`
- `docs/modules/09_health.md`
- `docs/modules/10_nutrition.md`
- `docs/modules/11_parent_requests.md`
- `docs/modules/12_school_settings.md`
- `docs/modules/13_parent_portal.md`
- `docs/modules/14_logs_and_audit.md`

---

## 3. Thứ tự đọc khi bắt đầu task

1. `AGENT.md`
2. `RULES_PLANNING.md`
3. `RULES_CODING.md`
4. `RULES_TENANCY.md`
5. `RULES_SECURITY.md`
6. `RULES_TESTING.md`
7. `RULES_DESIGN.md` nếu task có UI
8. `PLAN.md`
9. `docs/modules/<module>.md`

---

## 4. Không làm

- Không tự ý thêm module mới.
- Không tự ý đổi tên file spec.
- Không mở rộng scope ngoài module được giao.
- Không tự quyết định nghiệp vụ còn chưa chốt.
- Không viết code lan man ngoài task.
- Không dùng mock data để giả lập nghiệp vụ cuối cùng.

---

## 5. Cách phản hồi khi xong task

Zcode phải trả về report ngắn, rõ, có các phần:
- Tổng kết
- File đã sửa
- DoD checklist
- Test đã chạy
- Cleanup xác nhận
- Vấn đề / đề xuất ngoài phạm vi nếu có

---

## 6. Mẫu prompt giao việc cho Zcode

> Dùng block dưới đây khi bàn giao một phase/module.

```text
# TASK: Phase {{PHASE_NUMBER}} — {{PHASE_NAME}}

## 1. Bối cảnh
- Bạn là Zcode — AI Code Agent.
- Dự án: KinderManagement (multi-tenant SaaS quản lý trường mầm non).
- Stack: Next.js 16, TypeScript, tRPC, PostgreSQL (RLS), shadcn/ui, CSS tokens.
- Multi-tenancy: mọi query phải scope theo `school_id`; RLS hoặc middleware.
- Auth: phone hoặc username; mật khẩu ban đầu là tạm thời, bắt buộc đổi ở lần đăng nhập đầu.

## 2. Tài liệu bắt buộc đọc (theo đúng thứ tự)
1. `AGENT.md` — router và quy ước làm việc.
2. `RULES_PLANNING.md`
3. `RULES_CODING.md`
4. `RULES_TENANCY.md`
5. `RULES_SECURITY.md`
6. `RULES_TESTING.md`
7. `RULES_DESIGN.md` (nếu phase có UI)
8. `docs/modules/{{MODULE_FILE}}` — đặc tả phase này.
9. `PLAN.md` — mục Phase {{PHASE_NUMBER}} để biết task breakdown.

## 3. Phạm vi được phép
- Chỉ tạo/sửa file nằm trong phạm vi Phase {{PHASE_NUMBER}} và module `{{MODULE_FILE}}`.
- Mọi thay đổi ngoài phạm vi phải dừng lại và báo cáo.

## 4. Definition of Done
Sao chép nguyên mục "Definition of Done" từ `docs/modules/{{MODULE_FILE}}`. Zcode phải tick đủ từng mục.

## 5. Quy tắc nghiêm cấm
- ❌ Tự ý thêm tính năng, API, bảng DB ngoài DoD.
- ❌ Tạo mock data, fake user, fake tenant.
- ❌ Ghi đè file không thuộc phase.
- ❌ Bỏ qua test tenancy isolation và RLS.
- ❌ Tạo tài khoản thật trên DB production; chỉ test trên DB test và cleanup.

## 6. Định dạng báo cáo sau khi xong
Báo cáo phải có đúng các mục sau:

### 6.1 Tổng kết
- Phase: {{PHASE_NUMBER}} — {{PHASE_NAME}}
- Trạng thái: HOÀN THÀNH / CHƯA HOÀN THÀNH / CẦN REVIEW
- Tóm tắt 3-5 dòng.

### 6.2 File đã tạo / sửa
Liệt kê theo dạng:
- Tạo: `apps/web/src/...` — mô tả 1 dòng
- Sửa: `apps/web/src/...` — mô tả 1 dòng
- Migration: `prisma/migrations/{{NAME}}/migration.sql` — mô tả 1 dòng

### 6.3 DoD checklist
Sao chép DoD từ module, tick ✅ / ❌ / ⚠ kèm ghi chú ngắn.

### 6.4 Test đã chạy
- Unit: ... — PASS/FAIL
- Integration: ... — PASS/FAIL
- Tenancy isolation: ... — PASS/FAIL
- RLS: ... — PASS/FAIL
- e2e (nếu có): ... — PASS/FAIL

### 6.5 Cleanup xác nhận
- Tài khoản test: đã xóa / còn lại (liệt kê).
- DB test: đã reset về trạng thái sạch / còn dữ liệu test.
- Lệnh cleanup đã chạy: ...

### 6.6 Đề xuất ngoài phạm vi (nếu có)
Mỗi đề xuất ghi rõ:
- Mô tả ngắn.
- Lý do nên có.
- Phase đề xuất đưa vào.

### 6.7 Câu hỏi / vướng mắc (nếu có)

## 7. Lệnh chạy nhanh
- `pnpm install`
- `pnpm db:migrate`
- `pnpm test`
- `pnpm test:tenancy`
- `pnpm lint`
- `pnpm typecheck`
```

---

## 7. Ví dụ cụ thể — Phase 2

```text
# TASK: Phase 2 — System Admin Provisioning

## 1. Bối cảnh
- Bạn là Zcode — AI Code Agent.
- Dự án: KinderManagement (multi-tenant SaaS quản lý trường mầm non).
- Stack: Next.js 16, TypeScript, tRPC, PostgreSQL (RLS), shadcn/ui, CSS tokens.
- Multi-tenancy: mọi query phải scope theo `school_id`; RLS hoặc middleware.
- Auth: phone hoặc username; mật khẩu ban đầu là tạm thời, bắt buộc đổi ở lần đăng nhập đầu.

## 2. Tài liệu bắt buộc đọc
1. `AGENT.md`
2. `RULES_PLANNING.md`
3. `RULES_CODING.md`
4. `RULES_TENANCY.md`
5. `RULES_SECURITY.md`
6. `RULES_TESTING.md`
7. `RULES_DESIGN.md`
8. `docs/modules/01_system_admin.md`
9. `PLAN.md` — mục Phase 2

## 3. Phạm vi được phép
Chỉ tạo/sửa file thuộc System Admin: trang provisioning, School Admin account, emergency support access, school metrics dashboard, login flow với first-login password change.

## 4. Definition of Done (từ `docs/modules/01_system_admin.md`)
- [ ] Tạo trường mới yêu cầu tên trường, chủ trường, phone.
- [ ] Mã trường tự sinh, unique.
- [ ] School Admin được tạo cùng form (username/password/phone).
- [ ] First login bắt buộc đổi mật khẩu.
- [ ] Suspend school -> read-only.
- [ ] Xóa 2 lớp (soft + hard theo quy tắc).
- [ ] Emergency support access có log + thời hạn.
- [ ] System Admin chỉ thấy metrics tổng hợp.
- [ ] RLS pass; tenancy isolation pass; audit log ghi mọi thao tác.

## 5. Quy tắc nghiêm cấm
- ❌ Tự ý thêm tính năng ngoài DoD.
- ❌ Mock data, fake tenant.
- ❌ Ghi đè file không thuộc phase.
- ❌ Test trên DB production.

## 6. Định dạng báo cáo
Theo mẫu ở mục 6 của file này.

## 7. Lệnh chạy nhanh
- `pnpm install`
- `pnpm db:migrate`
- `pnpm test`
- `pnpm test:tenancy`
- `pnpm lint`
- `pnpm typecheck`
```

---

## 8. Ghi nhớ quan trọng

Nếu module spec và PLAN chưa đủ rõ, Zcode phải dừng và báo cáo thay vì tự suy diễn.

Nếu task chạm đến quyết định chưa chốt, giữ nguyên là unresolved và báo lại.
