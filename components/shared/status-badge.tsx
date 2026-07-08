export type StatusType = 'pending' | 'approved' | 'received' | 'discrepancy' | 'completed' | 'sent' | 'rejected' | string;

interface StatusBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md' | 'lg';
}

// Each status has a unique, non-overlapping color.
// Yellow/amber is freed from status use entirely.
const statusConfig: Record<string, {
  bg: string;
  text: string;
  dot: string;
  labelEn: string;
  labelKh: string;
}> = {
  pending: {
    bg: 'bg-orange-50 border border-orange-200',
    text: 'text-orange-700',
    dot: 'bg-orange-400',
    labelEn: 'Pending Review',
    labelKh: 'រង់ចាំពិនិត្យ',
  },
  approved: {
    bg: 'bg-blue-50 border border-blue-200',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
    labelEn: 'Approved',
    labelKh: 'យល់ព្រម',
  },
  sent: {
    bg: 'bg-sky-50 border border-sky-200',
    text: 'text-sky-700',
    dot: 'bg-sky-400',
    labelEn: 'Sent to Supplier',
    labelKh: 'ផ្ញើទៅផ្សារ',
  },
  received: {
    bg: 'bg-emerald-50 border border-emerald-200',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    labelEn: 'Received',
    labelKh: 'បានទទួល',
  },
  discrepancy: {
    bg: 'bg-red-50 border border-red-200',
    text: 'text-red-700',
    dot: 'bg-red-500',
    labelEn: 'Discrepancy',
    labelKh: 'មានខ្វះខូច',
  },
  completed: {
    bg: 'bg-emerald-50 border border-emerald-200',
    text: 'text-emerald-700',
    dot: 'bg-[#0A8F4D]',
    labelEn: 'Completed',
    labelKh: 'បានទទួលរួច',
  },
  rejected: {
    bg: 'bg-slate-100 border border-slate-200',
    text: 'text-slate-500',
    dot: 'bg-slate-400',
    labelEn: 'Rejected',
    labelKh: 'បដិសេធ',
  },
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    bg: 'bg-slate-100 border border-slate-200',
    text: 'text-slate-500',
    dot: 'bg-slate-400',
    labelEn: status || 'Unknown',
    labelKh: '',
  };

  if (size === 'sm') {
    // Compact inline pill — single line English only
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold leading-none ${config.bg} ${config.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dot}`} />
        {config.labelEn}
      </span>
    );
  }

  if (size === 'lg') {
    // Full bilingual stacked badge
    return (
      <span className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 ${config.bg} ${config.text}`}>
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${config.dot}`} />
        <span className="flex flex-col leading-tight">
          <span className="text-sm font-bold">{config.labelEn}</span>
          <span className="text-[11px] font-medium opacity-80 font-kantumruy">{config.labelKh}</span>
        </span>
      </span>
    );
  }

  // md — default: dot + English + Khmer on own line
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold ${config.bg} ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dot}`} />
      <span className="flex flex-col leading-tight">
        <span>{config.labelEn}</span>
        <span className="font-kantumruy text-[10px] font-medium opacity-70">{config.labelKh}</span>
      </span>
    </span>
  );
}
