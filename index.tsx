import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { MainLayout } from './MainLayout';
import './index.css';

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    // Wrap your existing App inside the new MainLayout
    root.render(<MainLayout StudioComponent={<App />} />);
}