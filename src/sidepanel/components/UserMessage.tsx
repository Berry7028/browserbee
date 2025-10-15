import React from 'react';

interface UserMessageProps {
  content: string;
  timestamp?: number;
}

export function UserMessage({ content, timestamp }: UserMessageProps) {
  const formatTime = (ts?: number) => {
    if (!ts) return '';
    const date = new Date(ts);
    return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="mb-6 flex justify-end">
      <div className="max-w-[80%]">
        <div className="rounded-2xl bg-blue-600 px-4 py-3 text-white">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{content}</p>
        </div>
        {timestamp && (
          <div className="mt-1 px-2 text-right text-xs text-white/30">
            {formatTime(timestamp)}
          </div>
        )}
      </div>
    </div>
  );
}
