import React from "react";
import Badge from "./Badge";
import Avatar from "./Avatar";
import { PrisonerIcon } from "./icons";

function NameBlock({
  id,
  name,
  personalNumber,
  line2,
  line3,
}: {
  id: string;
  name: string;
  personalNumber: string;
  line2: string;
  line3: string;
}) {
  return (
    <div className="flex flex-col gap-2 items-start relative w-[220px] shrink-0 leading-[1.25] text-right break-words">
      <div className="flex gap-2 items-start justify-end text-base w-full whitespace-nowrap">
        <p className="m-0 font-rubik font-medium text-[#00033d]" dir="auto">{id}</p>
        <p className="m-0 font-rubik font-medium text-[#00033d]" dir="auto">{name} | </p>
      </div>
      <p className="m-0 font-rubik font-normal text-sm text-[#8e929f] w-full" dir="auto">{personalNumber}</p>
      <p className="m-0 font-rubik font-normal text-sm text-[#8e929f] w-full" dir="auto">{line2}</p>
      <p className="m-0 font-rubik font-normal text-sm text-[#8e929f] w-full" dir="auto">{line3}</p>
    </div>
  );
}

export type ResultRowData = {
  id: string;
  name: string;
  personalNumber: string;
  line2: string;
  line3: string;
  photoUrl?: string;
  online?: boolean;
};

export default function ResultRow({
  id,
  name,
  personalNumber,
  line2,
  line3,
  photoUrl,
  online,
  className,
}: ResultRowData & { className?: string }) {
  return (
    <div
      className={`bg-white border-b border-[#f5f5f5] flex gap-6 items-start justify-end p-4 w-full box-border shrink-0 ${className ?? ""}`}
    >
      <div className="flex-1 min-w-0 h-[114px]" />
      <div className="flex gap-1 items-center justify-center px-1 self-stretch shrink-0">
        <div className="flex items-center justify-center p-1 rounded-lg shrink-0">
          <PrisonerIcon />
        </div>
        <div className="flex gap-[3px] items-center shrink-0">
          <Badge status="active" />
          <Badge status="future" />
          <Badge status="past" />
        </div>
      </div>
      <div className="flex gap-4 items-start justify-end self-stretch shrink-0">
        <NameBlock
          id={id}
          name={name}
          personalNumber={personalNumber}
          line2={line2}
          line3={line3}
        />
        <Avatar photoUrl={photoUrl} online={online} />
      </div>
    </div>
  );
}
