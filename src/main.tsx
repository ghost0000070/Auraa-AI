import { createRoot } from 'react-dom/client';
import React from 'react';
import App from './App.tsx';
import './index.css';

const rootEl = document.getElementById('root');
if (!rootEl) {
	console.error('[bootstrap] Missing #root element');
} else {
	createRoot(rootEl).render(
		<React.StrictMode>
			<App />
		</React.StrictMode>
	);
}
