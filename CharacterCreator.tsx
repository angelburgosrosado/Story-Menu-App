import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSelector, defaultStyles } from './StyleSelector';

interface CharacterCreatorProps {
    isLightMode: boolean;
}

export const CharacterCreator: React.FC<CharacterCreatorProps> = ({ isLightMode }) => {
    const { t } = useTranslation();
    const [selectedStyle, setSelectedStyle] = useState('anime');
    const [charName, setCharName] = useState('');
    const [charArchetype, setCharArchetype] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedChar, setGeneratedChar] = useState<any>(null);

    const handleGenerate = () => {
        setIsGenerating(true);
        // Simulate generation
        setTimeout(() => {
            setIsGenerating(false);
            setGeneratedChar({
                name: charName || t('character.defaultName', 'Unknown Hero'),
                archetype: charArchetype || t('character.defaultArchetype', 'Wanderer'),
                style: defaultStyles.find(s => s.id === selectedStyle)?.defaultLabel,
                imageUrl: defaultStyles.find(s => s.id === selectedStyle)?.imageUrl,
                stats: {
                    str: Math.floor(Math.random() * 10) + 10,
                    dex: Math.floor(Math.random() * 10) + 10,
                    int: Math.floor(Math.random() * 10) + 10,
                }
            });
        }, 1500);
    };

    return (
        <div className={`p-6 rounded-3xl border shadow-xl ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-gray-950 border-white/10'}`}>
            <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">🎭</span>
                <h2 className={`text-2xl font-bold ${isLightMode ? 'text-slate-800' : 'text-white'}`}>
                    {t('character.title', 'Casting Vault (Character Creator)')}
                </h2>
            </div>
            
            <p className={`mb-6 text-sm ${isLightMode ? 'text-slate-600' : 'text-gray-400'}`}>
                {t('character.description', 'Design and generate persistent characters to use across your story universes. Pick a visual style, define their archetype, and synthesize.')}
            </p>

            <StyleSelector 
                selectedStyle={selectedStyle} 
                onSelectStyle={setSelectedStyle} 
                isLightMode={isLightMode} 
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                    <label className={`block text-xs font-semibold mb-1 ${isLightMode ? 'text-slate-500' : 'text-gray-400'}`}>
                        {t('character.nameLabel', 'Character Name')}
                    </label>
                    <input 
                        type="text" 
                        value={charName}
                        onChange={(e) => setCharName(e.target.value)}
                        placeholder={t('character.namePlaceholder', 'e.g., Orion Flux')}
                        className={`w-full rounded-xl p-3 text-sm transition-all focus:outline-none focus:border-indigo-500/50 ${
                            isLightMode 
                            ? 'bg-white border border-slate-200 text-slate-800 placeholder-slate-400' 
                            : 'bg-black/40 border border-white/10 text-gray-200 placeholder-gray-600'
                        }`}
                    />
                </div>
                <div>
                    <label className={`block text-xs font-semibold mb-1 ${isLightMode ? 'text-slate-500' : 'text-gray-400'}`}>
                        {t('character.archetypeLabel', 'Archetype / Role')}
                    </label>
                    <input 
                        type="text" 
                        value={charArchetype}
                        onChange={(e) => setCharArchetype(e.target.value)}
                        placeholder={t('character.archetypePlaceholder', 'e.g., Cybernetic Mercenary')}
                        className={`w-full rounded-xl p-3 text-sm transition-all focus:outline-none focus:border-indigo-500/50 ${
                            isLightMode 
                            ? 'bg-white border border-slate-200 text-slate-800 placeholder-slate-400' 
                            : 'bg-black/40 border border-white/10 text-gray-200 placeholder-gray-600'
                        }`}
                    />
                </div>
            </div>

            <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all disabled:opacity-50"
            >
                {isGenerating ? t('character.synthesizing', 'Synthesizing DNA...') : t('character.generateBtn', 'Generate Character Entity')}
            </button>

            {generatedChar && (
                <div className={`mt-8 p-4 rounded-2xl border flex gap-4 ${isLightMode ? 'bg-white border-slate-200' : 'bg-black/50 border-indigo-500/30'}`}>
                    <img src={generatedChar.imageUrl} alt="Avatar" className="w-24 h-24 rounded-xl object-cover border border-white/10" />
                    <div>
                        <h3 className={`text-xl font-bold ${isLightMode ? 'text-slate-800' : 'text-white'}`}>{generatedChar.name}</h3>
                        <p className={`text-sm mb-2 ${isLightMode ? 'text-indigo-600' : 'text-indigo-400'}`}>{generatedChar.archetype} • {generatedChar.style}</p>
                        <div className="flex gap-3 text-xs font-mono text-gray-400">
                            <span>STR: {generatedChar.stats.str}</span>
                            <span>DEX: {generatedChar.stats.dex}</span>
                            <span>INT: {generatedChar.stats.int}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
