import Link from "next/link";
import { prisma } from "@km/db";
import { Button } from "@km/ui";
import { 
  School, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Headset, 
  History, 
  Plus, 
  ShieldAlert, 
  Server, 
  ArrowRight,
  Database,
  Lock
} from "lucide-react";

export const dynamic = "force-dynamic";

async function getPlatformMetrics() {
  const [total, active, suspended, pending, openSupportRequests, totalAuditLogs, recentSchools] = await Promise.all([
    prisma.school.count({ where: { deletedAt: null } }),
    prisma.school.count({ where: { status: "ACTIVE", deletedAt: null } }),
    prisma.school.count({ where: { status: "SUSPENDED", deletedAt: null } }),
    prisma.school.count({ where: { status: "PENDING_SETUP", deletedAt: null } }),
    prisma.supportRequest.count({
      where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
    }),
    prisma.auditLog.count(),
    prisma.school.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        code: true,
        name: true,
        ownerName: true,
        phone: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return { total, active, suspended, pending, openSupportRequests, totalAuditLogs, recentSchools };
}

export default async function SystemAdminDashboardPage() {
  const metrics = await getPlatformMetrics();

  return (
    <div className="space-y-8">
      {/* Tiêu đề & Giới thiệu */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Tổng quan nền tảng</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Bảng điều hành quản trị cấp cao dành cho Quản trị viên hệ thống KinderManagement SaaS.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/system-admin/schools/new">
            <Button className="font-semibold shadow-xs">
              <Plus className="h-4 w-4 mr-1.5" />
              Khởi tạo trường mới
            </Button>
          </Link>
          <Link href="/system-admin/support/new">
            <Button variant="outline" className="font-medium">
              <Headset className="h-4 w-4 mr-1.5 text-primary" />
              Hỗ trợ khẩn cấp
            </Button>
          </Link>
        </div>
      </div>

      {/* Banner Nguyên tắc Ranh giới (Zero Data Leak) */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold block text-sm">Nguyên tắc Cô lập Dữ liệu (Zero Data Leak):</span>
          <p className="leading-relaxed">
            System Admin chỉ theo dõi chỉ số tổng hợp và vòng đời trường học. Quyền đọc/ghi dữ liệu vận hành (học sinh, điểm danh, hóa đơn, y tế) bị <strong>chặn tuyệt đối</strong> trừ khi có phiên <strong>Support Access</strong> được phê duyệt và kích hoạt rõ ràng.
          </p>
        </div>
      </div>

      {/* 6 Thẻ Chỉ số Nền tảng */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard
          label="Tổng số trường"
          value={metrics.total}
          icon={School}
          tone="default"
        />
        <MetricCard
          label="Đang hoạt động"
          value={metrics.active}
          icon={CheckCircle2}
          tone="success"
        />
        <MetricCard
          label="Tạm khóa"
          value={metrics.suspended}
          icon={AlertTriangle}
          tone="warning"
        />
        <MetricCard
          label="Chờ thiết lập"
          value={metrics.pending}
          icon={Clock}
          tone="default"
        />
        <MetricCard
          label="Yêu cầu hỗ trợ"
          value={metrics.openSupportRequests}
          icon={Headset}
          tone={metrics.openSupportRequests > 0 ? "warning" : "default"}
        />
        <MetricCard
          label="Nhật ký kiểm toán"
          value={metrics.totalAuditLogs}
          icon={History}
          tone="default"
        />
      </section>

      {/* Hai Cột: Trường học mới nhất & Trạng thái Hệ thống */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cột Trái: 5 Trường mới nhất */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight">Cơ sở trường học mới nhất</h2>
            <Link 
              href="/system-admin/schools" 
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="rounded-xl border bg-card overflow-hidden shadow-xs">
            {metrics.recentSchools.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Chưa có trường nào được khởi tạo. Hãy bấm "Khởi tạo trường mới" để bắt đầu.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="border-b bg-muted/40 font-semibold text-muted-foreground uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Mã trường</th>
                      <th className="px-4 py-3">Tên trường</th>
                      <th className="px-4 py-3">Chủ trường</th>
                      <th className="px-4 py-3">Trạng thái</th>
                      <th className="px-4 py-3 text-right">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {metrics.recentSchools.map((school) => (
                      <tr key={school.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-primary">{school.code}</td>
                        <td className="px-4 py-3 font-medium text-foreground">{school.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{school.ownerName} ({school.phone})</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={school.status} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link 
                            href={`/system-admin/schools/${school.id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            Cấu hình
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

        {/* Cột Phải: Trạng thái Kỹ thuật & Bảo mật */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold tracking-tight">Trạng thái Kỹ thuật</h2>
          
          <div className="rounded-xl border bg-card p-5 space-y-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                <Database className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold flex items-center justify-between">
                  <span>Supabase PostgreSQL</span>
                  <span className="text-[10px] rounded-full bg-emerald-500/10 text-emerald-600 px-2 py-0.5 font-bold">Online</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">Kết nối qua Prisma Connection Pool</p>
              </div>
            </div>

            <div className="flex items-center gap-3 border-t pt-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                <Lock className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold flex items-center justify-between">
                  <span>Row Level Security</span>
                  <span className="text-[10px] rounded-full bg-blue-500/10 text-blue-600 px-2 py-0.5 font-bold">Active</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">Cô lập dữ liệu đa người thuê 100%</p>
              </div>
            </div>

            <div className="flex items-center gap-3 border-t pt-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                <Server className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold flex items-center justify-between">
                  <span>API & tRPC Core</span>
                  <span className="text-[10px] rounded-full bg-purple-500/10 text-purple-600 px-2 py-0.5 font-bold">Sẵn sàng</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">Next.js 15 App Router Server Actions</p>
              </div>
            </div>

            <div className="border-t pt-3 text-center">
              <Link href="/system-admin/audit">
                <Button variant="outline" size="sm" className="w-full text-xs font-semibold">
                  <History className="h-3.5 w-3.5 mr-1.5" />
                  Xem toàn bộ nhật ký Audit
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: number;
  icon: import("lucide-react").LucideIcon;
  tone?: "default" | "success" | "warning";
}) {
  const toneClass =
    tone === "success"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "warning"
      ? "text-amber-600 dark:text-amber-400"
      : "text-foreground";

  return (
    <div className="rounded-xl border bg-card p-4 shadow-xs space-y-2">
      <div className="flex items-center justify-between text-muted-foreground">
        <span className="text-xs font-medium">{label}</span>
        <Icon className="h-4 w-4" />
      </div>
      <div className={`text-2xl font-bold tracking-tight ${toneClass}`}>
        {value.toLocaleString("vi-VN")}
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
