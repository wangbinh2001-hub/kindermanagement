'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Save, CalendarIcon, QrCode, ClipboardList, History, CheckCircle2, ScanLine } from 'lucide-react';
import Link from 'next/link';
import { recordDailyAttendanceAction, scanQrAttendanceAction, calculateOvertimeHours } from '../actions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT_EXCUSED' | 'ABSENT_UNEXCUSED';


interface ClassAttendanceClientProps {
  schoolSlug: string;
  classId: string;
  className: string;
  schoolYearId: string;
  schoolId: string;
  targetDate: string;
  defaultStaffId: string;
  initialTab: string;
  students: Array<{
    studentSchoolRelationshipId: string;
    studentId: string;
    fullName: string;
    avatarUrl: string | null;
    studentCode: string;
  }>;
  initialRecords: Record<string, {
    id: string;
    status: AttendanceStatus;
    checkInTime: string | null;
    checkOutTime: string | null;
    overtimeHours: number;
    method: string;
    notes: string;
    recordedByName: string;
  }>;
  historyMatrix: HistoryMatrixRow[];
  historyDates: string[];
}

export type HistoryMatrixRow = {
  studentId: string;
  studentName: string;
  [date: string]: string | undefined;
};

export interface DailyAttendanceItem {
  status: string;
  checkInTime: string;
  checkOutTime: string;
  notes: string;
}

