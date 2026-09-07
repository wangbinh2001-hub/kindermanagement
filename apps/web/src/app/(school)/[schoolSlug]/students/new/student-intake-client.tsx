"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input } from "@km/ui";
import { 
  ArrowLeft, 
  UserPlus, 
  User, 
  Users, 
  GraduationCap, 
  ShieldCheck, 
  Sparkles, 
  AlertTriangle,
  Loader2,
  Calendar,
  Phone,
  Home,
  FileText,
  HeartHandshake,
} from "lucide-react";
import { enrollStudentAction } from "../../../students/actions";

interface StudentIntakeClientProps {
  schoolId: string;
  schoolSlug: string;
  schoolYears: Array<{ id: string; name: string; isCurrent: boolean }>;
  classes: Array<{ id: string; name: string; ageGroup: string; capacity: number }>;
  currentYearId?: string;
}

export function StudentIntakeClient({
  schoolId,
  schoolSlug,
  schoolYears,
  classes,
  currentYearId,
}: StudentIntakeClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Bước 1: Học sinh
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "OTHER">("MALE");
  const [dateOfBirth, setDateOfBirth] = useState("2022-01-15");
  const [cccd, setCccd] = useState("");
  const [personalIdNumber, setPersonalIdNumber] = useState("");
  const [phoneContact, setPhoneContact] = useState("");

  // Địa chỉ thường trú & tạm trú
  const [permanentProvince, setPermanentProvince] = useState("Hà Nội");
  const [permanentDistrict, setPermanentDistrict] = useState("Cầu Giấy");
  const [permanentWard, setPermanentWard] = useState("Dịch Vọng");
  const [permanentDetail, setPermanentDetail] = useState("Số 12 ngõ 45");

  const [currentProvince, setCurrentProvince] = useState("Hà Nội");
  const [currentDistrict, setCurrentDistrict] = useState("Cầu Giấy");
  const [currentWard, setCurrentWard] = useState("Dịch Vọng");
  const [currentDetail, setCurrentDetail] = useState("Số 12 ngõ 45");

  // Bước 2: Phụ huynh / Người giám hộ
  const [fatherName, setFatherName] = useState("");
  const [fatherYear, setFatherYear] = useState(1990);
  const [fatherPhone, setFatherPhone] = useState("");
  const [fatherOccupation, setFatherOccupation] = useState("Kỹ sư");

  const [motherName, setMotherName] = useState("");
  const [motherYear, setMotherYear] = useState(1992);
  const [motherPhone, setMotherPhone] = useState("");
  const [motherOccupation, setMotherOccupation] = useState("Giáo viên");

  // Bước 3: Phân lớp & Năm học
  const defaultYearId = currentYearId || schoolYears[0]?.id || "";
  const [schoolYearId, setSchoolYearId] = useState(defaultYearId);
  const [initialClassId, setInitialClassId] = useState(classes[0]?.id || "");
  const [enrolledAt, setEnrolledAt] = useState(new Date().toISOString().split("T")[0]);

  // Bước 4: Chính sách
  const [policyObject, setPolicyObject] = useState("");
  const [tuitionExempt, setTuitionExempt] = useState(false);
  const [tuitionReduced, setTuitionReduced] = useState(false);
  const [studyCostSupport, setStudyCostSupport] = useState(false);
  const [lunchSupport, setLunchSupport] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!lastName.trim() || !firstName.trim()) {
      setErrorMessage("Vui lòng nhập đầy đủ Họ và Tên của trẻ.");
      return;
    }

    if (!fatherPhone.trim() && !motherPhone.trim()) {
      setErrorMessage("Vui lòng nhập ít nhất một số điện thoại liên hệ của Cha hoặc Mẹ.");
      return;
    }

    const responsiblePersons = [];
    if (fatherName.trim() || fatherPhone.trim()) {
      responsiblePersons.push({
        type: "FATHER" as const,
        fullName: fatherName.trim() || "Cha học sinh",
        yearOfBirth: Number(fatherYear) || 1990,
        phone: fatherPhone.trim() || undefined,
        occupation: fatherOccupation.trim() || undefined,
        noInfo: false,
      });
    }

    if (motherName.trim() || motherPhone.trim()) {
      responsiblePersons.push({
        type: "MOTHER" as const,
        fullName: motherName.trim() || "Mẹ học sinh",
        yearOfBirth: Number(motherYear) || 1992,
        phone: motherPhone.trim() || undefined,
        occupation: motherOccupation.trim() || undefined,
        noInfo: false,
      });
    }

    const payload = {
      lastName: lastName.trim(),
      middleName: middleName.trim() || undefined,
      firstName: firstName.trim(),
      gender,
      dateOfBirth: new Date(dateOfBirth),
      cccd: cccd.trim() || undefined,
      personalIdNumber: personalIdNumber.trim() || undefined,
      permanentAddressProvince: permanentProvince.trim() || undefined,
      permanentAddressDistrict: permanentDistrict.trim() || undefined,
      permanentAddressWard: permanentWard.trim() || undefined,
      permanentAddressDetail: permanentDetail.trim() || undefined,
      currentAddressProvince: currentProvince.trim() || undefined,
      currentAddressDistrict: currentDistrict.trim() || undefined,
      currentAddressWard: currentWard.trim() || undefined,
      currentAddressDetail: currentDetail.trim() || undefined,
      phoneContact: phoneContact.trim() || fatherPhone.trim() || motherPhone.trim() || undefined,
      idempotencyKey: `ENROLL-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      schoolYearId,
      initialClassId: initialClassId || undefined,
      enrolledAt: new Date(enrolledAt || new Date()),
      responsiblePersons,
      policyObject: policyObject.trim() || undefined,
      tuitionExempt,
      tuitionReduced,
      studyCostSupport,
      lunchSupport,
    };

    startTransition(async () => {
      const res = await enrollStudentAction(schoolId, payload);
      if (res.success && res.data) {
        router.push(`/${schoolSlug}/students/${res.data.relationshipId}`);
      } else {
        setErrorMessage(res.error ?? "Lỗi khi lưu hồ sơ học sinh");
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Quay lại & Tiêu đề */}
      <div>
        <Link
          href={`/${schoolSlug}/students`}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors font-medium mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Quay lại Danh sách học sinh</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Tiếp nhận Hồ sơ Học sinh Mới
            </h1>
            <p className="text-xs text-muted-foreground">
              Số hóa hồ sơ nhân thân, gia đình và phân lớp ban đầu theo đúng tiêu chuẩn giáo dục mầm non.
            </p>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive flex items-center gap-2.5 animate-in fade-in">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Phần 1: Thông tin học sinh */}
        <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-5">
          <div className="border-b pb-3 flex items-center gap-2 text-foreground font-bold text-base">
            <User className="h-4 w-4 text-primary" />
            <span>1. Thông tin Nhân thân Trẻ</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="studentLastName" className="text-xs font-semibold text-foreground">
                Họ và tên đệm <span className="text-destructive">*</span>
              </label>
              <Input
                id="studentLastName"
                placeholder="Ví dụ: Nguyễn"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="studentMiddleName" className="text-xs font-semibold text-foreground">
                Tên đệm (Tùy chọn)
              </label>
              <Input
                id="studentMiddleName"
                placeholder="Ví dụ: Văn"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="studentFirstName" className="text-xs font-semibold text-foreground">
                Tên chính <span className="text-destructive">*</span>
              </label>
              <Input
                id="studentFirstName"
                placeholder="Ví dụ: An"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="studentGender" className="text-xs font-semibold text-foreground">
                Giới tính <span className="text-destructive">*</span>
              </label>
              <select
                id="studentGender"
                value={gender}
                onChange={(e) => setGender(e.target.value as "MALE" | "FEMALE" | "OTHER")}
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
              >
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
                <option value="OTHER">Khác</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="studentDob" className="text-xs font-semibold text-foreground">
                Ngày sinh <span className="text-destructive">*</span>
              </label>
              <Input
                id="studentDob"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="studentCccd" className="text-xs font-semibold text-foreground">
                Mã định danh cá nhân / CCCD (12 số)
              </label>
              <Input
                id="studentCccd"
                placeholder="12 chữ số định danh"
                value={cccd}
                onChange={(e) => setCccd(e.target.value)}
              />
            </div>
          </div>

          {/* Địa chỉ */}
          <div className="pt-2 border-t space-y-3">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Home className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Nơi ở hiện tại / Địa chỉ liên hệ</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                placeholder="Tỉnh / Thành phố"
                value={currentProvince}
                onChange={(e) => setCurrentProvince(e.target.value)}
              />
              <Input
                placeholder="Quận / Huyện"
                value={currentDistrict}
                onChange={(e) => setCurrentDistrict(e.target.value)}
              />
              <Input
                placeholder="Phường / Xã"
                value={currentWard}
                onChange={(e) => setCurrentWard(e.target.value)}
              />
            </div>
            <Input
              placeholder="Địa chỉ chi tiết (Số nhà, ngõ, tên đường...)"
              value={currentDetail}
              onChange={(e) => setCurrentDetail(e.target.value)}
            />
          </div>
        </div>

        {/* Phần 2: Người giám hộ */}
        <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-5">
          <div className="border-b pb-3 flex items-center gap-2 text-foreground font-bold text-base">
            <Users className="h-4 w-4 text-primary" />
            <span>2. Người Chịu trách nhiệm / Phụ huynh</span>
          </div>

          {/* Cha */}
          <div className="space-y-3 p-4 rounded-xl bg-muted/20 border">
            <span className="text-xs font-bold text-foreground flex items-center gap-1">
              <span>Thông tin Cha</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <Input
                  id="fatherName"
                  placeholder="Họ tên Cha"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                />
              </div>
              <Input
                id="fatherPhone"
                placeholder="Số điện thoại (09...)"
                value={fatherPhone}
                onChange={(e) => setFatherPhone(e.target.value)}
              />
              <Input
                id="fatherOccupation"
                placeholder="Nghề nghiệp"
                value={fatherOccupation}
                onChange={(e) => setFatherOccupation(e.target.value)}
              />
            </div>
          </div>

          {/* Mẹ */}
          <div className="space-y-3 p-4 rounded-xl bg-muted/20 border">
            <span className="text-xs font-bold text-foreground flex items-center gap-1">
              <span>Thông tin Mẹ</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <Input
                  id="motherName"
                  placeholder="Họ tên Mẹ"
                  value={motherName}
                  onChange={(e) => setMotherName(e.target.value)}
                />
              </div>
              <Input
                id="motherPhone"
                placeholder="Số điện thoại (09...)"
                value={motherPhone}
                onChange={(e) => setMotherPhone(e.target.value)}
              />
              <Input
                id="motherOccupation"
                placeholder="Nghề nghiệp"
                value={motherOccupation}
                onChange={(e) => setMotherOccupation(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Phần 3: Phân lớp & Nhập học */}
        <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-5">
          <div className="border-b pb-3 flex items-center gap-2 text-foreground font-bold text-base">
            <GraduationCap className="h-4 w-4 text-primary" />
            <span>3. Năm học & Xếp lớp Ban đầu</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="schoolYearSelect" className="text-xs font-semibold text-foreground">
                Năm học tiếp nhận <span className="text-destructive">*</span>
              </label>
              <select
                id="schoolYearSelect"
                value={schoolYearId}
                onChange={(e) => setSchoolYearId(e.target.value)}
                required
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
              >
                {schoolYears.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.name} {y.isCurrent ? "(Hiện tại)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="classSelect" className="text-xs font-semibold text-foreground">
                Lớp học ban đầu (Tùy chọn)
              </label>
              <select
                id="classSelect"
                value={initialClassId}
                onChange={(e) => setInitialClassId(e.target.value)}
                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-xs font-medium text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
              >
                <option value="">-- Chưa xếp lớp ngay --</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    Lớp {c.name} (Sĩ số {c.capacity})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="enrolledAt" className="text-xs font-semibold text-foreground">
                Ngày nhập học <span className="text-destructive">*</span>
              </label>
              <Input
                id="enrolledAt"
                type="date"
                value={enrolledAt}
                onChange={(e) => setEnrolledAt(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* Phần 4: Chính sách & Miễn giảm */}
        <div className="rounded-2xl border bg-card p-6 shadow-xs space-y-5">
          <div className="border-b pb-3 flex items-center gap-2 text-foreground font-bold text-base">
            <HeartHandshake className="h-4 w-4 text-primary" />
            <span>4. Chế độ Chính sách & Miễn giảm</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-start gap-3 p-3.5 rounded-xl border bg-muted/20 cursor-pointer">
              <input
                type="checkbox"
                checked={tuitionExempt}
                onChange={(e) => setTuitionExempt(e.target.checked)}
                className="h-4 w-4 rounded border-input text-primary focus:ring-primary mt-0.5"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-foreground block">Miễn 100% học phí</span>
                <span className="text-[11px] text-muted-foreground block">
                  Thuộc diện chính sách gia đình có công hoặc hoàn cảnh đặc biệt.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3.5 rounded-xl border bg-muted/20 cursor-pointer">
              <input
                type="checkbox"
                checked={lunchSupport}
                onChange={(e) => setLunchSupport(e.target.checked)}
                className="h-4 w-4 rounded border-input text-primary focus:ring-primary mt-0.5"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-foreground block">Hỗ trợ tiền ăn trưa</span>
                <span className="text-[11px] text-muted-foreground block">
                  Áp dụng trợ cấp bữa ăn theo quy chuẩn của Nhà nước.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Nút Submit */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Link href={`/${schoolSlug}/students`}>
            <Button type="button" variant="outline" disabled={isPending}>
              Hủy bỏ
            </Button>
          </Link>
          <Button
            type="submit"
            id="btn-submit-enrollment"
            disabled={isPending}
            className="h-11 px-8 font-semibold shadow-xs"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Đang xử lý hồ sơ...</span>
              </span>
            ) : (
              "Hoàn tất Tiếp nhận Học sinh"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
