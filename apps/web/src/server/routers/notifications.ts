import { router } from '../trpc';
import { schoolProcedure } from './school-procedure';
import { prisma } from '@km/db';
import {
  listNotificationsSchema,
  markNotificationReadSchema,
} from '@km/validators';

export const notificationRouter = router({
  /**
   * List notifications for current user with cursor pagination.
   * react-best-practices: lightweight query, indexed by recipientId+isRead+createdAt.
   */
  list: schoolProcedure
    .input(listNotificationsSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const schoolId = ctx.user.activeSchoolId!;

      const where: Record<string, unknown> = {
        recipientId: userId,
        schoolId,
      };

      if (input.isRead !== undefined) {
        where.isRead = input.isRead;
      }

      const notifications = await prisma.notification.findMany({
        where: where as Record<string, unknown>,
        orderBy: { createdAt: 'desc' },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
      });

      let nextCursor: string | undefined;
      if (notifications.length > input.limit) {
        const next = notifications.pop();
        nextCursor = next!.id;
      }

      return {
        items: notifications,
        nextCursor,
      };
    }),

  /**
   * Get unread notification count for badge display.
   * Optimized: count-only query, no data transfer.
   */
  unreadCount: schoolProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const schoolId = ctx.user.activeSchoolId!;

    const count = await prisma.notification.count({
      where: {
        recipientId: userId,
        schoolId,
        isRead: false,
      },
    });

    return { count };
  }),

  /**
   * Mark single notification as read.
   */
  markRead: schoolProcedure
    .input(markNotificationReadSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;

      const notification = await prisma.notification.findFirst({
        where: { id: input.id, recipientId: userId },
      });

      if (!notification) return { success: false };

      await prisma.notification.update({
        where: { id: input.id },
        data: { isRead: true, readAt: new Date() },
      });

      return { success: true };
    }),

  /**
   * Mark all notifications as read for current user.
   */
  markAllRead: schoolProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.user.id;
    const schoolId = ctx.user.activeSchoolId!;

    const result = await prisma.notification.updateMany({
      where: {
        recipientId: userId,
        schoolId,
        isRead: false,
      },
      data: { isRead: true, readAt: new Date() },
    });

    return { updated: result.count };
  }),
});
