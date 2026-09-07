'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { NOTIFICATION_TYPE_ICONS, NOTIFICATION_TYPE_LABELS } from '@km/validators';

// Mock data — in production comes from notifications.list
const mockNotifications = [
  {
    id: 'notif-1',
    type: 'NEW_PARENT_REQUEST',
    title: 'Yêu cầu mới từ PH Nguyễn Văn A',
    body: 'Yêu cầu xin nghỉ phép cho bé Minh Anh (3 ngày)',
    isRead: false,
    createdAt: '2026-09-07T08:30:00.000Z',
    linkUrl: '/parent-requests',
  },
  {
    id: 'notif-2',
    type: 'INVOICE_ISSUED',
    title: 'Hóa đơn tháng 9 đã được tạo',
    body: 'HD-2026-09-001 — 3,500,000₫',
    isRead: false,
    createdAt: '2026-09-06T14:00:00.000Z',
    linkUrl: '/tuition',
  },
  {
    id: 'notif-3',
    type: 'HEALTH_RECORD_ADDED',
    title: 'Kết quả sức khỏe mới',
    body: 'Cân đo ngày 05/09 — 15 học sinh',
    isRead: true,
    createdAt: '2026-09-05T10:00:00.000Z',
    linkUrl: '/health',
  },
];

/**
 * NotificationBell component with unread badge and dropdown panel.
 * 
 * react-best-practices: 
 * - Conditional rendering to avoid mounting dropdown when not visible
 * - Click-outside handler for dropdown dismissal
 */
export function NotificationBell({ schoolSlug }: { schoolSlug: string }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Close dropdown on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handler);
    }
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleMarkRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH} giờ trước`;
    const diffD = Math.floor(diffH / 24);
    return `${diffD} ngày trước`;
  };

  return (
    <div ref={ref} className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl hover:bg-muted/80 transition-colors"
        aria-label="Thông báo"
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-background">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel — only rendered when open (react-best-practices: conditional render) */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-card border rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
            <span className="text-sm font-semibold">Thông báo</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-primary hover:underline"
              >
                Đọc tất cả
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Không có thông báo mới
              </div>
            ) : (
              notifications.map((notif) => {
                const icon = NOTIFICATION_TYPE_ICONS[notif.type] || '📌';
                const typeLabel = NOTIFICATION_TYPE_LABELS[notif.type] || notif.type;

                return (
                  <div
                    key={notif.id}
                    className={`px-4 py-3 hover:bg-muted/30 cursor-pointer transition-colors ${
                      !notif.isRead ? 'bg-primary/5' : ''
                    }`}
                    onClick={() => {
                      handleMarkRead(notif.id);
                      // In production: router.push(`/${schoolSlug}${notif.linkUrl}`)
                    }}
                  >
                    <div className="flex gap-3 items-start">
                      <span className="text-lg mt-0.5">{icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm leading-tight ${!notif.isRead ? 'font-semibold' : ''}`}>
                            {notif.title}
                          </p>
                          {!notif.isRead && (
                            <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                          )}
                        </div>
                        {notif.body && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {notif.body}
                          </p>
                        )}
                        <p className="text-[11px] text-muted-foreground/70 mt-1">
                          {typeLabel} · {formatTime(notif.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
