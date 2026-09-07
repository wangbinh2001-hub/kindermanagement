# Module 02: School Overview (Dashboard theo vai trò)

> **Mục đích:** Đặc tả màn hình Dashboard/Tổng quan của Trường học, hiển thị số liệu thống kê và thông tin theo thời gian thực dựa trên vai trò của người dùng.
> **Đối tượng sử dụng tài liệu:** Zcode / AI Code Agent khi thực hiện Phase 3 trong `PLAN.md`.
> **Quy tắc kèm theo bắt buộc:** `RULES_CODING.md`, `RULES_TENANCY.md`, `RULES_DESIGN.md`.

---

## 1. Ranh giới ứng dụng (Application Boundary)
- **Đường dẫn (Route):** `apps/web/src/app/(school)/[schoolSlug]/page.tsx` (hoặc `/overview`)
- **Ngữ cảnh (Context):** Bắt buộc inject `schoolId` và `role` của user đang đăng nhập.

---

## 2. Bố cục & Phân quyền dữ liệu (Role-Based Dashboard Layout)

### 2.1 Bộ lọc thời gian (Time Range Filter)
- Mọi widget hỗ trợ bộ lọc:
  - `TODAY`: Hôm nay
  - `THIS_WEEK`: Tuần này
  - `THIS_MONTH`: Tháng này
  - `CURRENT_YEAR`: Năm học hiện tại

### 2.2 Dashboard dành cho School Admin (Toàn trường)
Hiển thị các khối chỉ số quan trọng (Key Metric Cards):
1. **Tổng học sinh (Active Students):** Số lượng học sinh đang theo học tại trường trong năm học hiện tại.
2. **Tổng số lớp học (Total Classes):** Số lượng lớp đang hoạt động trong năm học hiện tại.
3. **Tổng số giáo viên & nhân viên (Total Staff):** Tổng số nhân sự đang làm việc tại trường.
4. **Tỷ lệ chuyên cần hôm nay (Attendance Rate %):** 
   - Công thức: `(Số học sinh Có mặt / Tổng số học sinh cần điểm danh) * 100`.
   - Có biểu đồ tròn/thanh hiển thị chi tiết: Có mặt, Vắng có phép, Vắng không phép, Đi muộn.
5. **Tổng học phí chưa thu (Outstanding Balance):** Tổng số tiền của các hóa đơn học phí còn nợ/chưa thanh toán trong kỳ hiện tại.
6. **Yêu cầu phụ huynh đang chờ (Pending Parent Requests):** Số lượng đơn xin nghỉ, dặn thuốc, đón muộn chưa được xử lý. Có link chuyển nhanh đến trang quản lý yêu cầu.

### 2.3 Dashboard dành cho Giáo viên (Teacher - Theo lớp phụ trách)
Chỉ hiển thị dữ liệu của các lớp mà giáo viên được phân công làm Chủ nhiệm (Homeroom) hoặc Trợ giảng (Assistant):
1. **Học sinh của tôi (My Students):** Tổng số học sinh thuộc lớp phụ trách.
2. **Điểm danh lớp hôm nay:** Danh sách học sinh Vắng hôm nay (kèm lý do nếu có).
3. **Yêu cầu phụ huynh của lớp:** Danh sách dặn thuốc, đón muộn, xin nghỉ trong ngày của lớp mình cần xác nhận.

---

## 3. API & Procedure Design (tRPC)

```typescript
export const schoolOverviewRouter = router({
  getAdminMetrics: protectedProcedure
    .input(z.object({
      timeRange: z.enum(['TODAY', 'THIS_WEEK', 'THIS_MONTH', 'CURRENT_YEAR']),
    }))
    .query(async ({ ctx, input }) => {
      // Bắt buộc check role School Admin
      // Trả về: totalStudents, totalClasses, totalStaff, attendanceRate, outstandingTuition, pendingRequestsCount
    }),

  getTeacherMetrics: protectedProcedure
    .input(z.object({
      classId: z.string().uuid().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Bắt buộc lọc theo các assigned classes của teacher
      // Trả về: myStudentsCount, absentStudentsToday, pendingRequestsForMyClasses
    }),
});
```

---

## 4. UI States & Experience
- **Loading:** Render Skeleton Cards theo đúng layout Metric Cards.
- **Empty:** Trường mới tạo chưa có học sinh/lớp học -> Hiển thị "Setup Checklist" hướng dẫn tạo Năm học -> Tạo Lớp -> Thêm Học sinh.
- **Error:** Card lỗi kèm nút "Thử lại".
- **Design:** Tone màu chuyên nghiệp, không dùng icon hoạt hình, hỗ trợ Light/Dark mode.
