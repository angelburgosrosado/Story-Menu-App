/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { ComicFace, TOTAL_PAGES } from './types';
import { Panel } from './Panel';

interface BookProps {
    comicFaces: ComicFace[];
    currentSheetIndex: number;
    isStarted: boolean;
    isSetupVisible: boolean;
    selectedVoice: string;
    generateSpeech: (text: string, voiceName: string) => Promise<string>;
    onSheetClick: (index: number) => void;
    onChoice: (pageIndex: number, choice: string) => void;
    onOpenBook: () => void;
    onDownload: () => void;
    onReset: () => void;
    onUpdateText?: (pageIndex: number, field: 'caption' | 'dialogue', text: string) => void;
}

export const Book: React.FC<BookProps> = (props) => {
    const [hasWatermarkRemoval, setHasWatermarkRemoval] = React.useState(false);

    React.useEffect(() => {
        const creatorData = localStorage.getItem('infinite_heroes_creator');
        if (creatorData) {
            try {
                const creator = JSON.parse(creatorData);
                const tier = creator.tier || '';
                setHasWatermarkRemoval(tier.includes('Watermark') || tier.includes('Pro') || tier.includes('Enterprise') || tier.includes('Publisher'));
            } catch (e) {}
        }
    }, []);

    const sheetsToRender = [];
    if (props.comicFaces.length > 0) {
        sheetsToRender.push({ front: props.comicFaces[0], back: props.comicFaces.find(f => f.pageIndex === 1) });
        for (let i = 2; i <= TOTAL_PAGES; i += 2) {
            sheetsToRender.push({ front: props.comicFaces.find(f => f.pageIndex === i), back: props.comicFaces.find(f => f.pageIndex === i + 1) });
        }
    } else if (props.isSetupVisible) {
        // Placeholder sheet for initial render behind setup
        sheetsToRender.push({ front: undefined, back: undefined });
    }

    const watermarkOverlay = !hasWatermarkRemoval ? (
        <div className="hidden print:flex absolute inset-0 z-[100] pointer-events-none items-center justify-center opacity-10">
            <span className="text-6xl font-extrabold tracking-[0.2em] text-black -rotate-45 uppercase" style={{ WebkitTextStroke: '2px white' }}>
                STORY.MENU
            </span>
        </div>
    ) : null;

    return (
        <div className={`book ${props.currentSheetIndex > 0 ? 'opened' : ''} transition-all duration-1000 ease-in-out`}
           style={ (props.isSetupVisible) ? { transform: 'translateZ(-600px) translateY(-100px) rotateX(20deg) scale(0.9)', filter: 'blur(6px) brightness(0.7)', pointerEvents: 'none' } : {}}>
          {sheetsToRender.map((sheet, i) => (
              <div key={i} className={`paper ${i < props.currentSheetIndex ? 'flipped' : ''}`} style={{ zIndex: i < props.currentSheetIndex ? i : sheetsToRender.length - i }}
                   onClick={() => props.onSheetClick(i)}>
                  <div className="front relative">
                      <Panel face={sheet.front} allFaces={props.comicFaces} selectedVoice={props.selectedVoice} generateSpeech={props.generateSpeech} onChoice={props.onChoice} onOpenBook={props.onOpenBook} onDownload={props.onDownload} onReset={props.onReset} onUpdateText={props.onUpdateText} />
                      {sheet.front && watermarkOverlay}
                  </div>
                  <div className="back relative">
                      <Panel face={sheet.back} allFaces={props.comicFaces} selectedVoice={props.selectedVoice} generateSpeech={props.generateSpeech} onChoice={props.onChoice} onOpenBook={props.onOpenBook} onDownload={props.onDownload} onReset={props.onReset} onUpdateText={props.onUpdateText} />
                      {sheet.back && watermarkOverlay}
                  </div>
              </div>
          ))}
      </div>
    );
}
