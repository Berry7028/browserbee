import { faSync } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState, useEffect } from 'react';

interface TabStatusBarProps {
  tabId: number | null;
  tabTitle: string;
  tabStatus: 'attached' | 'detached' | 'unknown' | 'running' | 'idle' | 'error';
  variant?: 'inline' | 'card';
}

export const TabStatusBar: React.FC<TabStatusBarProps> = ({
  tabId,
  tabTitle,
  tabStatus,
  variant = 'card'
}) => {
  const [tabUrl, setTabUrl] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Listen for URL changes only
  useEffect(() => {
    if (!tabId) return;
    
    const statusListener = (
      message: any,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: any) => void
    ) => {
      // Ignore messages from other extensions
      if (sender.id !== chrome.runtime.id) {
        return;
      }
      
      // Only process messages for our tab
      if (message.tabId !== tabId) {
        return;
      }
      
      // Update URL based on message type
      if (message.action === 'targetChanged' && message.url) {
        setTabUrl(message.url);
        sendResponse({ received: true });
      }
      
      return true;
    };
    
    // Add the message listener
    chrome.runtime.onMessage.addListener(statusListener);
    
    // Get initial tab URL
    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime.lastError) {
        console.error('Error getting tab:', chrome.runtime.lastError);
        return;
      }
      
      if (tab && tab.url) {
        setTabUrl(tab.url);
      }
    });
    
    // Clean up the listener when the component unmounts
    return () => {
      chrome.runtime.onMessage.removeListener(statusListener);
    };
  }, [tabId]);
  
  if (!tabId) return null;
  
  const handleTabClick = () => {
    // Send message to background script to switch to this tab
    chrome.runtime.sendMessage({ 
      action: 'switchToTab', 
      tabId 
    });
  };
  
  const handleRefresh = () => {
    setIsRefreshing(true);
    
    // Show a message to the user
    chrome.runtime.sendMessage({
      action: 'updateOutput',
      content: {
        type: 'system',
        content: 'Refreshing connection to tab...'
      }
    });
    
    // Reload the page to reinitialize tab connection
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };
  
  const containerClasses =
    variant === 'inline'
      ? 'flex w-full items-center justify-between gap-3 rounded-3xl border border-white/12 bg-[#1a1a1a] px-5 py-3 text-sm text-white/80 shadow-[0_25px_80px_-60px_rgba(0,0,0,1)]'
      : 'flex max-w-[240px] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2 text-xs text-white/70 backdrop-blur';

  const titleClasses =
    variant === 'inline'
      ? 'flex-1 truncate text-left text-white/85 transition hover:text-white font-medium'
      : 'flex-1 truncate text-left text-white/80 transition hover:text-white';

  const buttonClasses =
    variant === 'inline'
      ? 'flex h-9 w-9 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white transition hover:bg-white/18 disabled:opacity-40'
      : 'flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-white transition hover:bg-white/[0.18] disabled:opacity-50';

  const dotClasses =
    variant === 'inline'
      ? 'h-2.5 w-2.5 rounded-full'
      : 'h-2.5 w-2.5 rounded-full';

  return (
    <div className={containerClasses}>
      <span
        className={`${dotClasses} ${
          tabStatus === 'attached'
            ? 'bg-white animate-pulse'
            : tabStatus === 'detached'
            ? 'bg-white/30'
            : tabStatus === 'running'
            ? 'bg-white animate-pulse'
            : tabStatus === 'idle'
            ? 'bg-white/60'
            : tabStatus === 'error'
            ? 'bg-white/40 animate-pulse'
            : 'bg-white/20'
        }`}
        title={
          tabStatus === 'attached'
            ? 'Connected'
            : tabStatus === 'detached'
            ? 'Disconnected'
            : tabStatus === 'running'
            ? 'Agent Running'
            : tabStatus === 'idle'
            ? 'Agent Idle'
            : tabStatus === 'error'
            ? 'Agent Error'
            : 'Unknown'
        }
      />
      <button
        className={titleClasses}
        onClick={handleTabClick}
        title={`${tabTitle}${tabUrl ? `\n${tabUrl}` : ''}`}
      >
        {tabTitle}
      </button>
      <button
        className={buttonClasses}
        onClick={handleRefresh}
        disabled={isRefreshing}
        title="Attach to current tab"
      >
        <FontAwesomeIcon
          icon={faSync}
          className={isRefreshing ? 'animate-spin' : ''}
          size="xs"
        />
      </button>
    </div>
  );
};
