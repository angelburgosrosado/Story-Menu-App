import React, { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  Layers, 
  Cpu, 
  Activity, 
  DollarSign, 
  Users, 
  Search, 
  ArrowUpRight 
} from 'lucide-react';

interface AdminCostAnalyticsViewProps {
  analyticsData: any;
}

const COLORS = ['#6366f1', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

export const AdminCostAnalyticsView: React.FC<AdminCostAnalyticsViewProps> = ({ analyticsData }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Process Trend Data (Cost by Date)
  const trendData = useMemo(() => {
    if (!analyticsData?.logs || analyticsData.logs.length === 0) return [];
    
    const costByDate: Record<string, number> = {};
    // Process in chronological order (reverse the descending logs)
    const logsCopy = [...analyticsData.logs].reverse();
    
    logsCopy.forEach((log: any) => {
      if (!log.created_at) return;
      const date = new Date(log.created_at).toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric' 
      });
      costByDate[date] = (costByDate[date] || 0) + parseFloat(log.cost_usd || '0');
    });

    return Object.entries(costByDate).map(([date, cost]) => ({
      date,
      cost: parseFloat(cost.toFixed(4))
    }));
  }, [analyticsData?.logs]);

  // 2. Process Cost by Operation
  const operationData = useMemo(() => {
    if (!analyticsData?.logs || analyticsData.logs.length === 0) return [];
    
    const costByOp: Record<string, number> = {};
    analyticsData.logs.forEach((log: any) => {
      const op = log.operation || 'unknown';
      costByOp[op] = (costByOp[op] || 0) + parseFloat(log.cost_usd || '0');
    });

    return Object.entries(costByOp)
      .map(([name, value]) => ({
        name,
        value: parseFloat(value.toFixed(4))
      }))
      .sort((a, b) => b.value - a.value);
  }, [analyticsData?.logs]);

  // 3. Process Cost by Provider (using pre-calculated cents, convert to USD)
  const providerData = useMemo(() => {
    if (!analyticsData?.by_provider) return [];
    return analyticsData.by_provider.map((p: any) => ({
      name: p.provider,
      value: parseFloat((p.total / 100).toFixed(4))
    }));
  }, [analyticsData?.by_provider]);

  // Filter logs for search
  const filteredLogs = useMemo(() => {
    if (!analyticsData?.logs) return [];
    if (!searchTerm) return analyticsData.logs;
    
    const lowerSearch = searchTerm.toLowerCase();
    return analyticsData.logs.filter((log: any) => 
      (log.user_email || '').toLowerCase().includes(lowerSearch) ||
      (log.operation || '').toLowerCase().includes(lowerSearch) ||
      (log.model || '').toLowerCase().includes(lowerSearch)
    );
  }, [analyticsData?.logs, searchTerm]);

  // Derived KPI metrics
  const totalCost = analyticsData?.total_cost_cents ? analyticsData.total_cost_cents / 100 : 0;
  const totalCalls = analyticsData?.logs?.length || 0;
  const avgCostPerCall = totalCalls > 0 ? totalCost / totalCalls : 0;

  if (!analyticsData) {
    return (
      <div className="flex flex-col items-center justify-center p-24 text-slate-400 space-y-4">
        <Activity className="w-8 h-8 animate-spin text-indigo-500" />
        <div className="text-sm font-medium">Querying Firestore telemetry...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            AI Cost Analytics <span className="text-xs bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded-full border border-indigo-100">Live</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Track actual fiat USD cost distribution across generative engines
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total API Spend
            </h3>
            <DollarSign className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-3xl font-black text-slate-800">
            ${totalCost.toFixed(4)}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Cumulative operating cost across platforms
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Input Tokens
            </h3>
            <Layers className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-slate-800">
            {analyticsData.totals?.tokensIn?.toLocaleString() || 0}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Ingested prompt sequences and metadata
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Output Tokens
            </h3>
            <Cpu className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-3xl font-black text-slate-800">
            {analyticsData.totals?.tokensOut?.toLocaleString() || 0}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Synthesized narratives and model outputs
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Avg Cost / Event
            </h3>
            <TrendingUp className="w-4 h-4 text-pink-500" />
          </div>
          <div className="text-3xl font-black text-slate-800">
            ${avgCostPerCall.toFixed(4)}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Based on {totalCalls} recorded events
          </p>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cost Trend AreaChart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-slate-800 tracking-tight">
              Operating Cost Trajectory
            </h3>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">USD Over Time</span>
          </div>
          <div className="h-64 w-full">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}
                    formatter={(value: any) => [`$${value}`, 'Cost']}
                  />
                  <Area type="monotone" dataKey="cost" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorCost)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                Aggregate trajectory requires subsequent API invocations
              </div>
            )}
          </div>
        </div>

        {/* Cost by Provider PieChart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-slate-800 tracking-tight">
              Provider Cost Distribution
            </h3>
          </div>
          <div className="h-48 w-full flex items-center justify-center">
            {providerData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={providerData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {providerData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [`$${value}`, 'Cost']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-400 text-xs">No provider cost registry</div>
            )}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {providerData.map((item, idx) => (
              <div key={item.name} className="flex items-center space-x-2 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="text-slate-500 capitalize">{item.name}:</span>
                <span className="font-bold text-slate-700">${item.value.toFixed(4)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cost by Operation BarChart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-slate-800 tracking-tight">
              Activity Cost Breakdown
            </h3>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">By Operation</span>
          </div>
          <div className="h-64 w-full">
            {operationData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={operationData} layout="vertical" margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} tickLine={false} width={80} />
                  <Tooltip formatter={(value: any) => [`$${value}`, 'Cost']} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {operationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                Requires operation logs
              </div>
            )}
          </div>
        </div>

        {/* User Leaderboard */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800 tracking-tight">
                Operator Consumption Leaderboard
              </h3>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
              {analyticsData.by_user?.map((u: any, idx: number) => (
                <div
                  key={u.user_email}
                  className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-[10px]">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-800 truncate max-w-xs md:max-w-md">
                        {u.user_email}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {u.calls} transactions completed
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-slate-800 text-sm">
                      ${(parseFloat(u.total) / 100).toFixed(4)}
                    </div>
                  </div>
                </div>
              ))}
              {(!analyticsData.by_user || analyticsData.by_user.length === 0) && (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Leaderboard data requires operational entries
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Audit Logs with Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-black text-slate-800 tracking-tight">
              Operational Telemetry Audit Trail
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Verbatim query records parsed directly from firestore logs
            </p>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search user, operation, or model..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all w-64 text-slate-700"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-400 font-bold text-[10px] uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Operator Email</th>
                <th className="p-4">Action Context</th>
                <th className="p-4">Inference Model</th>
                <th className="p-4">Tokens (In / Out)</th>
                <th className="p-4 text-right">Computed Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.slice(0, 50).map((log: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50/55 transition-colors">
                  <td className="p-4 whitespace-nowrap text-slate-400">
                    {log.created_at ? new Date(log.created_at).toLocaleString() : 'N/A'}
                  </td>
                  <td className="p-4 font-bold text-slate-700 truncate max-w-xs">
                    {log.user_email}
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 uppercase">
                      {log.operation}
                    </span>
                  </td>
                  <td className="p-4 text-slate-500 font-mono">
                    {log.model}
                  </td>
                  <td className="p-4">
                    {log.tokens_in?.toLocaleString() || 0} / {log.tokens_out?.toLocaleString() || 0}
                  </td>
                  <td className="p-4 text-right font-bold text-slate-800">
                    ${parseFloat(log.cost_usd || '0').toFixed(4)}
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No matching log events found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
