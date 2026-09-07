# EXECUTION — Tenancy, RLS, Test & Report Rules

> File này gom quy tắc tenancy và execution để Zcode / AI Code Agent dùng khi code. Không thay thế `AGENT.md`, `PLAN.md`, `RULES_*.md`, hoặc module spec. Chỉ làm rõ cách thực thi để tránh code lan man, sai tenant, test giả, hoặc report thiếu.

---

## 1. Nguyên tắc thực thi

- Một lượt làm việc chỉ xử lý đúng task được giao.
- Không tự thêm feature, API, DB table, UI route ngoài module spec.
- Không sửa file ngoài phạm vi task nếu chưa báo cáo.
- Không vừa code vừa giải thích dài dòng.
- Code xong phải chạy test liên quan và report.
- Nếu requirement thiếu, mâu thuẫn, hoặc chưa chốt: dừng và báo cáo `UNRESOLVED`.

---

## 2. Tenancy bắt buộc

KinderManagement là SaaS đa tenant. Mỗi trường là một tenant.

### 2.1 Luật tenant

- Mọi operational entity phải có `school_id` hoặc liên kết bắt buộc về một entity có `school_id`.
- Mọi query đọc/ghi dữ liệu trường phải scope theo active school.
- Không lấy dữ liệu bằng global ID nếu không kiểm tra tenant.
- Không dùng client-provided `school_id` làm nguồn tin duy nhất.
- Active school phải lấy từ session/context đã xác thực.
- System Admin không có school context mặc định.
- Support Access phải explicit, time-bound, scoped, audited.

### 2.2 Global identity không phải tenant data

Các identity toàn cục có thể không thuộc một school duy nhất:
- User
- ParentIdentity
- Student

Nhưng mọi dữ liệu vận hành phải qua relationship có tenant:
- StudentSchoolRelationship
- StaffMember
- ClassMembership
- AttendanceRecord
- Invoice
- HealthRecord
- ParentRequest

### 2.3 Pattern query tối thiểu

```ts
await db.entity.findMany({
  where: {
    schoolId: ctx.activeSchoolId,
    deletedAt: null,
  },
});
```

Nếu entity không có `schoolId` trực tiếp, phải join qua relationship tenant-scoped.

```ts
await db.healthRecord.findMany({
  where: {
    studentSchoolRelationship: {
      schoolId: ctx.activeSchoolId,
      deletedAt: null,
    },
    deletedAt: null,
  },
});
```

---

## 3. RLS nguyên tắc

RLS là lớp chặn cuối. App authorization không được thay thế RLS.

### 3.1 Bắt buộc

- Bật RLS cho bảng tenant-scoped.
- Policy đọc/ghi phải dựa trên school context đã xác thực.
- Test phải chứng minh user trường A không đọc/ghi được dữ liệu trường B.
- Policy không được dùng giá trị truyền từ client chưa xác minh.

### 3.2 Policy concept

Ví dụ ý tưởng, không copy máy móc nếu schema khác:

```sql
CREATE POLICY school_isolation_select ON "StudentSchoolRelationship"
FOR SELECT
USING (
  school_id = current_setting('app.current_school_id', true)::uuid
);
```

Mutation cũng cần policy riêng:

```sql
CREATE POLICY school_isolation_insert ON "AttendanceRecord"
FOR INSERT
WITH CHECK (
  school_id = current_setting('app.current_school_id', true)::uuid
);
```

### 3.3 Cấm

- Không disable RLS để test cho qua.
- Không dùng service role trong route/user-facing procedure để né policy.
- Không hardcode tenant ID.
- Không tạo policy `USING (true)` cho bảng có dữ liệu trường.

---

## 4. Validation và authorization

### 4.1 Input boundary

Mọi input từ client/API phải validate bằng Zod hoặc equivalent.

```ts
const inputSchema = z.object({
  studentSchoolRelationshipId: z.string().uuid(),
  measuredAt: z.coerce.date(),
});
```

### 4.2 Authorization

- UI hide chỉ là phụ, không phải bảo mật.
- Server procedure phải kiểm tra role/permission.
- Teacher chỉ được truy cập lớp được assign.
- Parent chỉ được truy cập child link hợp lệ.
- Staff chỉ được thao tác đúng permission được cấp.

---

## 5. Audit rule

Mutation quan trọng phải ghi audit:
- create
- update
- soft delete
- restore
- approve/reject
- permission change
- support access
- auth-sensitive events

