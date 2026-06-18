import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App'; // <--- Removed the curly braces here!
import { MainLayout } from './MainLayout';
import './index.css';
import './i18n';

import { HelmetProvider } from 'react-helmet-async';

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
    constructor(props: {children: React.ReactNode}) {
        super(props);
        this.state = { hasError: false, error: null };
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
        return this.props.children;
    }
}

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    // Render the new MainLayout, passing the original App as the StudioComponent
    root.render(
        <HelmetProvider>
            <ErrorBoundary>
                <MainLayout StudioComponent={<App />} />
            </ErrorBoundary>
        </HelmetProvider>
    );
}