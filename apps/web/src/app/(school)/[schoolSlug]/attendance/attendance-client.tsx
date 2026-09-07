'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  UserCheck, 
  UserX, 
  ArrowRight, 
  ScanLine, 
  QrCode, 
  Sparkles,
  CalendarCheck,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';

interface ClassStat {
  id: string;
  name: string;
  ageGroup: string;
  homeroomTeacherName: string;
  studentCount: number;
  presentCount: number;
  absentCount: number;
}

interface AttendanceClientProps {
  schoolSlug: string;
  classes: ClassStat[];
}

export function AttendanceClient({ schoolSlug, classes }: AttendanceClientProps) {
  if (classes.length === 0) {
    return (
      <Card className="border-dashed border-2 rounded-3xl mt-6">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center space-y-4">
          <div className="h-16 w-16 rounded-3xl bg-muted/60 flex items-center justify-center text-muted-foreground">
            <Users className="h-8 w-8 opacity-60" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Chưa có lớp học nào</h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1">
              Năm học hiện tại chưa có lớp học nào đang hoạt động để ghi nhận điểm danh.
            </p>
          </div>
          <Link href={`/${schoolSlug}/school-years`}>
            <Button className="rounded-xl text-xs font-bold">Đến trang Quản lý Lớp học</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const totalStudents = classes.reduce((acc, c) => acc + c.studentCount, 0);
  const totalPresent = classes.reduce((acc, c) => acc + c.presentCount, 0);
  const totalAbsent = classes.reduce((acc, c) => acc + c.absentCount, 0);
  const overallRate = totalStudents > 0 ? Math.round((totalPresent / totalStudents) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Overview Attendance Summary Bar */}
      <div className="rounded-3xl border border-primary/20 bg-gradient-to-r from-card via-card to-primary/5 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center font-bold text-xl shadow-xs">
              <CalendarCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base text-foreground">Điểm danh Toàn trường</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                  Thời gian thực
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tổng cộng {classes.length} lớp học • {totalStudents} học sinh chính thức
              </p>
            </div>
          </div>

          {/* Metrics Pill Group */}
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-card border px-3 py-1.5 text-center">
              <span className="text-[10px] text-muted-foreground font-medium block">Tỷ lệ đến lớp</span>
              <span className="text-sm font-extrabold text-emerald-600">{overallRate}%</span>
            </div>
            <div className="rounded-xl bg-card border px-3 py-1.5 text-center">
              <span className="text-[10px] text-muted-foreground font-medium block">Có mặt</span>
              <span className="text-sm font-extrabold text-foreground">{totalPresent}</span>
            </div>
            <div className="rounded-xl bg-card border px-3 py-1.5 text-center">
              <span className="text-[10px] text-muted-foreground font-medium block">Vắng</span>
              <span className="text-sm font-extrabold text-rose-600">{totalAbsent}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Class Cards Grid */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {classes.map((cls) => {
          const attendanceRate = cls.studentCount > 0 
            ? Math.round((cls.presentCount / cls.studentCount) * 100)
            : 0;
          
          return (
            <div 
              key={cls.id} 
              className="flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-5 shadow-xs card-hover"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-foreground">{cls.name}</h3>
                    <span className="text-xs text-muted-foreground">{cls.ageGroup}</span>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {cls.studentCount} Học sinh
                  </span>
                </div>

                <div className="space-y-4 my-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground font-medium">Tỷ lệ chuyên cần</span>
                      <span className="font-extrabold text-foreground">{attendanceRate}%</span>
                    </div>
                    <Progress value={attendanceRate} className="h-2 rounded-full" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-3 flex flex-col items-center justify-center">
                      <div className="flex items-center gap-1.5 text-emerald-600 mb-0.5">
                        <UserCheck className="w-3.5 h-3.5" />
                        <span className="font-bold text-xs">Có mặt</span>
                      </div>
                      <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">{cls.presentCount}</span>
                    </div>
                    <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-3 flex flex-col items-center justify-center">
                      <div className="flex items-center gap-1.5 text-rose-600 mb-0.5">
                        <UserX className="w-3.5 h-3.5" />
                        <span className="font-bold text-xs">Vắng mặt</span>
                      </div>
                      <span className="text-xl font-black text-rose-700 dark:text-rose-400">{cls.absentCount}</span>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    GVCN: <span className="font-bold text-foreground">{cls.homeroomTeacherName || 'Chưa gán'}</span>
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-border/60">
                <Link href={`/${schoolSlug}/attendance/${cls.id}`} className="flex-1">
                  <Button className="w-full gap-1.5 rounded-xl font-bold text-xs py-2 h-9 shadow-xs">
                    <span>Vào điểm danh</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
                <Link href={`/${schoolSlug}/attendance/${cls.id}?tab=qr`}>
                  <Button variant="outline" size="icon" className="rounded-xl h-9 w-9" title="Quét mã QR Check-in">
                    <ScanLine className="w-4 h-4 text-primary" />
                  </Button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
