"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Input } from "@km/ui";
import { 
  UserPlus, 
  Search, 
  Filter, 
  GraduationCap, 
  Users, 
  Calendar, 
  ChevronRight, 
  Phone, 
  CheckCircle2, 
  Clock, 
  XCircle,
  Building2,
  Sparkles
} from "lucide-react";

export interface StudentListItem {
  relationshipId: string;
  studentId: string;
  fullName: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  dateOfBirth: string;
  className: string | null;
  classId: string | null;
  enrollmentStatus: "ACTIVE" | "WITHDRAWN" | "GRADUATED" | "ON_LEAVE";
  enrolledAt: string;
  parentName: string | null;
  parentPhone: string | null;
  tuitionExempt: boolean;
  lunchSupport: boolean;
}

interface StudentsListClientProps {
  schoolSlug: string;
  students: StudentListItem[];
  classes: Array<{ id: string; name: string }>;
  schoolYears: Array<{ id: string; name: string; isCurrent: boolean }>;
  currentYearId?: string;
}

export function StudentsListClient({
  schoolSlug,
  students,
  classes,
  schoolYears,
  currentYearId,
}: StudentsListClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  const filteredStudents = students.filter((s) => {
    const term = searchTerm.trim().toLowerCase();
    const digitsOnlySearch = searchTerm.replace(/\D/g, "");
    const digitsOnlyParentPhone = (s.parentPhone || "").replace(/\D/g, "");
    const matchesPhone =
      Boolean(s.parentPhone && s.parentPhone.includes(searchTerm.trim())) ||
      (digitsOnlySearch.length >= 6 &&
        digitsOnlyParentPhone.endsWith(digitsOnlySearch.replace(/^0/, "")));

    const matchesSearch =
      !term ||
      s.fullName.toLowerCase().includes(term) ||
      matchesPhone ||
      (s.parentName && s.parentName.toLowerCase().includes(term));

    const matchesClass =
      selectedClassId === "ALL" || s.classId === selectedClassId;

    const matchesStatus =
      selectedStatus === "ALL" || s.enrollmentStatus === selectedStatus;

    return matchesSearch && matchesClass && matchesStatus;
  });

  const totalActive = students.filter((s) => s.enrollmentStatus === "ACTIVE").length;
  const totalOnLeave = students.filter((s) => s.enrollmentStatus === "ON_LEAVE").length;
  const totalWithdrawn = students.filter((s) => s.enrollmentStatus === "WITHDRAWN").length;

  return (
    <div className="space-y-8">
      {/* Header & Thao tác chính */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Hồ sơ & Danh sách Học sinh
            </h1>
            <span className="rounded-full bg-primary/10 text-primary font-bold text-xs px-2.5 py-0.5 border border-primary/20">
              {students.length} trẻ
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý tiếp nhận nhập học, hồ sơ nhân khẩu, phân lớp và lịch sử chuyển lớp của trẻ.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href={`/${schoolSlug}/students/new`}>
            <Button id="btn-add-student" className="h-10 font-semibold shadow-xs gap-2">
              <UserPlus className="h-4 w-4" />
              <span>Tiếp nhận học sinh mới</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Thẻ Thống kê Tổng quan */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Tổng học sinh</span>
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-foreground">{students.length}</div>
          <p className="text-[11px] text-muted-foreground">Toàn bộ hồ sơ tại trường</p>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Đang theo học</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {totalActive}
          </div>
          <p className="text-[11px] text-muted-foreground">Trạng thái ACTIVE</p>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Tạm nghỉ / Bảo lưu</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {totalOnLeave}
          </div>
          <p className="text-[11px] text-muted-foreground">Trạng thái ON_LEAVE</p>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Đã thôi học / Chuyển</span>
            <XCircle className="h-4 w-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
            {totalWithdrawn}
          </div>
          <p className="text-[11px] text-muted-foreground">Đã rút hồ sơ</p>
        </div>
      </div>

      {/* Thanh Tìm kiếm & Bộ lọc */}
      <div className="rounded-xl border bg-card p-4 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="student-search-input"
            type="text"
            placeholder="Tìm theo tên bé, phụ huynh hoặc số điện thoại..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10 w-full"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {/* Lọc theo lớp */}
          <select
            id="filter-class"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="h-10 rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
          >
            <option value="ALL">Tất cả lớp học ({classes.length})</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                Lớp {c.name}
              </option>
            ))}
          </select>

          {/* Lọc theo trạng thái */}
          <select
            id="filter-status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-10 rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang học (ACTIVE)</option>
            <option value="ON_LEAVE">Tạm nghỉ (ON_LEAVE)</option>
            <option value="WITHDRAWN">Đã thôi học (WITHDRAWN)</option>
            <option value="GRADUATED">Đã tốt nghiệp (GRADUATED)</option>
          </select>
        </div>
      </div>

      {/* Danh sách học sinh */}
      {filteredStudents.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center space-y-4 bg-muted/10">
          <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <Users className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-base text-foreground">
              {students.length === 0
                ? "Chưa có học sinh nào trong trường"
                : "Không tìm thấy học sinh phù hợp với bộ lọc"}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {students.length === 0
                ? "Bắt đầu tiếp nhận và số hóa hồ sơ học sinh đầu tiên để quản lý lớp học và điểm danh."
                : "Thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh lại bộ lọc lớp học/trạng thái."}
            </p>
          </div>
          {students.length === 0 && (
            <Link href={`/${schoolSlug}/students/new`}>
              <Button size="sm" className="font-semibold shadow-xs">
                <UserPlus className="h-4 w-4 mr-1.5" />
                Tiếp nhận hồ sơ ngay
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b bg-muted/40 text-muted-foreground font-semibold">
                  <th className="py-3 px-4">Họ và tên trẻ</th>
                  <th className="py-3 px-4">Lớp hiện tại</th>
                  <th className="py-3 px-4">Giới tính & Ngày sinh</th>
                  <th className="py-3 px-4">Người giám hộ</th>
                  <th className="py-3 px-4">Chính sách</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredStudents.map((s) => {
                  const statusBadge =
                    s.enrollmentStatus === "ACTIVE"
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                      : s.enrollmentStatus === "ON_LEAVE"
                      ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                      : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20";

                  const statusText =
                    s.enrollmentStatus === "ACTIVE"
                      ? "Đang học"
                      : s.enrollmentStatus === "ON_LEAVE"
                      ? "Tạm nghỉ"
                      : s.enrollmentStatus === "WITHDRAWN"
                      ? "Thôi học"
                      : "Tốt nghiệp";

                  return (
                    <tr
                      key={s.relationshipId}
                      className="hover:bg-muted/30 transition-colors group cursor-pointer"
                    >
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/${schoolSlug}/students/${s.relationshipId}`}
                          className="font-bold text-sm text-foreground group-hover:text-primary transition-colors block"
                        >
                          {s.fullName}
                        </Link>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          ID: {s.studentId.slice(-6)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {s.className ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-foreground bg-muted/60 px-2 py-0.5 rounded text-xs">
                            <GraduationCap className="h-3 w-3 text-primary" />
                            {s.className}
                          </span>
                        ) : (
                          <span className="text-muted-foreground italic">Chưa xếp lớp</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="font-medium text-foreground block">
                            {s.gender === "MALE" ? "Nam" : s.gender === "FEMALE" ? "Nữ" : "Khác"}
                          </span>
                          <span className="text-muted-foreground text-[11px] flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(s.dateOfBirth).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-foreground block">
                            {s.parentName || "Chưa cập nhật"}
                          </span>
                          {s.parentPhone && (
                            <span className="text-muted-foreground text-[11px] flex items-center gap-1 font-mono">
                              <Phone className="h-3 w-3" />
                              {s.parentPhone}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {s.tuitionExempt && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-400 text-[10px] font-semibold border border-blue-500/20">
                              Miễn học phí
                            </span>
                          )}
                          {s.lunchSupport && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-semibold border border-amber-500/20">
                              Hỗ trợ ăn
                            </span>
                          )}
                          {!s.tuitionExempt && !s.lunchSupport && (
                            <span className="text-muted-foreground text-[11px]">-</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${statusBadge}`}
                        >
                          {statusText}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/${schoolSlug}/students/${s.relationshipId}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                        >
                          <span>Hồ sơ</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
