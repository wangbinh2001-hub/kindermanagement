"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button, Input } from "@km/ui";
import { 
  Search, 
  Plus, 
  School as SchoolIcon, 
  Settings, 
  Lock, 
  Unlock, 
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Loader2
} from "lucide-react";
import { updateSchoolStatusAction } from "../actions";

interface SchoolItem {
  id: string;
  code: string;
  name: string;
  slug: string;
  ownerName: string | null;
  phone: string | null;
  email: string | null;
  status: "PENDING_SETUP" | "ACTIVE" | "SUSPENDED" | "DELETED";
  createdAt: string;
}

export function SchoolsClient({ initialSchools }: { initialSchools: SchoolItem[] }) {
  const [schools, setSchools] = useState<SchoolItem[]>(initialSchools);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isPending, startTransition] = useTransition();
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const filteredSchools = schools.filter((school) => {
    const matchSearch =
      school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      school.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (school.ownerName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

    const matchStatus = statusFilter === "ALL" || school.status === statusFilter;

    return matchSearch && matchStatus;
  });

  const handleToggleStatus = (schoolId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    const confirmText = nextStatus === "SUSPENDED" 
      ? "Bạn có chắc muốn TẠM KHÓA trường này? Người dùng sẽ chỉ xem được dữ liệu cũ và bị chặn ghi mới."
      : "Bạn có chắc muốn KÍCH HOẠT lại trường này?";

    if (!window.confirm(confirmText)) return;

    startTransition(async () => {
      const res = await updateSchoolStatusAction(schoolId, nextStatus, "Thao tác từ bảng danh sách trường");
      if (res.success && res.data) {
        setSchools((prev) =>
          prev.map((s) => (s.id === schoolId ? { ...s, status: nextStatus } : s))
        );
        setActionMessage(`Đã cập nhật trạng thái trường thành công: ${nextStatus === "ACTIVE" ? "Hoạt động" : "Tạm khóa"}`);
        setTimeout(() => setActionMessage(null), 3000);
      } else {
        alert(res.error ?? "Lỗi cập nhật trạng thái");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Nút Tạo mới */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Danh sách trường học</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý vòng đời, trạng thái và cấu hình phân hệ cho các cơ sở trường mầm non.
          </p>
        </div>

        <Link href="/system-admin/schools/new">
          <Button className="font-semibold shadow-xs">
            <Plus className="h-4 w-4 mr-1.5" />
            Khởi tạo trường mới
          </Button>
        </Link>
      </div>

      {actionMessage && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Thanh Tìm kiếm & Bộ lọc */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="searchSchool"
            placeholder="Tìm kiếm theo mã trường, tên trường hoặc chủ trường..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <select
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="SUSPENDED">Tạm khóa</option>
            <option value="PENDING_SETUP">Chờ thiết lập</option>
          </select>
        </div>
      </div>

      {/* Bảng Danh sách Trường */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-xs">
        {filteredSchools.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <SchoolIcon className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-base">Không tìm thấy trường học nào</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Không có trường nào khớp với từ khóa tìm kiếm hoặc bộ lọc hiện tại.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="border-b bg-muted/40 font-semibold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Mã trường</th>
                  <th className="px-4 py-3.5">Tên trường</th>
                  <th className="px-4 py-3.5">Chủ trường / SĐT</th>
                  <th className="px-4 py-3.5">Trạng thái</th>
                  <th className="px-4 py-3.5">Ngày khởi tạo</th>
                  <th className="px-4 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredSchools.map((school) => (
                  <tr key={school.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-primary">
                      {school.code}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-foreground text-sm">{school.name}</div>
                      <div className="text-muted-foreground font-mono text-[11px]">{school.slug}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-foreground">{school.ownerName}</div>
                      <div className="text-muted-foreground">{school.phone}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={school.status} />
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">
                      {school.createdAt}
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(school.id, school.status)}
                        disabled={isPending}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-colors ${
                          school.status === "ACTIVE"
                            ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20"
                        }`}
                        title={school.status === "ACTIVE" ? "Tạm khóa trường" : "Kích hoạt trường"}
                      >
                        {school.status === "ACTIVE" ? (
                          <>
                            <Lock className="h-3 w-3" />
                            <span>Tạm khóa</span>
                          </>
                        ) : (
                          <>
                            <Unlock className="h-3 w-3" />
                            <span>Kích hoạt</span>
                          </>
                        )}
                      </button>

                      <Link href={`/system-admin/schools/${school.id}`}>
                        <Button variant="outline" size="sm" className="h-7 px-2.5 text-[11px] font-semibold">
                          <Settings className="h-3 w-3 mr-1" />
                          <span>Chi tiết</span>
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING_SETUP: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-300 dark:border-amber-800",
    ACTIVE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
    SUSPENDED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-300 dark:border-red-800",
    DELETED: "bg-zinc-100 text-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-300 border-zinc-300 dark:border-zinc-800",
  };

  const labels: Record<string, string> = {
    PENDING_SETUP: "Chờ thiết lập",
    ACTIVE: "Hoạt động",
    SUSPENDED: "Tạm khóa",
    DELETED: "Đã xóa",
  };

  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${styles[status] ?? styles.PENDING_SETUP}`}>
      {labels[status] ?? status}
    </span>
  );
}