export function ClassAttendanceClient({
  schoolSlug,
  classId,
  className,
  schoolYearId,
  schoolId,
  targetDate,
  defaultStaffId,
  initialTab,
  students,
  initialRecords,
  historyMatrix,
  historyDates
}: ClassAttendanceClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [date, setDate] = useState(targetDate.split('T')[0]);
  const [isSaving, setIsSaving] = useState(false);
  
  // State cho Daily List
  const [records, setRecords] = useState<Record<string, DailyAttendanceItem>>(
    students.reduce((acc, student) => {
      const existing = initialRecords[student.studentSchoolRelationshipId];
      acc[student.studentSchoolRelationshipId] = {
        status: existing?.status || 'PRESENT',
        checkInTime: existing?.checkInTime ? new Date(existing.checkInTime).toTimeString().substring(0, 5) : '07:30',
        checkOutTime: existing?.checkOutTime ? new Date(existing.checkOutTime).toTimeString().substring(0, 5) : '',
        notes: existing?.notes || '',
      };
      return acc;
    }, {} as Record<string, DailyAttendanceItem>)
  );

  // Xử lý thay đổi ngày (reload trang với tham số date)
  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    router.push(`/${schoolSlug}/attendance/${classId}?date=${newDate}&tab=${activeTab}`);
  };

  // Thay đổi trạng thái điểm danh
  const handleStatusChange = (studentRelId: string, status: string) => {
    setRecords(prev => {
      const current = prev[studentRelId] ?? { status: 'PRESENT', checkInTime: '07:30', checkOutTime: '', notes: '' };
      return {
        ...prev,
        [studentRelId]: {
          status,
          notes: current.notes,
          checkInTime: status === 'PRESENT' || status === 'LATE' ? (current.checkInTime || '07:30') : '',
          checkOutTime: status === 'PRESENT' || status === 'LATE' ? current.checkOutTime : '',
        }
      };
    });
  };

  // Cập nhật thông tin khác (thời gian, ghi chú)
  const handleRecordChange = (studentRelId: string, field: 'checkInTime' | 'checkOutTime' | 'notes', value: string) => {
    setRecords(prev => {
      const current = prev[studentRelId] ?? { status: 'PRESENT', checkInTime: '07:30', checkOutTime: '', notes: '' };
      return {
        ...prev,
        [studentRelId]: {
          ...current,
          [field]: value
        }
      };
    });
  };

  // Lưu điểm danh thủ công
  const handleSaveDaily = async () => {
    setIsSaving(true);
    try {
      const selectedDate = new Date(date || new Date());
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isEditingHistory = selectedDate.getTime() < today.getTime();

      const recordsToSave = Object.keys(records).map(relId => {
        const r = records[relId] ?? { status: 'PRESENT', checkInTime: '', checkOutTime: '', notes: '' };
        
        let checkInDate: Date | null = null;
        let checkOutDate: Date | null = null;

        if (r.status === 'PRESENT' || r.status === 'LATE') {
          if (r.checkInTime) {
            checkInDate = new Date(selectedDate);
            const [h, m] = r.checkInTime.split(':');
            if (h && m) {
              checkInDate.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
            }
          }
          if (r.checkOutTime) {
            checkOutDate = new Date(selectedDate);
            const [h, m] = r.checkOutTime.split(':');
            if (h && m) {
              checkOutDate.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
            }
          }
        }

        return {
          studentSchoolRelationshipId: relId,
          status: r.status as AttendanceStatus,
          checkInTime: checkInDate ? checkInDate.toISOString() : null,
          checkOutTime: checkOutDate ? checkOutDate.toISOString() : null,
          notes: r.notes,
        };
      });

      const res = await recordDailyAttendanceAction({
        schoolId,
        schoolYearId,
        classId,
        date: selectedDate.toISOString(),
        records: recordsToSave,
        recordedById: defaultStaffId,
        isEditingHistory
      });

      if (res.success) {
        toast.success('Lưu điểm danh thành công!');
        router.refresh();
      } else {
        toast.error(res.error || 'Lỗi khi lưu điểm danh');
      }
    } catch (error: unknown) {
      console.error('Client side error in handleSaveDaily:', error);
      const msg = error instanceof Error ? error.message : String(error);
      toast.error(`Lỗi hệ thống: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case 'PRESENT': return 'bg-green-100 text-green-800';
      case 'LATE': return 'bg-yellow-100 text-yellow-800';
      case 'ABSENT_EXCUSED': return 'bg-orange-100 text-orange-800';
      case 'ABSENT_UNEXCUSED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: AttendanceStatus) => {
    switch (status) {
      case 'PRESENT': return 'Có mặt';
      case 'LATE': return 'Đi trễ';
      case 'ABSENT_EXCUSED': return 'Vắng (P)';
      case 'ABSENT_UNEXCUSED': return 'Vắng (KP)';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/${schoolSlug}/attendance`}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Lớp: {className}</h1>
            <p className="text-muted-foreground text-sm">Quản lý điểm danh và đón trả</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => {
        setActiveTab(val);
        router.push(`/${schoolSlug}/attendance/${classId}?date=${date}&tab=${val}`);
      }}>
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="daily" className="gap-2">
            <ClipboardList className="h-4 w-4" /> Điểm danh Ngày
          </TabsTrigger>
          <TabsTrigger value="qr" className="gap-2">
            <QrCode className="h-4 w-4" /> Quét QR Code
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" /> Ma trận Lịch sử
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: DAILY LIST */}
        <TabsContent value="daily" className="space-y-6 mt-0">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Danh sách lớp</CardTitle>
                  <CardDescription>Cập nhật tình trạng điểm danh thủ công</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="date" 
                      value={date} 
                      onChange={(e) => handleDateChange(e.target.value)} 
                      className="w-[150px]"
                    />
                  </div>
                  <Button onClick={handleSaveDaily} disabled={isSaving} className="gap-2">
                    <Save className="h-4 w-4" /> {isSaving ? 'Đang lưu...' : 'Lưu điểm danh'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="p-3 font-medium w-[250px]">Học sinh</th>
                      <th className="p-3 font-medium w-[180px]">Trạng thái</th>
                      <th className="p-3 font-medium">Vào lớp</th>
                      <th className="p-3 font-medium">Đón về</th>
                      <th className="p-3 font-medium">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {students.map(st => {
                      const rec = records[st.studentSchoolRelationshipId] ?? { status: 'PRESENT', checkInTime: '07:30', checkOutTime: '', notes: '' };
                      return (
                        <tr key={st.studentSchoolRelationshipId} className="hover:bg-muted/30">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={st.avatarUrl || ''} />
                                <AvatarFallback>{st.fullName.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{st.fullName}</div>
                                <div className="text-xs text-muted-foreground">{st.studentCode}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <Select 
                              value={rec.status} 
                              onValueChange={(val) => handleStatusChange(st.studentSchoolRelationshipId, val)}
                            >
                              <SelectTrigger className={`h-8 text-xs font-semibold border-0 ${getStatusColor(rec.status as AttendanceStatus)}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="PRESENT">Có mặt</SelectItem>
                                <SelectItem value="LATE">Đi trễ</SelectItem>
                                <SelectItem value="ABSENT_EXCUSED">Vắng có phép</SelectItem>
                                <SelectItem value="ABSENT_UNEXCUSED">Vắng không phép</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-3">
                            <Input 
                              type="time" 
                              value={rec.checkInTime} 
                              onChange={(e) => handleRecordChange(st.studentSchoolRelationshipId, 'checkInTime', e.target.value)}
                              disabled={rec.status === 'ABSENT_EXCUSED' || rec.status === 'ABSENT_UNEXCUSED'}
                              className="h-8 w-[100px]"
                            />
                          </td>
                          <td className="p-3">
                            <Input 
                              type="time" 
                              value={rec.checkOutTime} 
                              onChange={(e) => handleRecordChange(st.studentSchoolRelationshipId, 'checkOutTime', e.target.value)}
                              disabled={rec.status === 'ABSENT_EXCUSED' || rec.status === 'ABSENT_UNEXCUSED'}
                              className="h-8 w-[100px]"
                            />
                          </td>
                          <td className="p-3">
                            <Input 
                              value={rec.notes} 
                              onChange={(e) => handleRecordChange(st.studentSchoolRelationshipId, 'notes', e.target.value)}
                              placeholder="Ghi chú..."
                              className="h-8 min-w-[150px]"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: QR SCANNER (MOCK) */}
        <TabsContent value="qr" className="space-y-6 mt-0">
          <Card>
            <CardHeader className="text-center pb-2">
              <CardTitle>Quét mã QR Phụ huynh</CardTitle>
              <CardDescription>Mô phỏng máy quét mã QR tại cổng trường hoặc trong lớp</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="w-[300px] h-[300px] border-4 border-dashed rounded-xl flex flex-col items-center justify-center bg-muted/20 mb-8 relative overflow-hidden group">
                <ScanLine className="w-20 h-20 text-primary/50 group-hover:text-primary transition-colors" />
                <p className="mt-4 text-sm text-muted-foreground font-medium">Đưa mã QR vào khung hình</p>
                
                {/* Giả lập đường quét */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-primary animate-[scan_2s_ease-in-out_infinite]" />
              </div>
              
              <div className="w-full max-w-md space-y-4">
                <div className="text-sm font-semibold mb-2">Giả lập Quét QR (Dành cho Tester):</div>
                <div className="flex gap-2" id="demo-student">
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn học sinh để quét..." />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map(st => (
                        <SelectItem key={st.studentSchoolRelationshipId} value={st.studentSchoolRelationshipId}>
                          {st.fullName} ({st.studentCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-3">
                  <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    onClick={async () => {
                      // Lấy value từ component select của Radix UI khá khó nếu không dùng state.
                      // Để đơn giản, giả lập random sinh viên đầu tiên
                      const relId = students[0]?.studentSchoolRelationshipId;
                      if (!relId) return;
                      toast.promise(
                        scanQrAttendanceAction({
                          schoolId, schoolYearId, classId,
                          studentSchoolRelationshipId: relId,
                          type: 'CHECK_IN',
                          recordedById: defaultStaffId
                        }).then(res => {
                          if (!res.success) throw new Error(res.error || 'Lỗi');
                          return res;
                        }),
                        {
                          loading: 'Đang xử lý...',
                          success: () => {
                            router.refresh();
                            return `Đã CHECK-IN cho ${students[0]?.fullName || 'học sinh'}`;
                          },
                          error: (err) => err.message || 'Lỗi khi Check-in'
                        }
                      );
                    }}
                  >
                    Mô phỏng Check-IN
                  </Button>
                  <Button 
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={async () => {
                      const relId = students[0]?.studentSchoolRelationshipId;
                      if (!relId) return;
                      toast.promise(
                        scanQrAttendanceAction({
                          schoolId, schoolYearId, classId,
                          studentSchoolRelationshipId: relId,
                          type: 'CHECK_OUT',
                          recordedById: defaultStaffId
                        }).then(res => {
                          if (!res.success) throw new Error(res.error || 'Lỗi');
                          return res;
                        }),
                        {
                          loading: 'Đang xử lý...',
                          success: () => {
                            router.refresh();
                            return `Đã CHECK-OUT cho ${students[0]?.fullName || 'học sinh'}`;
                          },
                          error: (err) => err.message || 'Lỗi khi Check-out'
                        }
                      );
                    }}
                  >
                    Mô phỏng Check-OUT
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: HISTORY MATRIX */}
        <TabsContent value="history" className="space-y-6 mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Ma trận điểm danh (30 ngày gần nhất)</CardTitle>
              <CardDescription>Lịch sử đi học của lớp</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto border rounded-md max-h-[500px]">
                <table className="w-full text-xs text-center border-collapse">
                  <thead className="bg-muted/50 sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="p-2 border text-left min-w-[150px] sticky left-0 bg-muted/95 backdrop-blur z-20">Học sinh</th>
                      {historyDates.map(d => {
                        const dateObj = new Date(d);
                        const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
                        return (
                          <th key={d} className={`p-2 border min-w-[40px] ${isWeekend ? 'bg-red-50 text-red-600' : ''}`}>
                            {dateObj.getDate()}/{dateObj.getMonth() + 1}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {historyMatrix.map(row => (
                      <tr key={row.studentId} className="hover:bg-muted/30">
                        <td className="p-2 border text-left font-medium sticky left-0 bg-background z-10 truncate max-w-[150px]">
                          {row.studentName}
                        </td>
                        {historyDates.map(d => {
                          const status = row[d];
                          let cellClass = "";
                          let cellContent = "-";
                          
                          if (status === 'PRESENT') { cellClass = "bg-green-100 text-green-700 font-bold"; cellContent = "V"; }
                          else if (status === 'LATE') { cellClass = "bg-yellow-100 text-yellow-700 font-bold"; cellContent = "T"; }
                          else if (status === 'ABSENT_EXCUSED') { cellClass = "bg-orange-100 text-orange-700 font-bold"; cellContent = "P"; }
                          else if (status === 'ABSENT_UNEXCUSED') { cellClass = "bg-red-100 text-red-700 font-bold"; cellContent = "K"; }

                          return (
                            <td key={d} className={`p-1 border ${cellClass}`}>
                              {cellContent}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex gap-6 text-sm text-muted-foreground justify-center">
                <div className="flex items-center gap-1.5"><span className="w-4 h-4 bg-green-100 flex items-center justify-center text-green-700 font-bold text-[10px] rounded">V</span> Có mặt</div>
                <div className="flex items-center gap-1.5"><span className="w-4 h-4 bg-yellow-100 flex items-center justify-center text-yellow-700 font-bold text-[10px] rounded">T</span> Đi trễ</div>
                <div className="flex items-center gap-1.5"><span className="w-4 h-4 bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-[10px] rounded">P</span> Vắng có phép</div>
                <div className="flex items-center gap-1.5"><span className="w-4 h-4 bg-red-100 flex items-center justify-center text-red-700 font-bold text-[10px] rounded">K</span> Vắng không phép</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
