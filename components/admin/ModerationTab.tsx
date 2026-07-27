import React from 'react';
import { Shield } from 'lucide-react';

export interface ModerationFlag {
    id: string | number;
    severity: string;
    reason: string;
    target_id: string;
    target_type: string;
}

interface ModerationTabProps {
    flags: ModerationFlag[];
    fetchData: () => void;
}

export const ModerationTab: React.FC<ModerationTabProps> = ({ flags, fetchData }) => {
    return (
        <div className="bg-slate-950 border border-slate-700 p-4">
            <h3 className="font-bold text-sm text-red-500 mb-4">Content Safety & Moderation Queue</h3>
            {flags.length === 0 ? (
                <div className="text-emerald-500 text-xs italic font-mono flex items-center gap-2">
                    <Shield size={14} /> Queue is clear. All global content is safe.
                </div>
            ) : (
                <ul className="space-y-3">
                    {flags.map((flag: any) => (
                        <li key={flag.id} className="p-3 bg-red-950/20 border border-red-900/50">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="text-red-400 font-bold text-sm uppercase">[{flag.severity}] Violation Flag</div>
                                    <div className="text-gray-400 text-xs mt-1">Reason: {flag.reason}</div>
                                    <div className="text-gray-500 text-[10px] mt-1">Target ID: {flag.target_id} ({flag.target_type})</div>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        className="bg-emerald-600/20 text-emerald-400 px-2 py-1 text-xs border border-emerald-600/50 hover:bg-emerald-600/40"
                                        onClick={async () => {
                                            await fetch(`/api/admin/moderation/${flag.id}/resolve`, { 
                                                method: 'POST', 
                                                headers: {'Content-Type': 'application/json'}, 
                                                body: JSON.stringify({ action: 'safe' }) 
                                            });
                                            fetchData();
                                        }}
                                    >
                                        Mark Safe
                                    </button>
                                    <button 
                                        className="bg-red-600/20 text-red-400 px-2 py-1 text-xs border border-red-600/50 hover:bg-red-600/40"
                                        onClick={async () => {
                                            await fetch(`/api/admin/moderation/${flag.id}/resolve`, { 
                                                method: 'POST', 
                                                headers: {'Content-Type': 'application/json'}, 
                                                body: JSON.stringify({ action: 'remove' }) 
                                            });
                                            fetchData();
                                        }}
                                    >
                                        Takedown Content
                                    </button>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
