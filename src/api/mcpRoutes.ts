import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticateUser } from '../middleware/authMiddleware.js'; // Import the new middleware

const router = express.Router();

// Mock data for tasks
let mockTasks = [];

/**
 * Execute MCP command
 */
router.post('/mcp-command', authenticateUser, async (req, res) => {
  const { command, workflow_type, parameters, model, duration, style, aspect_ratio } = req.body;

  if (!command) {
    return res.status(400).json({ error: 'Command is required' });
  }

  const taskId = uuidv4();
  const newTask = {
    task_id: taskId,
    status: 'initiated',
    progress: 0,
    current_step: 'Initializing MCP directive...',
    logs: [`[${new Date().toLocaleTimeString()}] MCP directive received: ${command}`],
    timestamp: new Date().toISOString(),
    command_details: { command, workflow_type, parameters, model, duration, style, aspect_ratio }
  };

  mockTasks.push(newTask);

  // Simulate task progression
  setTimeout(() => {
    const taskIndex = mockTasks.findIndex(t => t.task_id === taskId);
    if (taskIndex !== -1) {
      mockTasks[taskIndex].status = 'processing';
      mockTasks[taskIndex].progress = 25;
      mockTasks[taskIndex].current_step = 'Processing with AI agents...';
      mockTasks[taskIndex].logs.push(`[${new Date().toLocaleTimeString()}] Processing with AI agents...`);
    }
  }, 2000);

  setTimeout(() => {
    const taskIndex = mockTasks.findIndex(t => t.task_id === taskId);
    if (taskIndex !== -1) {
      mockTasks[taskIndex].status = 'completed';
      mockTasks[taskIndex].progress = 100;
      mockTasks[taskIndex].current_step = 'Task completed successfully';
      mockTasks[taskIndex].logs.push(`[${new Date().toLocaleTimeString()}] Task completed successfully`);
      mockTasks[taskIndex].result = { message: 'Command executed successfully' };
    }
  }, 5000);

  return res.status(200).json({
    task_id: taskId,
    status: 'initiated',
    message: 'MCP directive received and processing initiated',
    estimated_duration: '5 seconds',
    agents_deployed: ['Mock AI Agent']
  });
});

/**
 * Get task status
 */
router.get('/task-status/:taskId', authenticateUser, (req, res) => {
  const { taskId } = req.params;
  const task = mockTasks.find(t => t.task_id === taskId);

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  return res.status(200).json(task);
});

/**
 * Get all active tasks
 */
router.get('/active-tasks', authenticateUser, (req, res) => {
  const activeTasks = mockTasks.filter(t => t.status !== 'completed' && t.status !== 'error');
  return res.status(200).json({ active_tasks: activeTasks });
});

/**
 * Cancel task
 */
router.delete('/task/:taskId', authenticateUser, (req, res) => {
  const { taskId } = req.params;
  const initialLength = mockTasks.length;
  mockTasks = mockTasks.filter(t => t.task_id !== taskId);

  if (mockTasks.length < initialLength) {
    return res.status(200).json({ message: 'Task cancelled successfully' });
  } else {
    return res.status(404).json({ error: 'Task not found' });
  }
});

export default router;
