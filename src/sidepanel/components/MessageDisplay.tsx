import React from 'react';
import { Message } from '../types';
import { LlmContent } from './LlmContent';
import { ScreenshotMessage } from './ScreenshotMessage';
import { ToolCallMessage } from './ToolCallMessage';
import { UserMessage } from './UserMessage';

interface MessageDisplayProps {
  messages: Message[];
  streamingSegments: Record<number, string>;
  isStreaming: boolean;
}

export const MessageDisplay: React.FC<MessageDisplayProps> = ({
  messages,
  streamingSegments,
  isStreaming
}) => {
  // Filter out system messages only, keep user, AI, tool, and screenshots
  const filteredMessages = messages.filter(msg => msg.type !== 'system');

  return (
    <div className="space-y-6">
      {/* Render completed messages in their original order */}
      {filteredMessages.map((msg, index) => (
        <div key={`msg-${index}`}>
          {msg.type === 'user' ? (
            <UserMessage content={msg.content} timestamp={msg.timestamp} />
          ) : msg.type === 'tool' ? (
            <ToolCallMessage 
              toolName={msg.toolName || ''} 
              toolInput={msg.toolInput || msg.content} 
            />
          ) : msg.type === 'screenshot' && msg.imageData ? (
            <ScreenshotMessage imageData={msg.imageData} mediaType={msg.mediaType} />
          ) : (
            <div className="rounded-3xl border border-white/12 bg-[#1f1f1f] px-6 py-5 text-[15px] leading-7 text-white/85 shadow-[0_24px_70px_-60px_rgba(0,0,0,0.9)] space-y-4">
              <LlmContent content={msg.content} />
              {msg.reasoning && (
                <details className="group rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/70">
                  <summary className="flex cursor-pointer list-none items-center justify-between text-white/60 transition-colors group-open:text-white/80">
                    <span>思考過程を表示</span>
                    <span className="ml-3 text-xs text-white/40">(OpenAI reasoning)</span>
                  </summary>
                  <div className="mt-3 whitespace-pre-wrap text-white/70">
                    {msg.reasoning}
                  </div>
                </details>
              )}
            </div>
          )}
        </div>
      ))}
      
      {/* Render currently streaming segments at the end */}
      {isStreaming && Object.entries(streamingSegments).map(([id, content]) => (
        <div
          key={`segment-${id}`}
          className="rounded-3xl border border-white/12 bg-[#1f1f1f] px-6 py-5 text-[15px] leading-7 text-white/70 shadow-[0_24px_70px_-60px_rgba(0,0,0,0.9)] animate-pulse"
        >
          <LlmContent content={content} />
        </div>
      ))}
    </div>
  );
};
