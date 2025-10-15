import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface LlmContentProps {
  content: string;
}

export const LlmContent: React.FC<LlmContentProps> = ({ content }) => {
  // Split content into regular text and tool calls
  const parts: Array<{ type: 'text' | 'tool', content: string }> = [];
  
  // Process the content to identify tool calls
  // Create a combined regex that handles both direct tool calls and those wrapped in code blocks (xml or bash)
  const combinedToolCallRegex = /(```(?:xml|bash)\s*)?<tool>(.*?)<\/tool>\s*<input>([\s\S]*?)<\/input>(?:\s*<requires_approval>(.*?)<\/requires_approval>)?(\s*```)?/g;
  let lastIndex = 0;
  
  // Create a copy of the content to work with
  const contentCopy = content.toString();
  
  // Reset regex lastIndex
  combinedToolCallRegex.lastIndex = 0;
  
  // Process all tool calls (both direct and code block) in a single pass
  let match;
  while ((match = combinedToolCallRegex.exec(contentCopy)) !== null) {
    // Add text before the tool call
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: contentCopy.substring(lastIndex, match.index)
      });
    }
    
    // Add the tool call
    parts.push({
      type: 'tool',
      content: match[0]
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add any remaining text after the last tool call
  if (lastIndex < contentCopy.length) {
    parts.push({
      type: 'text',
      content: contentCopy.substring(lastIndex)
    });
  }

  // If no tool calls were found, just return the whole content
  if (parts.length === 0) {
    parts.push({
      type: 'text',
      content: content
    });
  }
  
  return (
    <>
      {parts.map((part, index) => {
        if (part.type === 'text') {
          // Render regular text with markdown
          return (
            <ReactMarkdown 
              key={index}
              remarkPlugins={[remarkGfm]}
              components={{
                // Apply Tailwind classes to markdown elements
                p: ({node, ...props}) => <p className="mb-3 text-[15px] text-white/80" {...props} />,
                h1: ({node, ...props}) => <h1 className="mb-4 text-2xl font-semibold text-white" {...props} />,
                h2: ({node, ...props}) => <h2 className="mb-3 text-xl font-semibold text-white" {...props} />,
                h3: ({node, ...props}) => <h3 className="mb-2 text-lg font-semibold text-white" {...props} />,
                ul: ({node, ...props}) => <ul className="mb-3 list-disc space-y-1 pl-6 text-white/80" {...props} />,
                ol: ({node, ...props}) => <ol className="mb-3 list-decimal space-y-1 pl-6 text-white/80" {...props} />,
                li: ({node, ...props}) => <li className="text-[15px]" {...props} />,
                a: ({node, ...props}) => <a className="text-sky-400 underline hover:text-sky-300" {...props} />,
                code: ({node, className, children, ...props}) => {
                  const match = /language-(\w+)/.exec(className || '');
                  const isInline = !match && !className;
                  return isInline 
                    ? <code className="rounded bg-white/[0.08] px-1.5 py-0.5 text-[13px] text-white" {...props}>{children}</code>
                    : <pre className="my-3 overflow-auto rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white"><code {...props}>{children}</code></pre>;
                },
                blockquote: ({node, ...props}) => <blockquote className="my-3 border-l-4 border-white/20 bg-white/[0.04] px-4 py-2 italic text-white/70" {...props} />,
                table: ({node, ...props}) => <table className="my-3 w-full table-auto border-collapse text-white/80" {...props} />,
                th: ({node, ...props}) => <th className="border border-white/20 bg-white/[0.05] px-4 py-2 text-left text-white" {...props} />,
                td: ({node, ...props}) => <td className="border border-white/10 px-4 py-2" {...props} />,
              }}
            >
              {part.content}
            </ReactMarkdown>
          );
        } else {
          // Render tool calls with special styling
          // We don't need to check for specific formats anymore since we're using a combined regex
          // Just return null for all tool calls to prevent empty bubbles
          return null;
        }
      })}
    </>
  );
};
