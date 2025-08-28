import React, { useEffect } from 'react';
import XIcon from './icons/XIcon';

interface LogLineDetailModalProps {
  lineNumber: number;
  line: string;
  onClose: () => void;
}

const LogLineDetailModal: React.FC<LogLineDetailModalProps> = ({ lineNumber, line, onClose }) => {
  // Close modal on Escape key press for accessibility
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal content
      >
        <header className="flex items-center justify-between p-4 border-b border-slate-700 flex-shrink-0">
          <h3 className="text-lg font-semibold text-cyan-400">
            Log Line #{lineNumber.toLocaleString()}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:bg-slate-700 hover:text-slate-100 transition-colors"
            aria-label="Close"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </header>
        <div className="p-6 overflow-y-auto">
          <pre className="text-slate-200 text-sm whitespace-pre-wrap break-words font-mono">
            <code>{line}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};

export default LogLineDetailModal;
