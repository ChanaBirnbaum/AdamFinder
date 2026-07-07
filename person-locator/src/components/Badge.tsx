export type BadgeStatus = 'active' | 'future' | 'past';

const BADGE_STYLES: Record<BadgeStatus, { className: string; label: string }> = {
  active: { className: 'plib-bg-badge-success-bg plib-border-hairline plib-border-badge-success-fg plib-text-badge-success-fg', label: 'פעיל'  },
  future: { className: 'plib-bg-badge-warning-bg plib-border-hairline plib-border-badge-warning-fg plib-text-badge-warning-fg', label: 'עתידי' },
  past:   { className: 'plib-bg-badge-neutral-bg plib-border plib-border-badge-neutral-fg plib-text-badge-neutral-fg',          label: 'עבר'   },
};

export default function Badge({ status, label: labelOverride, className }: { status: BadgeStatus; label?: string; className?: string }) {
  const { className: statusClass, label } = BADGE_STYLES[status];
  return (
    <div className={`plib-root plib-flex plib-items-center plib-justify-end plib-px-2 plib-py-1 plib-rounded-lg plib-border-solid plib-shrink-0 ${statusClass} ${className ?? ''}`}>
      <p className="plib-m-0 plib-font-rubik plib-font-normal plib-text-xs plib-leading-tight plib-whitespace-nowrap plib-text-center plib-break-words" dir="auto">
        {labelOverride ?? label}
      </p>
    </div>
  );
}
