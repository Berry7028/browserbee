import { faTools } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';

interface ToolCallMessageProps {
  toolName: string;
  toolInput: string;
}

export function ToolCallMessage({ toolName, toolInput }: ToolCallMessageProps) {
  // Parse the tool input if it's a JSON string
  let parsedInput: any;
  try {
    parsedInput = JSON.parse(toolInput);
  } catch {
    parsedInput = toolInput;
  }

  // Format the input for display
  const formatInput = (input: any): string => {
    if (typeof input === 'string') {
      return input;
    }
    if (typeof input === 'object' && input !== null) {
      return Object.entries(input)
        .map(([key, value]) => {
          if (typeof value === 'string' && value.length > 100) {
            return `${key}: ${value.substring(0, 100)}...`;
          }
          return `${key}: ${JSON.stringify(value)}`;
        })
        .join(', ');
    }
    return String(input);
  };

  return (
    <div className="mb-4 flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-600/20 text-purple-400">
        <FontAwesomeIcon icon={faTools} className="text-sm" />
      </div>
      <div className="flex-1 pt-1">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-sm font-semibold text-purple-400">
            {toolName}
          </span>
        </div>
        <div className="mt-1 text-sm text-white/50">
          {formatInput(parsedInput)}
        </div>
      </div>
    </div>
  );
}
