import React, { useState, useRef, useEffect } from 'react';
import { 
  Terminal, 
  Zap, 
  Brain, 
  Eye, 
  Mic, 
  Video, 
  Image,
  ChevronRight,
  Activity,
  CheckCircle,
  AlertTriangle,
  Cpu,
  HardDrive,
  Wifi
} from 'lucide-react';
import { useNexus } from '../core/NexusContext';
import { useMCPTasks } from '../hooks/useMCPTasks';
import { ConsoleHeader } from './console/ConsoleHeader';
import { AIAgentStatus } from './console/AIAgentStatus';
import { SystemStatus } from './console/SystemStatus';
import { CommandInput } from './console/CommandInput';
import { WorkflowLibrary } from './console/WorkflowLibrary';
import { ConsoleLog } from './console/ConsoleLog';
import { mcpApiService, SystemStatus as MCPSystemStatus } from '../services/mcp'; // Import mcpApiService and SystemStatus type

interface AIAgent {
  name: string;
  icon: React.ElementType; // Use React.ElementType for Lucide icons
  status: 'ready' | 'busy' | 'offline' | 'processing';
  color: string;
  load: number;
  tasks: number;
}

export function MCPConsole() {
  const [command, setCommand] = useState('');
  const { tasks, isLoading, error, executeCommand, cancelTask, clearError } = useMCPTasks();
  const { trackInteraction } = useNexus();
  const logEndRef = useRef<HTMLDivElement>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [systemStatus, setSystemStatus] = useState<MCPSystemStatus | null>(null);

  useEffect(() => {
    const fetchSystemStatus = async () => {
      try {
        const status = await mcpApiService.getSystemStatus();
        setSystemStatus(status);
        setIsOnline(status.api_status === 'operational');
      } catch (err) {
        console.error('Failed to fetch system status:', err);
        setIsOnline(false);
      }
    };

    fetchSystemStatus();
    const interval = setInterval(fetchSystemStatus, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const [aiAgents, setAiAgents] = useState<AIAgent[]>([
    { name: 'Transcriber AI', icon: Mic, status: 'ready', color: 'emerald', load: 12, tasks: 0 },
    { name: 'Vision AI', icon: Eye, status: 'ready', color: 'blue', load: 8, tasks: 0 },
    { name: 'Audio AI', icon: Mic, status: 'ready', color: 'purple', load: 15, tasks: 0 },
    { name: 'Social Clip AI', icon: Video, status: 'ready', color: 'pink', load: 5, tasks: 0 },
    { name: 'Multi-Cam AI', icon: Video, status: 'ready', color: 'orange', load: 22, tasks: 0 },
    { name: 'Image AI', icon: Image, status: 'ready', color: 'cyan', load: 7, tasks: 0 },
  ]);

  const predefinedWorkflows = [
    {
      name: "The Podcast Workflow",
      command: 'MCP, execute "The Podcast Workflow": sync multi-cam, remove filler words, generate 3 teaser clips with animated captions',
      description: "Complete podcast production pipeline",
      workflow_type: "podcast"
    },
    {
      name: "Viral Moment Extraction",
      command: "MCP, analyze this content and extract the 5 most engaging moments for social media",
      description: "AI-powered viral content detection",
      workflow_type: "social"
    },
    {
      name: "Live-Switch Edit",
      command: "MCP, create a live-switched edit favoring the wide shot during crosstalk",
      description: "Intelligent multi-camera switching",
      workflow_type: "multicam"
    },
    {
      name: "Emotional Emphasis",
      command: "MCP, find the most emotional moment in this interview and emphasize it with music and color grading",
      description: "AI-driven emotional storytelling",
      workflow_type: "analysis"
    },
    {
      name: "Style Transfer",
      command: "MCP, re-edit this content in the style of a sci-fi trailer with dramatic pacing",
      description: "Creative style transformation",
      workflow_type: "style"
    }
  ];

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [tasks]);

  // Update agent status based on active tasks
  useEffect(() => {
    const activeTasks = tasks.filter(task => task.status === 'processing' || task.status === 'initiated');
    
    setAiAgents(prev => prev.map(agent => {
      const agentTasks = activeTasks.filter(task => 
        task.logs.some(log => log.includes(agent.name))
      );
      
      return {
        ...agent,
        status: agentTasks.length > 0 ? 'busy' : 'ready',
        tasks: agentTasks.length,
        load: agentTasks.length > 0 ? Math.floor(Math.random() * 40) + 30 : Math.floor(Math.random() * 20) + 5
      };
    }));
  }, [tasks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || isLoading) return;
    
    try {
      await executeCommand({ command });
      setCommand('');
    } catch (err) {
      console.error('Failed to execute command:', err);
    }
  };

  const executeWorkflow = async (workflow: { name: string; command: string; workflow_type: string }) => {
    try {
      trackInteraction({
        userId: 'current_user',
        module: 'console',
        action: 'execute_workflow',
        context: { workflow: workflow.name }
      });
      
      await executeCommand({
        command: workflow.command,
        workflow_type: workflow.workflow_type
      });
    } catch (err) {
      console.error('Failed to execute workflow:', err);
    }
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'command': return ChevronRight;
      case 'delegation': return Zap;
      case 'status': return Activity;
      case 'analysis': return Brain;
      case 'processing': return Cpu;
      case 'complete': return CheckCircle;
      case 'error': return AlertTriangle;
      default: return Terminal;
    }
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case 'command': return 'text-primary-400';
      case 'delegation': return 'text-secondary-400';
      case 'status': return 'text-accent-400';
      case 'analysis': return 'text-purple-400';
      case 'processing': return 'text-blue-400';
      case 'complete': return 'text-emerald-400';
      case 'error': return 'text-red-400';
      default: return 'text-neutral-400';
    }
  };

  const getAgentStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'text-emerald-400 bg-emerald-900/30';
      case 'busy': return 'text-yellow-400 bg-yellow-900/30';
      case 'processing': return 'text-blue-400 bg-blue-900/30';
      case 'offline': return 'text-red-400 bg-red-900/30';
      default: return 'text-neutral-400 bg-neutral-700';
    }
  };

  // Flatten all logs from all tasks for display
  const allLogs = tasks.flatMap(task => 
    task.logs.map((log, index) => ({
      id: `${task.task_id}-${index}`,
      timestamp: new Date(),
      type: task.status === 'completed' ? 'complete' : 
            task.status === 'error' ? 'error' : 
            task.status === 'processing' ? 'processing' : 'status',
      message: log,
      progress: task.progress,
      task_id: task.task_id
    }))
  ).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ConsoleHeader 
        isOnline={isOnline} 
        error={error} 
        onClearError={clearError} 
      />

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* AI Agents Status Panel */}
        <div className="xl:col-span-1">
          <AIAgentStatus 
            agents={aiAgents} 
            getAgentStatusColor={getAgentStatusColor} 
          />
          <SystemStatus 
            metrics={[
              { icon: Cpu, label: 'API Status', value: systemStatus?.api_status || 'Unknown', color: 'blue' },
              { icon: HardDrive, label: 'Redis Status', value: systemStatus?.redis_status || 'Unknown', color: 'green' },
              { icon: Wifi, label: 'Active Tasks', value: systemStatus?.active_task_count?.toString() || '0', color: 'purple' },
              { icon: Zap, label: 'Memory Usage', value: systemStatus?.redis_memory_usage || 'N/A', color: 'orange' }
            ]}
          />
        </div>

        {/* MCP Console */}
        <div className="xl:col-span-2">
          <ConsoleLog 
            logs={allLogs}
            isLoading={isLoading}
            tasks={tasks}
            getLogIcon={getLogIcon}
            getLogColor={getLogColor}
            onCancelTask={cancelTask}
            logEndRef={logEndRef}
          />
          <CommandInput 
            command={command}
            setCommand={setCommand}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            isOnline={isOnline}
          />
        </div>

        {/* Workflow Library */}
        <WorkflowLibrary 
          workflows={predefinedWorkflows}
          onExecuteWorkflow={executeWorkflow}
          isLoading={isLoading}
          isOnline={isOnline}
        />
      </div>
    </div>
  );
}
