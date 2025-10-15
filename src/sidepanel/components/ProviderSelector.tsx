import { faCog, faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useState } from 'react';
import { ConfigManager } from '../../background/configManager';
import { TokenTrackingService } from '../../tracking/tokenTrackingService';

interface ProviderOption {
  provider: string;
  displayName: string;
  models: {id: string, name: string}[];
}

interface ProviderSelectorProps {
  isProcessing: boolean;
  variant?: 'default' | 'compact';
}

export function ProviderSelector({ isProcessing, variant = 'default' }: ProviderSelectorProps) {
  const [options, setOptions] = useState<ProviderOption[]>([]);
  const [currentProvider, setCurrentProvider] = useState<string>('');
  const [currentModel, setCurrentModel] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Function to load provider options
  const loadOptions = async () => {
    setIsLoading(true);
    const configManager = ConfigManager.getInstance();
    
    // Get current config
    const config = await configManager.getProviderConfig();
    setCurrentProvider(config.provider);
    setCurrentModel(config.apiModelId || '');
    
    // Get configured providers
    const providers = await configManager.getConfiguredProviders();
    
    // Build options
    const providerOptions: ProviderOption[] = [];
    
    for (const provider of providers) {
      const models = await configManager.getModelsForProvider(provider);
      
      providerOptions.push({
        provider,
        displayName: formatProviderName(provider),
        models,
      });
    }
    
    setOptions(providerOptions);
    setIsLoading(false);
  };
  
  // Load options when component mounts
  useEffect(() => {
    loadOptions();
  }, []);
  
  // Listen for provider configuration changes
  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.action === 'providerConfigChanged') {
        console.log('Provider configuration changed, refreshing options');
        loadOptions();
      }
    };
    
    // Add the message listener
    chrome.runtime.onMessage.addListener(handleMessage);
    
    // Clean up the listener when the component unmounts
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);
  
  const formatProviderName = (provider: string) => {
    switch (provider) {
      case 'anthropic': return 'Anthropic';
      case 'openai': return 'OpenAI';
      case 'gemini': return 'Google';
      case 'ollama': return 'Ollama';
      case 'openai-compatible': return 'OpenAI Compatible';
      default: return provider;
    }
  };
  
  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const [provider, modelId] = value.split('|');
    
    if (provider && modelId) {
      setCurrentProvider(provider);
      setCurrentModel(modelId);
      
      // Update config
      const configManager = ConfigManager.getInstance();
      await configManager.updateProviderAndModel(provider, modelId);
      
      // Update token tracking service with new provider and model
      const tokenTracker = TokenTrackingService.getInstance();
      tokenTracker.updateProviderAndModel(provider, modelId);
      
      // Clear message history to ensure a clean state with the new provider
      try {
        await chrome.runtime.sendMessage({
          action: 'clearHistory'
        });
        
        // Show a message to the user
        chrome.runtime.sendMessage({
          action: 'updateOutput',
          content: {
            type: 'system',
            content: `Switched to ${formatProviderName(provider)} model: ${modelId}`
          }
        });
      } catch (error) {
        console.error('Error clearing history:', error);
      }
      
      // Reload the page to apply changes
      window.location.reload();
    }
  };
  
  if (isLoading || options.length === 0) {
    return null;
  }
  
  // Function to open options page in a new tab
  const openOptionsPage = () => {
    chrome.runtime.openOptionsPage();
  };
  
  // Function to open help documentation
  const openHelpPage = () => {
    window.open('https://parsaghaffari.github.io/browserbee/', '_blank');
  };

  const baseClasses =
    variant === 'compact'
      ? 'flex w-full items-center justify-between rounded-3xl border border-white/12 bg-[#111823] px-4 py-3 text-sm text-white/80 shadow-[0_25px_80px_-60px_rgba(0,0,0,1)]'
      : 'flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/70';

  const buttonClasses =
    variant === 'compact'
      ? 'flex h-9 w-9 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white transition hover:bg-white/15 disabled:opacity-40'
      : 'flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/[0.06] text-white/70 transition hover:text-white disabled:opacity-40';

  const selectClasses =
    variant === 'compact'
      ? 'appearance-none bg-transparent pr-8 text-sm font-medium text-white/90 outline-none transition focus:text-white disabled:opacity-40'
      : 'appearance-none bg-transparent pr-8 text-sm font-medium text-white/80 outline-none transition focus:text-white disabled:opacity-40';

  return (
    <div className={baseClasses}>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          className={buttonClasses}
          onClick={openOptionsPage}
          title="Open Settings"
          disabled={isProcessing}
        >
          <FontAwesomeIcon icon={faCog} />
        </button>
        <div className="relative min-w-[200px] flex-1">
          <select
            className={selectClasses}
            value={`${currentProvider}|${currentModel}`}
            onChange={handleChange}
            disabled={isProcessing}
          >
            {options.map((option) =>
              option.models.map((model) => (
                <option
                  key={`${option.provider}|${model.id}`}
                  value={`${option.provider}|${model.id}`}
                  className="bg-[#0f1621] text-white"
                >
                  {option.displayName} ・ {model.name}
                </option>
              ))
            )}
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-1 flex items-center text-white/30">
            ▾
          </span>
        </div>
      </div>
      <button
        className={buttonClasses}
        onClick={openHelpPage}
        title="Open Help"
        disabled={isProcessing}
      >
        <FontAwesomeIcon icon={faCircleInfo} />
      </button>
    </div>
  );
}
