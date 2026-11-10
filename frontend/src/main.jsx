import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { LangProvider } from './context/LangContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { CompareProvider } from './context/CompareContext.jsx';
import { WishlistProvider } from './context/WishlistContext.jsx';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <LangProvider>
        <ToastProvider>
          <AuthProvider>
            <WishlistProvider>
              <CompareProvider>
                <ErrorBoundary>
                  <App />
                </ErrorBoundary>
              </CompareProvider>
            </WishlistProvider>
          </AuthProvider>
        </ToastProvider>
      </LangProvider>
    </BrowserRouter>
  </React.StrictMode>
);
