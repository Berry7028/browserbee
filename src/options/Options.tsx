import { useState, useEffect } from 'react';
import { Model } from './components/ModelList';
import { 
  anthropicModels, 
  openaiModels, 
  geminiModels, 
  ollamaModels,
  anthropicDefaultModelId,
  openaiDefaultModelId,
  geminiDefaultModelId,
  ollamaDefaultModelId
} from '../models/models';

// Import components
import { AboutSection } from './components/AboutSection';
import { LLMProviderConfig } from './components/LLMProviderConfig';
import { ModelPricingTable } from './components/ModelPricingTable';
import { MemoryManagement } from './components/MemoryManagement';

export function Options() {
  // Function to process and sort model pricing data
  const getModelPricingData = () => {
    const allModels = [
      ...Object.entries(anthropicModels).map(([id, model]) => ({ 
        id, provider: 'Anthropic', ...model 
      })),
      ...Object.entries(openaiModels).map(([id, model]) => ({ 
        id, provider: 'OpenAI', ...model 
      })),
      ...Object.entries(geminiModels).map(([id, model]) => ({ 
        id, provider: 'Google', ...model 
      })),
      ...Object.entries(ollamaModels).map(([id, model]) => ({ 
        id, provider: 'Ollama', ...model 
      }))
    ];
    
    // Sort by output price (cheapest first)
    return allModels.sort((a, b) => a.outputPrice - b.outputPrice);
  };
  
  // Provider selection
  const [provider, setProvider] = useState('anthropic');
  
  // Anthropic settings
  const [anthropicApiKey, setAnthropicApiKey] = useState('');
  const [anthropicBaseUrl, setAnthropicBaseUrl] = useState('');
  
  // OpenAI settings
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [openaiBaseUrl, setOpenaiBaseUrl] = useState('');
  
  // Gemini settings
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [geminiBaseUrl, setGeminiBaseUrl] = useState('');
  
  // Ollama settings
  const [ollamaApiKey, setOllamaApiKey] = useState('');
  const [ollamaBaseUrl, setOllamaBaseUrl] = useState('');
  
  // Model IDs - using defaults from models.ts
  const [anthropicModelId, setAnthropicModelId] = useState(anthropicDefaultModelId);
  const [openaiModelId, setOpenaiModelId] = useState(openaiDefaultModelId);
  const [geminiModelId, setGeminiModelId] = useState(geminiDefaultModelId);
  const [ollamaModelId, setOllamaModelId] = useState(ollamaDefaultModelId);
  
  // Common settings
  const [thinkingBudgetTokens, setThinkingBudgetTokens] = useState(0);
  
  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  
  // openai-compatible provider related state
  const [openaiCompatibleApiKey, setOpenaiCompatibleApiKey] = useState('');
  const [openaiCompatibleBaseUrl, setOpenaiCompatibleBaseUrl] = useState('');
  const [openaiCompatibleModelId, setOpenaiCompatibleModelId] = useState('');
  const [openaiCompatibleModels, setOpenaiCompatibleModels] = useState<Model[]>([]);
  const [newModel, setNewModel] = useState({ id: '', name: '', isReasoningModel: false });

  // Load saved settings when component mounts
  useEffect(() => {
    chrome.storage.sync.get({
      provider: 'anthropic',
      anthropicApiKey: '',
      anthropicModelId: anthropicDefaultModelId,
      anthropicBaseUrl: '',
      openaiApiKey: '',
      openaiModelId: openaiDefaultModelId,
      openaiBaseUrl: '',
      geminiApiKey: '',
      geminiModelId: geminiDefaultModelId,
      geminiBaseUrl: '',
      ollamaApiKey: '',
      ollamaModelId: ollamaDefaultModelId,
      ollamaBaseUrl: '',
      thinkingBudgetTokens: 0,
      openaiCompatibleApiKey: '',
      openaiCompatibleBaseUrl: '',
      openaiCompatibleModelId: '',
      openaiCompatibleModels: [],
    }, (result) => {
      setProvider(result.provider);
      setAnthropicApiKey(result.anthropicApiKey);
      setAnthropicModelId(result.anthropicModelId);
      setAnthropicBaseUrl(result.anthropicBaseUrl);
      setOpenaiApiKey(result.openaiApiKey);
      setOpenaiModelId(result.openaiModelId);
      setOpenaiBaseUrl(result.openaiBaseUrl);
      setGeminiApiKey(result.geminiApiKey);
      setGeminiModelId(result.geminiModelId);
      setGeminiBaseUrl(result.geminiBaseUrl);
      setOllamaApiKey(result.ollamaApiKey);
      setOllamaModelId(result.ollamaModelId);
      setOllamaBaseUrl(result.ollamaBaseUrl || '');
      setThinkingBudgetTokens(result.thinkingBudgetTokens);
      setOpenaiCompatibleApiKey(result.openaiCompatibleApiKey || '');
      setOpenaiCompatibleBaseUrl(result.openaiCompatibleBaseUrl || '');
      setOpenaiCompatibleModelId(result.openaiCompatibleModelId || '');
      setOpenaiCompatibleModels(result.openaiCompatibleModels || []);
    });
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    setSaveStatus('');

    chrome.storage.sync.set({
      provider,
      anthropicApiKey,
      anthropicModelId,
      anthropicBaseUrl,
      openaiApiKey,
      openaiModelId,
      openaiBaseUrl,
      geminiApiKey,
      geminiModelId,
      geminiBaseUrl,
      ollamaApiKey,
      ollamaModelId,
      ollamaBaseUrl,
      thinkingBudgetTokens,
      openaiCompatibleApiKey,
      openaiCompatibleBaseUrl,
      openaiCompatibleModelId,
      openaiCompatibleModels,
    }, () => {
      setIsSaving(false);
      setSaveStatus('Settings saved successfully!');
      
      // Clear status message after 3 seconds
      setTimeout(() => {
        setSaveStatus('');
      }, 3000);
    });
  };

  // openai-compatible model list operations
  const handleAddModel = () => {
    if (!newModel.id.trim() || !newModel.name.trim()) return;
    setOpenaiCompatibleModels([...openaiCompatibleModels, { ...newModel }]);
    setNewModel({ id: '', name: '', isReasoningModel: false });
  };
  
  const handleRemoveModel = (id: string) => {
    setOpenaiCompatibleModels(openaiCompatibleModels.filter(m => m.id !== id));
    if (openaiCompatibleModelId === id) setOpenaiCompatibleModelId('');
  };
  
  const handleEditModel = (idx: number, field: string, value: any) => {
    setOpenaiCompatibleModels(models => models.map((m, i) => i === idx ? { ...m, [field]: value } : m));
  };

  return (
    <div className="max-w-3xl mx-auto p-5 font-sans text-gray-800">
      <h1 className="text-2xl font-bold mb-6 text-primary">BrowserBee 🐝</h1>
      
      {/* About Section */}
      <AboutSection />
      
      {/* LLM Provider Configuration */}
      <LLMProviderConfig
        // Provider selection
        provider={provider}
        setProvider={setProvider}
        // Anthropic
        anthropicApiKey={anthropicApiKey}
        setAnthropicApiKey={setAnthropicApiKey}
        anthropicBaseUrl={anthropicBaseUrl}
        setAnthropicBaseUrl={setAnthropicBaseUrl}
        thinkingBudgetTokens={thinkingBudgetTokens}
        setThinkingBudgetTokens={setThinkingBudgetTokens}
        // OpenAI
        openaiApiKey={openaiApiKey}
        setOpenaiApiKey={setOpenaiApiKey}
        openaiBaseUrl={openaiBaseUrl}
        setOpenaiBaseUrl={setOpenaiBaseUrl}
        // Gemini
        geminiApiKey={geminiApiKey}
        setGeminiApiKey={setGeminiApiKey}
        geminiBaseUrl={geminiBaseUrl}
        setGeminiBaseUrl={setGeminiBaseUrl}
        // Ollama
        ollamaApiKey={ollamaApiKey}
        setOllamaApiKey={setOllamaApiKey}
        ollamaBaseUrl={ollamaBaseUrl}
        setOllamaBaseUrl={setOllamaBaseUrl}
        // OpenAI-compatible
        openaiCompatibleApiKey={openaiCompatibleApiKey}
        setOpenaiCompatibleApiKey={setOpenaiCompatibleApiKey}
        openaiCompatibleBaseUrl={openaiCompatibleBaseUrl}
        setOpenaiCompatibleBaseUrl={setOpenaiCompatibleBaseUrl}
        openaiCompatibleModelId={openaiCompatibleModelId}
        setOpenaiCompatibleModelId={setOpenaiCompatibleModelId}
        openaiCompatibleModels={openaiCompatibleModels}
        setOpenaiCompatibleModels={setOpenaiCompatibleModels}
        newModel={newModel}
        setNewModel={setNewModel}
        // Save functionality
        isSaving={isSaving}
        saveStatus={saveStatus}
        handleSave={handleSave}
        // Model operations
        handleAddModel={handleAddModel}
        handleRemoveModel={handleRemoveModel}
        handleEditModel={handleEditModel}
      />
      
      {/* Model Pricing Table */}
      <ModelPricingTable getModelPricingData={getModelPricingData} />
      
      {/* Memory Management */}
      <MemoryManagement />
    </div>
  );
}
