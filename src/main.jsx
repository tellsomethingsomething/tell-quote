import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import ErrorBoundary from './components/common/ErrorBoundary.jsx';
import { ToastProvider } from './components/common/Toast.jsx';

import { BrowserRouter as Router } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <ToastProvider>
          <Router>
            <App />
          </Router>
        </ToastProvider>
      </HelmetProvider>
    </ErrorBoundary>
  </StrictMode>,
)
