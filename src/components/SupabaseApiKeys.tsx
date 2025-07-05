import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Key, Copy, Check } from 'lucide-react';

const SupabaseApiKeys = () => {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (key: string, type: string) => {
    navigator.clipboard.writeText(key);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your_supabase_anon_key';
  const serviceKeyPlaceholder = 'service_role_key_placeholder_not_exposed_to_client';

  return (
    <motion.div
      className="mb-8 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-xl rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50 p-6 shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
          <Key size={20} className="text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
          API Keys
        </h2>
      </div>

      <div className="space-y-4">
        {/* Anon Key */}
        <div className="p-4 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm text-neutral-700 dark:text-neutral-300">anon</span>
                <span className="text-xs font-semibold text-white bg-green-500 px-2 py-0.5 rounded-full">public</span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Last request was 20 minutes ago.</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-sm text-neutral-500 dark:text-neutral-400 truncate max-w-xs">{anonKey}</span>
              <button onClick={() => handleCopy(anonKey, 'anon')} className="p-2 text-neutral-500 hover:text-neutral-700 dark:hover:text-white">
                {copied === 'anon' ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
              </button>
            </div>
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-2">
            This key is safe to use in a browser if you have enabled Row Level Security for your tables and configured policies. Prefer using Secret API keys instead.
          </p>
        </div>

        {/* Service Role Key */}
        <div className="p-4 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm text-neutral-700 dark:text-neutral-300">service_role</span>
                <span className="text-xs font-semibold text-white bg-red-500 px-2 py-0.5 rounded-full">secret</span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">No requests in the past 24 hours.</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-sm text-neutral-500 dark:text-neutral-400">******************</span>
              <button onClick={() => handleCopy(serviceKeyPlaceholder, 'service')} className="p-2 text-neutral-500 hover:text-neutral-700 dark:hover:text-white">
                {copied === 'service' ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
              </button>
            </div>
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-2">
            This key has the ability to bypass Row Level Security. Never share it publicly. If leaked, generate a new JWT secret immediately. Prefer using Publishable API keys instead.
          </p>
        </div>
      </div>

      {/* Disable Legacy API Keys */}
      <div className="mt-6 pt-6 border-t border-neutral-200/50 dark:border-neutral-700/50">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-neutral-800 dark:text-neutral-200">Disable legacy API keys</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Make sure you are no longer using your legacy API keys before proceeding.</p>
          </div>
          <button className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
            Disable JWT-based API keys
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default SupabaseApiKeys;
