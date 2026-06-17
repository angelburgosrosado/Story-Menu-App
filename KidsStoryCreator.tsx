import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSelector, StyleOption } from './StyleSelector';

const kidsStyles: StyleOption[] = [
    { id: 'crayon', labelKey: 'style.crayon', defaultLabel: 'Crayon Drawing', imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=200&q=80' },
    { id: 'storybook', labelKey: 'style.storybook', defaultLabel: 'Storybook', imageUrl: 'https://images.unsplash.com/photo-1550592704-6c76defa99ce?auto=format&fit=crop&w=200&q=80' },
    { id: 'popup', labelKey: 'style.popup', defaultLabel: 'Pop-up Book', imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80' },
    { id: 'claymation', labelKey: 'style.claymation', defaultLabel: 'Claymation', imageUrl: 'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=200&q=80' },
];

interface KidsStoryCreatorProps {
    isLightMode: boolean;
}

export const KidsStoryCreator: React.FC<KidsStoryCreatorProps> = ({ isLightMode }) => {
    const { t } = useTranslation();
    const [selectedStyle, setSelectedStyle] = useState('storybook');
    const [heroName, setHeroName] = useState('');
    const [favoriteAnimal, setFavoriteAnimal] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedStory, setGeneratedStory] = useState<any>(null);

    const handleGenerate = () => {
        setIsGenerating(true);
        // Simulate kid-safe generation
        setTimeout(() => {
            setIsGenerating(false);
            setGeneratedStory({
                title: t('kids.mockTitle', 'The Adventures of {{name}} and the {{animal}}', { 
                    name: heroName || 'Timmy', 
                    animal: favoriteAnimal || 'Friendly Bear' 
                }),
                text: t('kids.mockText', 'Once upon a time, in a bright and colorful forest, a brave little hero named {{name}} set out on a wonderful journey with their best friend, the {{animal}}...', {
                    name: heroName || 'Timmy', 
                    animal: favoriteAnimal || 'Friendly Bear' 
                }),
                imageUrl: kidsStyles.find(s => s.id === selectedStyle)?.imageUrl
            });
        }, 1500);
    };

    return (
        <div className={`p-6 rounded-3xl border shadow-xl ${isLightMode ? 'bg-amber-50 border-amber-200' : 'bg-orange-950/20 border-orange-500/20'}`}>
            <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">🧸</span>
                <h2 className={`text-2xl font-bold ${isLightMode ? 'text-amber-800' : 'text-orange-300'}`}>
                    {t('kids.title', 'Kids Story Creator')}
                </h2>
            </div>
            
            <p className={`mb-6 text-sm ${isLightMode ? 'text-amber-700/80' : 'text-orange-200/70'}`}>
                {t('kids.description', 'Create gentle, fun, and educational stories safe for children. Pick a friendly visual style and let the magic happen.')}
            </p>

            <StyleSelector 
                selectedStyle={selectedStyle} 
                onSelectStyle={setSelectedStyle} 
                isLightMode={isLightMode} 
                styles={kidsStyles}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                    <label className={`block text-xs font-semibold mb-1 ${isLightMode ? 'text-amber-700' : 'text-orange-300'}`}>
                        {t('kids.heroNameLabel', 'Hero Name')}
                    </label>
                    <input 
                        type="text" 
                        value={heroName}
                        onChange={(e) => setHeroName(e.target.value)}
                        placeholder={t('kids.heroNamePlaceholder', 'e.g., Mia')}
                        className={`w-full rounded-xl p-3 text-sm transition-all focus:outline-none focus:border-orange-500/50 ${
                            isLightMode 
                            ? 'bg-white border border-amber-200 text-slate-800 placeholder-slate-400' 
                            : 'bg-black/40 border border-orange-500/20 text-gray-200 placeholder-gray-600'
                        }`}
                    />
                </div>
                <div>
                    <label className={`block text-xs font-semibold mb-1 ${isLightMode ? 'text-amber-700' : 'text-orange-300'}`}>
                        {t('kids.animalLabel', 'Favorite Animal')}
                    </label>
                    <input 
                        type="text" 
                        value={favoriteAnimal}
                        onChange={(e) => setFavoriteAnimal(e.target.value)}
                        placeholder={t('kids.animalPlaceholder', 'e.g., Magic Bunny')}
                        className={`w-full rounded-xl p-3 text-sm transition-all focus:outline-none focus:border-orange-500/50 ${
                            isLightMode 
                            ? 'bg-white border border-amber-200 text-slate-800 placeholder-slate-400' 
                            : 'bg-black/40 border border-orange-500/20 text-gray-200 placeholder-gray-600'
                        }`}
                    />
                </div>
            </div>

            <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold transition-all disabled:opacity-50 shadow-lg shadow-orange-500/30"
            >
                {isGenerating ? t('kids.synthesizing', 'Sprinkling Magic Dust...') : t('kids.generateBtn', 'Create Storybook')}
            </button>

            {generatedStory && (
                <div className={`mt-8 p-6 rounded-2xl border flex flex-col sm:flex-row gap-6 ${isLightMode ? 'bg-white border-amber-200' : 'bg-black/50 border-orange-500/30'}`}>
                    <img src={generatedStory.imageUrl} alt="Story" className="w-full sm:w-1/3 h-48 rounded-xl object-cover border border-white/10 shadow-md" />
                    <div className="flex-1">
                        <h3 className={`text-2xl font-bold mb-3 ${isLightMode ? 'text-amber-800' : 'text-orange-300'}`}>{generatedStory.title}</h3>
                        <p className={`text-base leading-relaxed ${isLightMode ? 'text-slate-600' : 'text-gray-300'}`}>{generatedStory.text}</p>
                    </div>
                </div>
            )}
        </div>
    );
};
