import React, { useState } from 'react';
import { Home } from './Home';

// This acts as the main router shell for the new UI.
// It wraps your existing App (Creator Studio) inside the 'studio' route.
export const MainLayout = ({ StudioComponent }: { StudioComponent: React.ReactNode }) => {
    const [currentView, setCurrentView] = useState<'home' | 'studio'>('home');

    return (
        <div className="min-h-screen bg-gray-950 text-white font-sans selection:bg-pink-500/30">
            {/* Global Navigation */}
            <nav className="sticky top-0 z-50 flex justify-between items-center px-6 py-4 border-b border-gray-800 bg-gray-950/80 backdrop-blur-lg">
                <div
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={() => setCurrentView('home')}
                >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:shadow-pink-500/20 transition-all">
                        <span className="font-extrabold text-lg tracking-tighter text-white">SM</span>
                    </div>
                    <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        Story Menu
                    </span>
                </div>

                <div className="flex items-center gap-6 font-medium">
                    <button onClick={() => setCurrentView('home')} className={`hover:text-blue-400 transition-colors ${currentView === 'home' ? 'text-blue-400' : 'text-gray-300'}`}>Explore</button>
                    <button className="text-gray-300 hover:text-pink-400 transition-colors">Community</button>
                    <button
                        onClick={() => setCurrentView('studio')}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all"
                    >
                        Studio
                    </button>
                </div>
            </nav>

            {/* Router View */}
            <main>
                {currentView === 'home' ? <Home onNavigate={setCurrentView} /> : StudioComponent}
            </main>
        </div>
    );
}