import React from 'react';

const EmptyState: React.FC = () => (
  <div className="plib-flex plib-flex-col plib-items-center plib-justify-center plib-py-8 plib-px-4 plib-text-center" role="status">
    <p className="plib-text-gray-900 plib-font-medium plib-text-sm">לא נמצאו תוצאות</p>
    <p className="plib-text-gray-500 plib-text-xs plib-mt-1">נסה להרחיב את החיפוש</p>
  </div>
);

export default EmptyState;
