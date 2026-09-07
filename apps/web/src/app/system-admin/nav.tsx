"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  School, 
  Headset, 
  History,
  PlusCircle,
  ExternalLink,
  UserCheck
} from "lucide-react";

export function SystemAdminNav() {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/system-admin",
      label: "Tổng quan",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      href: "/system-admin/schools",
      label: "Trường học",
      icon: School,
      exact: false,
    },
    {
      href: "/system-admin/support",
      label: "Phiên Hỗ trợ",
      icon: Headset,
      exact: false,
    },
    {
      href: "/system-admin/audit",
      label: "Nhật ký Kiểm toán",
      icon: History,
      exact: false,
    },
    {
      href: "/system-admin/profile",
      label: "Thông tin Admin",
      icon: UserCheck,
      exact: false,
    },
  ];

  return (
    <nav className="flex items-center gap-1 sm:gap-2">
      {navItems.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);

        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              isActive
                ? "bg-primary/10 text-primary font-semibold shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Icon className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
