import { getSystemAdminProfileAction } from "../actions";
import { ProfileClient } from "./profile-client";

export const metadata = {
  title: "Thông tin Quản trị viên | KinderManagement",
  description: "Quản lý thông tin tài khoản và đổi mật khẩu System Administrator",
};

export default async function SystemAdminProfilePage() {
  const res = await getSystemAdminProfileAction();

  const initialProfile = res.success && res.data
    ? res.data
    : {
        id: "admin-root",
        email: "admin@kindermanagement.edu.vn",
        fullName: "Quản trị viên Hệ thống (System Admin)",
        phone: "0901234567",
        role: "SYSTEM_ADMIN",
        createdAt: new Date().toISOString(),
        lastSignInAt: null,
      };

  return <ProfileClient initialProfile={initialProfile} />;
}
