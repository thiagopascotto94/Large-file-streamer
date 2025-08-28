import React from 'react';

const Spinner: React.FC<{ className?: string }> = ({ className }) => {
  const finalClassName = `animate-spin rounded-full border-b-2 border-t-2 border-cyan-400 ${className || 'h-8 w-8'}`;
  return (
    <div
      className={finalClassName}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Spinner;