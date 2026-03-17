import React from 'react';

const SkeletonCard: React.FC = () => (
  <div className="flex items-start gap-3 p-3" aria-hidden="true">
    {/* Photo circle */}
    <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
    <div className="flex-1 space-y-2">
      {/* Name line */}
      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
      {/* Secondary info */}
      <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
      {/* Tertiary info */}
      <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
    </div>
  </div>
);

export default SkeletonCard;
