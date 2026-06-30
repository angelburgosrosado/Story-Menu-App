import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

interface AIAssistButtonProps {
    mode: 'editorial' | 'comic';
    targetField: string;
    currentValue: string;
    onSuggestion: (suggestion: string) => void;
}

export const AIAssistButton: React.FC<AIAssistButtonProps> = ({ mode, targetField, currentValue, onSuggestion }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleSuggest = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/gemini/suggest', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-gemini-key': localStorage.getItem('GEMINI_API_KEY') || ''
                },
                body: JSON.stringify({ 
                    fieldName: targetField,
                    currentValue,
                    genre: mode === 'editorial' ? 'Editorial' : 'Comic Book',
                    userEmail: localStorage.getItem('ADMIN_LOGGED_IN') === 'true' ? 'abglco@protonmail.com' : undefined
                })
            });

            if (response.ok) {
                const data = await response.json();
                onSuggestion(data.suggestion || data.text || '');
            } else {
                console.error('Failed to get AI suggestion');
            }
        } catch (error) {
            console.error('Error fetching AI suggestion:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            type="button"
            onClick={handleSuggest}
            disabled={isLoading}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-md transition-all 
                ${isLoading ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-slate-800 text-yellow-400 hover:bg-slate-700 shadow-sm border border-slate-700'}`}
            title="Generate suggestion with AI"
        >
            {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            <span>{isLoading ? 'Thinking...' : 'AI Assist'}</span>
        </button>
    );
};
