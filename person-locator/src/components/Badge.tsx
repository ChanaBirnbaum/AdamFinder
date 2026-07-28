export type BadgeStatus = 'active' | 'future' | 'past';
export type BadgeSize = 'default' | 'compact';

const BADGE_STYLES: Record<BadgeStatus, { bg: string; text: string; border: string; label: string }> = {
  active: { bg: 'plib-bg-badge-success-bg', text: 'plib-text-badge-success-fg', border: 'plib-border-hairline plib-border-badge-success-fg', label: 'פעיל'  },
  future: { bg: 'plib-bg-badge-warning-bg', text: 'plib-text-badge-warning-fg', border: 'plib-border-hairline plib-border-badge-warning-fg', label: 'עתידי' },
  past:   { bg: 'plib-bg-badge-neutral-bg', text: 'plib-text-badge-neutral-fg', border: 'plib-border plib-border-badge-neutral-fg',            label: 'עבר'   },
};

export default function Badge({ status, label: labelOverride, className, size = 'default' }: { status: BadgeStatus; label?: string; className?: string; size?: BadgeSize }) {
  const { bg, text, border, label } = BADGE_STYLES[status];
  const isCompact = size === 'compact';
  return (
    <div
      className={`plib-root plib-flex plib-items-center plib-justify-end plib-border-solid plib-shrink-0 ${bg} ${text} ${
        isCompact ? 'plib-px-1 plib-py-0 plib-rounded' : `plib-px-2 plib-py-1 plib-rounded-lg ${border}`
      } ${className ?? ''}`}
    >
      <p
        className={`plib-m-0 plib-font-rubik plib-font-normal plib-leading-tight plib-whitespace-nowrap plib-text-center plib-break-words ${
          isCompact ? 'plib-text-3xs' : 'plib-text-xs'
        }`}
        dir="auto"
      >
        {labelOverride ?? label}
      </p>
    </div>
  );
}
