'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  updateSchoolProfileSchema,
  updateSchoolSettingsSchema,
} from '@km/validators/schemas/school-operations';
import { updateSchoolProfileAction, updateSchoolSettingsAction } from '../../actions';
import {
  Settings,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  User,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  CalendarDays,
  Sparkles,
  ShieldCheck,
  Save,
} from 'lucide-react';

interface SchoolData {
  id: string;
  code: string;
  slug: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  taxCode: string | null;
  legalRepresentative: string | null;
  description: string | null;
  setting: {
    currentSchoolYearId: string | null;
    enableAttendance: boolean;
    enableTuition: boolean;
    enableHealth: boolean;
    enableNutrition: boolean;
  } | null;
  schoolYears: Array<{
    id: string;
    name: string;
    isCurrent: boolean;
  }>;
}

export function SettingsClient({ school }: { school: SchoolData }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'profile' | 'advanced'>('profile');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form 1: Thông tin cơ sở
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm({
    resolver: zodResolver(updateSchoolProfileSchema),
    defaultValues: {
      name: school.name,
      phone: school.phone ?? '',
      email: school.email ?? '',
      address: school.address ?? '',
      taxCode: school.taxCode ?? '',
      legalRepresentative: school.legalRepresentative ?? '',
      description: school.description ?? '',
    },
  });

  // Form 2: Cài đặt nâng cao
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [selectedYearId, setSelectedYearId] = useState(school.setting?.currentSchoolYearId ?? '');
  const [flags, setFlags] = useState({
    enableAttendance: school.setting?.enableAttendance ?? true,
    enableTuition: school.setting?.enableTuition ?? true,
    enableHealth: school.setting?.enableHealth ?? true,
    enableNutrition: school.setting?.enableNutrition ?? false,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

type ProfileFormData = z.infer<typeof updateSchoolProfileSchema>;

  const onProfileSubmit = async (data: ProfileFormData) => {
    setIsSavingProfile(true);
    setErrorMessage(null);
    try {
      const res = await updateSchoolProfileAction(school.id, data);
      if (res.success) {
        showToast('Đã lưu thông tin trường học thành công! (Dữ liệu đã đồng bộ 2 chiều)');
        router.refresh();
      } else {
        setErrorMessage(res.error ?? 'Lỗi khi lưu thông tin');
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Lỗi kết nối');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const onAdvancedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setErrorMessage(null);
    try {
      const res = await updateSchoolSettingsAction(school.id, {
        currentSchoolYearId: selectedYearId || null,
        ...flags,
      });
      if (res.success) {
        showToast('Đã cập nhật cấu hình vận hành nâng cao thành công!');
        router.refresh();
      } else {
        setErrorMessage(res.error ?? 'Lỗi khi lưu cấu hình');
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Lỗi kết nối');
    } finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
          <Settings className="h-6 w-6 text-primary" />
          <span>Cài đặt Cơ sở Trường học</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Quản lý thông tin liên hệ và cấu hình vận hành cho trường <strong>{school.name}</strong>.
        </p>
      </div>

      {toastMessage && (
        <div
          id="toast-notification"
          className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2 animate-in fade-in">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border gap-2">
        <button
          id="tab-profile"
          onClick={() => setActiveTab('profile')}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'profile'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Thông tin cơ sở & Liên hệ
        </button>
        <button
          id="tab-advanced"
          onClick={() => setActiveTab('advanced')}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'advanced'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Cấu hình Vận hành Nâng cao
        </button>
      </div>

      {/* Tab 1: Thông tin cơ sở */}
      {activeTab === 'profile' && (
        <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-5">
          <div className="p-6 rounded-2xl border border-border bg-card space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-sm font-bold flex items-center gap-2 text-foreground">
                <Building2 className="h-4 w-4 text-primary" />
                <span>Hồ sơ Trường học & Pháp lý</span>
              </h2>
              <span className="font-mono text-xs bg-muted px-2.5 py-0.5 rounded text-muted-foreground">
                Mã: {school.code}
              </span>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="schoolNameInput" className="text-xs font-semibold text-foreground block">
                Tên cơ sở trường học <span className="text-destructive">*</span>
              </label>
              <input
                id="schoolNameInput"
                className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                {...registerProfile('name')}
              />
              {profileErrors.name && (
                <p className="text-xs text-destructive">{profileErrors.name.message as string}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="schoolPhoneInput" className="text-xs font-semibold text-foreground block">
                  Số điện thoại liên hệ <span className="text-destructive">*</span>
                </label>
                <input
                  id="schoolPhoneInput"
                  className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  {...registerProfile('phone')}
                />
                {profileErrors.phone && (
                  <p className="text-xs text-destructive">{profileErrors.phone.message as string}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="schoolEmailInput" className="text-xs font-semibold text-foreground block">
                  Email nhà trường <span className="text-destructive">*</span>
                </label>
                <input
                  id="schoolEmailInput"
                  type="email"
                  className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  {...registerProfile('email')}
                />
                {profileErrors.email && (
                  <p className="text-xs text-destructive">{profileErrors.email.message as string}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="schoolAddressInput" className="text-xs font-semibold text-foreground block">
                Địa chỉ cơ sở mầm non
              </label>
              <input
                id="schoolAddressInput"
                className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                {...registerProfile('address')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="legalRepInput" className="text-xs font-semibold text-foreground block">
                  Người đại diện pháp luật / Chủ trường
                </label>
                <input
                  id="legalRepInput"
                  className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  {...registerProfile('legalRepresentative')}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="taxCodeInput" className="text-xs font-semibold text-foreground block">
                  Mã số thuế cơ sở
                </label>
                <input
                  id="taxCodeInput"
                  className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  {...registerProfile('taxCode')}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="descInput" className="text-xs font-semibold text-foreground block">
                Giới thiệu ngắn về trường
              </label>
              <textarea
                id="descInput"
                rows={3}
                className="w-full p-3.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                {...registerProfile('description')}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              id="btn-save-profile"
              disabled={isSavingProfile}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-xs hover:bg-primary/90 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSavingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>{isSavingProfile ? 'Đang lưu...' : 'Lưu thông tin cơ sở'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Cài đặt nâng cao */}
      {activeTab === 'advanced' && (
        <form onSubmit={onAdvancedSubmit} className="space-y-5">
          <div className="p-6 rounded-2xl border border-border bg-card space-y-5 shadow-xs">
            <h2 className="text-sm font-bold flex items-center gap-2 border-b pb-3 text-foreground">
              <CalendarDays className="h-4 w-4 text-primary" />
              <span>Năm học Hoạt động Chính thức (Active School Year)</span>
            </h2>

            <div className="space-y-1.5">
              <label htmlFor="activeYearSelect" className="text-xs font-semibold text-foreground block">
                Chọn năm học làm ngữ cảnh mặc định
              </label>
              <select
                id="activeYearSelect"
                value={selectedYearId}
                onChange={(e) => setSelectedYearId(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">-- Chưa thiết lập năm học chính thức --</option>
                {school.schoolYears.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.name} {y.isCurrent ? '(Hiện tại)' : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Tất cả học sinh, lớp học và các chỉ số trên bảng điều khiển sẽ ưu tiên tải theo năm học này.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-border bg-card space-y-4 shadow-xs">
            <h2 className="text-sm font-bold flex items-center gap-2 border-b pb-3 text-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Cấu hình Module Vận hành Nội bộ</span>
            </h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border">
                <div>
                  <span className="text-xs font-bold text-foreground block">Điểm danh & Đón trả QR</span>
                  <span className="text-[11px] text-muted-foreground">Kích hoạt luồng quét mã QR và xác nhận đón trẻ</span>
                </div>
                <input
                  type="checkbox"
                  checked={flags.enableAttendance}
                  onChange={(e) => setFlags({ ...flags, enableAttendance: e.target.checked })}
                  className="h-4 w-4 rounded text-primary"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border">
                <div>
                  <span className="text-xs font-bold text-foreground block">Quản lý Học phí & Hóa đơn</span>
                  <span className="text-[11px] text-muted-foreground">Biểu phí, khoản thu, miễn giảm và xuất hóa đơn</span>
                </div>
                <input
                  type="checkbox"
                  checked={flags.enableTuition}
                  onChange={(e) => setFlags({ ...flags, enableTuition: e.target.checked })}
                  className="h-4 w-4 rounded text-primary"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border">
                <div>
                  <span className="text-xs font-bold text-foreground block">Theo dõi Sức khỏe & BMI WHO</span>
                  <span className="text-[11px] text-muted-foreground">Sổ tiêm chủng và biểu đồ tăng trưởng của trẻ</span>
                </div>
                <input
                  type="checkbox"
                  checked={flags.enableHealth}
                  onChange={(e) => setFlags({ ...flags, enableHealth: e.target.checked })}
                  className="h-4 w-4 rounded text-primary"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border">
                <div>
                  <span className="text-xs font-bold text-foreground block">Dinh dưỡng & Thực đơn Calo</span>
                  <span className="text-[11px] text-muted-foreground">Thực đơn hàng tuần và phiếu tính calo khẩu phần</span>
                </div>
                <input
                  id="toggle-nutrition"
                  type="checkbox"
                  checked={flags.enableNutrition}
                  onChange={(e) => setFlags({ ...flags, enableNutrition: e.target.checked })}
                  className="h-4 w-4 rounded text-primary cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              id="btn-save-advanced"
              disabled={isSavingSettings}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-xs hover:bg-primary/90 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSavingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>{isSavingSettings ? 'Đang lưu...' : 'Lưu cấu hình nâng cao'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
