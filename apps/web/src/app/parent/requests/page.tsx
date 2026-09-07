'use client';

import { useState } from 'react';
import {
  PARENT_REQUEST_TYPE_LABELS,
  PARENT_REQUEST_STATUS_LABELS,
  PARENT_REQUEST_STATUS_COLORS,
} from '@km/validators';
import type { ParentRequestType, ParentRequestStatus } from '@km/validators';
import { 
  ClipboardList, 
  Plus, 
  Calendar, 
  Clock, 
  UserCheck, 
  FileText, 
  CheckCircle2, 
  X,
  Send,
  Sparkles,
  AlertCircle,
  type LucideIcon
} from 'lucide-react';

const REQUEST_TYPES: Array<{ type: ParentRequestType; label: string; icon: LucideIcon; desc: string }> = [
  { type: 'ABSENCE_LEAVE', label: 'Xin nghỉ học', icon: Calendar, desc: 'Báo nghỉ ốm, việc bận' },
  { type: 'MEDICATION_INSTRUCTION', label: 'Dặn thuốc', icon: Plus, desc: 'Thuốc uống & liều lượng' },
  { type: 'LATE_PICKUP', label: 'Đón muộn', icon: Clock, desc: 'Thông báo đón sau 17:30' },
  { type: 'PICKUP_AUTHORIZATION', label: 'Người đón hộ', icon: UserCheck, desc: 'Ủy quyền người thân đón' },
  { type: 'CHILD_CONDITION_NOTE', label: 'Lưu ý sức khỏe', icon: AlertCircle, desc: 'Dị ứng, thể trạng đặc biệt' },
  { type: 'OTHER_REQUEST', label: 'Yêu cầu khác', icon: FileText, desc: 'Ý kiến trao đổi với trường' },
];

const mockRequests = [
  {
    id: 'req-1',
    type: 'ABSENCE_LEAVE' as ParentRequestType,
    title: 'Xin nghỉ học ngày 10-11/9',
    status: 'PENDING' as ParentRequestStatus,
    createdAt: '2026-09-06T10:00:00.000Z',
    description: 'Con bị sốt siêu vi, gia đình xin phép cho bé nghỉ 2 ngày để chăm sóc tại nhà.',
    teacherNote: null,
  },
  {
    id: 'req-2',
    type: 'MEDICATION_INSTRUCTION' as ParentRequestType,
    title: 'Dặn thuốc ho bổ phế sau ăn trưa',
    status: 'APPROVED' as ParentRequestStatus,
    createdAt: '2026-09-05T08:00:00.000Z',
    reviewedAt: '2026-09-05T08:45:00.000Z',
    description: 'Uống 1 gói siro ho Prospan 5ml sau giờ cơm trưa 11:30.',
    teacherNote: 'Cô Lan đã tiếp nhận và cho bé uống thuốc đúng giờ.',
  },
];

export default function ParentRequestsPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedType, setSelectedType] = useState<ParentRequestType>('ABSENCE_LEAVE');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requestsList, setRequestsList] = useState(mockRequests);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newReq = {
      id: `req-${Date.now()}`,
      type: selectedType,
      title: title || PARENT_REQUEST_TYPE_LABELS[selectedType],
      status: 'PENDING' as ParentRequestStatus,
      createdAt: new Date().toISOString(),
      description,
      teacherNote: null,
    };
    setRequestsList([newReq, ...requestsList]);
    setShowCreateForm(false);
    setTitle('');
    setDescription('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header with CTA */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-foreground">Đơn từ & Dặn dò</h1>
            <p className="text-xs text-muted-foreground">Tương tác trực tiếp với giáo viên chủ nhiệm</p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-sm hover:bg-primary/90 transition-all active:scale-[0.98] cursor-pointer"
        >
          {showCreateForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          <span>{showCreateForm ? 'Đóng' : 'Tạo đơn mới'}</span>
        </button>
      </div>

      {/* Modern Request Creator */}
      {showCreateForm && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-primary/30 bg-card p-5 space-y-4 shadow-md animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="font-bold text-sm text-foreground">Chọn phân loại đơn từ</h3>
            </div>
            <span className="text-[10px] text-muted-foreground">Phản hồi trong 30 phút</span>
          </div>

          {/* Type Selector Grid */}
          <div className="grid grid-cols-2 gap-2">
            {REQUEST_TYPES.map((item) => {
              const isSelected = selectedType === item.type;
              const Icon = item.icon;
              return (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setSelectedType(item.type)}
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-primary/10 border-primary text-primary shadow-xs'
                      : 'bg-card border-border/70 hover:bg-muted/40 text-foreground'
                  }`}
                >
                  <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs truncate leading-tight">{item.label}</p>
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">{item.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">
              Tiêu đề ngắn gọn
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`VD: ${PARENT_REQUEST_TYPE_LABELS[selectedType]} ngày mai...`}
              className="w-full border border-border/80 rounded-xl px-3.5 py-2 text-xs bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              required
            />
          </div>

          {/* Detail Description */}
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">
              Chi tiết / Ghi chú cho giáo viên
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập thông tin thời gian, liều lượng thuốc hoặc người đưa đón..."
              className="w-full border border-border/80 rounded-xl px-3.5 py-2.5 text-xs bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 min-h-[80px] transition-all"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-xl font-bold text-xs shadow-md hover:bg-primary/90 transition-all cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Gửi đơn tới Nhà trường</span>
          </button>
        </form>
      )}

      {/* Requests Feed */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
          Lịch sử gửi đơn ({requestsList.length})
        </h3>

        {requestsList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
            <ClipboardList className="h-8 w-8 mx-auto opacity-40 mb-2" />
            <p className="text-xs font-medium">Chưa có đơn từ nào được gửi</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requestsList.map((req) => {
              const isApproved = req.status === 'APPROVED';
              const isPending = req.status === 'PENDING';

              return (
                <div key={req.id} className="rounded-2xl border border-border/80 bg-card p-4 space-y-3 shadow-xs card-hover">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                          {PARENT_REQUEST_TYPE_LABELS[req.type]}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {new Date(req.createdAt).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-foreground mt-1.5 leading-snug">{req.title}</h4>
                    </div>

                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ${PARENT_REQUEST_STATUS_COLORS[req.status]}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${isApproved ? 'bg-emerald-500' : isPending ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'}`}></span>
                      {PARENT_REQUEST_STATUS_LABELS[req.status]}
                    </span>
                  </div>

                  {req.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed bg-muted/30 rounded-xl p-2.5">
                      {req.description}
                    </p>
                  )}

                  {/* Teacher Response Note if available */}
                  {req.teacherNote && (
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Phản hồi từ Giáo viên chủ nhiệm:</span>
                      </div>
                      <p className="text-foreground/90 pl-5 leading-relaxed">{req.teacherNote}</p>
                    </div>
                  )}

                  {/* Status Timeline Stepper */}
                  <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1 font-semibold text-primary">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                      1. Đã gửi đơn
                    </span>
                    <span className="h-0.5 flex-1 mx-2 bg-border"></span>
                    <span className={`flex items-center gap-1 ${req.status !== 'PENDING' ? 'font-semibold text-emerald-600' : 'text-muted-foreground'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${req.status !== 'PENDING' ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`}></span>
                      2. Giáo viên xem
                    </span>
                    <span className="h-0.5 flex-1 mx-2 bg-border"></span>
                    <span className={`flex items-center gap-1 ${isApproved ? 'font-bold text-emerald-600' : 'text-muted-foreground'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${isApproved ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`}></span>
                      3. Hoàn tất
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
