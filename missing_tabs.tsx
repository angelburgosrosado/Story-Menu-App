
                    {activeTab === 'administrators' && (
                        <div className="p-8 bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800 mb-6">Security Contexts & Admin Accounts</h3>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                    <div className="p-4 bg-white border-b border-slate-100">
                                        <span className="font-bold text-xs uppercase tracking-wider text-slate-600">Active Operators</span>
                                    </div>
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 text-slate-400 font-medium text-[10px] uppercase tracking-wider border-b border-slate-200">
                                            <tr>
                                                <th className="p-4">Identity</th>
                                                <th className="p-4">Clearance</th>
                                                <th className="p-4">Issued On</th>
                                                <th className="p-4 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {adminUsers.map((u: any, i: number) => (
                                                <tr key={i} className="hover:bg-slate-50">
                                                    <td className="p-4 font-mono font-bold text-slate-800">{u.username}</td>
                                                    <td className="p-4">
                                                        <span className="bg-purple-100 text-purple-700 text-[10px] font-bold uppercase px-2 py-1 rounded">{u.role}</span>
                                                    </td>
                                                    <td className="p-4 text-xs font-mono text-slate-500">{new Date(u.created_at).toLocaleDateString()}</td>
                                                    <td className="p-4 text-right">
                                                        <button onClick={() => handleDeleteAdmin(u.username)} className="text-red-500 hover:text-white hover:bg-red-500 border border-red-200 text-xs font-bold uppercase px-3 py-1.5 rounded transition-colors">Revoke</button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {adminUsers.length === 0 && (
                                                <tr><td colSpan={4} className="p-8 text-center text-slate-400 italic">No elevated identities exist.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
                                    <h4 className="font-bold text-sm mb-6 uppercase text-slate-800 flex items-center gap-2">
                                        <Shield size={16} className="text-blue-500" /> Issue Credentials
                                    </h4>
                                    <form onSubmit={handleCreateAdmin} className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Operator Username</label>
                                            <input type="text" value={newAdminUsername} onChange={e => setNewAdminUsername(e.target.value)} required className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all bg-slate-50" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Secret Key</label>
                                            <input type="password" value={newAdminPassword} onChange={e => setNewAdminPassword(e.target.value)} required className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all bg-slate-50" />
                                        </div>
                                        <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg text-sm uppercase tracking-wider hover:bg-slate-800 transition-colors mt-2 shadow-md">Authorize Access</button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Diagnostics Panel */}
                    {activeTab === 'diagnostics' && (
                        <div className="p-8">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800 mb-1">System Health & Diagnostics</h3>
                                    <p className="text-sm text-slate-500">Live service monitoring and dependency status.</p>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={runLiveVerification} className="px-5 py-2.5 bg-white border border-purple-200 hover:border-purple-300 text-purple-700 text-sm font-bold rounded-xl shadow-sm transition-all">
                                        Perform Live Verification
                                    </button>
                                    <button onClick={runDiagnostics} disabled={runningDiagnostics} className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl shadow-md disabled:opacity-50 flex items-center gap-2 transition-all">
                                        {runningDiagnostics ? <RefreshCw size={16} className="animate-spin" /> : <Activity size={16} />}
                                        {runningDiagnostics ? 'Scanning...' : 'Run Diagnostics'}
                                    </button>
                                </div>
                            </div>
                            
                            {!healthData ? (
                                <div className="text-slate-400 text-sm font-mono text-center py-16 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">Awaiting diagnostic telemetry...</div>
                            ) : healthData.error ? (
                                <div className="text-red-600 text-sm font-mono p-6 border border-red-200 bg-red-50 rounded-2xl shadow-sm">
                                    <strong className="block mb-2">SYSTEM FAULT:</strong> {healthData.error}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* DB Card */}
                                    <div className="border border-slate-200 p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="font-bold text-sm uppercase tracking-wider text-slate-600">Database Engine</h4>
                                            <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${healthData.database.status === 'ok' ? 'bg-emerald-100 text-emerald-700' : healthData.database.status === 'offline' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                                {healthData.database.status}
                                            </div>
                                        </div>
                                        <p className="text-sm font-mono text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">{healthData.database.message}</p>
                                    </div>

                                    {/* Storage Card */}
                                    <div className="border border-slate-200 p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="font-bold text-sm uppercase tracking-wider text-slate-600">Blob Storage</h4>
                                            <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${healthData.storage.status === 'ok' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                {healthData.storage.status}
                                            </div>
                                        </div>
                                        <p className="text-sm font-mono text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">{healthData.storage.message}</p>
                                    </div>

                                    {/* Gemini Card */}
                                    <div className="border border-slate-200 p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="font-bold text-sm uppercase tracking-wider text-slate-600">Gemini Inference API</h4>
                                            <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${healthData.integrations.gemini.status === 'ok' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                {healthData.integrations.gemini.status}
                                            </div>
                                        </div>
                                        <p className="text-sm font-mono text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">{healthData.integrations.gemini.message}</p>
                                    </div>

                                    {/* Payments Card */}
                                    <div className="border border-slate-200 p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="font-bold text-sm uppercase tracking-wider text-slate-600">Financial Processors</h4>
                                            <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${(healthData.integrations.stripe.status === 'ok' || healthData.integrations.paypal.status === 'ok') ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {(healthData.integrations.stripe.status === 'ok' || healthData.integrations.paypal.status === 'ok') ? 'operational' : 'degraded'}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-100">
                                                <span className="text-xs font-bold text-slate-600">Stripe</span>
                                                <span className="text-xs">{healthData.integrations.stripe.status === 'ok' ? '✅ Connected' : '❌ Failed'}</span>
                                            </div>
                                            <div className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-100">
                                                <span className="text-xs font-bold text-slate-600">PayPal</span>
                                                <span className="text-xs">{healthData.integrations.paypal.status === 'ok' ? '✅ Connected' : '❌ Failed'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* AI Sandbox Panel */}