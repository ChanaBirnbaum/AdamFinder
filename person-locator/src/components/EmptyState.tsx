import React from 'react';

const EmptyState: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-8 px-4 text-center" role="status">
    <p className="text-gray-900 font-medium text-sm">לא נמצאו תוצאות</p>
    <p className="text-gray-500 text-xs mt-1">נסה להרחיב את החיפוש</p>
  </div>
);

export default EmptyState;
