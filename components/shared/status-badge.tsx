export type StatusType = 'pending' | 'approved' | 'received' | 'discrepancy' | 'completed' | 'sent' | 'rejected' | string;

interface StatusBadgeProps {
  status: StatusType;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-yellow-100 dark:bg-yellow-950/50 border border-yellow-300/60', text: 'text-yellow-800 dark:text-yellow-300', label: 'Pending / រង់ចាំពិនិត្យ' },
  approved: { bg: 'bg-blue-100 dark:bg-blue-950/50 border border-blue-300/60', text: 'text-blue-800 dark:text-blue-300', label: 'Approved / យល់ព្រម' },
  sent: { bg: 'bg-amber-100 dark:bg-amber-950/50 border border-amber-300/60', text: 'text-amber-800 dark:text-amber-300', label: 'Sent to Supplier / ផ្ញើទៅផ្សារ' },
  received: { bg: 'bg-green-100 dark:bg-green-950/50 border border-green-300/60', text: 'text-green-800 dark:text-green-300', label: 'Received / បានទទួល' },
  discrepancy: { bg: 'bg-red-100 dark:bg-red-950/50 border border-red-300/60', text: 'text-red-800 dark:text-red-300', label: 'Discrepancy / មានខ្វះខូច' },
  completed: { bg: 'bg-purple-100 dark:bg-purple-950/50 border border-purple-300/60', text: 'text-purple-800 dark:text-purple-300', label: 'Completed / បានទទួលរួច' },
  rejected: { bg: 'bg-rose-100 dark:bg-rose-950/50 border border-rose-300/60', text: 'text-rose-800 dark:text-rose-300', label: 'Rejected / បដិសេធ' },
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status] || { 
    bg: 'bg-gray-100 dark:bg-gray-800 border border-gray-300/60', 
    text: 'text-gray-800 dark:text-gray-300', 
    label: status || 'Unknown' 
  };
  
  const sizeClass = size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : size === 'lg' ? 'px-4 py-1.5 text-sm' : 'px-3 py-1 text-xs';

  return (
    <span className={`inline-block rounded-full font-bold shadow-2xs ${sizeClass} ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}
