import React, { useState, useEffect } from 'react';
import { Shield, X, Users, DollarSign, Activity, Trash2, RefreshCw } from 'lucide-react';

interface Customer {
  id: string;
  email: string;
  tier: string | null;
  subscriptionId: string | null;
  paymentMethod: string | null;
  createdAt: string;
}

interface Stats {
  totalUsers: number;
  proUsers: number;
  enterpriseUsers: number;
  freeUsers: number;
  mrrEstimate: number;
  stripePayments: number;
  paypalPayments: number;
}

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, custRes] = await Promise.all([
        fetch('/api/admin/stats').then(r => r.json()),
        fetch('/api/admin/customers').then(r => r.json())
      ]);
      setStats(statsRes);
      setCustomers(custRes);
    } catch (e) {
      console.error("Failed to load admin data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchData();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-sm z-[10000] p-4 flex items-center justify-center">
      <div className="w-full max-w-5xl bg-slate-900 border-4 border-cyan-800 shadow-[8px_8px_0px_#000] text-white p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black uppercase text-cyan-400 flex items-center gap-2">
            <Shield className="animate-pulse" /> SaaS Admin Control Panel
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X /></button>
        </div>

        {loading ? (
            <div className="text-center py-20 font-mono text-cyan-400">Loading Enterprise Metrics...</div>
        ) : (
            <div className="space-y-6">
                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Total Creators', value: stats.totalUsers, icon: Users },
                            { label: 'Pro Memberships', value: stats.proUsers, icon: Shield },
                            { label: 'Enterprise', value: stats.enterpriseUsers, icon: DollarSign },
                            { label: 'MRR Estimate', value: `$${stats.mrrEstimate}`, icon: Activity },
                        ].map((s, i) => (
                            <div key={i} className="bg-slate-950 border border-slate-700 p-4">
                                <div className="text-gray-500 text-[10px] uppercase font-bold">{s.label}</div>
                                <div className="text-2xl font-black text-white flex items-center gap-2">
                                    <s.icon size={16} /> {s.value}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Customer List */}
                <div className="bg-slate-950 border border-slate-700">
                    <div className="p-3 border-b border-slate-700 flex justify-between items-center bg-slate-900">
                        <span className="font-bold text-xs uppercase">Recent Registered Creators</span>
                        <button onClick={fetchData} className="text-cyan-400 hover:text-cyan-300"><RefreshCw size={14} /></button>
                    </div>
                    <table className="w-full text-left text-[11px] font-mono">
                        <thead className="bg-slate-900 text-gray-400 uppercase">
                            <tr>
                                <th className="p-2">Email</th>
                                <th className="p-2">Tier</th>
                                <th className="p-2">Method</th>
                                <th className="p-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                        {customers.map(c => (
                            <tr key={c.id} className="border-t border-slate-800 hover:bg-slate-900/50">
                                <td className="p-2 truncate">{c.email}</td>
                                <td className="p-2 text-yellow-400">{c.tier || 'Free'}</td>
                                <td className="p-2">{c.paymentMethod || '-'}</td>
                                <td className="p-2">
                                    <button 
                                        onClick={async () => {
                                            const newTier = prompt("Enter new tier (Pro/Enterprise/Free):", c.tier || 'Free');
                                            if (newTier) {
                                                await fetch(`/api/admin/customers/${c.email}`, { 
                                                    method: 'PUT', 
                                                    headers: {'Content-Type': 'application/json'},
                                                    body: JSON.stringify({ tier: newTier }) 
                                                });
                                                fetchData();
                                            }
                                        }}
                                        className="text-cyan-400 hover:text-cyan-300 mr-3">
                                        Edit
                                    </button>
                                    <button 
                                        onClick={async () => {
                                            if(confirm(`Delete ${c.email}?`)) {
                                                await fetch(`/api/admin/customers/${c.email}`, { method: 'DELETE' });
                                                fetchData();
                                            }
                                        }}
                                        className="text-red-500 hover:text-red-300">
                                        <Trash2 size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
