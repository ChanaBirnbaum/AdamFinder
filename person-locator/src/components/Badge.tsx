export type BadgeStatus = 'active' | 'future' | 'past';

const BADGE_STYLES: Record<BadgeStatus, { className: string; label: string }> = {
  active: { className: 'bg-badge-success-bg border-hairline border-badge-success-fg text-badge-success-fg', label: 'פעיל'  },
  future: { className: 'bg-badge-warning-bg border-hairline border-badge-warning-fg text-badge-warning-fg', label: 'עתידי' },
  past:   { className: 'bg-badge-neutral-bg border border-badge-neutral-fg text-badge-neutral-fg',          label: 'עבר'   },
};

export default function Badge({ status, label: labelOverride, className }: { status: BadgeStatus; label?: string; className?: string }) {
  const { className: statusClass, label } = BADGE_STYLES[status];
  return (
    <div className={`flex items-center justify-end px-2 py-1 rounded-lg border-solid shrink-0 ${statusClass} ${className ?? ''}`}>
      <p className="m-0 font-rubik font-normal text-xs leading-tight whitespace-nowrap text-center break-words" dir="auto">
        {labelOverride ?? label}
      </p>
    </div>
  );
}
