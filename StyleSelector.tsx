import React from 'react';
import { useTranslation } from 'react-i18next';

export interface StyleOption {
    id: string;
    labelKey: string;
    defaultLabel: string;
    imageUrl: string;
}

export const defaultStyles: StyleOption[] = [
    { id: 'anime', labelKey: 'style.anime', defaultLabel: 'Anime', imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=200&q=80' },
    { id: '3d-render', labelKey: 'style.3d', defaultLabel: '3D Pixar', imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80' },
    { id: 'watercolor', labelKey: 'style.watercolor', defaultLabel: 'Watercolor', imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=200&q=80' },
    { id: 'cyberpunk', labelKey: 'style.cyberpunk', defaultLabel: 'Cyberpunk', imageUrl: 'https://images.unsplash.com/photo-1515630278258-407f66498911?auto=format&fit=crop&w=200&q=80' },
];

interface StyleSelectorProps {
    selectedStyle: string;
    onSelectStyle: (styleId: string) => void;
    isLightMode: boolean;
    styles?: StyleOption[];
}

export const StyleSelector: React.FC<StyleSelectorProps> = ({ selectedStyle, onSelectStyle, isLightMode, styles = defaultStyles }) => {
    const { t } = useTranslation();

    return (
        <div className="mb-6">
            <span className={`text-xs block font-semibold mb-3 ${isLightMode ? 'text-slate-500' : 'text-gray-400'}`}>
                {t('style.prompt', 'Create by Style:')}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {styles.map((style) => (
                    <button
                        key={style.id}
                        onClick={() => onSelectStyle(style.id)}
                        className={`group relative rounded-xl overflow-hidden border-2 transition-all duration-300 h-24 ${
                            selectedStyle === style.id 
                            ? 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]' 
                            : (isLightMode ? 'border-transparent hover:border-slate-300' : 'border-transparent hover:border-white/20')
                        }`}
                    >
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all z-10"></div>
                        <img src={style.imageUrl} alt={style.defaultLabel} className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute bottom-2 left-2 right-2 z-20 text-center">
                            <span className="text-white text-xs font-bold drop-shadow-md">
                                {t(style.labelKey, style.defaultLabel)}
                            </span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};