Audit log tối thiểu:
- actorId
- actorRole
- schoolId nếu có
- entityType
- entityId
- action
- beforeState nếu update/delete
- afterState nếu create/update
- metadata nếu cần
- createdAt

Không ghi PII thô vào log nếu không cần.

---

## 6. Test thật, không mock nghiệp vụ

### 6.1 Nguyên tắc test

- Test trên DB test, không dùng production.
- Tạo dữ liệu thật trong test DB.
- Chạy flow thật qua API/service càng nhiều càng tốt.
- Sau test phải cleanup dữ liệu test.
- Test không được phụ thuộc dữ liệu có sẵn trong DB.

### 6.2 Cleanup bắt buộc

Mọi dữ liệu test nên có prefix:

```text
KM_TEST_<phase>_<timestamp>
```

Cleanup theo prefix hoặc transaction rollback.

Nếu cleanup fail, report phải ghi rõ còn dữ liệu nào.

### 6.3 Cleanup sau mỗi phase

- Sau mỗi phase, bắt buộc chạy cleanup trên **test DB** cho toàn bộ dữ liệu do phase tạo.
- Chỉ được báo cáo `HOÀN THÀNH` khi cleanup đã PASS và xác nhận không còn dữ liệu `KM_TEST_<phase>_...`.
- Cleanup phải chạy kể cả khi test fail; nếu cleanup fail, phase bị `BLOCKED`.
- Không xóa dữ liệu dev/production; không dùng `--force`, `TRUNCATE`, hoặc data wipe để che lỗi nếu chưa được phê duyệt.

### 6.4 Tenancy isolation test tối thiểu

Mỗi module tenant-scoped phải có test:

1. Tạo School A.
2. Tạo School B.
3. Tạo user/role hợp lệ cho School A.
4. Tạo dữ liệu thuộc School B.
5. Dùng context School A đọc dữ liệu School B.
6. Kỳ vọng: denied hoặc empty result.
7. Cleanup toàn bộ dữ liệu test.

---

## 7. Idempotency rule

Mutation có thể retry phải idempotent:
- tạo attendance record
- tạo invoice
- tạo parent request
- bulk update
- payment/reference callback nếu sau này có

Client gửi idempotency key. Server lưu và reuse result nếu request lặp.

Không tạo duplicate record khi refresh/retry.

---

## 8. Migration rule

- Migration phải nhỏ, đúng phase.
- Tên migration phải đọc được.
- Không drop data nếu chưa có approval.
- Không đổi schema module khác nếu không liên quan task.
- Mọi operational table có `deleted_at` nếu không có lý do rõ ràng.
- Tenant table phải có index theo `school_id`.

Ví dụ:

```text
prisma/migrations/20260906_phase2_system_admin/migration.sql
```

---

## 9. UI execution rule

Nếu task có UI:
- Dùng design token, không hardcode màu bừa bãi.
- Light/Dark đều phải ổn.
- Không childish.
- Form có label, error, focus state.
- Empty/loading/error state đầy đủ.
- User-facing string phải i18n-ready, vi-VN primary.
- Không gọi DB trực tiếp từ UI.

---

## 10. Report format bắt buộc

Zcode sau khi xong phải report theo mẫu:

```text
# REPORT — Phase <number> <name>

## 1. Trạng thái
HOÀN THÀNH / CHƯA HOÀN THÀNH / CẦN REVIEW

## 2. Tóm tắt
- ...
- ...
- ...

## 3. File đã tạo/sửa
- Tạo: `...`
- Sửa: `...`
- Migration: `...`

## 4. DoD checklist
- ✅ ...
- ❌ ...
- ⚠ ...

## 5. Test đã chạy
- `pnpm typecheck`: PASS/FAIL
- `pnpm lint`: PASS/FAIL
- `pnpm test`: PASS/FAIL
- `pnpm test:tenancy`: PASS/FAIL
- Khác: ...

## 6. Cleanup xác nhận
- Test data prefix: ...
- Đã cleanup: CÓ/KHÔNG
- Dữ liệu test còn lại: CÓ/KHÔNG, chi tiết nếu có

## 7. Vấn đề / unresolved
- ...

## 8. Đề xuất ngoài phạm vi
- ...
```

---

## 11. Khi phải dừng

Dừng và report nếu gặp:
- Module spec thiếu quyết định nghiệp vụ.
- PLAN và module spec mâu thuẫn.
- Cần sửa schema ngoài phase.
- Cần thêm dependency mới.
- Test cần production data.
- Không thể cleanup dữ liệu test.
- RLS/tenancy chưa rõ.

Không tự xử lý bằng suy đoán.
