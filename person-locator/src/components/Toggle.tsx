type ToggleProps = {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
};

export default function Toggle({ checked, onChange, className }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange?.(!checked)}
      dir="ltr"
      className={`plib-root plib-flex plib-gap-1 plib-items-center plib-bg-transparent plib-border-0 plib-cursor-pointer plib-p-0 plib-shrink-0 ${className ?? ''}`}
    >
      <div
        className={`plib-relative plib-flex plib-h-4 plib-w-8 plib-items-center plib-rounded-full plib-transition-colors plib-shrink-0 ${
          checked ? 'plib-bg-primary-main' : 'plib-bg-control-off'
        }`}
      >
        <span
          className={`plib-absolute plib-left-0 plib-top-0.5 plib-h-3 plib-w-3 plib-rounded-full plib-bg-white plib-shadow plib-transition-transform ${
            checked ? 'plib-translate-x-4.5' : 'plib-translate-x-0.5'
          }`}
        />
      </div>
      <p
        className="plib-m-0 plib-font-rubik plib-font-normal plib-leading-tight plib-text-text-muted plib-text-sm plib-text-right plib-whitespace-nowrap"
        dir="auto"
      >
        {checked ? 'לא פעיל' : 'פעיל'}
      </p>
    </button>
  );
}
