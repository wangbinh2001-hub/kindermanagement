import { router } from './trpc';
import { systemAdminRouter } from './routers/system-admin';
import { schoolOperationsRouter } from './routers/school-operations';
import { studentRouter } from './routers/students';
import { staffRouter } from './routers/staff';
import { attendanceRouter } from './routers/attendance';
import { tuitionRouter } from './routers/tuition';
import { healthRouter } from './routers/health';
import { nutritionRouter } from './routers/nutrition';
import { authRouter } from './routers/auth';
import { parentPortalRouter } from './routers/parent-portal';
import { parentRequestRouter } from './routers/parent-requests';
import { auditLogRouter } from './routers/audit-log';
import { notificationRouter } from './routers/notifications';

export const appRouter = router({
  auth: authRouter,
  systemAdmin: systemAdminRouter,
  schoolOps: schoolOperationsRouter,
  students: studentRouter,
  staff: staffRouter,
  attendance: attendanceRouter,
  tuition: tuitionRouter,
  health: healthRouter,
  nutrition: nutritionRouter,
  parentPortal: parentPortalRouter,
  parentRequests: parentRequestRouter,
  auditLog: auditLogRouter,
  notifications: notificationRouter,
});

export type AppRouter = typeof appRouter;