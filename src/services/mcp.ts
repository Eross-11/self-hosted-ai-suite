const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface MCPCommand {
  command: string;
  workflow_type?: string;
  parameters?: Record<string, unknown>;
  model?: string;
  duration?: number;
  style?: string;
  aspect_ratio?: string;
}

interface MCPResponse {
  task_id: string;
  status: string;
  message: string;
  estimated_duration?: string;
  agents_deployed?: string[];
}

export interface TaskStatus {
  task_id: string;
  status: string;
  progress: number;
  current_step: string;
  logs: string[];
  result?: {
    primary_edit?: string;
    social_clips?: string[];
    audio_master?: string;
  metadata?: Record<string, unknown>;
  };
}

export interface SystemStatus {
  api_status: string;
  redis_status: string;
  active_task_count: number;
  redis_memory_usage: string;
  redis_connected_clients: string;
  uptime: string;
  websocket_connections?: {
    total_users: number;
    total_connections: number;
    users_online: string[];
  };
  storage_stats?: {
    total_files: number;
    total_size: number;
    categories: Record<string, { count: number; size: number }>;
  };
}

class APIService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          // In a real app, you'd redirect to login or refresh token
          throw new Error('Authentication required');
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // MCP Command Methods
  async executeMCPCommand(command: MCPCommand): Promise<MCPResponse> {
    return this.request<MCPResponse>('/mcp-command', {
      method: 'POST',
      body: JSON.stringify(command),
    });
  }

  // Task Management Methods
  async getTaskStatus(taskId: string): Promise<TaskStatus> {
    return this.request<TaskStatus>(`/task-status/${taskId}`);
  }

  async getActiveTasks(): Promise<{ active_tasks: TaskStatus[] }> {
    return this.request<{ active_tasks: TaskStatus[] }>('/active-tasks');
  }

  async cancelTask(taskId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/task/${taskId}`, {
      method: 'DELETE',
    });
  }

  // System Status Methods (Placeholder - will be implemented in backend)
  async getSystemStatus(): Promise<SystemStatus> {
    // This will eventually fetch from a real backend endpoint
    return {
      api_status: 'unknown',
      redis_status: 'unknown',
      active_task_count: 0,
      redis_memory_usage: 'N/A',
      redis_connected_clients: 'N/A',
      uptime: 'N/A',
    };
  }

  async healthCheck(): Promise<{ 
    message: string; 
    status: string; 
    redis_status: string; 
    version: string;
    features: string[];
  }> {
    return this.request('/');
  }
}

export const mcpApiService = new APIService();
