import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App'; // <--- Removed the curly braces here!
import { MainLayout } from './MainLayout';
import './index.css';
import './i18n';

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    // Render the new MainLayout, passing the original App as the StudioComponent
    root.render(<MainLayout StudioComponent={<App />} />);
}