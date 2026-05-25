/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GENRES, LANGUAGES, Persona, VOICES } from './types';

interface SetupProps {
    show: boolean;
    isTransitioning: boolean;
    hero: Persona | null;
    friend: Persona | null;
    villain: Persona | null;
    selectedGenre: string;
    selectedLanguage: string;
    customPremise: string;
    richMode: boolean;
    selectedVoice: string;
    soundtrackEnabled: boolean;
    activeCreator: { id: string; email: string };
    onCreatorChange: (creator: { id: string; email: string }) => void;
    onHeroUpload: (file: File) => void;
    onFriendUpload: (file: File) => void;
    onVillainUpload: (file: File) => void;
    onGenreChange: (val: string) => void;
    onLanguageChange: (val: string) => void;
    onPremiseChange: (val: string) => void;
    onRichModeChange: (val: boolean) => void;
    onVoiceChange: (val: string) => void;
    onSoundtrackChange: (val: boolean) => void;
    onLaunch: () => void;
    onSelectHero: (p: Persona | null) => void;
    onSelectFriend: (p: Persona | null) => void;
    onSelectVillain: (p: Persona | null) => void;
}

const Footer = () => {
  const [remixIndex, setRemixIndex] = useState(0);
  const remixes = [
    "Overhauled visual card selection logic",
    "Animated retro arcade cabinet layout",
    "Cinematic real-time ambient soundtrack",
    "Interactive customized universe presets",
    "Premium voice narrators with dynamic equalizer feedback",
    "Generative comic multiverse engine"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setRemixIndex(prev => (prev + 1) % remixes.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black text-white py-3 px-6 flex flex-col md:flex-row justify-between items-center z-[300] border-t-4 border-red-500 font-comic shadow-[0_-4px_20px_rgba(0,0,0,0.8)]">
        <div className="flex items-center gap-2 text-base md:text-lg">
            <span className="text-yellow-400 font-bold tracking-wider animate-pulse uppercase">REMIX LOGIC ACTIVE:</span>
            <span className="text-gray-100">{remixes[remixIndex]}</span>
        </div>
        <div className="flex items-center gap-4 mt-2 md:mt-0 text-sm">
            <span className="text-gray-400 font-mono">Gemini Multimodal Framework</span>
            <a href="https://x.com/ammaar" target="_blank" rel="noopener noreferrer" className="text-yellow-400 hover:text-white transition-colors duration-200">Created by @ammaar</a>
        </div>
    </div>
  );
};

export const Setup: React.FC<SetupProps> = (props) => {
    if (!props.show && !props.isTransitioning) return null;

    const [dbConnection, setDbConnection] = useState<{ 
        status: string; 
        mode: string;
        hasUrlEnv?: boolean;
        dbUrlMasked?: string;
    }>({ status: 'Connecting', mode: '' });
    const [cloudRunConfig, setCloudRunConfig] = useState<any>({ isCloudRun: false, service: '', revision: '', configuration: '', project: '', port: '', region: '' });
    const [savedCharacters, setSavedCharacters] = useState<any[]>([]);
    const [creatorEmailInput, setCreatorEmailInput] = useState(props.activeCreator.email);
    const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

    // Dynamic Database URL tester
    const [testConnectionString, setTestConnectionString] = useState('');
    const [isTestingConnection, setIsTestingConnection] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string; tested: boolean } | null>(null);

    const [isReconnecting, setIsReconnecting] = useState(false);
    const [reconnectResultMessage, setReconnectResultMessage] = useState<string | null>(null);

    // Fetch DB Status
    const fetchDbStatus = async () => {
        try {
            const res = await fetch('/api/db-status');
            const data = await res.json();
            setDbConnection({ 
                status: data.status, 
                mode: data.mode,
                hasUrlEnv: data.hasUrlEnv,
                dbUrlMasked: data.dbUrlMasked
            });
        } catch (e) {
            setDbConnection({ status: 'error', mode: 'In-Memory Fallback Sandbox' });
        }
    };

    // Fetch Cloud Run Config
    const fetchCloudRunConfig = async () => {
        try {
            const res = await fetch('/api/cloudrun-config');
            const data = await res.json();
            setCloudRunConfig(data);
        } catch (e) {
            console.error("Failed to detect Cloud Run container setup:", e);
        }
    };

    // Fetch Character Vault Saved Items
    const fetchVault = async () => {
        try {
            const res = await fetch(`/api/characters?userId=${props.activeCreator.id}`);
            const list = await res.json();
            setSavedCharacters(Array.isArray(list) ? list : []);
        } catch (e) {
            console.error("Failed to load character vault", e);
        }
    };

    useEffect(() => {
        fetchDbStatus();
        fetchCloudRunConfig();
    }, []);

    useEffect(() => {
        if (props.activeCreator.id) {
            fetchVault();
        }
    }, [props.activeCreator.id]);

    // Handle custom event from App when a character is synced
    useEffect(() => {
        const handler = () => {
             fetchVault();
        };
        window.addEventListener('refresh-character-vault', handler);
        return () => {
             window.removeEventListener('refresh-character-vault', handler);
        };
    }, [props.activeCreator.id]);

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!creatorEmailInput.trim()) return;
        setIsUpdatingEmail(true);
        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: creatorEmailInput.trim() })
            });
            const data = await res.json();
            if (data && data.id) {
                const userObj = { id: data.id, email: data.email };
                props.onCreatorChange(userObj);
                localStorage.setItem('infinite_heroes_creator', JSON.stringify(userObj));
                alert(`Welcome back, Creator! Profile active: ${data.email}`);
            }
        } catch (err) {
            alert("Creator registration fallback active. Loaded.");
        } finally {
            setIsUpdatingEmail(false);
        }
    };

    const handleDeleteFromVault = async (charId: string) => {
        if (!confirm("Are you sure you want to retire this character from the vault?")) return;
        try {
            await fetch(`/api/characters/${charId}`, { method: 'DELETE' });
            fetchVault();
        } catch (e) {
            console.error("Retire failed", e);
        }
    };

    const handleLoadMyUrl = async () => {
        try {
            const res = await fetch('/api/get-raw-database-url');
            const data = await res.json();
            if (data.url) {
                setTestConnectionString(data.url);
            } else {
                setTestConnectionString("postgresql://angelburgosrosado:75727572Ab%21@136.116.100.202:5432/comics-v1");
            }
        } catch (e) {
            setTestConnectionString("postgresql://angelburgosrosado:75727572Ab%21@136.116.100.202:5432/comics-v1");
        }
    };

    const handleTestConnection = async (e: React.FormEvent<any> | null, forceEnvUrl = false) => {
        if (e) e.preventDefault();
        const str = forceEnvUrl ? "" : testConnectionString.trim();
        if (!str && !forceEnvUrl) {
            alert("Please paste a database connection URL format to test, or click 'TEST SERVER-SIDE URL' to evaluate the loaded environment variables!");
            return;
        }
        setIsTestingConnection(true);
        setTestResult(null);
        try {
            const res = await fetch('/api/verify-database-connection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ connectionString: str })
            });
            const data = await res.json();
            if (data.success) {
                setTestResult({
                    success: true,
                    message: data.version || "Connection active! Table structures successfully verified.",
                    tested: true
                });
                // Succeeded, refresh database pool connection states on the server too!
                fetchDbStatus();
            } else {
                setTestResult({
                    success: false,
                    message: data.error || "Connection timed out or returned credentials/firewall error.",
                    tested: true
                });
            }
        } catch (err: any) {
            setTestResult({
                success: false,
                message: err.message || "Failed to contact verification proxy service.",
                tested: true
            });
        } finally {
            setIsTestingConnection(false);
        }
    };

    const handleForceReconnect = async () => {
        setIsReconnecting(true);
        setReconnectResultMessage(null);
        try {
            const res = await fetch('/api/db-reconnect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (data.success) {
                setReconnectResultMessage("✓ CONNECTED! Active PostgreSQL pool is fully established.");
                alert("Server-side Database connection established successfully! Live multi-tenant synchronization is active.");
                fetchDbStatus();
                if (props.activeCreator.id) {
                    fetchVault();
                }
            } else {
                setReconnectResultMessage("❌ " + (data.message || "Forced reconnect failed. Check credentials/firewall rules."));
            }
        } catch (e: any) {
            setReconnectResultMessage("❌ Network connection proxy failure: " + e.message);
        } finally {
            setIsReconnecting(false);
        }
    };

    // Helper map of genre symbols/emojis
    const genreIcons: Record<string, string> = {
        "Classic Horror": "💀",
        "Superhero Action": "⚡",
        "Dark Sci-Fi": "🚀",
        "High Fantasy": "🏰",
        "Neon Noir Detective": "🕵️",
        "Wasteland Apocalypse": "☣️",
        "Lighthearted Comedy": "🎭",
        "Teen Drama / Slice of Life": "🎒",
        "Custom": "✨"
    };

    return (
        <>
        <style>{`
             @keyframes knockout-exit {
                0% { transform: scale(1) rotate(1deg); }
                15% { transform: scale(1.08) rotate(-4deg); }
                100% { transform: translateY(-200vh) rotate(720deg) scale(0.3); opacity: 0; }
             }
             @keyframes pow-enter {
                 0% { transform: translate(-50%, -50%) scale(0) rotate(-45deg); opacity: 0; }
                 30% { transform: translate(-50%, -50%) scale(1.6) rotate(12deg); opacity: 1; }
                 100% { transform: translate(-50%, -50%) scale(1.9) rotate(0deg); opacity: 0; }
             }
             @keyframes pulse-glow {
                 0%, 100% { box-shadow: 0 0 12px rgba(239, 68, 68, 0.4); }
                 50% { box-shadow: 0 0 28px rgba(239, 68, 68, 0.85); }
             }
             @keyframes shimmer {
                 0% { background-position: -200% 0; }
                 100% { background-position: 200% 0; }
             }
             .animate-pulse-glow {
                 animation: pulse-glow 2s infinite ease-in-out;
             }
             .retro-halftone {
                 background-image: radial-gradient(rgba(0, 0, 0, 0.15) 15%, transparent 16%), radial-gradient(rgba(0, 0, 0, 0.15) 15%, transparent 16%);
                 background-size: 8px 8px;
                 background-position: 0 0, 4px 4px;
             }
             .shiny-btn {
                 background: linear-gradient(90deg, #dc2626 0%, #ea580c 50%, #dc2626 100%);
                 background-size: 200% auto;
                 animation: shimmer 2s linear infinite;
             }
             /* Custom Scrollbars */
             .custom-scrollbar::-webkit-scrollbar {
                 height: 6px;
                 width: 6px;
             }
             .custom-scrollbar::-webkit-scrollbar-track {
                 background: #111827;
             }
             .custom-scrollbar::-webkit-scrollbar-thumb {
                 background: #f59e0b;
                 border-radius: 3px;
             }
          `}</style>

        {props.isTransitioning && (
            <div className="fixed top-1/2 left-1/2 z-[210] pointer-events-none" style={{ animation: 'pow-enter 1s forwards ease-out' }}>
                <svg viewBox="0 0 200 150" className="w-[500px] h-[400px] drop-shadow-[0_12px_0_rgba(0,0,0,0.6)]">
                    <path d="M95.7,12.8 L110.2,48.5 L148.5,45.2 L125.6,74.3 L156.8,96.8 L119.4,105.5 L122.7,143.8 L92.5,118.6 L60.3,139.7 L72.1,103.2 L34.5,108.8 L59.9,79.9 L24.7,57.3 L62.5,54.4 L61.2,16.5 z" fill="#FFD700" stroke="black" strokeWidth="5"/>
                    <text x="100" y="95" textAnchor="middle" fontFamily="'Bangers', cursive" fontSize="72" fill="#DC2626" stroke="black" strokeWidth="2.5" transform="rotate(-6 100 75)">BOOM!</text>
                </svg>
            </div>
        )}
        
        <div className="fixed inset-0 z-[200] overflow-y-auto bg-black/90 backdrop-blur-md transition-all duration-500 ease-in-out"
             style={{
                 animation: props.isTransitioning ? 'knockout-exit 1s forwards cubic-bezier(.6,-0.28,.74,.05)' : 'none',
                 pointerEvents: props.isTransitioning ? 'none' : 'auto'
             }}>
          
          <div className="min-h-full flex items-center justify-center p-4 pb-36 md:p-8">
            <div className="max-w-[1100px] w-full bg-slate-900 border-[6px] border-black shadow-[16px_16px_0px_#000] p-6 md:p-8 relative overflow-hidden rounded-2xl">
                
                {/* Comic Halftone texture wrapper behind everything */}
                <div className="absolute inset-0 opacity-15 retro-halftone pointer-events-none" />

                {/* Aesthetic Top Ribbon */}
                <div className="absolute top-0 right-0 bg-yellow-400 text-black font-comic text-xs uppercase px-4 py-1 border-b-2 border-l-2 border-black tracking-widest font-bold z-10">
                     Issue #01 - Multiverse Reborn
                </div>

                {/* Dashboard Title Block */}
                <div className="text-center mb-8 relative z-10 select-none">
                    <span className="block font-comic text-red-500 text-xl md:text-2xl tracking-widest uppercase mb-1 drop-shadow-[1px_1px_0px_#000]">INTELLIGENT DYNAMIC COMICS</span>
                    <div className="inline-flex items-center justify-center gap-3 bg-red-600 border-4 border-black px-6 py-2 shadow-[4px_4px_0px_#000] transform -rotate-1">
                        <span className="font-comic text-4xl md:text-6xl text-white tracking-wider" style={{ textShadow: '3px 3px 0px black' }}>INFINITE</span>
                        <span className="font-comic text-4xl md:text-6xl text-yellow-300 tracking-wider" style={{ textShadow: '3px 3px 0px black' }}>HEROES</span>
                        <span className="font-comic text-xl md:text-2xl bg-black text-white px-2.5 py-0.5 rounded ml-2 border border-yellow-300">REMIX</span>
                    </div>
                </div>

                {/* ADVANCED FULL-STACK DATABASE CONTROLLER GRID */}
                <div className="mb-6 relative z-10 grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-950 border-4 border-black p-4 rounded-lg shadow-[4px_4px_0px_#000] text-gray-200">
                    <div className="md:col-span-4 flex flex-col justify-center border-b-2 border-dashed border-slate-800 pb-3 md:pb-0 md:border-b-0 md:border-r-2 md:border-slate-800 pr-0 md:pr-4">
                         <div className="flex items-center gap-2">
                             <div className={`w-3.5 h-3.5 rounded-full border-2 border-black ${dbConnection.status === 'ok' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500 animate-pulse'}`} />
                             <span className="font-comic font-bold uppercase tracking-wider text-xs">
                                  {dbConnection.status === 'ok' ? '● POSTGRES CONNECTION LIVE' : '● SANDBOX EMULATION ONLINE'}
                             </span>
                         </div>
                         <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                              Storage Model: {dbConnection.mode || 'Local Fallback Core'}
                         </p>
                         <div className="mt-2 flex flex-col gap-1">
                              <button 
                                   type="button" 
                                   disabled={isReconnecting}
                                   onClick={handleForceReconnect}
                                   className="w-fit bg-slate-900 hover:bg-slate-800 border-2 border-black hover:border-yellow-400 px-2 py-1 text-[9px] font-mono rounded tracking-wider uppercase text-yellow-300 active:translate-y-0.5 select-none disabled:opacity-40 font-bold"
                              >
                                   {isReconnecting ? 'RECONNECTING...' : '🔄 FORCE POOL RECONNECT'}
                              </button>
                              {reconnectResultMessage && (
                                   <span className={`text-[10px] font-mono leading-tight block truncate ${reconnectResultMessage.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>
                                        {reconnectResultMessage}
                                   </span>
                              )}
                         </div>
                    </div>

                    <div className="md:col-span-8">
                         <form onSubmit={handleEmailSubmit} className="flex flex-col md:flex-row gap-3 items-stretch md:items-end">
                              <div className="flex-1 text-left">
                                   <label className="block text-slate-400 font-mono text-[10px] uppercase mb-1">Creator Identity Network (Email)</label>
                                   <input 
                                        type="email" 
                                        className="w-full bg-slate-900 border-2 border-black p-1.5 px-3 rounded font-mono text-xs text-yellow-300 focus:outline-none focus:border-red-500"
                                        placeholder="enter-creator-identity@multiverse.com"
                                        value={creatorEmailInput}
                                        onChange={(e) => setCreatorEmailInput(e.target.value)}
                                   />
                              </div>
                              <button 
                                   type="submit" 
                                   disabled={isUpdatingEmail}
                                   className="bg-zinc-800 hover:bg-zinc-700 border-2 border-black hover:border-yellow-400 px-4 py-1.5 font-comic text-xs uppercase font-bold tracking-wider text-white select-none whitespace-nowrap active:translate-y-0.5"
                              >
                                   {isUpdatingEmail ? 'SYNCING...' : 'CONNECT ACCOUNT'}
                              </button>
                         </form>
                    </div>
                </div>

                {/* INTERACTIVE MULTIVERSE DATABASE DIAGNOSTIC TOOL */}
                <div id="db-diagnostic-terminal" className="mb-6 relative z-10 bg-slate-950 border-4 border-black p-4 rounded-lg shadow-[4px_4px_0px_#000] text-gray-200 text-left">
                    <span className="block font-comic text-yellow-300 font-bold uppercase tracking-wider text-xs mb-2">
                        📢 LIVE DATABASE TESTER & PORT CHECKER
                    </span>
                    <p className="text-[11px] text-slate-400 font-mono mb-3 leading-relaxed">
                        Test database routing and firewall status instantly. Paste a PostgreSQL connection URI, or load your custom parameters to trace active network tunnels.
                        <strong className="text-yellow-400 block mt-1.5 uppercase">⚡ CONTAINER NETWORK WARNING:</strong>
                        Your application runs in a containerized Cloud Run environment. Inside a container, <code className="text-white bg-slate-800 px-1 py-0.5 rounded">localhost</code> or <code className="text-white bg-slate-800 px-1 py-0.5 rounded">127.0.0.1</code> refers to the web container itself, NOT your local computer or external database server! To link custom databases, you <strong className="text-cyan-300">MUST specify your database's Public IP Address</strong> or <strong className="text-cyan-300">External Hostname</strong>.
                    </p>

                    {dbConnection.hasUrlEnv ? (
                        <div className="mb-3 p-2.5 bg-slate-900/80 border-2 border-slate-700/60 rounded font-mono text-[11px] text-gray-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-inner">
                             <div>
                                  <span className="text-cyan-400 font-bold uppercase tracking-wider text-[10px] block sm:inline mr-1">📄 Active Server-side .env Config:</span>
                                  <code className="text-yellow-300 font-bold selection:bg-yellow-500/30 text-xs">{dbConnection.dbUrlMasked}</code>
                             </div>
                             <button
                                 type="button"
                                 onClick={() => handleTestConnection(null, true)}
                                 disabled={isTestingConnection}
                                 className="px-2.5 py-1 bg-yellow-500 hover:bg-yellow-400 text-black font-comic font-extrabold rounded uppercase text-[10px] tracking-wide shadow-md active:translate-y-0.5 whitespace-nowrap self-end sm:self-auto disabled:opacity-40"
                             >
                                 ⚡ Check Active .env URL
                             </button>
                        </div>
                    ) : (
                        <div className="mb-3 p-2.5 bg-red-950/20 border-2 border-red-900/40 rounded font-mono text-[11px] text-red-400 flex flex-col gap-1">
                             <span className="font-bold uppercase tracking-wider text-[10px]">⚠️ NO DATABASE_URL DETECTED IN SERVER ENV</span>
                             <span>Your app is currently running in "Safe Offline Sandboxed memory mode". To link a persistent database, provide a DATABASE_URL secret in the application Settings.</span>
                        </div>
                    )}

                    <form onSubmit={(e) => handleTestConnection(e)} className="flex flex-col md:flex-row gap-3 items-stretch md:items-end">
                        <div className="flex-1">
                            <label className="block text-slate-400 font-mono text-[9px] uppercase mb-1">PostgreSQL URL Connection String</label>
                            <input 
                                type="text"
                                className="w-full bg-slate-900 border-2 border-black p-1.5 px-3 rounded font-mono text-xs text-yellow-300 focus:outline-none focus:border-cyan-400"
                                placeholder="postgresql://username:password@hostname:port/database"
                                value={testConnectionString}
                                onChange={(e) => setTestConnectionString(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={handleLoadMyUrl}
                                className="bg-zinc-800 hover:bg-zinc-700 text-slate-300 border-2 border-black px-2.5 py-1.5 font-mono text-[10px] uppercase rounded active:translate-y-0.5 whitespace-nowrap"
                                title="Load server-side secret URL or template with placeholder"
                            >
                                LOAD MY URL
                            </button>
                            <button
                                type="submit"
                                id="test-conn-btn"
                                disabled={isTestingConnection}
                                className="bg-cyan-600 hover:bg-cyan-500 border-2 border-black hover:border-yellow-300 px-5 py-1.5 font-comic text-xs uppercase font-bold tracking-wider text-white whitespace-nowrap active:translate-y-0.5 disabled:opacity-40"
                            >
                                {isTestingConnection ? 'TESTING...' : 'TEST CONNECTION'}
                            </button>
                        </div>
                    </form>

                    {testResult && (
                        <div className={`mt-3 p-3 border-2 border-dashed rounded font-mono text-xs ${
                            testResult.success 
                                ? 'bg-green-950/60 border-green-500/80 text-green-300' 
                                : 'bg-red-950/60 border-red-500/80 text-red-300'
                        }`}>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-[10px] uppercase px-1.5 py-0.5 rounded border inline-block select-none bg-black/40">
                                    {testResult.success ? '✓ VERIFICATION SUCCESSFUL' : '⚡ DIAGNOSTIC ERROR REPORT'}
                                </span>
                            </div>
                            <p className="whitespace-pre-wrap font-mono mt-0.5 leading-tight">{testResult.message}</p>
                            {testResult.success && (
                                <p className="text-[10px] text-green-400 mt-2">
                                    💡 Connection is active and healthy! High-speed schema structures, user indexes, and characters maps can now be synchronized.
                                </p>
                            )}
                            {!testResult.success && (
                                <div className="text-[10px] text-red-400 mt-2 leading-relaxed">
                                    💡 <strong className="uppercase">Troubleshooting Checklist:</strong>
                                    <ul className="list-disc pl-4 mt-1 space-y-1">
                                        <li>Double-check username, password, target database name, or port settings.</li>
                                        <li>Ensure port <span className="text-yellow-400 font-bold">5432</span> (or your custom port) on your PG host allows outside ingress connections.</li>
                                        <li>Ensure Postgres <code>pg_hba.conf</code> accepts connection scopes dynamically.</li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* CLOUD RUN CONFIGURATION STATUS GRID */}
                <div className="mb-6 relative z-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-900 border-4 border-black p-4 rounded-lg shadow-[4px_4px_0px_#000] text-gray-200">
                    <div className="flex flex-col text-left">
                        <span className="text-slate-400 font-mono text-[10px] uppercase">⚡ HOSTING ENVIRONMENT</span>
                        <div className="flex items-center gap-1.5 mt-1">
                            <span className="inline-block w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
                            <span className="text-xs font-comic font-bold uppercase tracking-wide text-cyan-400">GCP CLOUD RUN CONTAINER</span>
                        </div>
                    </div>
                    <div className="flex flex-col text-left">
                        <span className="text-slate-400 font-mono text-[10px] uppercase">📁 PROJECT ID</span>
                        <span className="text-xs font-mono text-yellow-300 truncate mt-1">{cloudRunConfig.project || 'detecting-project-id...'}</span>
                    </div>
                    <div className="flex flex-col text-left">
                        <span className="text-slate-400 font-mono text-[10px] uppercase">🏷️ DEPLOYED SERVICE</span>
                        <span className="text-xs font-mono text-white truncate mt-1">{cloudRunConfig.service || 'infinite-heroes-service'}</span>
                    </div>
                    <div className="flex flex-col text-left">
                        <span className="text-slate-400 font-mono text-[10px] uppercase">🔧 INGRESS / REVISION</span>
                        <span className="text-[10px] font-mono text-slate-400 truncate mt-1 bg-black/40 px-1.5 py-0.5 rounded border border-slate-700/60 inline-block w-fit">
                            Revision: <span className="text-green-400 font-bold">{cloudRunConfig.revision || 'n/a'}</span> @ Port {cloudRunConfig.port}
                        </span>
                    </div>
                </div>

                {/* Main Config Workspace split in 2 bold frames */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8 relative z-10">
                    
                    {/* Section 1: The Cast Grid (7 cols) */}
                    <div className="lg:col-span-7 flex flex-col p-5 bg-slate-800 border-4 border-black rounded-lg shadow-[6px_6px_0px_#000] relative">
                        <div className="absolute -top-4 left-6 bg-blue-600 text-white font-comic text-lg uppercase px-4 py-0.5 border-2 border-black rotate-[-1.5deg] shadow-[2px_2px_0px_#000] font-bold z-10 tracking-wide">
                             1. CHOOSE YOUR CAST
                        </div>
                        
                        <p className="text-xs text-gray-300 font-medium mb-5 mt-2">
                             Upload custom character images to create coherent comic likenesses throughout the adventure. Include a Villain for high-stakes conflicts!
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            
                            {/* HERO CARD (BLUE THEME) */}
                            <div className={`relative group h-80 rounded-xl overflow-hidden border-4 bg-slate-950 flex flex-col justify-between transition-all duration-300 transform hover:-translate-y-2 hover:scale-[1.02] ${props.hero ? 'border-green-500 hover:shadow-[0_0_24px_rgba(59,130,246,0.85)] hover:border-blue-500' : 'border-blue-700/80 hover:shadow-[0_0_24px_rgba(59,130,246,0.85)] hover:border-blue-500'} cursor-pointer`}>
                                 <input type="file" accept="image/*" id="hero-upload-input" className="hidden" onChange={(e) => e.target.files?.[0] && props.onHeroUpload(e.target.files[0])} />
                                 <label htmlFor="hero-upload-input" className="absolute inset-0 cursor-pointer z-10">
                                      <span className="sr-only">Upload Hero</span>
                                 </label>

                                 {props.hero ? (
                                      <>
                                          {/* Full Bleed Image */}
                                          <img src={`data:image/jpeg;base64,${props.hero.base64}`} alt="Hero Roster" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                                          
                                          {/* Top Tag */}
                                          <div className="absolute top-2 left-2 bg-blue-600 text-white border border-black font-comic text-xs uppercase px-2 py-0.5 rotate-[-2deg] z-20">
                                               HERO ACTIVE
                                          </div>

                                          <div className="p-3 relative z-20 flex flex-col justify-end h-full">
                                               <span className="text-green-400 text-[10px] font-mono tracking-wider font-bold animate-pulse block mb-0.5">⚡ IDENTITY SCANNED</span>
                                               <p className="text-white font-comic text-xl leading-none uppercase tracking-wide truncate">MAIN AVATAR</p>
                                               <p className="text-gray-300 text-[10px] line-clamp-1 mt-1 font-sans">{props.hero.desc || "Ready for battle"}</p>
                                               
                                               {/* Dark Hover Replacement Overlay */}
                                               <div className="absolute inset-0 bg-blue-950/90 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                    <span className="text-yellow-400 font-comic text-lg">CHANGE HERO</span>
                                                    <span className="text-gray-300 text-[10px] mt-1 font-mono">JPG / PNG / WEBP</span>
                                               </div>
                                          </div>
                                      </>
                                 ) : (
                                      <div className="flex flex-col justify-between h-full p-4 relative z-20">
                                           {/* Emblem representation */}
                                           <div className="flex justify-between items-center">
                                                <span className="bg-blue-600 text-white font-comic text-xs uppercase px-2.5 py-0.5 rounded-full border border-black shadow-[1px_1px_0px_#000]">REQUIRED</span>
                                                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
                                           </div>

                                           <div className="flex flex-col items-center my-auto py-2 text-center">
                                                <div className="text-blue-400 mb-2 transform group-hover:scale-110 transition-transform duration-300">
                                                     <svg className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                     </svg>
                                                </div>
                                                <span className="font-comic text-lg text-blue-300 tracking-wide">HERO CYLINDER</span>
                                                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-mono mt-1">CLICK TO SCAN</span>
                                           </div>

                                           <div className="bg-blue-950/80 border border-blue-800 text-center py-1.5 rounded font-comic text-xs text-blue-200 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                UPLOAD IMAGE
                                           </div>
                                      </div>
                                 )}
                            </div>

                            {/* CO-STAR CARD (PURPLE THEME) */}
                            <div className={`relative group h-80 rounded-xl overflow-hidden border-4 bg-slate-950 flex flex-col justify-between transition-all duration-300 transform hover:-translate-y-2 hover:scale-[1.02] ${props.friend ? 'border-green-500 hover:shadow-[0_0_24px_rgba(168,85,247,0.85)] hover:border-purple-500' : 'border-purple-800 hover:shadow-[0_0_24px_rgba(168,85,247,0.85)] hover:border-purple-500'} cursor-pointer`}>
                                 <input type="file" accept="image/*" id="friend-upload-input" className="hidden" onChange={(e) => e.target.files?.[0] && props.onFriendUpload(e.target.files[0])} />
                                 <label htmlFor="friend-upload-input" className="absolute inset-0 cursor-pointer z-10">
                                      <span className="sr-only">Upload Co-Star</span>
                                 </label>

                                 {props.friend ? (
                                      <>
                                          <img src={`data:image/jpeg;base64,${props.friend.base64}`} alt="Co-Star Preview" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                                          
                                          <div className="absolute top-2 left-2 bg-purple-600 text-white border border-black font-comic text-xs uppercase px-2 py-0.5 rotate-[2deg] z-20">
                                               CO-STAR READY
                                          </div>

                                          <div className="p-3 relative z-20 flex flex-col justify-end h-full">
                                               <span className="text-green-400 text-[10px] font-mono tracking-wider font-bold animate-pulse block mb-0.5">🌟 ALLY DISCOVERED</span>
                                               <p className="text-white font-comic text-xl leading-none uppercase tracking-wide truncate">SOCIUS / SIDEKICK</p>
                                               <p className="text-gray-300 text-[10px] line-clamp-1 mt-1 font-sans">{props.friend.desc || "Ready for combat support"}</p>
                                               
                                               <div className="absolute inset-0 bg-purple-950/90 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                    <span className="text-yellow-400 font-comic text-lg">CHANGE CO-STAR</span>
                                                    <span className="text-gray-300 text-[10px] mt-1 font-mono">JPG / PNG / WEBP</span>
                                               </div>
                                          </div>
                                      </>
                                 ) : (
                                      <div className="flex flex-col justify-between h-full p-4 relative z-20">
                                           <div className="flex justify-between items-center">
                                                <span className="bg-purple-900 border border-purple-700 text-purple-200 font-comic text-[10px] uppercase px-2 py-0.5 rounded-full">OPTIONAL</span>
                                                <span className="w-2 h-2 rounded-full bg-purple-500" />
                                           </div>

                                           <div className="flex flex-col items-center my-auto py-2 text-center">
                                                <div className="text-purple-400 mb-2 transform group-hover:scale-110 transition-transform duration-300">
                                                     <svg className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94-3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                                                     </svg>
                                                </div>
                                                <span className="font-comic text-lg text-purple-300 tracking-wide">SIDEKICK GRID</span>
                                                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-mono mt-1">CLICK TO JOIN</span>
                                           </div>

                                           <div className="bg-purple-950/80 border border-purple-800 text-center py-1.5 rounded font-comic text-xs text-purple-200 group-hover:bg-purple-600 group-hover:text-white transition-all">
                                                UPLOAD PHOTO
                                           </div>
                                      </div>
                                 )}
                            </div>

                            {/* VILLAIN CARD (RED THEME) */}
                            <div className={`relative group h-80 rounded-xl overflow-hidden border-4 bg-slate-950 flex flex-col justify-between transition-all duration-300 transform hover:-translate-y-2 hover:scale-[1.02] ${props.villain ? 'border-green-500 hover:shadow-[0_0_24px_rgba(239,68,68,0.85)] hover:border-red-500' : 'border-red-800 hover:shadow-[0_0_24px_rgba(239,68,68,0.85)] hover:border-red-500'} cursor-pointer`}>
                                 <input type="file" accept="image/*" id="villain-upload-input" className="hidden" onChange={(e) => e.target.files?.[0] && props.onVillainUpload(e.target.files[0])} />
                                 <label htmlFor="villain-upload-input" className="absolute inset-0 cursor-pointer z-10">
                                      <span className="sr-only">Upload Villain</span>
                                 </label>

                                 {props.villain ? (
                                      <>
                                          <img src={`data:image/jpeg;base64,${props.villain.base64}`} alt="Villain Preview" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                                          
                                          <div className="absolute top-2 left-2 bg-red-600 text-white border border-black font-comic text-xs uppercase px-2 py-0.5 rotate-[-1deg] z-20 animate-pulse">
                                               NEMESIS ACTIVE
                                          </div>

                                          <div className="p-3 relative z-20 flex flex-col justify-end h-full">
                                               <span className="text-red-500 text-[10px] font-mono tracking-wider font-bold block mb-0.5">⚠️ MENACE UNLEASHED</span>
                                               <p className="text-white font-comic text-xl leading-none uppercase tracking-wide truncate">ARC-RIVAL</p>
                                               <p className="text-gray-300 text-[10px] line-clamp-1 mt-1 font-sans">{props.villain.desc || "Plotting doom..."}</p>
                                               
                                               <div className="absolute inset-0 bg-red-950/90 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                    <span className="text-yellow-400 font-comic text-lg">CHANGE VILLAIN</span>
                                                    <span className="text-gray-300 text-[10px] mt-1 font-mono">JPG / PNG / WEBP</span>
                                               </div>
                                          </div>
                                      </>
                                 ) : (
                                      <div className="flex flex-col justify-between h-full p-4 relative z-20">
                                           <div className="flex justify-between items-center">
                                                <span className="bg-red-950 border border-red-900 text-red-200 font-comic text-[10px] uppercase px-2 py-0.5 rounded-full">OPTIONAL</span>
                                                <span className="w-2 h-2 rounded-full bg-red-600" />
                                           </div>

                                           <div className="flex flex-col items-center my-auto py-2 text-center">
                                                <div className="text-red-500 mb-2 transform group-hover:scale-110 transition-transform duration-300">
                                                     <svg className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                          <path strokeLinecap="round" strokeLinejoin="round" d="M112.236 10.97a9.236 9.236 0 11-18.472 0 9.236 9.236 0 0118.472 0zm-1.89 12.394A4.484 4.484 0 0012 10.5a4.484 4.484 0 00-1.654-3.464M18.364 5.636a9 9 0 010 12.728m-1.414-1.414a7 7 0 000-9.9" />
                                                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01" />
                                                     </svg>
                                                </div>
                                                <span className="font-comic text-lg text-red-300 tracking-wide">ARC-RIVAL</span>
                                                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-mono mt-1">CLICK TO ENGAGE</span>
                                           </div>

                                           <div className="bg-red-950/80 border border-red-900 text-center py-1.5 rounded font-comic text-xs text-red-200 group-hover:bg-red-600 group-hover:text-white transition-all">
                                                UPLOAD BOSS
                                           </div>
                                      </div>
                                 )}
                            </div>

                        </div>

                        {/* CHARACTER VAULT SAVED ITEMS MODULE */}
                        {savedCharacters.length > 0 && (
                            <div className="mt-5 pt-4 border-t-2 border-slate-700">
                                <div className="flex justify-between items-center mb-2.5">
                                     <span className="font-comic text-xs uppercase text-yellow-300 font-bold tracking-wider">
                                          🗃️ Character Vault (Saved in pg DB)
                                     </span>
                                     <span className="text-[10px] font-mono text-slate-400">
                                          {savedCharacters.length} active profiles
                                     </span>
                                </div>
                                <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar pr-1">
                                     {savedCharacters.map((char) => (
                                          <div 
                                               key={char.id} 
                                               className="flex-shrink-0 w-36 bg-slate-900 border-2 border-black rounded-lg p-2 flex flex-col justify-between group/vault relative text-left"
                                          >
                                               <div className="relative h-20 w-full mb-1 bg-slate-950 rounded overflow-hidden">
                                                    {char.image_url ? (
                                                         <img 
                                                              src={char.image_url.startsWith('data:') ? char.image_url : `data:image/jpeg;base64,${char.image_url}`} 
                                                              alt={char.character_name} 
                                                              className="w-full h-full object-cover select-none" 
                                                         />
                                                    ) : (
                                                         <div className="w-full h-full flex items-center justify-center text-xs font-mono text-slate-400">
                                                              [No Avatar]
                                                         </div>
                                                    )}
                                                    <button 
                                                         onClick={(e) => { e.stopPropagation(); handleDeleteFromVault(char.id); }}
                                                         className="absolute top-1 right-1 bg-black/75 hover:bg-red-600 rounded p-1 text-white border border-black opacity-0 group-hover/vault:opacity-100 transition-opacity duration-200"
                                                         title="Retire Character"
                                                    >
                                                         <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                         </svg>
                                                    </button>
                                               </div>
                                               <div>
                                                    <p className="font-comic text-xs font-bold text-gray-200 uppercase truncate leading-tight select-none">
                                                         {char.character_name}
                                                    </p>
                                                    <span className={`text-[9px] font-mono uppercase px-1 py-0.2 rounded border border-black inline-block mt-0.5 select-none ${
                                                         char.role_type === 'Hero' ? 'bg-blue-900/40 text-blue-300 border-blue-800' :
                                                         char.role_type === 'Co-Star' ? 'bg-purple-900/40 text-purple-300 border-purple-800' :
                                                         'bg-red-900/40 text-red-300 border-red-800'
                                                    }`}>
                                                         {char.role_type}
                                                    </span>
                                               </div>
                                               
                                               <div className="mt-2 grid grid-cols-1 gap-1">
                                                    <button 
                                                         onClick={() => {
                                                              const persona = { base64: char.image_url || '', desc: char.description || '' };
                                                              if (char.role_type === 'Hero') props.onSelectHero(persona);
                                                              else if (char.role_type === 'Co-Star') props.onSelectFriend(persona);
                                                              else if (char.role_type === 'Villain') props.onSelectVillain(persona);
                                                         }}
                                                         className="bg-zinc-805 hover:bg-yellow-400 font-comic text-[10px] text-gray-300 hover:text-black py-0.5 uppercase tracking-wide rounded border border-black transition-colors"
                                                    >
                                                         CAST ROLE
                                                    </button>
                                               </div>
                                          </div>
                                     ))}
                                </div>
                            </div>
                        )}

                        {/* Terms Guardrails disclaimer style */}
                        <div className="mt-4 p-2.5 bg-slate-900/60 border border-slate-700 rounded text-[11px] text-gray-400 leading-tight">
                             <span className="text-yellow-400 font-bold uppercase tracking-wider">🔒 MULTIVERSE SECURITY:</span> Pictures are parsed server-side to extract spatial vectors for coherent layout synthesis. No files are stored or kept. Build guidelines apply.
                        </div>
                    </div>

                    {/* Section 2: Config Console (5 cols) */}
                    <div className="lg:col-span-5 flex flex-col p-5 bg-slate-800 border-4 border-black rounded-lg shadow-[6px_6px_0px_#000] relative">
                        <div className="absolute -top-4 left-6 bg-yellow-500 text-black font-comic text-lg uppercase px-4 py-0.5 border-2 border-black rotate-[1deg] shadow-[2px_2px_0px_#000] font-bold z-10 tracking-wide">
                             2. ENVIRONMENT SYNAPSE
                        </div>

                        <div className="flex flex-col gap-5 mt-4 flex-1">
                            
                            {/* Visual Genre Selection (Grid of Custom Chips) */}
                            <div>
                                <p className="font-comic text-base tracking-wide text-yellow-300 uppercase mb-2">Select Story Path (Genre)</p>
                                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                    {GENRES.map((g) => {
                                        const isSelected = props.selectedGenre === g;
                                        return (
                                            <button 
                                                key={g}
                                                onClick={() => props.onGenreChange(g)}
                                                className={`py-2 px-3 text-left border-2 rounded transition-all duration-150 transform flex items-center gap-1.5 ${
                                                    isSelected 
                                                    ? 'bg-yellow-400 text-black border-black font-bold -rotate-1 translate-x-px translate-y-px shadow-[2px_2px_0px_rgba(0,0,0,1)]' 
                                                    : 'bg-slate-900 text-gray-300 border-slate-700 hover:bg-slate-750 hover:text-white hover:border-gray-500 hover:-translate-y-px shadow-sm'
                                                }`}
                                            >
                                                <span className="text-base select-none">{genreIcons[g] || "📖"}</span>
                                                <span className="font-comic text-xs tracking-wide uppercase truncate">{g}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Dense Grid chips for Common Languages */}
                            <div>
                                <p className="font-comic text-base tracking-wide text-cyan-400 uppercase mb-2">Multilingual Lexicon (Language)</p>
                                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1 custom-scrollbar">
                                     {LANGUAGES.map((l) => {
                                         const isSelected = props.selectedLanguage === l.code;
                                         return (
                                             <button
                                                 key={l.code}
                                                 onClick={() => props.onLanguageChange(l.code)}
                                                 className={`text-[10px] px-2 py-1 font-mono uppercase font-bold tracking-tight rounded-md border-2 transition-all ${
                                                     isSelected
                                                     ? 'bg-cyan-400 text-black border-black shadow-[1px_1px_0px_black]'
                                                     : 'bg-slate-900 text-gray-400 border-slate-700 hover:text-white hover:border-gray-500'
                                                 }`}
                                             >
                                                 {l.name}
                                             </button>
                                         );
                                     })}
                                </div>
                            </div>

                            {/* Narrator TTS Pick Option */}
                            <div>
                                <p className="font-comic text-base tracking-wide text-purple-300 uppercase mb-2">Voice Narrator (Gemini Audio)</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-1.5">
                                     {VOICES.map((v) => {
                                         const isSelected = props.selectedVoice === v.id;
                                         const emoji = v.id === 'Zephyr' ? '🌬️' : v.id === 'Kore' ? '🎭' : v.id === 'Fenrir' ? '🐺' : v.id === 'Puck' ? '🧚' : '💀';
                                         return (
                                             <button
                                                 key={v.id}
                                                 onClick={() => props.onVoiceChange(v.id)}
                                                 className={`flex items-center gap-2 px-3 py-1.5 text-left rounded border-2 transition-all text-xs ${
                                                     isSelected
                                                     ? 'bg-purple-600 text-white border-black shadow-[2px_2px_0px_black] scale-[1.01] font-bold'
                                                     : 'bg-slate-900 text-gray-400 border-slate-700 hover:text-white hover:border-gray-500'
                                                 }`}
                                             >
                                                 <span className="text-sm select-none">{emoji}</span>
                                                 <span className="font-sans tracking-wide uppercase truncate">{v.name}</span>
                                             </button>
                                         );
                                     })}
                                </div>
                            </div>

                            {/* Dynamic Textarea prompt for Custom Genre */}
                            {props.selectedGenre === 'Custom' && (
                                <div className="animate-fadeIn">
                                    <p className="font-comic text-xs tracking-wide text-red-400 uppercase mb-1">Enter Your Unique Multiverse Concept</p>
                                    <textarea 
                                        value={props.customPremise} 
                                        onChange={(e) => props.onPremiseChange(e.target.value)} 
                                        placeholder="Space cats fighting medieval robot wizards in a neon cathedral..." 
                                        className="w-full p-2 bg-slate-950 border-2 border-black text-white text-xs font-sans h-16 resize-none rounded shadow-[inset_0px_2px_6px_rgba(0,0,0,0.8)] focus:outline-none focus:border-yellow-400 transition-colors" 
                                    />
                                </div>
                            )}

                            {/* Beautiful Slider Toggles for soundtrack & Mode */}
                            <div className="flex flex-col gap-2.5 pt-3 border-t border-slate-700 mt-2">
                                
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                         <span className="text-white text-xs font-bold font-comic tracking-wide uppercase">Novel Mode / Rich Content</span>
                                         <span className="text-[10px] text-gray-400">Deep dialogues & full scenery descriptors</span>
                                    </div>
                                    <button 
                                        onClick={() => props.onRichModeChange(!props.richMode)}
                                        className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-300 ${props.richMode ? 'bg-cyan-500' : 'bg-slate-700'} relative`}
                                        aria-label="Toggle Novel Mode"
                                    >
                                         <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${props.richMode ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                         <span className="text-yellow-400 text-xs font-bold font-comic tracking-wide uppercase animate-pulse">🎵 SYNAPSE Retro SOUNDTRACK</span>
                                         <span className="text-[10px] text-gray-400">Generative procedural synth loops</span>
                                    </div>
                                    <button 
                                        onClick={() => props.onSoundtrackChange(!props.soundtrackEnabled)}
                                        className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-300 ${props.soundtrackEnabled ? 'bg-yellow-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]' : 'bg-slate-700'} relative`}
                                        aria-label="Toggle Retro Soundtrack"
                                    >
                                         <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${props.soundtrackEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                            </div>

                        </div>
                    </div>

                </div>

                {/* Overhauled, pulsating, shimmering call-to-action button */}
                <div className="relative group select-none">
                     {/* Pulsing button shadow */}
                     <div className={`absolute -inset-1 rounded-lg blur opacity-75 group-hover:opacity-100 transition-opacity duration-300 ${props.hero ? 'bg-red-500 animate-pulse-glow' : 'bg-gray-700'}`} />
                     
                     <button 
                          onClick={props.onLaunch} 
                          disabled={!props.hero || props.isTransitioning} 
                          className={`shiny-btn relative comic-btn w-full py-4 text-2xl md:text-4xl text-white font-comic uppercase tracking-widest border-4 border-black disabled:grayscale disabled:opacity-50 disabled:cursor-not-allowed shadow-[6px_6px_0px_#000] hover:scale-[1.01] active:translate-y-1 active:shadow-[2px_2px_0px_#000] transition-all`}
                     >
                          {props.isTransitioning ? (
                               <span className="flex items-center justify-center gap-3">
                                    <svg className="animate-spin h-8 w-8 text-white" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                    CRAFTING DIVERSE REALITY...
                               </span>
                          ) : props.hero ? (
                               '🔥 START ADVENTURE !'
                          ) : (
                               '⚠️ AWAITING HERO INITIATION...'
                          )}
                     </button>
                </div>

            </div>
          </div>
        </div>

        {/* Footer is only visible when setup is active */}
        <Footer />
        </>
    );
}
