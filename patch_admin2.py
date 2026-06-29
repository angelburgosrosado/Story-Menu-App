with open('AdminApp.tsx', 'r') as f:
    content = f.read()

# 1. State
if "const [bypasses, setBypasses] = useState" not in content:
    content = content.replace(
        "const [systemLogs, setSystemLogs] = useState<any[]>([]);",
        "const [systemLogs, setSystemLogs] = useState<any[]>([]);\n  const [bypasses, setBypasses] = useState<any[]>([]);"
    )

# 2. Fetch Logic
if "bypassesRes" not in content:
    content = content.replace(
        """        adminFetch("/api/admin/system/users")
          .then((r) => (r.ok ? r.json() : []))
          .catch(() => []),
      ]);""",
        """        adminFetch("/api/admin/system/users")
          .then((r) => (r.ok ? r.json() : []))
          .catch(() => []),
        adminFetch("/api/admin/system/bypasses")
          .then((r) => (r.ok ? r.json() : []))
          .catch(() => []),
      ]);"""
    )
    content = content.replace(
        """      setCostAnalytics(costsRes);
      setAdminUsers(Array.isArray(adminUsersRes) ? adminUsersRes : []);
      runDiagnostics();""",
        """      setCostAnalytics(costsRes);
      setAdminUsers(Array.isArray(adminUsersRes) ? adminUsersRes : []);
      setBypasses(Array.isArray(arguments[9]) ? arguments[9] : []); // Using arguments since we can't easily destructure in the regex replace without changing Promise.all
      runDiagnostics();"""
    )
    
    # Actually, a safer way to replace Promise.all array destructuring:
    content = content.replace(
        """      const [
        statsRes,
        custRes,
        catRes,
        flagRes,
        logsRes,
        plansRes,
        settingsRes,
        costsRes,
        adminUsersRes,
      ] = await Promise.all([""",
        """      const [
        statsRes,
        custRes,
        catRes,
        flagRes,
        logsRes,
        plansRes,
        settingsRes,
        costsRes,
        adminUsersRes,
        bypassesRes,
      ] = await Promise.all(["""
    )
    
    content = content.replace(
        """setBypasses(Array.isArray(arguments[9]) ? arguments[9] : []); // Using arguments since we can't easily destructure in the regex replace without changing Promise.all""",
        """setBypasses(Array.isArray(bypassesRes) ? bypassesRes : []);"""
    )

# 3. UI
tab_target = '{activeTab === "administrators" && ('
tab_replacement = """{activeTab === "logs" && (
                <div className="p-8 space-y-8 bg-slate-50 relative animate-in fade-in duration-200">
                  
                  {/* Operational Bypasses Panel */}
                  <div className="bg-white rounded-2xl shadow-sm border border-rose-100 overflow-hidden">
                    <div className="bg-rose-50 px-6 py-4 border-b border-rose-100 flex items-center gap-3">
                      <div className="p-2 bg-rose-100 rounded-lg text-rose-600">
                        <Activity size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-rose-900">Active Operational Bypasses</h3>
                        <p className="text-sm text-rose-700">Structural overrides and development fallbacks currently overriding security or standard flow.</p>
                      </div>
                    </div>
                    <div className="p-6">
                      {bypasses.length === 0 ? (
                        <div className="text-sm text-slate-500 italic">No structural bypasses detected. System is running in full production security mode.</div>
                      ) : (
                        <div className="space-y-4">
                          {bypasses.map((bp, i) => (
                            <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-rose-50/50 rounded-xl border border-rose-100/50">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-200 text-rose-800">{bp.severity}</span>
                                  <span className="font-bold text-rose-900">{bp.type}</span>
                                </div>
                                <p className="text-sm text-rose-700">{bp.description}</p>
                                <div className="mt-2 text-xs text-rose-600 font-medium">Affected: {bp.affected_components.join(", ")}</div>
                              </div>
                              <div className="mt-4 md:mt-0 text-sm font-bold text-rose-500 uppercase tracking-wider px-4 py-2 bg-white rounded-lg shadow-sm border border-rose-100">
                                {bp.status}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Webhook Allocations */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100">
                      <h3 className="font-bold text-slate-800">Allocated Webhook Endpoints</h3>
                      <p className="text-sm text-slate-500">URLs for external integrations to send data to.</p>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <div>
                          <h4 className="font-bold text-slate-700 text-sm">Stripe Payments Webhook</h4>
                          <code className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded mt-1 inline-block">POST /api/webhooks/stripe</code>
                        </div>
                        <button onClick={() => navigator.clipboard.writeText(window.location.origin + "/api/webhooks/stripe")} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 text-slate-600 transition-colors">
                          Copy Full URL
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Error Stream Console */}
                  <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-slate-100">Webhook & Error Logs Stream</h3>
                        <p className="text-sm text-slate-400">Live feed of internal errors and webhook processing failures.</p>
                      </div>
                      <button onClick={fetchData} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs hover:bg-slate-700 transition-colors flex items-center gap-2">
                        <Activity size={14} /> Refresh Feed
                      </button>
                    </div>
                    <div className="p-0 overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                          <tr className="bg-slate-950/50">
                            <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">Timestamp</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">Source</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">Event</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">Error</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50 text-sm">
                          {systemLogs.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-6 py-8 text-center text-slate-500 font-mono text-sm">
                                [System initialized] No logged errors or webhook failures.
                              </td>
                            </tr>
                          ) : (
                            systemLogs.map((log: any) => (
                              <tr key={log.id} className="hover:bg-slate-800/20 transition-colors">
                                <td className="px-6 py-4 font-mono text-xs text-slate-400 whitespace-nowrap">
                                  {new Date(log.created_at).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 text-slate-300 font-medium">
                                  {log.source || "System"}
                                </td>
                                <td className="px-6 py-4 text-blue-400 font-mono text-xs">
                                  {log.event_type}
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-rose-400 font-mono text-xs truncate max-w-md" title={log.error_message}>
                                    {log.error_message}
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "administrators" && ("""

if tab_target in content:
    content = content.replace(tab_target, tab_replacement)

with open('AdminApp.tsx', 'w') as f:
    f.write(content)
print("Patched AdminApp.tsx successfully.")
