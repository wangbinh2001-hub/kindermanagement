import { z } from 'zod';

// ── List notifications for current user ──────────────────────────
export const listNotificationsSchema = z.object({
  isRead: z.boolean().optional(),
  cursor: z.string().optional(),
  limit: z.number().min(1).max(50).default(20),
});

export type ListNotificationsInput = z.infer<typeof listNotificationsSchema>;

// ── Mark single notification as read ─────────────────────────────
export const markNotificationReadSchema = z.object({
  id: z.string().min(1),
});

export type MarkNotificationReadInput = z.infer<typeof markNotificationReadSchema>;

// ── Notification type constants ──────────────────────────────────
export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  PARENT_REQUEST_APPROVED: 'Yêu cầu được duyệt',
  PARENT_REQUEST_REJECTED: 'Yêu cầu bị từ chối',
  NEW_PARENT_REQUEST: 'Yêu cầu mới từ phụ huynh',
  INVOICE_ISSUED: 'Hóa đơn mới',
  HEALTH_RECORD_ADDED: 'Kết quả sức khỏe mới',
  MENU_PUBLISHED: 'Thực đơn tuần mới',
  SYSTEM_ANNOUNCEMENT: 'Thông báo hệ thống',
};

export const NOTIFICATION_TYPE_ICONS: Record<string, string> = {
  PARENT_REQUEST_APPROVED: '✅',
  PARENT_REQUEST_REJECTED: '❌',
  NEW_PARENT_REQUEST: '📋',
  INVOICE_ISSUED: '💳',
  HEALTH_RECORD_ADDED: '❤️',
  MENU_PUBLISHED: '🍽️',
  SYSTEM_ANNOUNCEMENT: '📢',
};
