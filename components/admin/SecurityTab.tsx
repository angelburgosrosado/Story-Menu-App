import React from 'react';
import { Shield, Trash2 } from 'lucide-react';

export interface AdminUser {
    username: string;
    role?: string;
    created_at: string;
}

interface SecurityTabProps {
    adminUsers: AdminUser[];
    handleDeleteAdmin: (username: string) => void;
    handleCreateAdmin: (e: React.FormEvent) => void;
    newAdminEmail: string;
    setNewAdminEmail: (val: string) => void;
    newAdminPassword: string;
    setNewAdminPassword: (val: string) => void;
}

export const SecurityTab: React.FC<SecurityTabProps> = ({
    adminUsers,
    handleDeleteAdmin,
    handleCreateAdmin,
    newAdminEmail,
    setNewAdminEmail,
    newAdminPassword,
    setNewAdminPassword
}) => {
    return (
        <div className="bg-slate-950 border border-slate-700 p-4">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="font-bold text-lg text-yellow-400 flex items-center gap-2">
                        <Shield size={20} /> Access Control Lists
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">Manage users who have Super Admin clearance.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h4 className="font-bold text-sm text-slate-300 mb-3 border-b border-slate-800 pb-2">Authorized Administrators</h4>
                    {adminUsers.length === 0 ? (
                        <div className="text-gray-500 text-xs italic bg-slate-900 p-4 rounded text-center">No admins configured. Check default credentials.</div>
                    ) : (
                        <ul className="space-y-2">
                            {adminUsers.map((user: any) => (
                                <li key={user.username} className="flex justify-between items-center p-3 bg-slate-900 border border-slate-800 rounded">
                                    <div>
                                        <div className="font-bold text-sm text-slate-200">{user.username}</div>
                                        <div className="text-[10px] text-gray-500">Role: {user.role || 'Admin'} • Created: {new Date(user.created_at).toLocaleDateString()}</div>
                                    </div>
                                    <button 
                                        onClick={() => handleDeleteAdmin(user.username)}
                                        className="text-red-500 hover:text-red-400 p-2 rounded hover:bg-red-500/10 transition-colors"
                                        title="Revoke Access"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="bg-slate-900 p-4 rounded border border-slate-800">
                    <h4 className="font-bold text-sm text-slate-300 mb-4">Grant Access</h4>
                    <form onSubmit={handleCreateAdmin} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-1">Email Address</label>
                            <input 
                                type="email" 
                                value={newAdminEmail}
                                onChange={e => setNewAdminEmail(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-yellow-400 outline-none"
                                placeholder="e.g. admin@story.menu"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-1">Secure Password</label>
                            <input 
                                type="password" 
                                value={newAdminPassword}
                                onChange={e => setNewAdminPassword(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-yellow-400 outline-none"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        <button 
                            type="submit"
                            className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-2 rounded transition-colors text-sm"
                        >
                            Create Administrator
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
