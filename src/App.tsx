import React, { useState, lazy, Suspense, useEffect } from 'react';
import { EnhancedLayout } from './components/EnhancedLayout';
import { EnhancedHero } from './components/EnhancedHero';

// Lazy load components that aren't needed on initial render
const Dashboard = lazy(() => import('./components/Dashboard').then(module => ({ default: module.Dashboard })));
const MCPConsole = lazy(() => import('./components/MCPConsole').then(module => ({ default: module.MCPConsole })));
const ContentStudio = lazy(() => import('./components/ContentStudio').then(module => ({ default: module.ContentStudio })));
const ContentLibrary = lazy(() => import('./components/ContentLibrary').then(module => ({ default: module.ContentLibrary })));
const NeuralCommandInterface = lazy(() => import('./components/NeuralCommandInterface').then(module => ({ default: module.NeuralCommandInterface })));
const AIWorkflowOrchestrator = lazy(() => import('./components/AIWorkflowOrchestrator').then(module => ({ default: module.AIWorkflowOrchestrator })));
const ModelHub = lazy(() => import('./components/ModelHub').then(module => ({ default: module.ModelHub })));
const TheHive = lazy(() => import('./components/TheHive').then(module => ({ default: module.TheHive })));
const AIPersona = lazy(() => import('./components/AIPersona').then(module => ({ default: module.AIPersona })));

import { PersonaProvider } from './components/PersonaProvider';
import { NexusProvider } from './core/NexusContext';
import { WorkspaceProvider } from './contexts/WorkspaceContext';
import { WorkspaceSelector } from './components/WorkspaceSelector';
import { LoginForm } from './components/LoginForm';
import { LoadingAnimation } from './components/LoadingAnimation';
import { CommandAction } from './components/CommandPalette';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { useAuth } from './hooks/useAuth';
import { useWebSocket } from './hooks/useWebSocket';

