import React from 'react';
import { BookingStatus, BookingStatusHistory } from '../types.js';
import { 
  CheckCircle2, 
  Clock, 
  Truck, 
  Wrench, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  QrCode 
} from 'lucide-react';

interface BookingTimelineProps {
  status: BookingStatus;
  timeline?: BookingStatusHistory[];
  createdAt?: string;
  className?: string;
}

interface StepConfig {
  key: BookingStatus;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STEPS: StepConfig[] = [
  {
    key: 'PENDING',
    label: 'Requested',
    description: 'Booking placed, awaiting specialist confirmation',
    icon: Clock,
  },
  {
    key: 'ACCEPTED',
    label: 'Accepted',
    description: 'Specialist accepted appointment schedule',
    icon: CheckCircle2,
  },
  {
    key: 'ON_THE_WAY',
    label: 'On The Way',
    description: 'Specialist is en route to your service location',
    icon: Truck,
  },
  {
    key: 'IN_PROGRESS',
    label: 'In Progress',
    description: 'Specialist arrived and commenced work',
    icon: Wrench,
  },
  {
    key: 'AWAITING_PAYMENT',
    label: 'Bill & Pay',
    description: 'Work done. UPI QR scan & digital payment',
    icon: QrCode,
  },
  {
    key: 'COMPLETED',
    label: 'Completed',
    description: 'Payment confirmed & service closed',
    icon: CheckCircle,
  },
];

const STATUS_ORDER: Record<string, number> = {
  PENDING: 0,
  ACCEPTED: 1,
  CONFIRMED: 1, // Treat confirmed at same tier as accepted
  ON_THE_WAY: 2,
  IN_PROGRESS: 3,
  AWAITING_PAYMENT: 4,
  COMPLETED: 5,
};

export const BookingTimeline: React.FC<BookingTimelineProps> = ({
  status,
  timeline = [],
  createdAt,
  className = '',
}) => {
  const isCancelled = status === 'CANCELLED';
  const isRejected = status === 'REJECTED';
  const currentStepIndex = STATUS_ORDER[status] ?? 0;

  // Find history record for a given status
  const getHistoryForStatus = (stepKey: BookingStatus) => {
    return timeline.find((h) => {
      if (stepKey === 'ACCEPTED' && (h.status === 'ACCEPTED' || h.status === 'CONFIRMED')) return true;
      return h.status === stepKey;
    });
  };

  const formatTime = (iso?: string) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return iso;
    }
  };

  if (isCancelled || isRejected) {
    const termRecord = timeline.slice().reverse().find((h) => h.status === 'CANCELLED' || h.status === 'REJECTED');
    return (
      <div className={`p-4 rounded-xl border ${isCancelled ? 'bg-amber-50/70 border-amber-200 text-amber-900' : 'bg-red-50/70 border-red-200 text-red-900'} ${className}`}>
        <div className="flex items-start gap-3">
          {isCancelled ? (
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1 text-xs">
            <h4 className="font-bold text-sm">
              {isCancelled ? 'Booking Cancelled' : 'Specialist Unavailable / Request Rejected'}
            </h4>
            <p className="opacity-90">
              {termRecord?.notes || (isCancelled ? 'This booking was cancelled by the client.' : 'The specialist was unable to accept this appointment slot.')}
            </p>
            {termRecord?.created_at && (
              <p className="text-[11px] font-mono opacity-70">
                Timestamp: {formatTime(termRecord.created_at)}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between text-xs text-slate-500 font-medium pb-1 border-b border-slate-100">
        <span className="flex items-center gap-1.5 font-semibold text-slate-800">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
          Live Service Milestone Tracker
        </span>
        {createdAt && <span className="font-mono text-[11px]">Booked: {formatTime(createdAt)}</span>}
      </div>

      <div className="relative">
        <div className="grid grid-cols-5 gap-1 sm:gap-2">
          {STEPS.map((step, idx) => {
            const isCompleted = currentStepIndex > idx || (currentStepIndex === idx && status === 'COMPLETED');
            const isCurrent = currentStepIndex === idx && status !== 'COMPLETED';
            const isUpcoming = currentStepIndex < idx;
            const history = getHistoryForStatus(step.key);
            const Icon = step.icon;

            return (
              <div key={step.key} className="flex flex-col items-center text-center group relative">
                {/* Connector line between steps */}
                {idx < STEPS.length - 1 && (
                  <div 
                    className={`absolute top-4 left-1/2 w-full h-0.5 -z-0 transition-colors duration-300 ${
                      currentStepIndex > idx ? 'bg-blue-600' : 'bg-slate-200'
                    }`} 
                  />
                )}

                {/* Circle Icon Badge */}
                <div 
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center z-10 transition-all duration-300 ${
                    isCompleted
                      ? 'bg-blue-600 text-white shadow-xs'
                      : isCurrent
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-sm animate-pulse'
                      : 'bg-white border-2 border-slate-200 text-slate-400'
                  }`}
                  title={`${step.label}: ${step.description}`}
                >
                  <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </div>

                {/* Step Title */}
                <span 
                  className={`mt-2 text-[11px] sm:text-xs font-semibold leading-tight ${
                    isCompleted || isCurrent ? 'text-slate-900' : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </span>

                {/* Timestamp if reached */}
                {history?.created_at ? (
                  <span className="text-[10px] text-blue-600 font-mono mt-0.5 hidden sm:inline-block">
                    {formatTime(history.created_at).split(',')[0]}
                  </span>
                ) : isUpcoming ? (
                  <span className="text-[10px] text-slate-300 mt-0.5 hidden sm:inline-block">Pending</span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Step Note Box */}
      {timeline.length > 0 && (
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs flex items-start gap-2.5">
          <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700 shrink-0">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">
                Latest Update ({STEPS[currentStepIndex]?.label || status})
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {formatTime(timeline[timeline.length - 1]?.created_at)}
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              {timeline[timeline.length - 1]?.notes || STEPS[currentStepIndex]?.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
