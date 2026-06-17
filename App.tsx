
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
import { ModeSelectionScreen } from './ModeSelectionScreen';
import { recordPageGenerated } from './storage';
import { saveCharacterToFirestore, saveProjectToFirestore, addTokensToUser } from './storageFirestore';
import { calculateTokenCost, AI_MODELS } from './pricingIntelligence';
import { Sparkles, BookOpen, User, CheckCircle, Zap, Shield, Play, Layers, Cpu, Database, Volume2, ArrowRight, Eye, Palette, Flame, Radio, Clock, CloudLightning } from 'lucide-react';
import i18n from './i18n';

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
  const [hasSelectedMode, setHasSelectedMode] = useState<boolean>(false);
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
  const [imageProvider, setImageProvider] = useState<'gemini' | 'llamagen' | 'comfyui' | 'leonardo'>('gemini');

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

  // --- Phase 2: URL Language Routing (Initial Load) ---
  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/^\/([a-z]{2}(-[A-Z]{2})?)\/?$/i);
    if (match) {
      const shortCode = match[1].toLowerCase();
      if (shortCode === 'en') {
        setSelectedLanguage('en-US');
      } else {
        const found = LANGUAGES.find(l => l.code.toLowerCase().startsWith(shortCode));
        if (found) {
          setSelectedLanguage(found.code);
        }
      }
    }
  }, []);

  // --- Phase 2 & 3: URL Language Routing (State Change -> URL & i18n) ---
  useEffect(() => {
    const shortCode = selectedLanguage.split('-')[0].toLowerCase();
    const newPath = shortCode === 'en' ? '/' : `/${shortCode}/`;
    if (window.location.pathname !== newPath) {
      window.history.pushState(null, '', newPath);
    }
    // Update translation engine
    i18n.changeLanguage(shortCode);
  }, [selectedLanguage]);


  useEffect(() => {
    const handleOpenAuth = () => {
      setLandingAuthOpen(true);
    };
    const handleLaunchSandbox = () => {
      handleLaunchOfflineSandbox();
    };
    const handleOpenCheckout = (e: Event) => {
      const customEvent = e as CustomEvent;
      setCheckoutTier(customEvent.detail || 'Pro');
      setIsCheckoutOpen(true);
    };
    
    window.addEventListener('trigger-auth-dialog', handleOpenAuth);
    window.addEventListener('trigger-sandbox-mode', handleLaunchSandbox);
    window.addEventListener('trigger-checkout-dialog', handleOpenCheckout);
    return () => {
      window.removeEventListener('trigger-auth-dialog', handleOpenAuth);
      window.removeEventListener('trigger-sandbox-mode', handleLaunchSandbox);
      window.removeEventListener('trigger-checkout-dialog', handleOpenCheckout);
    };
  }, []);
  
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
            if (data && data.tokenBalance !== undefined) {
              u.tokenBalance = data.tokenBalance;
              window.dispatchEvent(new CustomEvent('token-balance-updated', { detail: data.tokenBalance }));
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
      // Re-fetch token balance to update UI
      const docRef = doc(db, 'users', currentUser.id);
      getDoc(docRef).then(snap => {
         if (snap.exists() && snap.data().tokenBalance !== undefined) {
             const newBalance = snap.data().tokenBalance;
             setCurrentUser(prev => prev ? { ...prev, tokenBalance: newBalance } : prev);
             window.dispatchEvent(new CustomEvent('token-balance-updated', { detail: newBalance }));
         }
      });
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

  /**
   * Evaluates cost, checks balance, and deducts tokens.
   * Throws an error or opens checkout if insufficient balance.
   */
  const handleTokenDeduction = async (modelId: keyof typeof AI_MODELS, estimatedTokens: number = 1000): Promise<boolean> => {
    if (!currentUser || currentUser.isOffline) return true; // Bypass in offline/sandbox mode

    const cost = calculateTokenCost(modelId, estimatedTokens);
    const currentBalance = currentUser.tokenBalance || 0;

    if (currentBalance < cost) {
      console.warn(`Insufficient tokens. Needed ${cost}, have ${currentBalance}. Triggering Checkout.`);
      setCheckoutTier('Starter');
      setIsCheckoutOpen(true);
      throw new Error(`INSUFFICIENT_TOKENS:${cost}`);
    }

    // Optimistically update UI
    const newBalance = currentBalance - cost;
    setCurrentUser(prev => prev ? { ...prev, tokenBalance: newBalance } : prev);
    window.dispatchEvent(new CustomEvent('token-balance-updated', { detail: newBalance }));

    try {
      // Async update to DB
      await addTokensToUser(currentUser.id, -cost);
      return true;
    } catch (e) {
      console.error("Failed to deduct tokens in DB", e);
      return false;
    }
  };

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
          await handleTokenDeduction('gemini-3.1-flash-tts-preview', 1); // 1 generation
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
    await handleTokenDeduction('gemini-3.5-flash', 1500);
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
          await handleTokenDeduction('gemini-3.5-flash', 1000);
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
    await handleTokenDeduction('gemini-2.5-flash-image', 1);
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
                villainRef: villainRef.current,
                provider: imageProvider
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
      try {
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
      } catch (e: any) {
          console.error("Failed to generate page", faceId, e);
          updateFaceState(faceId, { isLoading: false, narrative: { scene: "Generation failed due to insufficient tokens or API error.", choices: [], focus_char: 'other' } });
          throw e; // rethrow to abort batch
      }
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
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 relative font-sans">
        {/* Ambient background grids and glows */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.15),transparent_50%),radial-gradient(ellipse_at_bottom,rgba(147,51,234,0.15),transparent_50%)] pointer-events-none z-0" />
        <div className="absolute top-0 left-0 w-full h-full bg-[size:32px_32px] bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] opacity-70 pointer-events-none z-0" />
        
        <div className="relative z-10 w-full max-w-md">
          <AuthScreen 
            currentUser={currentUser} 
            onUserChange={(user) => {
              setCurrentUser(user);
              if (user) {
                setActiveCreator({ id: user.id, email: user.email });
                localStorage.setItem('infinite_heroes_creator', JSON.stringify({ id: user.id, email: user.email, displayName: user.displayName }));
                
                // Fetch extra stats if online
                if (!user.isOffline) {
                    import('./check_balance').then(m => m.checkUserBalance(user.id)).then(stats => {
                        if (stats) setUsageStats(stats);
                    }).catch(e => console.error("Balance fetch error:", e));
                }
              }
            }}
          />
        </div>
      </div>
    );
  }

  if (!hasSelectedMode) {
      return (
          <ModeSelectionScreen 
              onSelect={(mode) => {
                  localStorage.setItem('story_menu_skin', mode);
                  // Dispatch storage event to notify MainLayout to update styling immediately
                  window.dispatchEvent(new Event('storage'));
                  setHasSelectedMode(true);
              }} 
          />
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
          imageProvider={imageProvider}
          onImageProviderChange={setImageProvider}
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
