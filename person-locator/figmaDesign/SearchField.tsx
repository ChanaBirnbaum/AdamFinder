import React, { useState } from "react";
import { CitizenIcon, GuardIcon, PrisonerIcon, SearchIcon } from "./components/icons";
import Toggle from "./components/Toggle";
import Tabs, { TabKey } from "./components/Tabs";
import ResultRow, { ResultRowData } from "./components/ResultRow";

const imgSampleProfile = "https://www.figma.com/api/mcp/asset/16424e10-bc7f-46b8-ac4a-ef33ed4ae013";

const SAMPLE_RESULTS: ResultRowData[] = [
  { id: "123456", name: "עלי מזרחי", personalNumber: "356565595959", line2: "סוג אסיר | 052-7654321", line3: "שיבוץ | 052-7654321", photoUrl: imgSampleProfile, online: true },
  { id: "123456", name: "עלי מזרחי", personalNumber: "356565595959", line2: "סוג אסיר | 052-7654321", line3: "שיבוץ | 052-7654321", online: true },
  { id: "123456", name: "עלי מזרחי", personalNumber: "356565595959", line2: "סוג אסיר | 052-7654321", line3: "שיבוץ | 052-7654321", online: true },
];

const TAB_COUNTS: Record<TabKey, number> = { citizens: 10, guards: 10, prisoners: 10 };

type PersonFilter = "citizen" | "guard" | "prisoner";

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center border-0 cursor-pointer shrink-0 transition-all ${
        active
          ? "bg-[#e6f4ff] rounded-full p-[10px] w-8 h-8 box-border"
          : "bg-transparent rounded-lg p-1"
      }`}
    >
      {children}
    </button>
  );
}

export default function SearchField({
  className,
  placeholder = "איתור אדם",
}: {
  className?: string;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [activeOnly, setActiveOnly] = useState(false);
  const [personFilter, setPersonFilter] = useState<PersonFilter>("citizen");
  const [activeTab, setActiveTab] = useState<TabKey>("prisoners");

  // default = no interaction | hover = mouse over | active = focused or has text
  const isActive = focused || query.length > 0;
  const showFull = hovered || isActive;

  return (
    <div
      dir="ltr"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`bg-white flex flex-col gap-1 items-end overflow-hidden p-1 relative rounded-lg w-[528px] transition-shadow ${
        showFull ? "shadow-search" : ""
      } ${className ?? ""}`}
    >
      {/* Search bar — always visible */}
      <div
        className={`bg-white flex gap-2 h-[47px] items-center px-4 py-3 relative rounded-lg shrink-0 w-full box-border border-solid transition-all ${
          isActive ? "border-2 border-[#006aff]" : "border border-[#006aff]"
        }`}
      >
        {/* Filter icons — appear on hover & active */}
        {showFull && (
          <div className="flex items-center shrink-0">
            <FilterButton active={personFilter === "citizen"} onClick={() => setPersonFilter("citizen")}>
              <CitizenIcon active={personFilter === "citizen"} />
            </FilterButton>
            <FilterButton active={personFilter === "guard"} onClick={() => setPersonFilter("guard")}>
              <GuardIcon />
            </FilterButton>
            <FilterButton active={personFilter === "prisoner"} onClick={() => setPersonFilter("prisoner")}>
              <PrisonerIcon />
            </FilterButton>
          </div>
        )}

        {/* Toggle — appears on hover & active */}
        {showFull && <Toggle checked={activeOnly} onChange={setActiveOnly} />}

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          dir="rtl"
          className="flex-1 min-w-0 font-rubik font-normal leading-[1.25] text-[#00033d] text-base text-right border-0 outline-none bg-transparent placeholder:text-[#8e929f]"
        />

        <SearchIcon />
      </div>

      {/* Dropdown — appears on active (focused or has text) */}
      {isActive && (
        <div className="bg-white flex flex-col items-start overflow-hidden rounded-lg shrink-0 w-full">
          <div className="bg-white border-b border-[#f5f5f5] flex h-12 items-center justify-center pl-4 shrink-0 w-full box-border">
            <Tabs active={activeTab} counts={TAB_COUNTS} onChange={setActiveTab} />
          </div>
          {SAMPLE_RESULTS.map((result, i) => (
            <ResultRow key={i} {...result} />
          ))}
        </div>
      )}
    </div>
  );
}
