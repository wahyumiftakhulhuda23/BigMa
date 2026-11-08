import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface RowOrderControlsProps {
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  indexDisplay?: number;
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
}

export const RowOrderControls: React.FC<RowOrderControlsProps> = ({
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
  indexDisplay,
  className = '',
  disabled = false,
  readOnly = false,
}) => {
  // If in read-only mode or movement handlers not provided (e.g. for Guest), only render row number
  if (readOnly || !onMoveUp || !onMoveDown) {
    return (
      <div className={`inline-flex items-center justify-center select-none ${className}`}>
        {typeof indexDisplay === 'number' && (
          <span className="font-mono text-xs font-semibold text-neutral-400 min-w-4 text-center">
            {indexDisplay}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center justify-center gap-1.5 select-none ${className}`}>
      <div className="flex flex-col gap-0.5">
        <button
          type="button"
          disabled={!canMoveUp || disabled}
          onClick={(e) => {
            e.stopPropagation();
            onMoveUp();
          }}
          className={`p-0.5 rounded transition-all ${
            !canMoveUp || disabled
              ? 'text-neutral-700 cursor-not-allowed opacity-20'
              : 'text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 cursor-pointer active:scale-95'
          }`}
          title="Geser baris ke atas"
          aria-label="Geser ke atas"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          disabled={!canMoveDown || disabled}
          onClick={(e) => {
            e.stopPropagation();
            onMoveDown();
          }}
          className={`p-0.5 rounded transition-all ${
            !canMoveDown || disabled
              ? 'text-neutral-700 cursor-not-allowed opacity-20'
              : 'text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 cursor-pointer active:scale-95'
          }`}
          title="Geser baris ke bawah"
          aria-label="Geser ke bawah"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>
      {typeof indexDisplay === 'number' && (
        <span className="font-mono text-[11px] font-bold text-neutral-400 min-w-4 text-center">
          {indexDisplay}
        </span>
      )}
    </div>
  );
};
