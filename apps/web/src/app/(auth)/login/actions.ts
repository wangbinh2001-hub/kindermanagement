'use server';

import { cookies } from 'next/headers';
import { prisma } from '@km/db';
import { supabaseAdmin } from '@km/auth';

export async function loginAction(formData: { identifier?: string; password?: string }) {
  try {
    const trimmedId = (formData?.identifier || '').trim();
    const trimmedPassword = (formData?.password || '').trim();

    if (!trimmedId || !trimmedPassword) {
      return {
        success: false,
        error: 'Vui lòng nhập đầy đủ tài khoản và mật khẩu.',
      };
    }

    // 1. Special handling for System Admin default / quick credentials
    const isAdminIdentifier = 
      trimmedId.toLowerCase() === 'admin' || 
      trimmedId.toLowerCase() === 'admin@kindermanagement.edu.vn';

    if (isAdminIdentifier && (trimmedPassword === 'admin' || trimmedPassword === 'Admin@Kinder2026!')) {
      try {
        const cookieStore = await cookies();
        cookieStore.set('km_role', 'SYSTEM_ADMIN', { path: '/', httpOnly: true, sameSite: 'lax' });
      } catch {
        // Ignore cookie errors
      }
      return { success: true, role: 'SYSTEM_ADMIN' as const, schoolSlug: null };
    }

    // 2. Tra cứu linh hoạt địa chỉ Email thực tế theo: Email, Username, Phone, hoặc Mã trường (School Code)
    let emailToAuth: string = trimmedId;

    if (!trimmedId.includes('@')) {
      try {
        // 2a. Tra cứu theo Mã trường (ví dụ SCH-2026-0001)
        const schoolByCode = await prisma.school.findFirst({
          where: { code: { equals: trimmedId, mode: 'insensitive' }, deletedAt: null },
          include: { adminAccounts: { where: { deletedAt: null }, take: 1 } },
        });
        if (schoolByCode && schoolByCode.adminAccounts[0]) {
          const { data: userData } = await supabaseAdmin.auth.admin.getUserById(schoolByCode.adminAccounts[0].userId);
          if (userData?.user?.email) {
            emailToAuth = userData.user.email;
          }
        }

        // 2b. Tra cứu theo Số điện thoại trường học
        if (!emailToAuth.includes('@')) {
          const schoolByPhone = await prisma.school.findFirst({
            where: { phone: trimmedId, deletedAt: null },
            include: { adminAccounts: { where: { deletedAt: null }, take: 1 } },
          });
          if (schoolByPhone && schoolByPhone.adminAccounts[0]) {
            const { data: userData } = await supabaseAdmin.auth.admin.getUserById(schoolByPhone.adminAccounts[0].userId);
            if (userData?.user?.email) {
              emailToAuth = userData.user.email;
            }
          }
        }

        // 2c. Tra cứu theo Số điện thoại Giáo viên / Nhân sự
        if (!emailToAuth.includes('@')) {
          const staffByPhone = await prisma.staffMember.findFirst({
            where: { phone: trimmedId, deletedAt: null },
          });
          if (staffByPhone?.userId) {
            const { data: userData } = await supabaseAdmin.auth.admin.getUserById(staffByPhone.userId);
            if (userData?.user?.email) {
              emailToAuth = userData.user.email;
            }
          }
        }

        // 2d. Tra cứu theo Username hoặc Metadata trong Supabase Auth
        if (!emailToAuth.includes('@')) {
          const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
          const matchedUser = listData?.users?.find((u) => {
            const meta = u.user_metadata as Record<string, unknown> | undefined;
            const username = (meta?.username as string) || '';
            const phone = (meta?.phone as string) || u.phone || '';
            const schoolCode = (meta?.school_code as string) || '';
            return (
              username.toLowerCase() === trimmedId.toLowerCase() ||
              phone === trimmedId ||
              schoolCode.toLowerCase() === trimmedId.toLowerCase()
            );
          });
          if (matchedUser?.email) {
            emailToAuth = matchedUser.email;
          }
        }

        // 2e. Fallback nếu vẫn không tìm thấy
        if (!emailToAuth.includes('@')) {
          emailToAuth = `${trimmedId}@kindermanagement.edu.vn`;
        }
      } catch {
        emailToAuth = `${trimmedId}@kindermanagement.edu.vn`;
      }
    }

    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pnxbefvojdkywabzvjga.supabase.co';
    const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_MhclGed1gRogJuPt8Dk6Nw_3byM3hoh';

    let authPassword = trimmedPassword;
    if (
      (trimmedId.toLowerCase() === 'admin' || emailToAuth === 'admin@kindermanagement.edu.vn') &&
      trimmedPassword.toLowerCase() === 'admin'
    ) {
      authPassword = 'Admin@Kinder2026!';
    }

    let res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: emailToAuth,
        password: authPassword,
      }),
    });

    if (!res.ok && authPassword !== trimmedPassword) {
      res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          apikey: anonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailToAuth,
          password: trimmedPassword,
        }),
      });
    }

    const json = (await res.json()) as {
      access_token?: string;
      user?: {
        id: string;
        email?: string;
        app_metadata?: {
          role?: 'SYSTEM_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'PARENT';
        };
      };
      error_description?: string;
      msg?: string;
    };

    if (!res.ok || !json.user) {
      return { 
        success: false, 
        error: json.error_description || json.msg || 'Tài khoản hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.' 
      };
    }

    const authUser = json.user;
    let role = authUser.app_metadata?.role as 'SYSTEM_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'PARENT' | undefined;
    let schoolSlug: string | null = null;
    let schoolId: string | null = null;

    // 3. Truy vấn chính xác Cơ sở Trường học được phân quyền
    if (authUser.id) {
      // 3a. Kiểm tra vai trò SchoolAdmin
      const schoolAdmin = await prisma.schoolAdmin.findFirst({
        where: { userId: authUser.id, deletedAt: null },
        include: { school: true },
      });
      if (schoolAdmin?.school) {
        role = role ?? 'SCHOOL_ADMIN';
        schoolSlug = schoolAdmin.school.slug;
        schoolId = schoolAdmin.school.id;
      }

      // 3b. Kiểm tra vai trò StaffMember / Teacher
      if (!schoolSlug) {
        const staff = await prisma.staffMember.findFirst({
          where: { userId: authUser.id, deletedAt: null },
          include: { school: true },
        });
        if (staff?.school) {
          role = role ?? (staff.roles.includes('TEACHER') ? 'TEACHER' : 'SCHOOL_ADMIN');
          schoolSlug = staff.school.slug;
          schoolId = staff.school.id;
        }
      }
    }

    role = role ?? 'SYSTEM_ADMIN';

    // 4. Đồng bộ Cookies an toàn để duy trì phiên làm việc cho Server Components
    try {
      const cookieStore = await cookies();
      if (json.access_token) {
        cookieStore.set('km_token', json.access_token, { path: '/', httpOnly: true, sameSite: 'lax' });
      }
      cookieStore.set('km_role', role, { path: '/', httpOnly: true, sameSite: 'lax' });
      if (schoolSlug) {
        cookieStore.set('km_school_slug', schoolSlug, { path: '/', httpOnly: true, sameSite: 'lax' });
      }
      if (schoolId) {
        cookieStore.set('km_school_id', schoolId, { path: '/', httpOnly: true, sameSite: 'lax' });
      }
    } catch {
      // Ignore cookie errors
    }

    return { 
      success: true, 
      role,
      schoolSlug,
    };
  } catch (error) {
    console.error('Unhandled login error:', error);
    return { 
      success: false, 
      error: 'Đã xảy ra lỗi trong quá trình kết nối máy chủ xác thực.' 
    };
  }
}
