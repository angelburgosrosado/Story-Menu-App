import React from 'react';

interface IntegrationsTabProps {
    stripePub: string;
    setStripePub: (val: string) => void;
    stripeSecret: string;
    setStripeSecret: (val: string) => void;
    paypalClient: string;
    setPaypalClient: (val: string) => void;
    handleSaveSetting: (key: string, val: string, isSecret: boolean) => void;
    showToast: (msg: string, type: 'success' | 'error') => void;
    fetchData: () => void;
}

export const IntegrationsTab: React.FC<IntegrationsTabProps> = ({
    stripePub, setStripePub,
    stripeSecret, setStripeSecret,
    paypalClient, setPaypalClient,
    handleSaveSetting, showToast,
    fetchData
}) => {
    return (
        <div className="bg-slate-950 border border-slate-700 p-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-sm text-cyan-400">Payment Gateway Integrations</h3>
                <button className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1 rounded text-xs font-bold" onClick={() => fetchData()}>Refresh</button>
            </div>
            <div className="text-xs text-yellow-500 font-mono mb-6 bg-yellow-500/10 p-3 rounded border border-yellow-500/20">
                * Tokens stored here override sandbox mocks. API keys are persisted securely in the database (`app_settings`) and synced to local environment variables.
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Stripe */}
                <div className="p-5 bg-slate-900 border border-slate-800 rounded">
                    <h4 className="font-bold text-indigo-400 mb-4 flex items-center gap-2">Stripe Processor</h4>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-[10px] uppercase font-bold text-gray-500">Publishable Key</label>
                                {stripePub ? <span className="text-[9px] font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded">CONNECTED</span> : <span className="text-[9px] font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded">MISSING</span>}
                            </div>
                            <div className="flex gap-2">
                                <input type="text" value={stripePub} onChange={e => setStripePub(e.target.value)} className="w-full bg-slate-950 border border-slate-700 p-2 text-xs rounded text-white focus:border-indigo-500 focus:outline-none" placeholder="pk_live_..." />
                                <button onClick={() => { handleSaveSetting('stripe_publishable_key', stripePub, false); showToast('Stripe Publishable Key saved', 'success'); }} className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 text-xs font-bold rounded shadow-lg shadow-indigo-500/20 transition-all active:scale-95">Save</button>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-[10px] uppercase font-bold text-gray-500">Secret Key (Restricted)</label>
                                {stripeSecret ? <span className="text-[9px] font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded">CONNECTED</span> : <span className="text-[9px] font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded">MISSING</span>}
                            </div>
                            <div className="flex gap-2">
                                <input type="password" value={stripeSecret} onChange={e => setStripeSecret(e.target.value)} className="w-full bg-slate-950 border border-slate-700 p-2 text-xs rounded text-white focus:border-indigo-500 focus:outline-none" placeholder="sk_live_..." />
                                <button onClick={() => { handleSaveSetting('stripe_secret_key', stripeSecret, true); showToast('Stripe Secret Key saved', 'success'); }} className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 text-xs font-bold rounded shadow-lg shadow-indigo-500/20 transition-all active:scale-95">Save</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* PayPal */}
                <div className="p-5 bg-slate-900 border border-slate-800 rounded">
                    <h4 className="font-bold text-blue-400 mb-4 flex items-center gap-2">PayPal Processor</h4>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-[10px] uppercase font-bold text-gray-500">Client ID</label>
                                {paypalClient ? <span className="text-[9px] font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded">CONNECTED</span> : <span className="text-[9px] font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded">MISSING</span>}
                            </div>
                            <div className="flex gap-2">
                                <input type="text" value={paypalClient} onChange={e => setPaypalClient(e.target.value)} className="w-full bg-slate-950 border border-slate-700 p-2 text-xs rounded text-white focus:border-blue-500 focus:outline-none" placeholder="Client ID from PayPal Developer Dashboard..." />
                                <button onClick={() => { handleSaveSetting('paypal_client_id', paypalClient, false); showToast('PayPal Client ID saved', 'success'); }} className="bg-blue-600 hover:bg-blue-500 text-white px-3 text-xs font-bold rounded shadow-lg shadow-blue-500/20 transition-all active:scale-95">Save</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
