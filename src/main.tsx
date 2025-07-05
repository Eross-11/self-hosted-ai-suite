import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { NexusProvider } from './core/NexusContext';
import './index.css';
import * as Sentry from '@sentry/react';

// Sentry error monitoring for production
if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      Sentry.consoleLoggingIntegration({ levels: ['log', 'error', 'warn'] }),
    ],
    _experiments: {
      enableLogs: true,
    },
  });
}

// PostHog analytics for production
if (import.meta.env.PROD && import.meta.env.VITE_POSTHOG_KEY && import.meta.env.VITE_POSTHOG_HOST) {
  import('posthog-js')
    .then(({ default: posthog }) => {
      posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
        api_host: import.meta.env.VITE_POSTHOG_HOST,
      });
    })
    .catch((error) => {
      console.warn('Failed to initialize PostHog:', error);
    });
}

// Dynamic import for code splitting
const App = React.lazy(() => import('./App'));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NexusProvider>
      <React.Suspense
        fallback={
          <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 flex items-center justify-center">
            <div
              className="w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"
              aria-label="Loading"
            ></div>
          </div>
        }
      >
        <App />
      </React.Suspense>
    </NexusProvider>
  </StrictMode>,
);
