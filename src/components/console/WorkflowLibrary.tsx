import React from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';

interface Workflow {
  name: string;
  description: string;
  command: string;
  workflow_type: string; // Add workflow_type
}

interface WorkflowLibraryProps {
  workflows: Workflow[];
  onExecuteWorkflow: (workflow: Workflow) => void;
  isLoading: boolean;
  isOnline: boolean;
}

export function WorkflowLibrary({ workflows, onExecuteWorkflow, isLoading, isOnline }: WorkflowLibraryProps) {
  return (
    <motion.div 
      className="xl:col-span-1"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.6 }}
    >
      <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-xl rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50 p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
          Workflow Library
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
          Pre-configured creative workflows for common production tasks
        </p>
        <div className="space-y-3">
          {workflows.map((workflow, index) => (
            <motion.button
              key={workflow.name}
              onClick={() => onExecuteWorkflow(workflow)}
              disabled={isLoading || !isOnline}
              className="w-full text-left p-4 rounded-xl bg-gradient-to-r from-neutral-50 to-neutral-100 dark:from-neutral-700 dark:to-neutral-600 hover:from-primary-50 hover:to-secondary-50 dark:hover:from-primary-900/20 dark:hover:to-secondary-900/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + index * 0.1 }}
              whileHover={{ scale: 1.02, x: 5 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-neutral-900 dark:text-white text-sm group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {workflow.name}
                </h4>
                <Play size={14} className="text-neutral-400 group-hover:text-primary-500 transition-colors" />
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-2">
                {workflow.description}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-500 italic">
                "{workflow.command.substring(0, 50)}..."
              </p>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
