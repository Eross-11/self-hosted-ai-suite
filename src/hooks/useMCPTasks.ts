import { useState, useEffect, useCallback } from 'react';
import { mcpApiService, TaskStatus, MCPCommand } from '../services/mcp';

interface MCPTask extends TaskStatus {
  timestamp: string;
}

export function useMCPTasks() {
  const [tasks, setTasks] = useState<MCPTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch active tasks
  const fetchActiveTasks = useCallback(async () => {
    try {
      const response = await mcpApiService.getActiveTasks();
      setTasks(response.active_tasks.map(task => ({
        ...task,
        timestamp: new Date().toISOString()
      })));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
      console.error('Failed to fetch active tasks:', err);
    }
  }, []);

  // Execute MCP command
  const executeCommand = useCallback(async (command: MCPCommand) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await mcpApiService.executeMCPCommand(command);
      
      // Add the new task to the list
      const newTask: MCPTask = {
        task_id: response.task_id,
        status: response.status,
        progress: 0,
        current_step: 'Initializing',
        logs: [`MCP directive received: ${command.command}`],
        timestamp: new Date().toISOString()
      };
      
      setTasks(prev => [newTask, ...prev]);
      
      // Start polling for this task
      pollTaskStatus(response.task_id);
      
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute command');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Poll task status
  const pollTaskStatus = useCallback(async (taskId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const status = await mcpApiService.getTaskStatus(taskId);
        
        setTasks(prev => prev.map(task => 
          task.task_id === taskId 
            ? { ...status, timestamp: task.timestamp }
            : task
        ));

        // Stop polling if task is completed or failed
        if (status.status === 'completed' || status.status === 'error') {
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.error(`Failed to poll task ${taskId}:`, err);
        clearInterval(pollInterval);
      }
    }, 1000); // Poll every second

    // Cleanup after 10 minutes
    setTimeout(() => clearInterval(pollInterval), 10 * 60 * 1000);
  }, []);

  // Cancel task
  const cancelTask = useCallback(async (taskId: string) => {
    try {
      await mcpApiService.cancelTask(taskId);
      setTasks(prev => prev.filter(task => task.task_id !== taskId));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel task');
      throw err;
    }
  }, []);

  // Get task by ID
  const getTask = useCallback((taskId: string) => {
    return tasks.find(task => task.task_id === taskId);
  }, [tasks]);

  // Initial fetch
  useEffect(() => {
    fetchActiveTasks();
  }, [fetchActiveTasks]);

  return {
    tasks,
    isLoading,
    error,
    executeCommand,
    cancelTask,
    getTask,
    refreshTasks: fetchActiveTasks,
    clearError: () => setError(null)
  };
}
