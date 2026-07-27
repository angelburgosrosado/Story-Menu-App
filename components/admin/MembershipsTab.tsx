import React from 'react';
import { RefreshCw, Trash2 } from 'lucide-react';

export interface Customer {
    id: string | number;
    email: string;
    tier?: string;
    paymentMethod?: string;
}

interface MembershipsTabProps {
    customers: Customer[];
    fetchData: () => void;
}

export const MembershipsTab: React.FC<MembershipsTabProps> = ({ customers, fetchData }) => {
    return (
        <div className="bg-slate-950 border border-slate-700">
            <div className="p-3 border-b border-slate-700 flex justify-between items-center bg-slate-900">
                <span className="font-bold text-xs uppercase">Recent Registered Creators</span>
                <button onClick={fetchData} className="text-cyan-400 hover:text-cyan-300">
                    <RefreshCw size={14} />
                </button>
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
                                    className="text-cyan-400 hover:text-cyan-300 mr-3"
                                >
                                    Edit
                                </button>
                                <button 
                                    onClick={async () => {
                                        if(confirm(`Delete ${c.email}?`)) {
                                            await fetch(`/api/admin/customers/${c.email}`, { method: 'DELETE' });
                                            fetchData();
                                        }
                                    }}
                                    className="text-red-500 hover:text-red-300"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
