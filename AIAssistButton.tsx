import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

interface AIAssistButtonProps {
    onSuggest: (suggestion: string) => void;
    context: string;
    fieldLabel: string;
    className?: string;
}

export const AIAssistButton: React.FC<AIAssistButtonProps> = ({ onSuggest, context, fieldLabel, className = '' }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleSuggest = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/gemini/suggest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    prompt: `Generate a creative suggestion for the field "${fieldLabel}" in a comic generation tool. Context: ${context || 'General character or story details'}. Keep it concise and imaginative.`
                })
            });

            if (response.ok) {
                const data = await response.json();
                onSuggest(data.suggestion || data.text || '');
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
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all 
                ${isLoading ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 shadow-sm border border-indigo-200'}
                ${className}`}
            title="Generate suggestion with AI"
        >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            <span>{isLoading ? 'Thinking...' : 'AI Assist'}</span>
        </button>
    );
};
