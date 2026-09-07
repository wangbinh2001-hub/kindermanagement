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
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar, 
  User, 
  Phone, 
  MessageSquare,
  Sparkles,
  ChevronRight,
  Filter
} from 'lucide-react';

interface SchoolRequestItem {
  id: string;
  type: ParentRequestType;
  title: string;
  status: ParentRequestStatus;
  createdAt: string;
  description: string;
  studentName: string;
  className: string;
  submittedBy: string;
  reviewedAt?: string;
  reviewedByRole?: string;
  reviewNotes?: string;
  metadata: Record<string, unknown>;
}

const mockSchoolRequests: SchoolRequestItem[] = [
  {
    id: 'req-1',
    type: 'ABSENCE_LEAVE' as ParentRequestType,
    title: 'Xin nghỉ học ngày 10-11/9',
    status: 'PENDING' as ParentRequestStatus,
    createdAt: '2026-09-06T10:00:00.000Z',
    description: 'Con bị sốt siêu vi, gia đình xin phép cho bé nghỉ 2 ngày để theo dõi tại nhà.',
    studentName: 'Nguyễn Minh Anh',
    className: 'Lớp Lá A',
    submittedBy: '090*****67 (Mẹ Minh Anh)',
    metadata: {
      absenceStartDate: '2026-09-10',
      absenceEndDate: '2026-09-11',
    },
  },
  {
    id: 'req-2',
    type: 'MEDICATION_INSTRUCTION' as ParentRequestType,
    title: 'Dặn thuốc ho Prospan sau giờ ăn trưa',
    status: 'PENDING' as ParentRequestStatus,
    createdAt: '2026-09-05T08:00:00.000Z',
    description: 'Bé bị ho khan, nhờ cô cho uống 1 gói siro ho Prospan 5ml sau khi ăn cơm trưa.',
    studentName: 'Trần Gia Bảo',
    className: 'Lớp Chồi B',
    submittedBy: '090*****43 (Bố Gia Bảo)',
    metadata: {
      medicationName: 'Prospan',
      dosage: '5ml',
      frequency: 'Sau ăn trưa',
    },
  },
  {
    id: 'req-3',
    type: 'LATE_PICKUP' as ParentRequestType,
    title: 'Đón muộn 30 phút ngày 08/09',
    status: 'APPROVED' as ParentRequestStatus,
    createdAt: '2026-09-04T14:00:00.000Z',
    description: 'Bố mẹ đi làm về kẹt xe cầu vượt, xin phép đón bé lúc 17:45.',
    studentName: 'Lê Khánh Linh',
    className: 'Lớp Mầm 1',
    submittedBy: '091*****78 (Mẹ Khánh Linh)',
    reviewedAt: '2026-09-04T15:00:00.000Z',
    reviewedByRole: 'TEACHER',
    reviewNotes: 'Cô Lan đã ghi nhận và trông bé tại phòng hoạt động chung.',
    metadata: {
      expectedPickupTime: '17:45',
      reason: 'Kẹt xe tan tầm',
    },
  },
];

type FilterStatus = ParentRequestStatus | 'ALL';

