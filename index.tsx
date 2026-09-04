/**
 * Screen Name: Client Application Entry
 * Purpose: Mount React root, configure global routing, register PWA service worker, and intercept API routes for decoupled deployments
 * Version: 2.1.0
 * Date: 2026-09-04
 * Phase: Phase 6 - Decoupled Production Deployment (Vercel Frontend + Render Backend)
 * What changed in this revision:
 *   - Injected global fetch routing for VITE_API_URL to automatically target external Render backend when deployed on Vercel
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AdminApp } from './AdminApp';
import { MainLayout } from './MainLayout';
import './index.css';
import './i18n';

import { HelmetProvider } from 'react-helmet-async';

// Global API interceptor for decoupled backend deployment (Render backend + Vercel frontend)
const apiBase = ((import.meta.env.VITE_API_URL as string) || '').replace(/\/+$/, '');
if (apiBase && typeof window !== 'undefined' && window.fetch) {
    const originalFetch = window.fetch.bind(window);
    window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
        if (typeof input === 'string' && input.startsWith('/api/')) {
            return originalFetch(`${apiBase}${input}`, init);
        }
        if (input instanceof URL && input.pathname.startsWith('/api/')) {
            return originalFetch(`${apiBase}${input.pathname}${input.search}`, init);
        }
        if (input instanceof Request && input.url.startsWith('/api/')) {
            return originalFetch(new Request(`${apiBase}${input.url}`, input));
        }
        return originalFetch(input, init);
    };
}

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