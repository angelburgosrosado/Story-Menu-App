import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AdminApp } from './AdminApp';
import { MainLayout } from './MainLayout';
import './index.css';
import './i18n';

import { HelmetProvider } from 'react-helmet-async';

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
    state = { hasError: false, error: null as Error | null };
    constructor(props: {children: React.ReactNode}) {
        super(props);
    }
    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '20px', background: '#fee', color: '#900', fontFamily: 'monospace', position: 'fixed', inset: 0, zIndex: 9999, overflow: 'auto' }}>
                    <h2>App Crashed</h2>
                    <pre>{this.state.error?.stack || this.state.error?.message}</pre>
                </div>
            );
        }
        return (this as any).props.children;
    }
}

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    
    // Simple routing based on pathname
    if (window.location.pathname.startsWith('/admin')) {
        root.render(
            <HelmetProvider>
                <ErrorBoundary>
                    <AdminApp />
                </ErrorBoundary>
            </HelmetProvider>
        );
    } else {
        root.render(
            <HelmetProvider>
                <ErrorBoundary>
                    <MainLayout StudioComponent={<App />} />
                </ErrorBoundary>
            </HelmetProvider>
        );
    }
}

// Register PWA Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => {
                console.log('[PWA] Service Worker registered scope:', reg.scope);
            })
            .catch(err => {
                console.warn('[PWA] Service Worker registration failed:', err);
            });
    });
}