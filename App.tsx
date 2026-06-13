
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect } from 'react';
import jsPDF from 'jspdf';
import { MAX_STORY_PAGES, BACK_COVER_PAGE, TOTAL_PAGES, INITIAL_PAGES, BATCH_SIZE, DECISION_PAGES, GENRES, TONES, LANGUAGES, ComicFace, Beat, Persona, CharacterIdentitySchema, ChapterGoal } from './types';
import { Setup } from './Setup';
import { Book } from './Book';
import { useApiKey } from './useApiKey';
import { ApiKeyDialog } from './ApiKeyDialog';
import { playPageTurnSFX, startProceduralSoundtrack, stopProceduralSoundtrack } from './audio';
import { auth, signOutUser, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { AuthScreen, AccountPanel } from './Account';
import { CheckoutModal } from './CheckoutModal';
import { AdminDashboard } from './AdminDashboard';
import { recordPageGenerated } from './storage';
import { saveCharacterToFirestore, saveProjectToFirestore } from './storageFirestore';
import { Sparkles, BookOpen, User, CheckCircle, Zap, Shield, Play, Layers, Cpu, Database, Volume2, ArrowRight, Eye, Palette, Flame, Radio, Clock, CloudLightning } from 'lucide-react';

// --- Constants ---
const MODEL_V3 = "gemini-3-pro-image-preview";
const MODEL_IMAGE_GEN_NAME = MODEL_V3;
const MODEL_TEXT_NAME = MODEL_V3;

const App: React.FC = () => {
  // --- API Key Hook ---
  const { validateApiKey, setShowApiKeyDialog, showApiKeyDialog, handleApiKeyDialogContinue } = useApiKey();

  const [activeCreator, setActiveCreator] = useState<{ id: string; email: string }>({
    id: '00000000-0000-0000-0000-000000000000',
    email: 'local-creator@infinite.multiverse'
  });

  const [villainDna, setVillainDna] = useState("");
  const [nemesisDNA, setNemesisDNA] = useState<CharacterIdentitySchema>({
    actor_id: "villain_spy_01",
    archetype_role: "Nemesis",
    persistence_layer: {
      biometric_backbone: "Striking youthful female in early 20s, sharp calculating hazel eyes, subtle freckles across the bridge of her nose, long dark wavy hair flowing past her shoulders",
      structural_constants: "High defined cheekbones, a sharp angular jawline, a tiny distinct silver snake ear-cuff pinned to her left ear cartilage",
      chromatic_anchor: "Pale matte complexion, deep contrast shadows, crisp cold highlights cutting cleanly through background lighting arrays"
    },
    adaptive_layer: {
      sartorial_style: "Elegant high-society sophistication blended seamlessly with hyper-functional, covert tactical-stealth elements",
      active_wardrobe: "A tailored charcoal evening dress with hidden utility structural seams and a concealed thigh-holster line"
    },
    rendering_directives: {
      art_style_lock: "Photorealistic Neon Noir Comic Book Style, sharp cinematic chiaroscuro, heavy ink-wash shadows",
      continuity_weight: "HIGH"
    }
  });
  const [soundPrompt, setSoundPrompt] = useState("");

  // --- Firebase User Account States ---
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; displayName?: string; isOffline?: boolean; tier?: string; subscriptionId?: string; paymentMethod?: string } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [landingPreviewTab, setLandingPreviewTab] = useState<'blueprint' | 'visuals' | 'sound'>('blueprint');
  const [landingAuthOpen, setLandingAuthOpen] = useState(false);

  // --- Checkout Modal States ---
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutTier, setCheckoutTier] = useState<'Pro' | 'Enterprise'>('Pro');
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  const [hero, setHeroState] = useState<Persona | null>(null);
  const [friend, setFriendState] = useState<Persona | null>(null);
  const [villain, setVillainState] = useState<Persona | null>(null);
  const [selectedGenre, setSelectedGenre] = useState(GENRES[0]);
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0].code);
  const [customPremise, setCustomPremise] = useState("");
  const [storyTone, setStoryTone] = useState(TONES[0]);
  const [richMode, setRichMode] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState('Zephyr');
  const [soundtrackEnabled, setSoundtrackEnabled] = useState(false);

  // --- Visual Cohesion & Creative Steerage States ---
  const [creativeDirectives, setCreativeDirectives] = useState("");

  const [heroVisuals, setHeroVisuals] = useState("wearing a sleek superhero nanosuit with vibrant blue glowing details, messy silver hair");
  const [friendVisuals, setFriendVisuals] = useState("wearing a leather bomber jacket, auburn ponytail");
  const [villainVisuals, setVillainVisuals] = useState("wearing a regal high-collared obsidian armor mantle, slicked-back dark hair");
  
  const heroRef = useRef<Persona | null>(null);
  const friendRef = useRef<Persona | null>(null);
  const villainRef = useRef<Persona | null>(null);

  const setHero = (p: Persona | null) => { setHeroState(p); heroRef.current = p; };
  const setFriend = (p: Persona | null) => { setFriendState(p); friendRef.current = p; };
  const setVillain = (p: Persona | null) => { setVillainState(p); villainRef.current = p; };
  
  const [comicFaces, setComicFaces] = useState<ComicFace[]>([]);
  const [currentSheetIndex, setCurrentSheetIndex] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  
  // --- Project / Studio Library State ---
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  const [storyBlueprint, setStoryBlueprint] = useState<ChapterGoal[]>([]);

  // Load blueprint from localStorage when activeProjectId changes
  useEffect(() => {
    if (activeProjectId) {
      const stored = localStorage.getItem(`blueprint_${activeProjectId}`);
      if (stored) {
        try {
          setStoryBlueprint(JSON.parse(stored));
        } catch {
          setStoryBlueprint([]);
        }
      } else {
        setStoryBlueprint([]);
      }
    } else {
      const stored = localStorage.getItem('offline_blueprint');
      if (stored) {
        try {
          setStoryBlueprint(JSON.parse(stored));
        } catch {
          setStoryBlueprint([]);
        }
      } else {
        setStoryBlueprint([]);
      }
    }
  }, [activeProjectId]);

  // Save blueprint to localStorage when it changes
  useEffect(() => {
    const key = activeProjectId ? `blueprint_${activeProjectId}` : 'offline_blueprint';
    if (storyBlueprint && storyBlueprint.length > 0) {
      localStorage.setItem(key, JSON.stringify(storyBlueprint));
    }
  }, [storyBlueprint, activeProjectId]);

  const handleLoadProject = (project: any) => {
    setActiveProjectId(project.id);
    setSelectedGenre(project.genre);
    setSelectedLanguage(project.language);
    
    // Parse faces if they exist
    if (project.comic_faces) {
      try {
        const parsed = typeof project.comic_faces === 'string' ? JSON.parse(project.comic_faces) : project.comic_faces;
        if (Array.isArray(parsed)) {
          setComicFaces(parsed);
          // Auto-open book to the saved state
          setCurrentSheetIndex(1);
          setIsStarted(true);
          setShowSetup(false);
          setIsTransitioning(false);
          return;
        }
      } catch (err) {
        console.error("Failed to parse comic faces from database project:", err);
      }
    }
    
    // Fallback: start blank
    setComicFaces([]);
    setCurrentSheetIndex(0);
    setIsStarted(true);
    setShowSetup(false);
    setIsTransitioning(false);
  };

  const handleLoadDraft = (draft: any) => {
    setSelectedGenre(draft.genre || 'Classic Horror');
    
    // Parse faces if they exist
    if (draft.comicFaces) {
      try {
        const parsed = typeof draft.comicFaces === 'string' ? JSON.parse(draft.comicFaces) : draft.comicFaces;
        if (Array.isArray(parsed)) {
          setComicFaces(parsed);
        } else {
          setComicFaces([]);
        }
      } catch (err) {
        console.error("Failed to parse comic faces from draft:", err);
        setComicFaces([]);
      }
    } else {
      setComicFaces([]);
    }

    // Parse blueprints if they exist
    if (draft.storyBlueprint) {
      try {
        const parsed = typeof draft.storyBlueprint === 'string' ? JSON.parse(draft.storyBlueprint) : draft.storyBlueprint;
        if (Array.isArray(parsed)) {
          setStoryBlueprint(parsed);
        } else {
          setStoryBlueprint([]);
        }
      } catch (err) {
        console.error("Failed to parse story blueprint from draft:", err);
        setStoryBlueprint([]);
      }
    } else {
      setStoryBlueprint([]);
    }

    setActiveProjectId(""); // Drafts don't overwrite active published documents
    setIsStarted(false);
    setShowSetup(true);
    alert(`📂 WIP snapshot loaded successfully!\n"${draft.title || 'Untitled Draft'}" has been restored directly to your active Workspace!`);
  };

  // Auto-save comic pages to database active project when changed
  useEffect(() => {
    if (!activeProjectId || comicFaces.length === 0) return;
    const hasLoadedPages = comicFaces.some(f => f.imageUrl && !f.isLoading);
    if (!hasLoadedPages) return;

    // Debounce save so we do not spam database requests
    const timer = setTimeout(() => {
      const isFirebaseUser = activeCreator.id && activeCreator.id !== '00000000-0000-0000-0000-000000000000' && !activeCreator.id.includes('local-creator') && !activeCreator.id.includes('offline');
      if (isFirebaseUser) {
        saveProjectToFirestore(activeCreator.id, {
          id: activeProjectId,
          userId: activeCreator.id,
          title: `Multiverse Reborn: ${selectedGenre}`,
          genre: selectedGenre,
          language: selectedLanguage,
          comicFaces: JSON.stringify(comicFaces)
        })
        .then(() => {
          console.log("💾 [Firestore] Auto-saved comic pages successfully:", activeProjectId);
        })
        .catch(err => console.error("Error auto-saving comic pages to Firestore:", err));
        return;
      }

      fetch(`/api/projects/${activeProjectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comicFaces: JSON.stringify(comicFaces)
        })
      })
      .then(r => r.json())
      .then(data => {
        console.log("💾 Auto-saved comic pages successfully to active project:", activeProjectId);
      })
      .catch(err => console.error("Error auto-saving comic pages", err));
    }, 2500);

    return () => clearTimeout(timer);
  }, [comicFaces, activeProjectId]);

  // --- Transition States ---
  const [showSetup, setShowSetup] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const generatingPages = useRef(new Set<number>());
  const historyRef = useRef<ComicFace[]>([]);

  // Sync / load active creator & Firebase Auth handshake
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const u: any = {
          id: user.uid,
          email: user.email || 'creator@multiverse.com',
          displayName: user.displayName || 'Multiverse Creator'
        };

        // Preload Firestore subscription tier record if present
        const docRef = doc(db, 'users', user.uid);
        getDoc(docRef).then((snap) => {
          if (snap.exists()) {
            const data = snap.data();
            if (data && data.tier) {
              u.tier = data.tier;
              u.subscriptionId = data.subscriptionId;
              u.paymentMethod = data.paymentMethod;
              console.info(`🔥 [Subscription Resolved] Loaded ${data.tier} membership status.`);
            }
          }
          setCurrentUser(u);
          setActiveCreator({ id: u.id, email: u.email });
          localStorage.setItem('infinite_heroes_creator', JSON.stringify(u));
        }).catch((err) => {
          console.warn("Could not query user doc details:", err);
          setCurrentUser(u);
          setActiveCreator({ id: u.id, email: u.email });
          localStorage.setItem('infinite_heroes_creator', JSON.stringify(u));
        });
      } else {
        // Enforce commercial authentication, do not allow plain offline local storage bypass.
        // Clear legacy non-firebase sessions to force the commercial login portal.
        localStorage.removeItem('infinite_heroes_creator');
        setCurrentUser(null);
        setActiveCreator({ id: '', email: '' });
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogOut = async () => {
    try {
      if (currentUser && !currentUser.isOffline) {
        await signOutUser();
      }
    } catch (err) {
      console.warn("Bypassed standard signOutUser step:", err);
    }
    setCurrentUser(null);
    setActiveCreator({ id: '', email: '' });
    localStorage.removeItem('infinite_heroes_creator');
    window.dispatchEvent(new Event('refresh-character-vault'));
  };

  const handleUpgradeSuccessful = (tier: string, paymentMethod: string, subscriptionId: string) => {
    if (currentUser) {
      const updated = { ...currentUser, tier, paymentMethod, subscriptionId };
      setCurrentUser(updated);
      localStorage.setItem('infinite_heroes_creator', JSON.stringify(updated));
    } else {
      // Create a temporary profile for offline sandbox flow
      const u = {
        id: 'offline_creator_upgraded',
        email: 'local-artist@sandbox.mode',
        displayName: 'Offline Creator',
        isOffline: true,
        tier,
        paymentMethod,
        subscriptionId
      };
      setCurrentUser(u);
      setActiveCreator({ id: u.id, email: u.email });
      localStorage.setItem('infinite_heroes_creator', JSON.stringify(u));
    }
    // Automatically trigger visual workspace setup
    setTimeout(() => {
      setIsCheckoutOpen(false);
      setIsStarted(true);
      setShowSetup(true);
    }, 3600);
  };

  // --- AI Helpers via Server Proxy ---

  // Sync procedural synthesizer soundtrack
  useEffect(() => {
     if (isStarted && soundtrackEnabled) {
          startProceduralSoundtrack(selectedGenre);
     } else {
          stopProceduralSoundtrack();
     }
     return () => stopProceduralSoundtrack();
  }, [isStarted, soundtrackEnabled, selectedGenre]);

  const generateSpeech = async (text: string, voiceName: string): Promise<string> => {
      try {
          const res = await fetch('/api/gemini/speech', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text, voiceName })
          });
          if (!res.ok) {
              const errData = await res.json().catch(() => ({}));
              throw new Error(errData.error || `Speech server failure: ${res.status}`);
          }
          const data = await res.json();
          return data.base64Audio || '';
      } catch (e) {
          console.error("Narrator voice failed", e);
          handleAPIError(e);
          throw e;
      }
  };

  const handleAPIError = (e: any) => {
    const msg = String(e);
    console.error("API Error:", msg);
    if (
      msg.includes('Requested entity was not found') || 
      msg.includes('API_KEY_INVALID') || 
      msg.toLowerCase().includes('permission denied')
    ) {
      setShowApiKeyDialog(true);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const generateBeat = async (history: ComicFace[], isRightPage: boolean, pageNum: number, isDecisionPage: boolean): Promise<Beat> => {
    if (!heroRef.current) throw new Error("No Hero");

    const isFinalPage = pageNum === MAX_STORY_PAGES;
    const langName = LANGUAGES.find(l => l.code === selectedLanguage)?.name || "English";

    // Get relevant history and last focus to prevent repetition
    const relevantHistory = history
        .filter(p => p.type === 'story' && p.narrative && (p.pageIndex || 0) < pageNum)
        .sort((a, b) => (a.pageIndex || 0) - (b.pageIndex || 0));

    const lastBeat = relevantHistory[relevantHistory.length - 1]?.narrative;
    const lastFocus = lastBeat?.focus_char || 'none';

    // Aggressive Co-Star Injection Logic
    let friendInstruction = "Not yet introduced.";
    if (friendRef.current) {
        friendInstruction = "ACTIVE and PRESENT (User Provided).";
        if (lastFocus !== 'friend' && Math.random() > 0.4) {
             friendInstruction += " MANDATORY: FOCUS ON THE CO-STAR FOR THIS PANEL.";
        } else {
             friendInstruction += " Ensure they are woven into the scene even if not the main focus.";
        }
    }

    let villainInstruction = "Not yet introduced.";
    if (villainRef.current) {
        villainInstruction = `ACTIVE ARC-RIVAL / VILLAIN (User Provided): "${villainRef.current.desc}". Looming, devious antagonist. They must construct a trap, initiate a conflict, or dramatically monologue/confront the Hero/Co-star.`;
        if (pageNum >= 3 && Math.random() > 0.4) {
             villainInstruction += " MANDATORY: SECTIONS OF THE DIALOGUE OR SCENE FOCUS SHOULD HIGHLIGHT THIS CHARACTER.";
        }
    }

    try {
        const response = await fetch('/api/gemini/beat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                history: relevantHistory,
                pageNum,
                isDecisionPage,
                selectedGenre,
                selectedLanguage,
                storyTone,
                customPremise,
                creativeDirectives,
                richMode,
                heroVisuals,
                friendVisuals,
                villainVisuals,
                villainDna, // Villain DNA Power Profile
                nemesisDNA, // Structured nemesis DNA Coordinates
                soundPrompt, // Synthesizer auditory prompt
                friendInstruction,
                villainInstruction,
                langName,
                storyBlueprint
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `Server beat failure: ${response.status}`);
        }

        const parsed = await response.json();
        
        if (parsed.dialogue) parsed.dialogue = parsed.dialogue.replace(/^[\w\s\-]+:\s*/i, '').replace(/["']/g, '').trim();
        if (parsed.caption) parsed.caption = parsed.caption.replace(/^[\w\s\-]+:\s*/i, '').trim();
        if (!isDecisionPage) parsed.choices = [];
        if (isDecisionPage && !isFinalPage && (!parsed.choices || parsed.choices.length < 2)) parsed.choices = ["Option A", "Option B"];
        if (!['hero', 'friend', 'other'].includes(parsed.focus_char)) parsed.focus_char = 'hero';

        return parsed as Beat;
    } catch (e) {
        console.error("Beat generation failed", e);
        handleAPIError(e);
        return { 
            caption: pageNum === 1 ? "It began..." : "...", 
            scene: `Generic scene for page ${pageNum}.`, 
            focus_char: 'hero', 
            choices: [] 
        };
    }
  };

  const generatePersona = async (desc: string): Promise<Persona> => {
      try {
          const response = await fetch('/api/gemini/persona', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ desc, selectedGenre })
          });
          if (!response.ok) {
              const errData = await response.json().catch(() => ({}));
              throw new Error(errData.error || `Server persona failure: ${response.status}`);
          }
          const data = await response.json();
          if (data.base64) return { base64: data.base64, desc };
          throw new Error("Failed");
      } catch (e) { 
        handleAPIError(e);
        throw e; 
      }
  };

  const generateImage = async (beat: Beat, type: ComicFace['type']): Promise<string> => {
    const styleEra = selectedGenre === 'Custom' ? "Modern American" : selectedGenre;
    try {
        const response = await fetch('/api/gemini/image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                beat,
                type,
                styleEra,
                heroVisuals,
                friendVisuals,
                villainVisuals,
                selectedGenre,
                selectedLanguage,
                heroRef: heroRef.current,
                friendRef: friendRef.current,
                villainRef: villainRef.current
            })
        });
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `Server image failure: ${response.status}`);
        }
        const data = await response.json();
        return data.imageUrl || '';
    } catch (e) { 
        handleAPIError(e);
        return ''; 
    }
  };

  const updateFaceState = (id: string, updates: Partial<ComicFace>) => {
      setComicFaces(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
      const idx = historyRef.current.findIndex(f => f.id === id);
      if (idx !== -1) historyRef.current[idx] = { ...historyRef.current[idx], ...updates };
  };

  const generateSinglePage = async (faceId: string, pageNum: number, type: ComicFace['type']) => {
      const isDecision = DECISION_PAGES.includes(pageNum);
      let beat: Beat = { scene: "", choices: [], focus_char: 'other' };

      if (type === 'cover') {
           // Cover beat is handled in generateImage
      } else if (type === 'back_cover') {
           beat = { scene: "Thematic teaser image", choices: [], focus_char: 'other' };
      } else {
           beat = await generateBeat(historyRef.current, pageNum % 2 === 0, pageNum, isDecision);
      }

      if (beat.focus_char === 'friend' && !friendRef.current && type === 'story') {
          try {
              const newSidekick = await generatePersona(selectedGenre === 'Custom' ? "A fitting sidekick for this story" : `Sidekick for ${selectedGenre} story.`);
              setFriend(newSidekick);
          } catch (e) { beat.focus_char = 'other'; }
      }

      if (beat.focus_char === 'villain' && !villainRef.current && type === 'story') {
          try {
              const newVillain = await generatePersona(selectedGenre === 'Custom' ? "A terrifying arch-nemesis villain" : `Nemesis villain for ${selectedGenre} story.`);
              setVillain(newVillain);
          } catch (e) { beat.focus_char = 'other'; }
      }

      updateFaceState(faceId, { narrative: beat, choices: beat.choices, isDecisionPage: isDecision });
      const url = await generateImage(beat, type);
      updateFaceState(faceId, { imageUrl: url, isLoading: false });
  };

  const generateBatch = async (startPage: number, count: number) => {
      const pagesToGen: number[] = [];
      for (let i = 0; i < count; i++) {
          const p = startPage + i;
          if (p <= TOTAL_PAGES && !generatingPages.current.has(p)) {
              pagesToGen.push(p);
          }
      }
      
      if (pagesToGen.length === 0) return;
      pagesToGen.forEach(p => generatingPages.current.add(p));

      const newFaces: ComicFace[] = [];
      pagesToGen.forEach(pageNum => {
          const type = pageNum === BACK_COVER_PAGE ? 'back_cover' : 'story';
          newFaces.push({ id: `page-${pageNum}`, type, choices: [], isLoading: true, pageIndex: pageNum });
      });

      setComicFaces(prev => {
          const existing = new Set(prev.map(f => f.id));
          return [...prev, ...newFaces.filter(f => !existing.has(f.id))];
      });
      newFaces.forEach(f => { if (!historyRef.current.find(h => h.id === f.id)) historyRef.current.push(f); });

      try {
          for (const pageNum of pagesToGen) {
               await generateSinglePage(`page-${pageNum}`, pageNum, pageNum === BACK_COVER_PAGE ? 'back_cover' : 'story');
               generatingPages.current.delete(pageNum);
          }
      } catch (e) {
          console.error("Batch generation error", e);
      } finally {
          pagesToGen.forEach(p => generatingPages.current.delete(p));
      }
  }

  const syncCharacterToDb = async (name: string, roleType: string, desc: string, base64: string) => {
       const isFirebaseUser = activeCreator.id && activeCreator.id !== '00000000-0000-0000-0000-000000000000' && !activeCreator.id.includes('local-creator') && !activeCreator.id.includes('offline');
       if (isFirebaseUser) {
           try {
               await saveCharacterToFirestore(activeCreator.id, {
                   userId: activeCreator.id,
                   name,
                   roleType: roleType as any,
                   description: desc,
                   imageUrl: base64
               });
               window.dispatchEvent(new Event('refresh-character-vault'));
               return;
           } catch (fsErr) {
               console.warn("Firestore saveCharacter fallback to db api:", fsErr);
           }
       }
       try {
           await fetch('/api/characters', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                   userId: activeCreator.id,
                   name,
                   roleType,
                   description: desc,
                   imageUrl: base64
               })
           });
           window.dispatchEvent(new Event('refresh-character-vault'));
       } catch (e) {
           console.error("Postgres character-vault sync failed", e);
       }
  };

  const launchStory = async () => {
    // --- API KEY VALIDATION ---
    const hasKey = await validateApiKey();
    if (!hasKey) return; // Stop if cancelled or invalid
    
    if (!heroRef.current) return;
    if (selectedGenre === 'Custom' && !customPremise.trim()) {
        alert("Please enter a custom story premise.");
        return;
    }
    setIsTransitioning(true);
    
    // Sync book project with correct database settings (PostgreSQL / Firestore)
    const titleText = `Multiverse Reborn: ${selectedGenre}`;
    const isFirebaseUser = activeCreator.id && activeCreator.id !== '00000000-0000-0000-0000-000000000000' && !activeCreator.id.includes('local-creator') && !activeCreator.id.includes('offline');
    if (isFirebaseUser) {
        try {
            const initialFacesCoverKey: ComicFace[] = [{ id: 'cover', type: 'cover', choices: [], isLoading: true, pageIndex: 0 }];
            const fireProjectId = await saveProjectToFirestore(activeCreator.id, {
                userId: activeCreator.id,
                title: titleText,
                genre: selectedGenre,
                language: selectedLanguage,
                comicFaces: JSON.stringify(initialFacesCoverKey)
            });
            if (fireProjectId) {
                console.log("🔥 [Firestore] Synced project entry created:", fireProjectId);
                setActiveProjectId(fireProjectId);
                window.dispatchEvent(new Event('refresh-character-vault'));
            }
        } catch (fsErr) {
            console.warn("Firestore saveProject failed, trying pg sync fallback:", fsErr);
        }
    } else {
        // Sync book project to PostgreSQL!
        try {
            const projRes = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: activeCreator.id,
                    title: titleText,
                    genre: selectedGenre,
                    language: selectedLanguage
                })
            });
            const projData = await projRes.json();
            if (projData && projData.id) {
                 console.log("📂 Synced project entry created:", projData.id);
                 setActiveProjectId(projData.id); // Save active project ID!
                 
                 // Cast linkages
                 if (heroRef.current) {
                     await fetch('/api/project-casting', {
                         method: 'POST',
                         headers: { 'Content-Type': 'application/json' },
                         body: JSON.stringify({ projectId: projData.id, characterId: activeCreator.id }) // or link specific cast ids
                     }).catch(() => {});
                 }
            }
        } catch (e) {
            console.warn("Project sync tracker offline:", e);
        }
    }

    let availableTones = TONES;
    if (selectedGenre === "Teen Drama / Slice of Life" || selectedGenre === "Lighthearted Comedy") {
        availableTones = TONES.filter(t => t.includes("CASUAL") || t.includes("WHOLESOME") || t.includes("QUIPPY"));
    } else if (selectedGenre === "Classic Horror") {
        availableTones = TONES.filter(t => t.includes("INNER-MONOLOGUE") || t.includes("OPERATIC"));
    }
    
    setStoryTone(availableTones[Math.floor(Math.random() * availableTones.length)]);

    const coverFace: ComicFace = { id: 'cover', type: 'cover', choices: [], isLoading: true, pageIndex: 0 };
    setComicFaces([coverFace]);
    historyRef.current = [coverFace];
    generatingPages.current.add(0);

    generateSinglePage('cover', 0, 'cover').finally(() => generatingPages.current.delete(0));
    
    setTimeout(async () => {
        setIsStarted(true);
        setShowSetup(false);
        setIsTransitioning(false);
        await generateBatch(1, INITIAL_PAGES);
        generateBatch(3, 3);
    }, 1100);
  };

  const handleChoice = async (pageIndex: number, choice: string) => {
      updateFaceState(`page-${pageIndex}`, { resolvedChoice: choice });
      const maxPage = Math.max(...historyRef.current.map(f => f.pageIndex || 0));
      if (maxPage + 1 <= TOTAL_PAGES) {
          generateBatch(maxPage + 1, BATCH_SIZE);
      }
  }

  const resetApp = () => {
      setIsStarted(false);
      setShowSetup(true);
      setComicFaces([]);
      setCurrentSheetIndex(0);
      historyRef.current = [];
      generatingPages.current.clear();
      setHero(null);
      setFriend(null);
      setVillain(null);
      setActiveProjectId(null); // Clear active project reference!
      stopProceduralSoundtrack();
  };

  const downloadPDF = () => {
    const PAGE_WIDTH = 480;
    const PAGE_HEIGHT = 720;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: [PAGE_WIDTH, PAGE_HEIGHT] });
    const pagesToPrint = comicFaces.filter(face => face.imageUrl && !face.isLoading).sort((a, b) => (a.pageIndex || 0) - (b.pageIndex || 0));

    pagesToPrint.forEach((face, index) => {
        if (index > 0) doc.addPage([PAGE_WIDTH, PAGE_HEIGHT], 'portrait');
        if (face.imageUrl) doc.addImage(face.imageUrl, 'JPEG', 0, 0, PAGE_WIDTH, PAGE_HEIGHT);
    });
    doc.save('Infinite-Heroes-Issue.pdf');
  };

  const handleHeroUpload = async (file: File) => {
       try { 
           const base64 = await fileToBase64(file); 
           setHero({ base64, desc: "The Main Hero", headBase64: hero?.headBase64, clothesBase64: hero?.clothesBase64 }); 
           await syncCharacterToDb("Main Avatar", "Hero", "The Main Hero", base64);
       } catch (e) { alert("Hero upload failed"); }
  };
  const handleHeroHeadUpload = async (file: File) => {
       try {
           const b64 = await fileToBase64(file);
           setHero({ base64: hero?.base64 || '', desc: hero?.desc || "The Main Hero", headBase64: b64, clothesBase64: hero?.clothesBase64 });
       } catch (e) { alert("Hair reference upload failed"); }
  };
  const handleHeroHeadClear = () => {
       if (hero) {
           setHero({ ...hero, headBase64: undefined });
       }
  };
  const handleHeroClothesUpload = async (file: File) => {
       try {
           const b64 = await fileToBase64(file);
           setHero({ base64: hero?.base64 || '', desc: hero?.desc || "The Main Hero", headBase64: hero?.headBase64, clothesBase64: b64 });
       } catch (e) { alert("Clothing reference upload failed"); }
  };
  const handleHeroClothesClear = () => {
       if (hero) {
           setHero({ ...hero, clothesBase64: undefined });
       }
  };

  const handleFriendUpload = async (file: File) => {
       try { 
           const base64 = await fileToBase64(file); 
           setFriend({ base64, desc: "The Sidekick/Rival", headBase64: friend?.headBase64, clothesBase64: friend?.clothesBase64 }); 
           await syncCharacterToDb("Socius", "Co-Star", "The Sidekick/Rival", base64);
       } catch (e) { alert("Friend upload failed"); }
  };
  const handleFriendHeadUpload = async (file: File) => {
       try {
           const b64 = await fileToBase64(file);
           setFriend({ base64: friend?.base64 || '', desc: friend?.desc || "The Sidekick/Rival", headBase64: b64, clothesBase64: friend?.clothesBase64 });
       } catch (e) { alert("Hair reference upload failed"); }
  };
  const handleFriendHeadClear = () => {
       if (friend) {
           setFriend({ ...friend, headBase64: undefined });
       }
  };
  const handleFriendClothesUpload = async (file: File) => {
       try {
           const b64 = await fileToBase64(file);
           setFriend({ base64: friend?.base64 || '', desc: friend?.desc || "The Sidekick/Rival", headBase64: friend?.headBase64, clothesBase64: b64 });
       } catch (e) { alert("Clothing reference upload failed"); }
  };
  const handleFriendClothesClear = () => {
       if (friend) {
           setFriend({ ...friend, clothesBase64: undefined });
       }
  };

  const handleVillainUpload = async (file: File) => {
       try { 
           const base64 = await fileToBase64(file); 
           setVillain({ base64, desc: "The Arch Nemesis Villain", headBase64: villain?.headBase64, clothesBase64: villain?.clothesBase64 }); 
           await syncCharacterToDb("Rival Rival", "Villain", "The Arch Nemesis Villain", base64);
       } catch (e) { alert("Villain upload failed"); }
  };
  const handleVillainHeadUpload = async (file: File) => {
       try {
           const b64 = await fileToBase64(file);
           setVillain({ base64: villain?.base64 || '', desc: villain?.desc || "The Arch Nemesis Villain", headBase64: b64, clothesBase64: villain?.clothesBase64 });
       } catch (e) { alert("Hair reference upload failed"); }
  };
  const handleVillainHeadClear = () => {
       if (villain) {
           setVillain({ ...villain, headBase64: undefined });
       }
  };
  const handleVillainClothesUpload = async (file: File) => {
       try {
           const b64 = await fileToBase64(file);
           setVillain({ base64: villain?.base64 || '', desc: villain?.desc || "The Arch Nemesis Villain", headBase64: villain?.headBase64, clothesBase64: b64 });
       } catch (e) { alert("Clothing reference upload failed"); }
  };
  const handleVillainClothesClear = () => {
       if (villain) {
           setVillain({ ...villain, clothesBase64: undefined });
       }
  };

  const handleSheetClick = (index: number) => {
      if (!isStarted) return;
      if (index === 0 && currentSheetIndex === 0) return;
      
      playPageTurnSFX();
      
      if (index < currentSheetIndex) setCurrentSheetIndex(index);
      else if (index === currentSheetIndex && comicFaces.find(f => f.pageIndex === index)?.imageUrl) setCurrentSheetIndex(prev => prev + 1);
  };

  if (currentUser === null) {
    const handleLaunchOfflineSandbox = () => {
      const offlineId = 'offline_creator_' + Math.random().toString(36).substring(2, 9);
      const u = {
        id: offlineId,
        email: 'local-artist@sandbox.mode',
        displayName: 'Offline Creator',
        isOffline: true
      };
      setCurrentUser(u);
      setActiveCreator({ id: u.id, email: u.email });
      localStorage.setItem('infinite_heroes_creator', JSON.stringify(u));
      window.dispatchEvent(new Event('refresh-character-vault'));
    };

    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col relative overflow-y-auto overflow-x-hidden font-sans scroll-smooth">
        {/* Ambient background grids and glows */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.15),transparent_50%),radial-gradient(ellipse_at_bottom,rgba(147,51,234,0.15),transparent_50%)] pointer-events-none z-0" />
        <div className="absolute top-0 left-0 w-full h-full bg-[size:32px_32px] bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] opacity-70 pointer-events-none z-0" />
        
        {/* Ambient glow blobs */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-2/3 -right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* TOP NAVBAR PANEL */}
        <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b-2 border-black/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between font-sans">
            <div className="flex items-center gap-3">
              <span className="text-2xl select-none animate-pulse">🌌</span>
              <span className="font-comic text-lg sm:text-2xl font-black uppercase text-amber-500 tracking-wider" style={{ textShadow: '2px 2px 0px black' }}>
                Story<span className="text-white">.Menu</span>
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-6 text-xs uppercase font-mono tracking-wider font-extrabold text-slate-300">
              <a href="#features" className="hover:text-cyan-400 font-bold transition-all">✨ Features</a>
              <a href="#editor-demo" className="hover:text-cyan-400 font-bold transition-all">🔮 Blueprint Demo</a>
              <a href="#pricing" className="hover:text-yellow-400 font-bold transition-all">💰 Pricing Plans</a>
              <a href="https://ai.studio/build" target="_blank" rel="noreferrer" className="hover:text-purple-400 font-bold transition-all flex items-center gap-1">🌐 Studio Hub</a>
            </nav>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setLandingAuthOpen(true)}
                className="bg-slate-900 text-slate-200 border-2 border-black px-4 py-2 font-mono text-xs uppercase font-bold tracking-wider hover:text-white hover:bg-slate-880 transition-all cursor-pointer"
              >
                Sign In
              </button>
              <button
                type="button"
                id="btn-navbar-signup"
                onClick={() => setLandingAuthOpen(true)}
                className="bg-yellow-400 text-black border-2 border-black font-comic hover:bg-yellow-300 text-xs px-4 py-2 uppercase font-extrabold tracking-wider shadow-[3px_3px_0px_#000] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 active:translate-y-0.5 transition-all cursor-pointer"
              >
                Sign Up Free
              </button>
            </div>
          </div>
        </header>

        {/* HERO SECTION */}
        <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-20 pb-16 text-center font-sans">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 rounded-full text-xs font-mono font-bold tracking-wider uppercase mb-6 animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block animate-ping" />
            Live SaaS Production Infrastructure Ready at Story.Menu
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-sans font-black leading-[1.1] uppercase tracking-tight text-white mb-6 select-none">
            <span className="block font-comic mb-2 text-white" style={{ textShadow: '3px 3px 0px #000' }}>
              What universe are you
            </span>
            <span className="block font-comic text-yellow-400" style={{ textShadow: '4px 4px 0px #000' }}>
              Craving Today?
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-gray-300 leading-relaxed font-mono tracking-tight mb-8">
            Welcome to <span className="text-amber-400 font-bold">Story.Menu</span>—the ultimate interactive AI creator suite where epic multi-agent narrative arcs, locked character DNA, and real-time synth soundtracks are served on-demand.
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto mb-14">
            <button
              type="button"
              id="cta-sign-up"
              onClick={() => setLandingAuthOpen(true)}
              className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-400 text-black font-semibold font-comic uppercase text-sm px-8 py-4 rounded border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 active:translate-y-px transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles size={16} />
              Unlock Cloud Studio Sync
            </button>
            <button
              type="button"
              id="cta-sandbox-launch"
              onClick={handleLaunchOfflineSandbox}
              className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500 text-white font-semibold font-comic uppercase text-sm px-8 py-4 rounded border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 active:translate-y-px transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play size={16} />
              Try sandbox offline
            </button>
          </div>

          {/* Social Proof metrics */}
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-900/40 border-2 border-black/80 rounded-xl divide-y-2 md:divide-y-0 md:divide-x-2 divide-black/80 shadow-[6px_6px_0px_rgba(0,0,0,1)] font-mono text-center">
            <div className="p-2">
              <div className="text-xl sm:text-2xl font-black text-cyan-400">5,800+</div>
              <div className="text-[10px] uppercase text-gray-400 tracking-wider">Comics Custom Made</div>
            </div>
            <div className="p-2">
              <div className="text-xl sm:text-2xl font-black text-yellow-400">14K+</div>
              <div className="text-[10px] uppercase text-gray-400 tracking-wider">Heroes & Villains Cast</div>
            </div>
            <div className="p-2">
              <div className="text-xl sm:text-2xl font-black text-purple-400">100%</div>
              <div className="text-[10px] uppercase text-gray-400 tracking-wider">Continuous Cohesion</div>
            </div>
            <div className="p-2">
              <div className="text-xl sm:text-2xl font-black text-emerald-400">&lt; 3 Sec</div>
              <div className="text-[10px] uppercase text-gray-400 tracking-wider">Speech Narration Synthesized</div>
            </div>
          </div>
        </section>

        {/* APP VALUE PROPOSITION BENTO GRID */}
        <section id="features" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 scroll-mt-20">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="font-comic text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-white mb-2">
              🌌 Built For Dynamic Multi-Tenant Publishing
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 font-mono">
              A high-end creative workshop structured to keep your graphic novels continuous, atmospheric, and visually arresting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1: Blueprint Architect */}
            <div className="bg-slate-900/60 border-2 border-black p-6 rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:border-cyan-400 transition-all text-left flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-lg bg-cyan-950/60 border border-cyan-800/40 flex items-center justify-center text-cyan-400 mb-4 shadow-inner">
                  <Layers size={24} />
                </div>
                <h3 className="font-comic text-lg uppercase font-bold text-white mb-2">
                  Story Blueprint Architect
                </h3>
                <p className="text-slate-400 font-mono text-xs leading-relaxed">
                  Map chapter goals from the initial setup page 1 trigger to decision branches on page 3, climbing to the climax on page 9. Gemini strictly adheres to this roadmap.
                </p>
              </div>
              <span className="text-[10px] font-mono font-semibold text-cyan-400 uppercase mt-4 inline-block">● CHAPTER CONTROL ACTIVE</span>
            </div>

            {/* Feature 2: Casting Vault */}
            <div className="bg-slate-900/60 border-2 border-black p-6 rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:border-yellow-400 transition-all text-left flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-lg bg-yellow-950/60 border border-yellow-800/40 flex items-center justify-center text-yellow-400 mb-4 shadow-inner">
                  <Palette size={24} />
                </div>
                <h3 className="font-comic text-lg uppercase font-bold text-white mb-2">
                  Multi-Tenant Casting Vault
                </h3>
                <p className="text-slate-400 font-mono text-xs leading-relaxed">
                  Forge persistent files containing biometrics, facial weights, clothing references, and artistic style lock keys. Keep heroes, companions, and archenemies fully unique.
                </p>
              </div>
              <span className="text-[10px] font-mono font-semibold text-yellow-400 uppercase mt-4 inline-block">● MODEL SYNTAX LOCKED</span>
            </div>

            {/* Feature 3: Voice Synthesizer */}
            <div className="bg-slate-900/60 border-2 border-black p-6 rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:border-purple-400 transition-all text-left flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-lg bg-purple-950/60 border border-purple-800/40 flex items-center justify-center text-purple-400 mb-4 shadow-inner">
                  <Volume2 size={24} />
                </div>
                <h3 className="font-comic text-lg uppercase font-bold text-white mb-2">
                  Synthesized Speech Narration
                </h3>
                <p className="text-slate-400 font-mono text-xs leading-relaxed">
                  Hear dialogues narrated instantly! Generates custom character text-to-speech outputs in multiple actor styles alongside background synth music.
                </p>
              </div>
              <span className="text-[10px] font-mono font-semibold text-purple-400 uppercase mt-4 inline-block">● ATMOSPHERE FX STABLE</span>
            </div>
          </div>
        </section>

        {/* INTERACTIVE DEMO COCKPIT BOARD */}
        <section id="editor-demo" className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 scroll-mt-20">
          <div className="bg-slate-900 border-4 border-black p-6 rounded-xl shadow-[8px_8px_0px_rgba(0,0,0,1)] text-white text-left select-none relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/5 rounded-full blur-2xl pointer-events-none" />
            
            {/* Teaser Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-black/85 pb-4 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">🔮</span>
                  <span className="font-comic text-lg sm:text-xl font-black uppercase text-amber-400 tracking-wider">
                    Interactive Creator Cockpit
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono">
                  Test and preview character casting and active story blueprint structures in real time.
                </p>
              </div>

              <div className="flex bg-slate-950 border border-slate-800 p-1 rounded gap-1 mt-4 sm:mt-0 font-mono text-[10px]">
                <button
                  type="button"
                  onClick={() => setLandingPreviewTab('blueprint')}
                  className={`px-3 py-1.5 uppercase font-bold transition-all ${landingPreviewTab === 'blueprint' ? 'bg-cyan-500 text-black font-extrabold' : 'text-slate-400 hover:text-white'}`}
                >
                  Blueprint manager
                </button>
                <button
                  type="button"
                  onClick={() => setLandingPreviewTab('visuals')}
                  className={`px-3 py-1.5 uppercase font-bold transition-all ${landingPreviewTab === 'visuals' ? 'bg-yellow-500 text-black font-extrabold' : 'text-slate-400 hover:text-white'}`}
                >
                  Continuity Visuals
                </button>
                <button
                  type="button"
                  onClick={() => setLandingPreviewTab('sound')}
                  className={`px-3 py-1.5 uppercase font-bold transition-all ${landingPreviewTab === 'sound' ? 'bg-purple-600 text-white font-extrabold' : 'text-slate-400 hover:text-white'}`}
                >
                  Speech & Synth
                </button>
              </div>
            </div>

            {/* Teaser Body Layout */}
            <div className="bg-slate-950/80 p-5 rounded-lg border-2 border-black min-h-64 font-mono">
              {landingPreviewTab === 'blueprint' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-cyan-400 text-xs font-black uppercase tracking-wider">Active Story Blueprint: Cyberpunk</span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded font-bold animate-pulse">● SAVING ON THE FLY</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                    <div className="p-3 bg-slate-900 border border-slate-800 rounded">
                      <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">🎬 PAGE 1 BEAT: INCITING INCIDENT</div>
                      <div className="text-xs font-bold text-white">The Tech Heist Crossroads</div>
                      <div className="text-[11px] text-slate-400 leading-relaxed mt-1">Protagonist encounters a neural chip encrypted with a memory of a cosmic cataclysm.</div>
                    </div>
                    <div className="p-3 bg-slate-900 border border-slate-800 rounded">
                      <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">⚔️ PAGE 9 BEAT: CLIMAX CONFLICT</div>
                      <div className="text-xs font-bold text-white">Neon Chasm Showdown</div>
                      <div className="text-[11px] text-slate-400 leading-relaxed mt-1">Protagonist and Sidekick confront the Syndicate Nemesis atop the cybernetic cloud-spire.</div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 text-[11px] pt-2">
                    <button onClick={() => setLandingAuthOpen(true)} className="text-cyan-300 hover:underline flex items-center gap-1">
                      Customize all 10 story outline cells <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              )}

              {landingPreviewTab === 'visuals' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-yellow-400 text-xs font-black uppercase tracking-wider">Multi-view Continuity Weights</span>
                    <span className="text-[10px] text-yellow-400 bg-yellow-950/40 border border-yellow-800/40 px-2 py-0.5 rounded font-black tracking-widest">ART_LOCK: NOIR</span>
                  </div>

                  <div className="space-y-3 mt-2">
                    <div className="flex flex-col gap-1 text-xs">
                      <span className="text-slate-400 font-bold uppercase text-[10px]">🦸 HERO BIOMETRIC SECURE</span>
                      <div className="p-2 bg-slate-900 border border-slate-800 text-gray-300 rounded text-[11px] leading-relaxed">
                        "Sleek metal combat nanosuit, glowing cyan energy lines, unruly silver-white frost hair, determined young gaze."
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 text-xs">
                      <span className="text-slate-400 font-bold uppercase text-[10px]">😈 ARCH NEMESIS CONSTANTS</span>
                      <div className="p-2 bg-slate-900 border border-slate-800 text-gray-300 rounded text-[11px] leading-relaxed">
                        "Slick obsidian high-collared protective armor shroud, calculated piercing amber eyes, cold heavy ink shadows."
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {landingPreviewTab === 'sound' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-purple-400 text-xs font-black uppercase tracking-wider">Multi-Actor Voice Deck</span>
                    <span className="text-[10px] text-purple-400 bg-purple-950/40 border border-purple-800/40 px-2 py-0.5 rounded font-black">Zephyr & Iris Enabled</span>
                  </div>

                  <div className="p-4 bg-slate-900 border border-slate-800 rounded flex flex-col gap-3 mt-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-950 select-none cursor-pointer rounded border border-purple-700 hover:bg-purple-900 transition-all text-xs" onClick={() => alert("Please sign up to activate synthetic speaker speech synthesis engines!")}>
                        ▶ TEST DIALOG AUDIO
                      </div>
                      <div className="flex-1">
                        <div className="text-[11px] text-slate-300 font-bold"> आयरिस (Iris) Voice Line Page 3</div>
                        <div className="text-[10px] text-slate-400 italic">"The crossroads hold no guarantees, commander. You must choose."</div>
                      </div>
                    </div>

                    {/* Simulated Waveform indicator visualizer */}
                    <div className="flex items-center justify-center gap-1.5 h-10 w-full bg-slate-950/40 rounded border border-slate-850 p-2 overflow-hidden">
                      <div className="w-1.5 h-4 bg-purple-500 rounded animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-1.5 h-8 bg-purple-400 rounded animate-bounce" style={{ animationDelay: '0.3s' }} />
                      <div className="w-1.5 h-5 bg-cyan-400 rounded animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <div className="w-1.5 h-7 bg-purple-500 rounded animate-bounce" style={{ animationDelay: '0.5s' }} />
                      <div className="w-1.5 h-6 bg-cyan-500 rounded animate-bounce" style={{ animationDelay: '0.4s' }} />
                      <div className="w-1.5 h-2 bg-slate-700 rounded" />
                      <div className="w-1.5 h-3 bg-purple-600 rounded animate-bounce" style={{ animationDelay: '0.6s' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* PRICING & SUBSCRIPTION MODES SECTION */}
        <section id="pricing" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 scroll-mt-20 border-t border-slate-900/60">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="font-comic text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-white mb-2">
              💵 Choose Your Multiverse Studio Tier
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 font-mono">
              Instantly deploy professional-grade publication features and take your original comics directly to your global audience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Tier */}
            <div className="bg-slate-900/50 border-2 border-black p-8 rounded-xl flex flex-col justify-between text-left shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:border-slate-700 transition-all relative">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-mono font-bold bg-slate-850 px-2.5 py-1 text-slate-300 border border-slate-700/60 uppercase">Indie Sandbox</span>
                  <h3 className="font-comic text-2xl font-black uppercase text-white mt-3">À La Carte</h3>
                  <p className="text-xs text-gray-400 font-mono mt-1">Design in transient browser memory. Perfect for casual creators sketching out individual panel frames.</p>
                </div>

                <div className="flex items-baseline py-2">
                  <span className="text-4xl font-black text-white font-mono">$0</span>
                  <span className="text-slate-500 text-xs ml-1 font-mono">/ Forever</span>
                </div>

                <ul className="space-y-2.5 text-xs font-mono text-slate-300 border-t border-slate-850 pt-4">
                  <li className="flex items-center gap-2">✓ Standard 10-page generation</li>
                  <li className="flex items-center gap-2">✓ Local JSON state draft files</li>
                  <li className="flex items-center gap-2">✓ Standard voice synthesis</li>
                  <li className="flex items-center gap-2 text-slate-500">✗ Cloud backup project storage</li>
                  <li className="flex items-center gap-2 text-slate-500">✗ Enterprise high-res styling</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={handleLaunchOfflineSandbox}
                className="mt-8 w-full bg-slate-800 hover:bg-slate-700 text-white font-comic text-xs uppercase font-extrabold py-3 border-2 border-black rounded shadow-[2px_2px_0px_#000] cursor-pointer"
              >
                Launch Sandbox Mode
              </button>
            </div>

            {/* Pro Tier */}
            <div className="bg-slate-900 border-4 border-yellow-400 p-8 rounded-xl flex flex-col justify-between text-left shadow-[8px_8px_0px_rgba(0,0,0,1)] relative hover:-translate-y-1 transition-all">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-3.5 py-1 font-comic text-[10px] font-black uppercase tracking-wider border-2 border-black">
                ✨ POPULAR BEST VALUE
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-mono font-bold bg-yellow-950/80 px-2.5 py-1 text-yellow-300 border border-yellow-800/40 uppercase">Multiverse Pro</span>
                  <h3 className="font-comic text-2xl font-black uppercase text-white mt-3">The Full Course</h3>
                  <p className="text-xs text-gray-300 font-mono mt-1">Our signature recipe for continuous multi-chapter epics. Secure Web Cloud Firestore database backing.</p>
                </div>

                <div className="flex items-baseline py-2">
                  <span className="text-4xl font-black text-yellow-400 font-mono">$19</span>
                  <span className="text-slate-400 text-xs ml-1 font-mono">/ Monthly</span>
                </div>

                <ul className="space-y-2.5 text-xs font-mono text-slate-200 border-t border-slate-800 pt-4">
                  <li className="flex items-center gap-2 text-yellow-300">✓ Secure Web Cloud Firestore database backing</li>
                  <li className="flex items-center gap-2">✓ Dynamic 10-chapter Story Blueprints</li>
                  <li className="flex items-center gap-2">✓ Priority Gemini-3 Image style anchors</li>
                  <li className="flex items-center gap-2">✓ Limitless character biometric vault cards</li>
                  <li className="flex items-center gap-2">✓ Multi-language custom voice output synthesis</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCheckoutTier('Pro');
                  setIsCheckoutOpen(true);
                }}
                className="mt-8 w-full bg-yellow-400 hover:bg-yellow-300 text-black font-comic text-xs uppercase font-extrabold py-3 border-2 border-black rounded shadow-[3px_3px_0px_#000] cursor-pointer"
              >
                Access Pro Account
              </button>
            </div>

            {/* Enterprise Tier */}
            <div className="bg-slate-900/50 border-2 border-black p-8 rounded-xl flex flex-col justify-between text-left shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:border-slate-700 transition-all relative">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-mono font-bold bg-slate-850 px-2.5 py-1 text-slate-300 border border-slate-700/60 uppercase">Studio Publisher</span>
                  <h3 className="font-comic text-2xl font-black uppercase text-white mt-3">The Multi-Course</h3>
                  <p className="text-xs text-gray-400 font-mono mt-1">Our full-suite solution for professional studios managing continuous, Firestore-backed 10-chapter epic blueprints.</p>
                </div>

                <div className="flex items-baseline py-2">
                  <span className="text-4xl font-black text-white font-mono">$79</span>
                  <span className="text-slate-500 text-xs ml-1 font-mono">/ Monthly</span>
                </div>

                <ul className="space-y-2.5 text-xs font-mono text-slate-300 border-t border-slate-850 pt-4">
                  <li className="flex items-center gap-2">✓ Everything in Pro plan</li>
                  <li className="flex items-center gap-2">✓ UHD 4K Vector generation exports</li>
                  <li className="flex items-center gap-2">✓ Custom model tuning weights</li>
                  <li className="flex items-center gap-2">✓ Collaborative publishing workspaces</li>
                  <li className="flex items-center gap-2">✓ Dedicate GCP priority prompt endpoints</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCheckoutTier('Enterprise');
                  setIsCheckoutOpen(true);
                }}
                className="mt-8 w-full bg-slate-800 hover:bg-slate-700 text-white font-comic text-xs uppercase font-extrabold py-3 border-2 border-black rounded shadow-[2px_2px_0px_#000] cursor-pointer"
              >
                Access Enterprise Account
              </button>
            </div>
          </div>
        </section>

        {/* BOTTOM CTA BANNER FOOTER */}
        <footer className="relative z-10 bg-slate-950 border-t-4 border-black py-16 text-center mt-auto">
          <div className="max-w-4xl mx-auto px-4 space-y-6">
            <h2 className="font-comic text-2xl sm:text-3xl font-black uppercase text-white animate-pulse">
              Ready to claim your place in the multiverse?
            </h2>
            <p className="text-xs text-slate-400 font-mono max-w-xl mx-auto leading-relaxed">
              Unlock the creative potential of multimodal artificial intelligence. Draft script blueprints, mold actors, and release immersive visual graphic books safely stored in Firestore today.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-sm mx-auto">
              <button
                type="button"
                onClick={() => setLandingAuthOpen(true)}
                className="bg-yellow-400 text-black border-2 border-black font-comic hover:bg-yellow-300 text-xs px-6 py-3 uppercase font-extrabold tracking-wider shadow-[3px_3px_0px_#000] transition-all cursor-pointer"
              >
                Access Creative Console
              </button>
              <button
                type="button"
                onClick={handleLaunchOfflineSandbox}
                className="bg-slate-900 text-slate-200 border-2 border-black px-6 py-3 font-mono text-xs uppercase font-bold tracking-wider hover:text-white hover:bg-slate-850 transition-all cursor-pointer"
              >
                Launch local sandbox
              </button>
            </div>

            <div className="border-t border-slate-900 pt-8 mt-12 flex flex-col sm:flex-row justify-between items-center text-[11px] font-mono text-slate-505 gap-4">
              <div>
                © 2026 STORY.MENU. ALL RIGHTS RESERVED.
              </div>
              <div className="flex gap-4">
                <span>DOMAIN: <span className="text-cyan-400 font-bold">story.menu</span></span>
                <span>CHASSIS: <span className="text-yellow-400 font-bold">MULTIVERSE v3.11</span></span>
              </div>
            </div>
          </div>
        </footer>

        {/* INTEGRATED AUTH SCREEN DIALOG MODAL */}
        {landingAuthOpen && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="relative animate-scaleUp">
              <AuthScreen 
                currentUser={currentUser} 
                onUserChange={(user) => {
                  setCurrentUser(user);
                  setLandingAuthOpen(false);
                  if (user) {
                    setActiveCreator({ id: user.id, email: user.email });
                    localStorage.setItem('infinite_heroes_creator', JSON.stringify({ id: user.id, email: user.email, displayName: user.displayName }));
                    window.dispatchEvent(new Event('refresh-character-vault'));
                  }
                }} 
                onClose={() => setLandingAuthOpen(false)} 
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="comic-scene">
      {showApiKeyDialog && <ApiKeyDialog onContinue={handleApiKeyDialogContinue} />}
      
      <Setup 
          show={showSetup}
          isTransitioning={isTransitioning}
          hero={hero}
          friend={friend}
          villain={villain}
          selectedGenre={selectedGenre}
          selectedLanguage={selectedLanguage}
          customPremise={customPremise}
          richMode={richMode}
          selectedVoice={selectedVoice}
          soundtrackEnabled={soundtrackEnabled}
          activeCreator={activeCreator}
          onCreatorChange={setActiveCreator}
          onLogOut={handleLogOut}
          onHeroUpload={handleHeroUpload}
          onFriendUpload={handleFriendUpload}
          onVillainUpload={handleVillainUpload}
          onHeroHeadUpload={handleHeroHeadUpload}
          onHeroHeadClear={handleHeroHeadClear}
          onHeroClothesUpload={handleHeroClothesUpload}
          onHeroClothesClear={handleHeroClothesClear}
          onFriendHeadUpload={handleFriendHeadUpload}
          onFriendHeadClear={handleFriendHeadClear}
          onFriendClothesUpload={handleFriendClothesUpload}
          onFriendClothesClear={handleFriendClothesClear}
          onVillainHeadUpload={handleVillainHeadUpload}
          onVillainHeadClear={handleVillainHeadClear}
          onVillainClothesUpload={handleVillainClothesUpload}
          onVillainClothesClear={handleVillainClothesClear}
          onGenreChange={setSelectedGenre}
          onLanguageChange={setSelectedLanguage}
          onPremiseChange={setCustomPremise}
          onRichModeChange={setRichMode}
          onVoiceChange={setSelectedVoice}
          onSoundtrackChange={setSoundtrackEnabled}
          onLaunch={launchStory}
          onSelectHero={setHero}
          onSelectFriend={setFriend}
          onSelectVillain={setVillain}
          onLoadProject={handleLoadProject}
          onLoadDraft={handleLoadDraft}
          comicFaces={comicFaces}
          creativeDirectives={creativeDirectives}
          onCreativeDirectivesChange={setCreativeDirectives}
          heroVisuals={heroVisuals}
          onHeroVisualsChange={setHeroVisuals}
          friendVisuals={friendVisuals}
          onFriendVisualsChange={setFriendVisuals}
          villainVisuals={villainVisuals}
          onVillainVisualsChange={setVillainVisuals}
          villainDna={villainDna}
          onVillainDnaChange={setVillainDna}
          nemesisDNA={nemesisDNA}
          onNemesisDnaChange={setNemesisDNA}
          soundPrompt={soundPrompt}
          onSoundPromptChange={setSoundPrompt}
          storyTone={storyTone}
          storyBlueprint={storyBlueprint}
          onStoryBlueprintChange={setStoryBlueprint}
      />

      <AccountPanel 
          currentUser={currentUser} 
          onUserChange={(user) => {
              setCurrentUser(user);
              if (user) {
                  setActiveCreator({ id: user.id, email: user.email });
                  localStorage.setItem('infinite_heroes_creator', JSON.stringify({ id: user.id, email: user.email, displayName: user.displayName }));
                  window.dispatchEvent(new Event('refresh-character-vault'));
              } else {
                  const defaultUser = { id: '00000000-0000-0000-0000-000000000000', email: 'local-creator@infinite.multiverse' };
                  setActiveCreator(defaultUser);
                  localStorage.removeItem('infinite_heroes_creator');
                  window.dispatchEvent(new Event('refresh-character-vault'));
              }
          }} 
          onOpenAuth={() => setShowAuthModal(true)} 
          onOpenCheckout={(tier) => {
              setCheckoutTier(tier);
              setIsCheckoutOpen(true);
          }}
          onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {showAuthModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[300] animate-fadeIn backdrop-blur-sm">
              <AuthScreen 
                  currentUser={currentUser} 
                  onUserChange={(user) => {
                      setCurrentUser(user);
                      if (user) {
                          setActiveCreator({ id: user.id, email: user.email });
                          localStorage.setItem('infinite_heroes_creator', JSON.stringify({ id: user.id, email: user.email, displayName: user.displayName }));
                          window.dispatchEvent(new Event('refresh-character-vault'));
                      }
                  }} 
                  onClose={() => setShowAuthModal(false)} 
              />
          </div>
      )}

      {isCheckoutOpen && (
          <CheckoutModal 
              isOpen={isCheckoutOpen}
              onClose={() => setIsCheckoutOpen(false)}
              initialTier={checkoutTier}
              currentUser={currentUser}
              onUpgradeSuccessful={handleUpgradeSuccessful}
          />
      )}
      
      {isAdminOpen && (
          <AdminDashboard 
              isOpen={isAdminOpen}
              onClose={() => setIsAdminOpen(false)}
          />
      )}
      
      <Book 
          comicFaces={comicFaces}
          currentSheetIndex={currentSheetIndex}
          isStarted={isStarted}
          isSetupVisible={showSetup && !isTransitioning}
          selectedVoice={selectedVoice}
          generateSpeech={generateSpeech}
          onSheetClick={handleSheetClick}
          onChoice={handleChoice}
          onOpenBook={() => { playPageTurnSFX(); setCurrentSheetIndex(1); }}
          onDownload={downloadPDF}
          onReset={resetApp}
      />
    </div>
  );
};

export default App;
