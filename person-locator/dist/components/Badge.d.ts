export type BadgeStatus = 'active' | 'future' | 'past';
export default function Badge({ status, label: labelOverride, className }: {
    status: BadgeStatus;
    label?: string;
    className?: string;
}): import("react/jsx-runtime").JSX.Element;
