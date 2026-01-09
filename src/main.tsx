import { createRoot } from 'react-dom/client';
import React from 'react';
import App from './App';
import './index.css';
import { validateEnvironment } from './config/constants';
import { errorTracker } from './lib/errorTracking';
import { registerServiceWorker } from './lib/serviceWorker';

// Validate environment variables before starting app
try {
	validateEnvironment();
} catch (error) {
	console.error('[bootstrap] Environment validation failed:', error);
	alert(`Configuration error: ${error instanceof Error ? error.message : 'Unknown error'}`);
	throw error;
}

// Initialize error tracking
errorTracker.init();

// Register service worker for PWA
registerServiceWorker();

const rootEl = document.getElementById('root');
if (!rootEl) {
	console.error('[bootstrap] Missing #root element');
	throw new Error('Root element not found - check your index.html');
} else {
	createRoot(rootEl).render(
		<React.StrictMode>
			<App />
		</React.StrictMode>
	);
}