// Lazy load pages
const FileUploadPage = lazy(() => import('./pages/FileUploadPage').then(module => ({ default: module.FileUploadPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(module => ({ default: module.SettingsPage })));
const SocialCommandPage = lazy(() => import('./pages/SocialCommandPage').then(module => ({ default: module.SocialCommandPage })));
const Marketplace = lazy(() => import('./modules/Strategy/Marketplace').then(module => ({ default: module.Marketplace })));
const Analytics = lazy(() => import('./modules/Social/Analytics').then(module => ({ default: module.Analytics })));
const SupportCenter = lazy(() => import('./modules/Support/SupportCenter').then(module => ({ default: module.SupportCenter })));
const TeamSettingsPage = lazy(() => import('./pages/TeamSettingsPage').then(module => ({ default: module.TeamSettingsPage })));
const BillingPage = lazy(() => import('./pages/BillingPage').then(module => ({ default: module.BillingPage })));
const WorkspaceSettingsPage = lazy(() => import('./pages/WorkspaceSettingsPage').then(module => ({ default: module.WorkspaceSettingsPage })));

import { 
  Home, 
  Brain,
  LayoutDashboard, 
  Wand2, 
  FolderOpen, 
  Share2, 
  Settings,
  ChevronLeft,
  Upload,
  LogOut,
  Atom,
  Workflow,
  Clock,
  Package,
  UserCog,
  Store,
  BarChart3,
  HelpCircle,
  Sparkles,
  Users,
  CreditCard,
  Building
} from 'lucide-react';

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const { user, isLoading: authLoading, logout, isAuthenticated } = useAuth();
  const { isConnected } = useWebSocket();

  useEffect(() => {
    if (isAuthenticated) {
      setCurrentView('dashboard');
    }
  }, [isAuthenticated]);

  // Define application commands for the command palette
  const commands: CommandAction[] = [
    // Navigation Commands
    {
      id: 'nav-home',
      name: 'Go to Home',
      description: 'Navigate to the main dashboard',
      category: 'Navigation',
      icon: Home,
      keywords: ['home', 'dashboard', 'main'],
      action: () => setCurrentView('home'),
      shortcut: '⌘1'
    },
    {
      id: 'nav-dashboard',
      name: 'Open Dashboard',
      description: 'View Echo AI command center and system metrics',
      category: 'Navigation',
      icon: LayoutDashboard,
      keywords: ['dashboard', 'metrics', 'overview', 'echo'],
      action: () => setCurrentView('dashboard'),
      shortcut: '⌘2'
    },
    {
      id: 'nav-neural',
      name: 'Neural Interface',
      description: 'Access advanced AI-powered natural language processing',
      category: 'Navigation',
      icon: Atom,
      keywords: ['neural', 'ai', 'nlp', 'interface'],
      action: () => setCurrentView('neural'),
      shortcut: '⌘3'
    },
    {
      id: 'nav-workflow',
      name: 'AI Workflows',
      description: 'Orchestrate intelligent automation workflows',
      category: 'Navigation',
      icon: Workflow,
      keywords: ['workflow', 'automation', 'orchestrator'],
      action: () => setCurrentView('workflow'),
      shortcut: '⌘4'
    },
    {
      id: 'nav-models',
      name: 'Model Hub',
      description: 'Discover and manage AI models',
      category: 'Navigation',
      icon: Package,
      keywords: ['models', 'hub', 'ai', 'download'],
      action: () => setCurrentView('models'),
      shortcut: '⌘5'
    },
    {
      id: 'nav-marketplace',
      name: 'Nexus Marketplace',
      description: 'Discover and purchase AI models, workflows, and agents',
      category: 'Navigation',
      icon: Store,
      keywords: ['marketplace', 'store', 'purchase', 'buy', 'models', 'workflows'],
      action: () => setCurrentView('marketplace'),
      shortcut: '⌘M'
    },
    {
      id: 'nav-hive',
      name: 'The Hive',
      description: 'Deploy autonomous content swarm agents',
      category: 'Navigation',
      icon: Brain,
      keywords: ['hive', 'swarm', 'autonomous', 'agents'],
      action: () => setCurrentView('hive'),
      shortcut: '⌘6'
    },
    {
      id: 'nav-mcp',
      name: 'MCP Console',
      description: 'Master Control Program terminal interface',
      category: 'Navigation',
      icon: Brain,
      keywords: ['mcp', 'console', 'terminal', 'command'],
      action: () => setCurrentView('mcp'),
      shortcut: '⌘7'
    },
    {
      id: 'nav-studio',
      name: 'Content Studio',
      description: 'AI-powered video generation and editing',
      category: 'Navigation',
      icon: Wand2,
      keywords: ['studio', 'content', 'video', 'generation'],
      action: () => setCurrentView('studio'),
      shortcut: '⌘8'
    },
    {
      id: 'nav-timeline',
      name: 'Video Timeline',
      description: 'Professional video editing timeline',
      category: 'Navigation',
      icon: Clock,
      keywords: ['timeline', 'video', 'editing', 'professional'],
      action: () => setCurrentView('timeline'),
      shortcut: '⌘9'
    },
    {
      id: 'nav-library',
      name: 'Content Library',
      description: 'Manage your AI-generated and uploaded content',
      category: 'Navigation',
      icon: FolderOpen,
      keywords: ['library', 'content', 'files', 'media'],
      action: () => setCurrentView('library')
    },
    {
      id: 'nav-upload',
      name: 'File Upload',
      description: 'Upload media files for processing',
      category: 'Navigation',
      icon: Upload,
      keywords: ['upload', 'files', 'media', 'import'],
      action: () => setCurrentView('upload')
    },
    {
      id: 'nav-social',
      name: 'Social Command',
      description: 'AI-powered social media management',
      category: 'Navigation',
      icon: Share2,
      keywords: ['social', 'media', 'posting', 'scheduling'],
      action: () => setCurrentView('social')
    },
    {
      id: 'nav-analytics',
      name: 'Strategic Analytics',
      description: 'Deep insights and social listening dashboard',
      category: 'Navigation',
      icon: BarChart3,
      keywords: ['analytics', 'insights', 'social', 'listening', 'metrics'],
      action: () => setCurrentView('analytics')
    },
    {
      id: 'nav-support',
      name: 'Support Center',
      description: 'Get help, tutorials, and community support',
      category: 'Navigation',
      icon: HelpCircle,
      keywords: ['support', 'help', 'tutorials', 'community'],
      action: () => setCurrentView('support')
    },
    {
      id: 'nav-settings',
      name: 'Settings',
      description: 'Configure your AI models and infrastructure',
      category: 'Navigation',
      icon: Settings,
      keywords: ['settings', 'config', 'preferences'],
      action: () => setCurrentView('settings')
    },
    {
      id: 'nav-team',
      name: 'Team Settings',
      description: 'Manage team members and permissions',
      category: 'Navigation',
      icon: Users,
      keywords: ['team', 'members', 'permissions', 'invites'],
      action: () => setCurrentView('team'),
    },
    {
      id: 'nav-billing',
      name: 'Billing & Subscription',
      description: 'Manage your subscription and payment details',
      category: 'Navigation',
      icon: CreditCard,
      keywords: ['billing', 'subscription', 'payment', 'plan'],
      action: () => setCurrentView('billing'),
    },
    {
      id: 'nav-workspace',
      name: 'Workspace Settings',
      description: 'Configure your workspace settings',
      category: 'Navigation',
      icon: Building,
      keywords: ['workspace', 'organization', 'company'],
      action: () => setCurrentView('workspace'),
    },
    {
      id: 'nav-persona',
      name: 'AI Persona',
      description: 'Manage your personal AI director that learns your style',
      category: 'AI',
      icon: UserCog,
      keywords: ['persona', 'ai', 'learning', 'style', 'preferences'],
      action: () => setCurrentView('persona')
    },

    // AI Actions
    {
      id: 'ai-generate-video',
      name: 'Generate Video',
      description: 'Create AI-generated video content',
      category: 'AI',
      icon: Wand2,
      keywords: ['generate', 'video', 'ai', 'create'],
      action: () => {
        setCurrentView('studio');
      }
    },
    {
      id: 'ai-start-hive',
      name: 'Deploy Hive Campaign',
      description: 'Start an autonomous content creation campaign',
      category: 'AI',
      icon: Brain,
      keywords: ['hive', 'campaign', 'autonomous', 'deploy'],
      action: () => {
        setCurrentView('hive');
      }
    },
    {
      id: 'ai-neural-command',
      name: 'Neural Command',
      description: 'Execute natural language AI command',
      category: 'AI',
      icon: Atom,
      keywords: ['neural', 'command', 'nlp', 'ai'],
      action: () => setCurrentView('neural')
    },
    {
      id: 'ai-echo-analyze',
      name: 'Echo Pattern Analysis',
      description: 'Analyze your workflow patterns with Echo AI',
      category: 'AI',
      icon: Sparkles,
      keywords: ['echo', 'analyze', 'patterns', 'ai', 'learning'],
      action: () => setCurrentView('persona')
    },

    // Quick Actions
    {
      id: 'action-logout',
      name: 'Sign Out',
      description: 'Log out of your account',
      category: 'Actions',
      icon: LogOut,
      keywords: ['logout', 'signout', 'exit'],
      action: logout
    },
    {
      id: 'action-toggle-sidebar',
      name: 'Toggle Sidebar',
      description: 'Show or hide the navigation sidebar',
      category: 'Actions',
      icon: ChevronLeft,
      keywords: ['sidebar', 'navigation', 'toggle'],
      action: () => setSidebarCollapsed(!sidebarCollapsed)
    }
  ];

  const navigation = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'neural', label: 'Neural Interface', icon: Atom },
    { id: 'workflow', label: 'AI Workflows', icon: Workflow },
    { id: 'models', label: 'Model Hub', icon: Package },
    { id: 'marketplace', label: 'Marketplace', icon: Store },
    { id: 'hive', label: 'The Hive', icon: Brain },
    { id: 'mcp', label: 'MCP Console', icon: Brain },
    { id: 'studio', label: 'Content Studio', icon: Wand2 },
    { id: 'timeline', label: 'Video Timeline', icon: Clock },
    { id: 'library', label: 'Library', icon: FolderOpen },
    { id: 'upload', label: 'File Upload', icon: Upload },
    { id: 'social', label: 'Social Command', icon: Share2 },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'support', label: 'Support', icon: HelpCircle },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'team', label: 'Team Settings', icon: Users },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'workspace', label: 'Workspace', icon: Building },
    { id: 'persona', label: 'AI Persona', icon: UserCog },
  ];

  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 flex items-center justify-center">
        <LoadingAnimation message="Initializing Nexus..." />
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return <EnhancedHero />; // Keep this non-lazy as it's the landing page
      case 'dashboard':
        return (
          <Suspense fallback={<LoadingAnimation message="Loading Dashboard..." />}>
            <Dashboard />
          </Suspense>
        );
      case 'neural':
        return (
          <Suspense fallback={<LoadingAnimation message="Loading Neural Interface..." />}>
            <NeuralCommandInterface />
          </Suspense>
        );
      case 'workflow':
        return (
          <Suspense fallback={<LoadingAnimation message="Loading Workflow Orchestrator..." />}>
            <AIWorkflowOrchestrator />
          </Suspense>
        );
      case 'models':
        return (
          <Suspense fallback={<LoadingAnimation message="Loading Model Hub..." />}>
            <ModelHub />
          </Suspense>
        );
      case 'marketplace':
        return (
          <Suspense fallback={<LoadingAnimation message="Loading Marketplace..." />}>
            <Marketplace />
          </Suspense>
        );
      case 'hive':
        return (
          <Suspense fallback={<LoadingAnimation message="Loading The Hive..." />}>
            <TheHive />
          </Suspense>
        );
      case 'mcp':
        return (
          <Suspense fallback={<LoadingAnimation message="Loading MCP Console..." />}>
            <MCPConsole />
          </Suspense>
        );
      case 'studio':
        return (
          <Suspense fallback={<LoadingAnimation message="Loading Content Studio..." />}>
            <ContentStudio />
          </Suspense>
        );
      case 'timeline':
        return (
          <Suspense fallback={<LoadingAnimation message="Loading Video Timeline..." />}>
            {/* VideoTimelinePage removed for debugging login */}
            <div className="p-4 text-neutral-500 dark:text-neutral-400">Video Timeline functionality temporarily disabled for debugging.</div>
          </Suspense>
        );
      case 'library':
        return (
          <Suspense fallback={<LoadingAnimation message="Loading Content Library..." />}>
            <ContentLibrary />
          </Suspense>
        );
      case 'upload':
        return (
          <Suspense fallback={<LoadingAnimation message="Loading File Upload..." />}>
            <FileUploadPage />
          </Suspense>
        );
      case 'social':
        return (
          <Suspense fallback={<LoadingAnimation message="Loading Social Command..." />}>
            <SocialCommandPage />
          </Suspense>
        );
      case 'analytics':
        return (
          <Suspense fallback={<LoadingAnimation message="Loading Analytics..." />}>
            <Analytics />
          </Suspense>
        );
      case 'support':
        return (
          <Suspense fallback={<LoadingAnimation message="Loading Support Center..." />}>
            <SupportCenter />
          </Suspense>
        );
      case 'team':
        return (
          <Suspense fallback={<LoadingAnimation message="Loading Team Settings..." />}>
            <TeamSettingsPage />
          </Suspense>
        );
      case 'billing':
        return (
          <Suspense fallback={<LoadingAnimation message="Loading Billing..." />}>
            <BillingPage />
          </Suspense>
        );
      case 'workspace':
        return (
          <Suspense fallback={<LoadingAnimation message="Loading Workspace Settings..." />}>
            <WorkspaceSettingsPage />
          </Suspense>
        );
      case 'settings':
        return (
          <Suspense fallback={<LoadingAnimation message="Loading Settings..." />}>
            <SettingsPage />
          </Suspense>
        );
      case 'persona':
        return (
          <Suspense fallback={<LoadingAnimation message="Loading AI Persona..." />}>
            <AIPersona />
          </Suspense>
        );
      default:
        return <EnhancedHero />;
    }
  };

  return (
    <NexusProvider>
      <PersonaProvider>
        <WorkspaceProvider>
          <WorkspaceSelector />
          <EnhancedLayout 
            commands={commands}
            onNavigate={setCurrentView}
          >
            <div className="flex">
              {/* Sidebar */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileHover={{ 
                  opacity: 1, 
                  scale: 1,
                  background: [
                    "linear-gradient(90deg, rgba(99, 102, 241, 0.1) 0%, rgba(20, 184, 166, 0.1) 100%)",
                    "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(20, 184, 166, 0.15) 100%)",
                    "linear-gradient(90deg, rgba(99, 102, 241, 0.1) 0%, rgba(20, 184, 166, 0.1) 100%)"
                  ]
                }}
                transition={{ 
                  duration: 0.3,
                  background: { duration: 2, repeat: Infinity }
                }}
              >
                <Sidebar
                  sidebarCollapsed={sidebarCollapsed}
                  setSidebarCollapsed={setSidebarCollapsed}
                  navigation={navigation}
                  currentView={currentView}
                  setCurrentView={setCurrentView}
                  user={user}
                  isConnected={isConnected}
                  logout={logout}
                />
              </motion.div>

              {/* Main Content */}
              <motion.main 
                className={`flex-1 transition-all duration-300 ${
                  sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
                }`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentView}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {renderContent()}
                  </motion.div>
                </AnimatePresence>
              </motion.main>
            </div>
            <MobileNav 
              navigation={navigation}
              currentView={currentView}
              setCurrentView={setCurrentView}
            />
          </EnhancedLayout>
        </WorkspaceProvider>
      </PersonaProvider>
    </NexusProvider>
  );
}

export default App;
