import { faTrash, faBookBookmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';

interface OutputHeaderProps {
  onClearHistory: () => void;
  onReflectAndLearn: () => void;
  isProcessing: boolean;
}

export const OutputHeader: React.FC<OutputHeaderProps> = ({
  onClearHistory,
  onReflectAndLearn,
  isProcessing
}) => {
  return (
    <div className="flex items-center justify-between border-b border-white/8 px-8 py-6">
      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.45em] text-white/35">
          Conversation
        </p>
        <p className="text-lg font-semibold text-white">
          現在のセッション
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onReflectAndLearn}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/10 text-white transition hover:bg-white/15 disabled:opacity-40"
          disabled={isProcessing}
          title="Memori"
        >
          <FontAwesomeIcon icon={faBookBookmark} />
        </button>
        <button
          onClick={onClearHistory}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/10 text-white/80 transition hover:bg-red-500/20 hover:text-red-100 disabled:opacity-40"
          disabled={isProcessing}
          title="履歴をクリア"
        >
          <FontAwesomeIcon icon={faTrash} />
        </button>
      </div>
    </div>
  );
};
