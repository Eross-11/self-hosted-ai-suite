import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNexus } from '../core/NexusContext';
import { geminiService } from '../services/GeminiService';
import { echoAI } from '../core/EchoAI';
import { 
  Settings, 
  Save, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertCircle,
  Brain,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import SupabaseApiKeys from '../components/SupabaseApiKeys';

export function SettingsPage() {
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [availableModels, setAvailableModels] = useState<Array<{name: string; displayName: string}>>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [geminiEnabled, setGeminiEnabled] = useState(echoAI.isGeminiEnabled());
  
  const { trackInteraction } = useNexus();
  
  useEffect(() => {
    // Load saved API key
    const savedKey = geminiService.getApiKey();
    if (savedKey) {
      setGeminiApiKey(savedKey);
      setGeminiEnabled(true);
    }
  }, []);
  
  const saveApiKey = async () => {
    try {
      geminiService.setApiKey(geminiApiKey);
      echoAI.setGeminiEnabled(true);
      setGeminiEnabled(true);
      setSaveStatus('success');
      
      trackInteraction({
        userId: 'current_user',
        module: 'settings',
        action: 'save_gemini_api_key',
        context: { success: true }
      });
      
      // Try to load models to verify the API key
      loadModels();
      
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error: unknown) {
      console.error('Failed to save API key:', error);
      setSaveStatus('error');
      
      trackInteraction({
        userId: 'current_user',
        module: 'settings',
        action: 'save_gemini_api_key',
        context: { success: false, error: error instanceof Error ? error.message : String(error) }
      });
      
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };
  
  const clearApiKey = () => {
    geminiService.clearApiKey();
    setGeminiApiKey('');
    echoAI.setGeminiEnabled(false);
    setGeminiEnabled(false);
    setAvailableModels([]);
    
    trackInteraction({
      userId: 'current_user',
      module: 'settings',
      action: 'clear_gemini_api_key',
      context: {}
    });
  };
  
  const loadModels = async () => {
    if (!geminiApiKey) return;
    
    setIsLoadingModels(true);
    try {
      const models = await geminiService.listModels();
      setAvailableModels(models.map(model => ({
        name: model.name,
        displayName: model.displayName
      })));
      
      trackInteraction({
        userId: 'current_user',
        module: 'settings',
        action: 'load_gemini_models',
        context: { success: true, modelCount: models.length }
      });
    } catch (error: unknown) {
      console.error('Failed to load models:', error);
      setSaveStatus('error');
      
      trackInteraction({
        userId: 'current_user',
        module: 'settings',
        action: 'load_gemini_models',
        context: { success: false, error: error instanceof Error ? error.message : String(error) }
      });
      
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsLoadingModels(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="flex items-center space-x-4 mb-4">
          <motion.div 
            className="w-16 h-16 bg-gradient-to-r from-neutral-500 via-neutral-600 to-neutral-700 rounded-3xl flex items-center justify-center"
            animate={{ 
              boxShadow: [
                "0 0 20px rgba(115, 115, 115, 0.5)",
                "0 0 40px rgba(115, 115, 115, 0.8)",
                "0 0 20px rgba(115, 115, 115, 0.5)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Settings size={32} className="text-white" />
          </motion.div>
          <div>
            <h1 className="text-4xl font-bold text-neutral-900 dark:text-white">
              Settings
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              Configure your AI models and platform preferences
            </p>
          </div>
        </div>
      </motion.div>

      <SupabaseApiKeys />
      
      {/* Google Gemini Configuration */}
      <motion.div 
        className="mb-8 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-xl rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50 p-6 shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <Sparkles size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
            Google Gemini Integration
          </h2>
        </div>
        
        <div className="space-y-6">
          {/* API Key Input */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Gemini API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="Enter your Google AI Studio API key"
                className="w-full pl-4 pr-10 py-3 rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                {showApiKey ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              Get your API key from the <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Google AI Studio</a>
            </p>
          </div>
          
          {/* Save Button */}
          <div className="flex items-center space-x-3">
            <motion.button
              onClick={saveApiKey}
              disabled={!geminiApiKey.trim() || saveStatus === 'success'}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Save size={18} />
              <span>Save API Key</span>
            </motion.button>
            
            <motion.button
              onClick={clearApiKey}
              disabled={!geminiApiKey.trim()}
              className="px-6 py-3 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium rounded-xl hover:bg-neutral-300 dark:hover:bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Clear
            </motion.button>
            
            {saveStatus === 'success' && (
              <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400">
                <CheckCircle size={18} />
                <span>API key saved successfully!</span>
              </div>
            )}
            
            {saveStatus === 'error' && (
              <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                <AlertCircle size={18} />
                <span>Failed to save API key. Please try again.</span>
              </div>
            )}
          </div>
          
          {/* Available Models */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Available Gemini Models
              </h3>
              <motion.button
                onClick={loadModels}
                disabled={!geminiApiKey.trim() || isLoadingModels}
                className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <RefreshCw size={16} className={isLoadingModels ? 'animate-spin' : ''} />
              </motion.button>
            </div>
            
            {availableModels.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {availableModels.map((model) => (
                  <div 
                    key={model.name}
                    className="p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg"
                  >
                    <div className="font-medium text-neutral-900 dark:text-white text-sm">
                      {model.displayName}
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      {model.name}
                    </div>
                  </div>
                ))}
              </div>
            ) : geminiEnabled ? (
              <div className="p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg text-center">
                <p className="text-neutral-600 dark:text-neutral-400">
                  {isLoadingModels ? 'Loading available models...' : 'Click refresh to load available models'}
                </p>
              </div>
            ) : (
              <div className="p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg text-center">
                <p className="text-neutral-600 dark:text-neutral-400">
                  Save your API key to see available models
                </p>
              </div>
            )}
          </div>
          
          {/* Echo AI Integration */}
          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Brain size={18} className="text-neutral-600 dark:text-neutral-400" />
                <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Enable Echo AI + Gemini Integration
                </h3>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  id="gemini-toggle"
                  checked={geminiEnabled}
                  onChange={(e) => {
                    const enabled = e.target.checked;
                    setGeminiEnabled(enabled);
                    echoAI.setGeminiEnabled(enabled);
                    
                    trackInteraction({
                      userId: 'current_user',
                      module: 'settings',
                      action: 'toggle_gemini_integration',
                      context: { enabled }
                    });
                  }}
                  disabled={!geminiApiKey.trim()}
                  className="sr-only"
                />
                <label
                  htmlFor="gemini-toggle"
                  className={`block w-14 h-7 rounded-full transition-colors duration-300 ease-in-out cursor-pointer ${
                    geminiEnabled ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-600'
                  } ${!geminiApiKey.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <motion.span
                    className="block w-5 h-5 mt-1 ml-1 bg-white rounded-full shadow"
                    animate={{ x: geminiEnabled ? 7 : 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  />
                </label>
              </div>
            </div>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              When enabled, Echo AI will use Gemini to enhance its learning, insights, and suggestions
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
