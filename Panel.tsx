/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ComicFace, INITIAL_PAGES, GATE_PAGE } from './types';
import { LoadingFX } from './LoadingFX';
import { 
    playLaserSFX, 
    playPunchSFX, 
    playExplosionSFX, 
    playSparkleSFX, 
    playNarratorTTS, 
    stopNarratorTTS 
} from './audio';

interface PanelProps {
    face?: ComicFace;
    allFaces: ComicFace[];
    selectedVoice: string;
    generateSpeech: (text: string, voiceName: string) => Promise<string>;
    onChoice: (pageIndex: number, choice: string) => void;
    onOpenBook: () => void;
    onDownload: () => void;
    onReset: () => void;
}

export const Panel: React.FC<PanelProps> = ({ 
    face, 
    allFaces, 
    selectedVoice, 
    generateSpeech, 
    onChoice, 
    onOpenBook, 
    onDownload, 
    onReset 
}) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [loadingSpeech, setLoadingSpeech] = useState(false);
    const [speechBase64, setSpeechBase64] = useState<string | null>(null);
    const [vLevel, setVLevel] = useState(0);

    // Stop speech if current page flips away or gets unmounted
    useEffect(() => {
        return () => {
            stopNarratorTTS();
        };
    }, []);

    if (!face) return <div id="empty-panel" className="w-full h-full bg-gray-950" />;
    if (face.isLoading && !face.imageUrl) return <LoadingFX id="loading-fx" />;
    
    const isFullBleed = face.type === 'cover' || face.type === 'back_cover';

    const handlePlaySpeech = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (speechBase64) {
            setIsPlaying(true);
            playNarratorTTS(speechBase64, 24000, () => setIsPlaying(false), setVLevel);
            return;
        }

        const textToSpeak = `${face.narrative?.caption || ''}. ${face.narrative?.dialogue || ''}`;
        if (!textToSpeak.trim()) return;

        setLoadingSpeech(true);
        try {
            const base64 = await generateSpeech(textToSpeak, selectedVoice);
            if (base64) {
                setSpeechBase64(base64);
                setIsPlaying(true);
                playNarratorTTS(base64, 24000, () => setIsPlaying(false), setVLevel);
            }
        } catch (err) {
            console.warn("Could not generate speak audio content", err);
        } finally {
            setLoadingSpeech(false);
        }
    };

    const handleStopSpeech = (e: React.MouseEvent) => {
        e.stopPropagation();
        stopNarratorTTS();
        setIsPlaying(false);
        setVLevel(0);
    };

    return (
        <div id={`panel-${face.pageIndex || 'cover'}`} className={`panel-container relative group h-full flex flex-col justify-between overflow-hidden ${isFullBleed ? '!p-0 !bg-[#0a0a0a]' : 'bg-[#e2dcd5] p-3 border-4 border-black'}`}>
            <div className="gloss"></div>
            
            {/* The Artwork */}
            <div className="relative flex-1 w-full min-h-0 bg-black flex items-center justify-center overflow-hidden border-2 border-black shadow-[inset_0px_4px_12px_rgba(0,0,0,0.8)]">
                {face.imageUrl && (
                    <img 
                        src={face.imageUrl} 
                        referreypolicy="no-referrer" 
                        alt="Comic panel art" 
                        className={`w-full h-full object-cover select-none pointer-events-none transition-transform duration-700 group-hover:scale-105 ${isFullBleed ? '!object-cover' : ''}`} 
                    />
                )}

                {/* Localized HTML Overlay Boxes for readability & accessibility */}
                {face.type === 'story' && face.narrative && (
                    <>
                        {/* Elegant Yellow Caption Box */}
                        {face.narrative.caption && (
                            <div className="absolute top-2 left-2 max-w-[85%] bg-yellow-100 border-2 border-black px-2 py-1 shadow-[2px_2px_0px_rgba(0,0,0,1)] z-10 select-all">
                                <p className="font-comic text-xs text-black leading-tight select-all uppercase font-medium">{face.narrative.caption}</p>
                            </div>
                        )}

                        {/* Classic Curved Dialogue Bubble */}
                        {face.narrative.dialogue && (
                            <div className="absolute bottom-2 right-2 max-w-[80%] bg-white border-2 border-black rounded-lg px-2 py-1 shadow-[2px_2px_0px_rgba(0,0,0,1)] z-10 select-all">
                                <div className="absolute -top-1.5 right-6 w-3 h-3 bg-white border-t-2 border-l-2 border-black transform rotate-45"></div>
                                <p className="font-comic text-xs text-black italic leading-tight text-center select-all">"{face.narrative.dialogue}"</p>
                            </div>
                        )}
                    </>
                )}

                {/* Premium Auditory Bar */}
                {face.type === 'story' && face.narrative && (
                    <div className="absolute top-2 right-2 z-30 flex items-center gap-1.5">
                        {isPlaying ? (
                            <button id={`stop-voice-${face.pageIndex}`} onClick={handleStopSpeech} className="px-2 py-1 rounded border border-black bg-red-600 text-white font-comic font-bold text-[10px] uppercase shadow-[1px_1px_0px_black] hover:bg-red-500 transition-all active:translate-y-px">
                                STOP
                            </button>
                        ) : (
                            <button id={`play-voice-${face.pageIndex}`} onClick={handlePlaySpeech} disabled={loadingSpeech} className="px-2 py-1 rounded border border-black bg-yellow-400 text-black font-comic font-bold text-[10px] uppercase shadow-[1px_1px_0px_black] hover:bg-yellow-300 disabled:bg-gray-400 disabled:cursor-wait transition-all active:translate-y-px">
                                {loadingSpeech ? '...' : '🔊 NARRATE'}
                            </button>
                        )}
                        
                        {/* Local Synthesizer FX Board */}
                        <div className="hidden sm:flex gap-1">
                             <button title="Laser Zap!" id="sfx-zap" onClick={(e) => { e.stopPropagation(); playLaserSFX(); }} className="p-1 text-[10px] rounded border border-black bg-purple-600 text-white shadow-[1px_1px_0px_black] hover:bg-purple-500 transform active:scale-95">⚡</button>
                             <button title="Clash Impact!" id="sfx-pow" onClick={(e) => { e.stopPropagation(); playPunchSFX(); }} className="p-1 text-[10px] rounded border border-black bg-orange-600 text-white shadow-[1px_1px_0px_black] hover:bg-orange-500 transform active:scale-95">👊</button>
                             <button title="Cosmic Blast!" id="sfx-bam" onClick={(e) => { e.stopPropagation(); playExplosionSFX(); }} className="p-1 text-[10px] rounded border border-black bg-red-700 text-white shadow-[1px_1px_0px_black] hover:bg-red-600 transform active:scale-95">💥</button>
                             <button title="Mystic Flare!" id="sfx-shim" onClick={(e) => { e.stopPropagation(); playSparkleSFX(); }} className="p-1 text-[10px] rounded border border-black bg-teal-600 text-white shadow-[1px_1px_0px_black] hover:bg-teal-500 transform active:scale-95">✨</button>
                        </div>
                    </div>
                )}

                {/* Audiovisual Equalizer Bar */}
                {isPlaying && (
                    <div className="absolute top-10 right-2 z-30 flex items-end gap-[1.5px] h-4 bg-black/70 px-1.5 py-0.5 rounded border border-white/20 select-none">
                        <span className="text-[8px] text-green-300 font-mono uppercase mr-1 tracking-tight">Active Speech:</span>
                        <div className="w-[2px] bg-green-400 rounded-t" style={{ height: `${vLevel * 0.15}px`, transition: 'height 0.1s ease' }} />
                        <div className="w-[2px] bg-green-400 rounded-t" style={{ height: `${vLevel * 0.35}px`, transition: 'height 0.1s ease' }} />
                        <div className="w-[2px] bg-green-400 rounded-t" style={{ height: `${vLevel * 0.25}px`, transition: 'height 0.1s ease' }} />
                        <div className="w-[2px] bg-green-400 rounded-t" style={{ height: `${vLevel * 0.45}px`, transition: 'height 0.1s ease' }} />
                    </div>
                )}
            </div>

            {/* Decision Buttons */}
            {face.isDecisionPage && face.choices.length > 0 && (
                <div className={`absolute bottom-0 inset-x-0 p-4 pb-10 flex flex-col gap-2 items-center justify-end transition-opacity duration-500 ${face.resolvedChoice ? 'opacity-0 pointer-events-none' : 'opacity-100'} bg-gradient-to-t from-black/95 via-black/60 to-transparent z-20`}>
                    <p className="text-white font-comic text-lg uppercase tracking-wider animate-pulse mb-1">Make your path:</p>
                    <div className="w-full flex flex-col gap-2">
                        {face.choices.map((choice, i) => (
                            <button 
                              key={i} 
                              id={`choice-btn-${face.pageIndex}-${i}`}
                              onClick={(e) => { 
                                  e.stopPropagation(); 
                                  if(face.pageIndex) {
                                      // Play crisp sparkle sound on choice select
                                      playSparkleSFX();
                                      onChoice(face.pageIndex, choice); 
                                  }
                              }}
                              className={`comic-btn w-full py-2.5 px-4 text-sm font-bold tracking-wider relative border-2 border-black transform hover:translate-y-[-2px] active:translate-y-[1px] transition-all duration-150 uppercase shadow-[2px_2px_0px_black] ${i === 0 ? 'bg-yellow-400 hover:bg-yellow-300 text-black' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
                            >
                                {choice}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Cover Action */}
            {face.type === 'cover' && (
                 <div className="absolute bottom-20 inset-x-0 flex flex-col items-center gap-2 z-20 px-6">
                      <button 
                       id="read-book-btn"
                       onClick={(e) => { e.stopPropagation(); playSparkleSFX(); onOpenBook(); }}
                       disabled={!allFaces.find(f => f.pageIndex === GATE_PAGE)?.imageUrl}
                       className="comic-btn bg-yellow-400 text-black px-10 py-3.5 text-2xl font-bold uppercase border-4 border-black hover:scale-105 active:scale-95 disabled:scale-100 transition-all shadow-[4px_4px_0px_rgba(0,0,0,1)] animate-bounce disabled:animate-none disabled:bg-gray-400 disabled:cursor-wait w-full max-w-sm text-center">
                          {(!allFaces.find(f => f.pageIndex === GATE_PAGE)?.imageUrl) ? `PRINTING ISSUE... ${allFaces.filter(f => f.type==='story' && f.imageUrl && (f.pageIndex||0) <= GATE_PAGE).length}/${INITIAL_PAGES}` : 'READ ISSUE #1'}
                      </button>
                 </div>
            )}

            {/* Back Cover Actions */}
            {face.type === 'back_cover' && (
                <div className="absolute bottom-20 inset-x-0 flex flex-col items-center gap-3.5 z-20 px-4">
                    <button id="download-issue-btn" onClick={(e) => { e.stopPropagation(); playSparkleSFX(); onDownload(); }} className="comic-btn bg-blue-600 text-white border-2 border-black px-8 py-3 text-lg font-bold w-full max-w-xs uppercase hover:bg-blue-500 transform active:scale-95 shadow-[3px_3px_0px_black]">DOWNLOAD ISSUE</button>
                    <button id="reset-issue-btn" onClick={(e) => { e.stopPropagation(); playExplosionSFX(); onReset(); }} className="comic-btn bg-green-500 text-white border-2 border-black px-8 py-3 text-lg font-bold w-full max-w-xs uppercase hover:bg-green-400 transform active:scale-95 shadow-[3px_3px_0px_black]">CREATE NEW ADVENTURE</button>
                </div>
            )}
        </div>
    );
};
