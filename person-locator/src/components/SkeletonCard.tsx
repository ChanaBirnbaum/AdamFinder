import React from 'react';

const SkeletonCard: React.FC = () => (
  <div className="plib-flex plib-items-start plib-gap-3 plib-p-3" aria-hidden="true">
    {/* Photo circle */}
    <div className="plib-w-10 plib-h-10 plib-rounded-full plib-bg-gray-200 plib-animate-pulse plib-flex-shrink-0" />
    <div className="plib-flex-1 plib-space-y-2">
      {/* Name line */}
      <div className="plib-h-4 plib-bg-gray-200 plib-rounded plib-animate-pulse plib-w-3/4" />
      {/* Secondary info */}
      <div className="plib-h-3 plib-bg-gray-200 plib-rounded plib-animate-pulse plib-w-1/2" />
      {/* Tertiary info */}
      <div className="plib-h-3 plib-bg-gray-200 plib-rounded plib-animate-pulse plib-w-2/3" />
    </div>
  </div>
);

export default SkeletonCard;