export default function SchoolParentRequestsPage() {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [requestsList, setRequestsList] = useState<SchoolRequestItem[]>(mockSchoolRequests);

  const filtered = filterStatus === 'ALL'
    ? requestsList
    : requestsList.filter((r) => r.status === filterStatus);

  const pendingCount = requestsList.filter((r) => r.status === 'PENDING').length;

  const handleReview = (requestId: string, action: 'APPROVE' | 'REJECT') => {
    setRequestsList(requestsList.map((r) => {
      if (r.id === requestId) {
        return {
          ...r,
          status: action === 'APPROVE' ? ('APPROVED' as ParentRequestStatus) : ('REJECTED' as ParentRequestStatus),
          reviewedAt: new Date().toISOString(),
          reviewedByRole: 'TEACHER',
          reviewNotes: reviewNotes || (action === 'APPROVE' ? 'Đã duyệt yêu cầu' : 'Từ chối yêu cầu'),
        };
      }
      return r;
    }));
    setReviewingId(null);
    setReviewNotes('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-foreground">Xử lý Yêu cầu Phụ huynh</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tiếp nhận & phản hồi đơn xin nghỉ học, dặn thuốc và ủy quyền đón hộ từ phụ huynh.
              </p>
            </div>
          </div>
        </div>

        {pendingCount > 0 && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-700 dark:text-amber-400">
            <Clock className="h-3.5 w-3.5 animate-spin" />
            <span>{pendingCount} đơn chờ xử lý ngay</span>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-muted/60 border border-border/60 overflow-x-auto">
        {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as FilterStatus[]).map((status) => {
          const isSelected = filterStatus === status;
          const count = status === 'ALL' 
            ? requestsList.length 
            : requestsList.filter((r) => r.status === status).length;

          return (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`flex items-center gap-2 py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-card text-primary shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>{status === 'ALL' ? 'Tất cả đơn' : PARENT_REQUEST_STATUS_LABELS[status]}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Requests Grid */}
      <div className="space-y-3.5">
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground">
            <ClipboardList className="h-10 w-10 mx-auto opacity-40 mb-2" />
            <p className="text-sm font-semibold">Không có đơn từ nào trong mục này</p>
          </div>
        ) : (
          filtered.map((req) => {
            const isReviewing = reviewingId === req.id;
            const isApproved = req.status === 'APPROVED';
            const isPending = req.status === 'PENDING';

            return (
              <div
                key={req.id}
                className="rounded-3xl border border-border/80 bg-card p-5 space-y-3.5 shadow-xs card-hover"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                        {PARENT_REQUEST_TYPE_LABELS[req.type]}
                      </span>
                      <span className="text-xs font-bold text-foreground">
                        Học sinh: <span className="text-primary font-extrabold">{req.studentName}</span> ({req.className})
                      </span>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        • {new Date(req.createdAt).toLocaleString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-sm text-foreground mt-2">{req.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {req.description}
                    </p>
                  </div>

                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border self-start ${PARENT_REQUEST_STATUS_COLORS[req.status]}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${isApproved ? 'bg-emerald-500' : isPending ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'}`}></span>
                    {PARENT_REQUEST_STATUS_LABELS[req.status]}
                  </span>
                </div>

                {/* Submitter & Student Info Footer */}
                <div className="pt-3 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      <span>{req.submittedBy}</span>
                    </span>
                  </div>

                  {/* Actions */}
                  {isPending && !isReviewing && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setReviewingId(req.id)}
                        className="py-1.5 px-3 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-xs hover:bg-primary/90 transition-all cursor-pointer"
                      >
                        Xử lý đơn này
                      </button>
                    </div>
                  )}
                </div>

                {/* Inline Review Action Form */}
                {isReviewing && (
                  <div className="pt-3 border-t border-border/60 space-y-3 bg-muted/30 p-4 rounded-2xl animate-in fade-in duration-200">
                    <label className="text-xs font-bold text-foreground block">
                      Ghi chú phản hồi cho phụ huynh:
                    </label>
                    <textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Ví dụ: Đã nhận đơn, cô giáo sẽ cho bé uống thuốc đúng giờ..."
                      className="w-full text-xs p-3 rounded-xl border bg-background text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden"
                      rows={2}
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setReviewingId(null)}
                        className="py-1.5 px-3 rounded-xl border text-xs font-semibold hover:bg-muted transition-colors cursor-pointer"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={() => handleReview(req.id, 'REJECT')}
                        className="py-1.5 px-3 rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/20 text-xs font-bold hover:bg-rose-500/20 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Từ chối</span>
                      </button>
                      <button
                        onClick={() => handleReview(req.id, 'APPROVE')}
                        className="py-1.5 px-3 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Chấp thuận đơn</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Review Info (for already reviewed) */}
                {(req.status === 'APPROVED' || req.status === 'REJECTED') && req.reviewedAt && (
                  <div className="text-xs text-muted-foreground border-t pt-2">
                    Đã xử lý bởi: {req.reviewedByRole} · {new Date(req.reviewedAt).toLocaleString('vi-VN')}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
