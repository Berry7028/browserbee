import { faPaperPlane, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { TokenUsageDisplay } from './TokenUsageDisplay';

interface PromptFormProps {
  onSubmit: (prompt: string) => void;
  onCancel: () => void;
  isProcessing: boolean;
  tabStatus: 'attached' | 'detached' | 'unknown' | 'running' | 'idle' | 'error';
}

export const PromptForm: React.FC<PromptFormProps> = ({
  onSubmit,
  onCancel,
  isProcessing,
  tabStatus
}) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isProcessing || tabStatus === 'detached') return;
    onSubmit(prompt);
    setPrompt(''); // Clear the prompt after submission
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <div className="relative overflow-hidden rounded-3xl border border-white/12 bg-[#1f1f1f] px-5 py-5 transition focus-within:border-white/40">
        <div className="mb-4 w-full">
          <TokenUsageDisplay />
        </div>
        <TextareaAutosize
          className="max-h-64 min-h-[44px] w-full resize-none bg-transparent pr-16 text-[15px] leading-6 text-white placeholder:text-white/30 focus:outline-none"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder={
            tabStatus === 'detached'
              ? 'タブとの接続が切れました。再読み込みしてから試してください。'
              : 'ページに関する質問や指示を入力してください…'
          }
          autoFocus
          disabled={isProcessing || tabStatus === 'detached'}
          minRows={1}
          maxRows={8}
        />
        {isProcessing ? (
          <button
            type="button"
            onClick={onCancel}
            className="absolute bottom-3.5 right-3.5 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-40"
            title="キャンセル"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        ) : (
          <button
            type="submit"
            className="absolute bottom-3.5 right-3.5 flex h-12 w-12 items-center justify-center rounded-full bg-white text-black transition hover:bg-white/80 disabled:opacity-40"
            disabled={!prompt.trim() || tabStatus === 'detached'}
            title={tabStatus === 'detached' ? 'タブを再読み込みしてください' : '送信'}
          >
            <FontAwesomeIcon icon={faPaperPlane} />
          </button>
        )}
      </div>
    </form>
  );
};
