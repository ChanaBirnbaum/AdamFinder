import React from "react";

export type BadgeStatus = "active" | "future" | "past";

const BADGE_STYLES: Record<BadgeStatus, { className: string; label: string }> = {
  active: {
    className: "bg-[#f6fff8] border-[0.5px] border-[#2e7d32] text-[#2e7d32]",
    label: "פעיל",
  },
  future: {
    className: "bg-[#fff9f0] border-[0.5px] border-[#ef6c00] text-[#ef6c00]",
    label: "עתידי",
  },
  past: {
    className: "bg-[#fafafa] border border-[#6b7280] text-[#6b7280]",
    label: "עבר",
  },
};

export default function Badge({ status, className }: { status: BadgeStatus; className?: string }) {
  const { className: statusClass, label } = BADGE_STYLES[status];
  return (
    <div className={`flex items-center justify-end px-2 py-1 rounded-lg border-solid shrink-0 ${statusClass} ${className ?? ""}`}>
      <p className="m-0 font-rubik font-normal text-xs leading-[1.25] whitespace-nowrap text-center break-words" dir="auto">
        {label}
      </p>
    </div>
  );
}
