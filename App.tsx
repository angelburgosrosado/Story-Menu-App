/**
 * Screen Name: App Main Shell
 * Purpose: Global state manager and router for Story.Menu features
 * Version: 1.2
 * Phase: Phase 12
 * Date: 2026-07-08
 * What changed in this revision: Added Account Settings dashboard integration.
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect } from 'react';
import jsPDF from 'jspdf';
import { MAX_STORY_PAGES, BACK_COVER_PAGE, TOTAL_PAGES, INITIAL_PAGES, BATCH_SIZE, DECISION_PAGES, GENRES, STYLE_KEYWORDS, TONES, LANGUAGES, ComicFace, Beat, Persona, CharacterIdentitySchema, ChapterGoal } from './types';
import { Setup } from './Setup';
import { StoryWorkspace } from './StoryWorkspace';
import { WorkspaceReader } from './WorkspaceReader';
import { PublicGallery, MOCK_STORIES } from './PublicGallery';
import { PublicStoryDetail } from './PublicStoryDetail';
import { PublicCreatorProfile } from './PublicCreatorProfile';
import { SavedLibrary } from './SavedLibrary';
import { RemixModal } from './RemixModal';
import { ModerationDashboard, MOCK_REPORTS } from './ModerationDashboard';
import { AccountSettings } from './AccountSettings';
import { AutomationHub } from './AutomationHub';
import { EducationDashboard } from './EducationDashboard';
import { ProgressDashboard } from './ProgressDashboard';
import { ModerationReview } from './ModerationReview';
import { PricingPlans } from './PricingPlans';
import { UsageDashboard } from './UsageDashboard';
import { ReportModal, ReportReason } from './ReportModal';
import { Book } from './Book';
import { useApiKey } from './useApiKey';
import { ApiKeyDialog } from './ApiKeyDialog';
import { playPageTurnSFX, startProceduralSoundtrack, stopProceduralSoundtrack } from './audio';
import { auth, signOutUser, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { AuthScreen, AccountPanel } from './Account';
import { CheckoutModal } from './CheckoutModal';
import { ModeSelectionScreen } from './ModeSelectionScreen';
import { recordPageGenerated } from './storage';
import { saveCharacterToFirestore, saveProjectToFirestore } from './storageFirestore';
import { fileToBase64 } from './imageUtils';
import { calculateTokenCost, AI_MODELS } from './pricingIntelligence';
import { Sparkles, BookOpen, User, CheckCircle, Zap, Shield, Play, Layers, Cpu, Database, Volume2, ArrowRight, Eye, Palette, Flame, Radio, Clock, CloudLightning, Download, RotateCcw } from 'lucide-react';
import i18n from './i18n';
import { WorkspaceExport } from './WorkspaceExport';

// --- Constants ---
const MODEL_V3 = "gemini-3-pro-image-preview";
const MODEL_IMAGE_GEN_NAME = MODEL_V3;
const MODEL_TEXT_NAME = MODEL_V3;

// Mapping from selected style IDs to descriptive keywords for AI
const styleToPromptKeywords: Record<string, string> = {
  'crayon': 'childlike drawing, vibrant colors, thick outlines, slightly smudged texture, simple shapes',
  'storybook': 'charming illustration, warm palette, clear details, friendly atmosphere, gentle aesthetic',
  'popup': 'vibrant, layered 3D elements, bold colors, playful depth, theatrical presentation',
  'claymation': 'stop-motion clay figures, textured surfaces, slightly quirky imperfections, soft lighting',
};

const App: React.FC = () => {
  // --- API Key Hook ---
  const { validateApiKey, setShowApiKeyDialog, showApiKeyDialog, handleApiKeyDialogContinue } = useApiKey();

  const [activeCreator, setActiveCreator] = useState<{ id: string; email: string; tier?: string }>({
    id: '00000000-0000-0000-0000-000000000000',
    email: 'local-creator@infinite.multiverse',
    tier: 'Free'
  });
  const [isLightMode, setIsLightMode] = useState(false);

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
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; displayName?: string; isOffline?: boolean; tier?: string; subscriptionId?: string; paymentMethod?: string; tokenBalance?: number; role?: 'Creator' | 'Teacher' | 'Parent' | 'Student' | 'Admin' } | null>(null);
  const [hasSelectedMode, setHasSelectedMode] = useState<boolean>(false);

  useEffect(() => {
    // Force reset on mount to ensure Fast Refresh doesn't preserve a dirty 'true' state from earlier tests
    setHasSelectedMode(false);
  }, []);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [landingPreviewTab, setLandingPreviewTab] = useState<'blueprint' | 'visuals' | 'sound'>('blueprint');
  const [landingAuthOpen, setLandingAuthOpen] = useState(false);

  // --- Checkout Modal States ---
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutTier, setCheckoutTier] = useState<'Pro' | 'Enterprise'>('Pro');

  const [hero, setHeroState] = useState<Persona | null>(null);
  const [friend, setFriendState] = useState<Persona | null>(null);
  const [villain, setVillainState] = useState<Persona | null>(null);
  const [selectedGenre, setSelectedGenre] = useState(GENRES[0]);

  // --- Trust & Moderation States ---
  const [reports, setReports] = useState<ReportItem[]>(MOCK_REPORTS);
  const [reportModalConfig, setReportModalConfig] = useState<{ targetId: string; targetType: 'story' | 'creator' } | null>(null);
  const [activeReviewReportId, setActiveReviewReportId] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState('storybook');
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0].code);
  const [customPremise, setCustomPremise] = useState("");
  const [storyTone, setStoryTone] = useState(TONES[0]);
  const [richMode, setRichMode] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState('Zephyr');
  const [soundtrackEnabled, setSoundtrackEnabled] = useState(false);
  const [imageProvider, setImageProvider] = useState<'gemini' | 'llamagen' | 'comfyui' | 'leonardo'>('leonardo');

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
  const [isReadingPreview, setIsReadingPreview] = useState(false);
  const [projectTitle, setProjectTitle] = useState("Untitled Project");

  // --- Phase 7 & 8: Public Gallery States ---
  const [appMode, setAppMode] = useState<'studio' | 'gallery'>('studio');
  const [galleryView, setGalleryView] = useState<'home' | 'story' | 'creator' | 'library' | 'moderation-dashboard' | 'moderation-review' | 'usage' | 'settings' | 'automation' | 'education-dashboard' | 'progress'>('home');
  const [showPricing, setShowPricing] = useState(false);
  const [selectedGalleryStoryId, setSelectedGalleryStoryId] = useState<string | null>(null);
  const [selectedGalleryCreatorId, setSelectedGalleryCreatorId] = useState<string | null>(null);

  const [savedStoryIds, setSavedStoryIds] = useState<string[]>(['story-2']);
  const [followedCreators, setFollowedCreators] = useState<string[]>(['creator-2']);
  const [showRemixModal, setShowRemixModal] = useState<boolean>(false);
  const [remixTargetId, setRemixTargetId] = useState<string | null>(null);

  const handleToggleSave = (storyId: string) => {
    setSavedStoryIds(prev => prev.includes(storyId) ? prev.filter(id => id !== storyId) : [...prev, storyId]);
  };
  const handleToggleFollow = (creatorId: string) => {
    setFollowedCreators(prev => prev.includes(creatorId) ? prev.filter(id => id !== creatorId) : [...prev, creatorId]);
  };
  const handleRemixAction = (storyId: string) => {
    setRemixTargetId(storyId);
    setShowRemixModal(true);
  };
  const handleConfirmRemix = (storyId: string) => {
    setShowRemixModal(false);
    // In a real app, this would duplicate the story state and switch to studio.
    setAppMode('studio');
  };

  const handleLaunchOfflineSandbox = () => {
    const offlineId = 'offline_creator_' + Math.random().toString(36).substring(2, 9);
    const u = {
      id: offlineId,
      email: 'local-artist@sandbox.mode',
      displayName: 'Offline Creator',
      isOffline: true,
      role: 'Creator' as const
    };
    setCurrentUser(u);
    setActiveCreator({ id: u.id, email: u.email, tier: 'Free' });
    localStorage.setItem('infinite_heroes_creator', JSON.stringify(u));
    window.dispatchEvent(new Event('refresh-character-vault'));
  };

  const handleReportSubmit = (reason: ReportReason, details: string) => {
    console.log("Report submitted:", reason, details, reportModalConfig);
    setReportModalConfig(null);
    alert("Report submitted successfully.");
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

  useEffect(() => {
    try {
      const h = localStorage.getItem('offline_hero');
      if (h) setHero(JSON.parse(h));
      const f = localStorage.getItem('offline_friend');
      if (f) setFriend(JSON.parse(f));
      const v = localStorage.getItem('offline_villain');
      if (v) setVillain(JSON.parse(v));
    } catch (e) { console.error('Failed to load offline characters', e); }
  }, []);

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

  const handleReset = () => {
    setComicFaces([]);
    setIsStarted(false);
    setShowSetup(true);
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
    alert(`📂 WIP snapshot loaded successfully!\\n"\"${draft.title || 'Untitled Draft'}\"" has been restored directly to your active Workspace!`);
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
          let userData: any = {};
          if (snap.exists()) {
            userData = snap.data();
          }

          // Securely fetch tokens from PostgreSQL/Memory backend
          fetch(`/api/user/tokens?email=${encodeURIComponent(u.email)}`)
            .then(res => res.json())
            .then(tokenData => {
              const fullUser: any = {
                ...u,
                tier: userData?.tier || 'Free',
                subscriptionId: userData?.subscriptionId,
                paymentMethod: userData?.paymentMethod,
                tokenBalance: typeof tokenData.tokens === 'number' ? tokenData.tokens : (typeof userData?.tokenBalance === 'number' ? userData.tokenBalance : 0),
                role: userData?.role || 'Creator'
              };
              setCurrentUser(fullUser);
              setActiveCreator({ id: fullUser.id, email: fullUser.email, tier: fullUser.tier });
              localStorage.setItem('infinite_heroes_creator', JSON.stringify(fullUser));
              setIsAuthLoading(false);

              if (tokenData.tokens !== undefined) {
                window.dispatchEvent(new CustomEvent('token-balance-updated', { detail: tokenData.tokens }));
              }
            })
            .catch(err => {
              console.warn("Failed to fetch secure token balance:", err);
              const fallbackUser: any = {
                ...u,
                tier: userData?.tier || 'Free',
                role: userData?.role || 'Creator'
              };
              setCurrentUser(fallbackUser);
              setActiveCreator({ id: fallbackUser.id, email: fallbackUser.email, tier: fallbackUser.tier });
              localStorage.setItem('infinite_heroes_creator', JSON.stringify(fallbackUser));
              setIsAuthLoading(false);
            });
        }).catch((err) => {
          console.warn("Could not query user doc details:", err);
          u.role = 'Creator';
          setCurrentUser(u);
          setActiveCreator({ id: u.id, email: u.email, tier: u.tier });
          localStorage.setItem('infinite_heroes_creator', JSON.stringify(u));
          setIsAuthLoading(false);
        });
      } else {
        // Enforce commercial authentication, do not allow plain offline local storage bypass.
        // Clear legacy non-firebase sessions to force the commercial login portal.
        localStorage.removeItem('infinite_heroes_creator');
        setCurrentUser(null);
        setActiveCreator({ id: '', email: '', tier: 'Free' });
        setIsAuthLoading(false);
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
    setActiveCreator({ id: '', email: '', tier: 'Free' });
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
      setActiveCreator({ id: u.id, email: u.email, tier: u.tier });
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
      setCheckoutTier('Pro');
      setIsCheckoutOpen(true);
      throw new Error(`INSUFFICIENT_TOKENS:${cost}`);
    }

    // Optimistically update UI
    const newBalance = currentBalance - cost;
    setCurrentUser(prev => prev ? { ...prev, tokenBalance: newBalance } : prev);
    window.dispatchEvent(new CustomEvent('token-balance-updated', { detail: newBalance }));

    // Real deduction happens securely on the backend when the API is hit.
    // If the API call fails or returns 402, the app will need to resync.
    return true;
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
      const geminiKey = localStorage.getItem('GEMINI_API_KEY') || '';
      const res = await fetch('/api/gemini/speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-gemini-key': geminiKey },
        body: JSON.stringify({ text, voiceName, userEmail: currentUser?.email || (localStorage.getItem('ADMIN_LOGGED_IN') === 'true' ? 'abglco@protonmail.com' : undefined) })
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
    // (Removed hardcoded MODERATION_BLOCKED alert to expose raw API errors)
    if (msg.includes('Insufficient tokens')) {
      alert('⚠️ Insufficient Tokens. Please add more tokens to continue.');
      setCheckoutTier('Pro');
      setIsCheckoutOpen(true);
      if (currentUser && currentUser.email) {
        fetch(`/api/user/tokens?email=${encodeURIComponent(currentUser.email)}`)
          .then(res => res.json())
          .then(data => {
            if (data.tokens !== undefined) {
              setCurrentUser(prev => prev ? { ...prev, tokenBalance: data.tokens } : prev);
              window.dispatchEvent(new CustomEvent('token-balance-updated', { detail: data.tokens }));
            }
          })
          .catch(console.error);
      }
      return;
    }

    if(
      msg.includes('Requested entity was not found') ||
      msg.includes('API_KEY_INVALID') ||
      msg.toLowerCase().includes('permission denied')
    ) {
      setShowApiKeyDialog(true);
    }
  };

  const generateBeat = async (history: ComicFace[], isRightPage: boolean, pageNum: number, isDecisionPage: boolean): Promise<Beat> => {
    await handleTokenDeduction('gemini-3.5-flash', 1500);
    if (!heroRef.current) throw new Error("No Hero");

    const isFinalPage = pageNum === MAX_STORY_PAGES;
    const langName = LANGUAGES.find(l => l.code === selectedLanguage)?.name || "English";

    // Get relevant history and last focus to prevent repetition
    const relevantHistory = history
      .filter(p => p.type === 'story' && p.narrative && (p.pageIndex || 0) < pageNum)
      .sort((a, b) => (a.pageIndex || 0) - (b.pageIndex || 0))
      .map(p => ({ ...p, imageUrl: undefined })); // Strip massive base64 imageUrls to avoid payload limits

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

    let enhancedCreativeDirectives = `${creativeDirectives || ''} Artistic Style Keywords: ${STYLE_KEYWORDS[selectedGenre] || STYLE_KEYWORDS['Custom']}.`;
    let narrativeGuidance = "";
    if (isFinalPage) {
      narrativeGuidance = "This is the final page. Conclude the story with a satisfying resolution, a clear ending, or a poignant moment. Ensure all plot threads are tied up.";
    } else if (pageNum % 3 === 0 && pageNum !== 1) {
      narrativeGuidance = "This page should advance the main plot significantly, introduce a new challenge, or reveal a key piece of information. Build towards the climax.";
    } else if (isDecisionPage) {
      narrativeGuidance = "This page ends with a decision. Ensure the narrative naturally leads to a point where the main character must make a crucial choice. Set up the stakes for the upcoming decision.";
    } else {
      narrativeGuidance = "Continue the story naturally. Focus on character development, dialogue, and advancing the current scene.";
    }

    try {
      const geminiKey = localStorage.getItem('GEMINI_API_KEY') || '';
      const response = await fetch('/api/gemini/beat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-gemini-key': geminiKey },
        body: JSON.stringify({
          userEmail: currentUser?.email || (localStorage.getItem('ADMIN_LOGGED_IN') === 'true' ? 'abglco@protonmail.com' : undefined),
          history: relevantHistory,
          hero: heroRef.current,
          friendInstruction,
          villainInstruction,
          creativeDirectives: enhancedCreativeDirectives, // Use enhanced directives
          narrativeGuidance, // Add narrative guidance
          genre: selectedGenre,
          language: selectedLanguage,
          tone: storyTone,
          customPremise,
          pageNum,
          isDecisionPage,
          selectedGenre, // Ensure genre is passed again
          selectedLanguage, // Ensure language is passed again
          storyTone, // Ensure tone is passed again
          soundPrompt,
          friendRef: friendRef.current, // Pass full friend object if available
          villainRef: villainRef.current, // Pass full villain object if available
          richMode,
          heroVisuals,
          friendVisuals,
          villainVisuals,
          villainDna, // Villain DNA Power Profile
          nemesisDNA, // Structured nemesis DNA Coordinates
          storyBlueprint
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server beat failure: ${response.status}`);
      }

      const parsed = await response.json();

      if (parsed.dialogue) parsed.dialogue = parsed.dialogue.replace(/[\w\s\-]+:\s*/i, '').replace(/["']/g, '').trim();
      if (parsed.caption) parsed.caption = parsed.caption.replace(/[\w\s\-]+:\s*/i, '').trim();
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
      } as Beat;
    }
  };

  const generatePersona = async (desc: string): Promise<Persona> => {
    try {
      await handleTokenDeduction('gemini-3.5-flash', 1000);
      const geminiKey = localStorage.getItem('GEMINI_API_KEY') || '';
      const response = await fetch('/api/gemini/persona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-gemini-key': geminiKey },
        body: JSON.stringify({ desc, selectedGenre, userEmail: currentUser?.email || (localStorage.getItem('ADMIN_LOGGED_IN') === 'true' ? 'abglco@protonmail.com' : undefined) })
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

    // --- Enhanced Style Description for Image Generation ---
    const styleKeywords = STYLE_KEYWORDS[selectedGenre] || STYLE_KEYWORDS['Custom'] || 'clean illustration, modern aesthetic';
    let imageStylePrompt = `Art Style: ${styleKeywords}. `;

    // --- Reinforce Character Consistency ---
    let characterConsistencyPrompt = "";
    if (heroRef.current) characterConsistencyPrompt += `Hero: ${heroRef.current.desc}. Visuals: ${heroVisuals}. `;
    if (friendRef.current) characterConsistencyPrompt += `Friend: ${friendRef.current.desc}. Visuals: ${friendVisuals}. `;
    if (villainRef.current) characterConsistencyPrompt += `Villain: ${villainRef.current.desc}. Visuals: ${villainVisuals}. `;

    // --- Incorporate Narrative Details ---
    let narrativeImagePrompt = `Scene: ${beat.scene}. `;
    if (beat.dialogue) narrativeImagePrompt += `Dialogue: "${beat.dialogue}". `;
    if (beat.caption) narrativeImagePrompt += `Caption: "${beat.caption}". `;
    if (beat.choices && beat.choices.length > 0) narrativeImagePrompt += `Choices: ${beat.choices.join(', ')}. `;

    // Combine all parts for the final prompt
    const finalImagePrompt = `Generate an image for a comic panel. ${imageStylePrompt}${characterConsistencyPrompt}${narrativeImagePrompt}Genre: ${selectedGenre}. Language: ${selectedLanguage}.`;

    try {
      const geminiKey = localStorage.getItem('GEMINI_API_KEY') || '';

      // --- Enhanced Style Description for Image Generation ---
      const styleKeywords = styleToPromptKeywords[selectedStyle] || 'clean illustration, modern aesthetic';
      let imageStylePrompt = `Art Style: ${styleKeywords}. `;

      // --- Reinforce Character Consistency ---
      let characterConsistencyPrompt = "";
      if (heroRef.current) characterConsistencyPrompt += `Hero: ${heroRef.current.desc}. Visuals: ${heroVisuals}. `;
      if (friendRef.current) characterConsistencyPrompt += `Friend: ${friendRef.current.desc}. Visuals: ${friendVisuals}. `;
      if (villainRef.current) characterConsistencyPrompt += `Villain: ${villainRef.current.desc}. Visuals: ${villainVisuals}. `;

      // --- Incorporate Narrative Details ---
      let narrativeImagePrompt = `Scene: ${beat.scene}. `;
      if (beat.dialogue) narrativeImagePrompt += `Dialogue: "${beat.dialogue}". `;
      if (beat.caption) narrativeImagePrompt += `Caption: "${beat.caption}". `;
      if (beat.choices && beat.choices.length > 0) narrativeImagePrompt += `Choices: ${beat.choices.join(', ')}. `;

      // Combine all parts for the final prompt
      const finalImagePrompt = `Generate an image for a comic panel. ${imageStylePrompt}${characterConsistencyPrompt}${narrativeImagePrompt}Genre: ${selectedGenre}. Language: ${selectedLanguage}.`;

      const response = await fetch('/api/gemini/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-gemini-key': geminiKey },
        body: JSON.stringify({
          userEmail: currentUser?.email || (localStorage.getItem('ADMIN_LOGGED_IN') === 'true' ? 'abglco@protonmail.com' : undefined),
          beat, // Keep beat for context if needed by backend
          type,
          styleEra,
          styleKeywords: STYLE_KEYWORDS[selectedGenre] || STYLE_KEYWORDS['Custom'],
          heroVisuals,
          friendVisuals,
          villainVisuals,
          selectedGenre,
          selectedLanguage,
          heroRef: heroRef.current,
          friendRef: friendRef.current,
          villainRef: villainRef.current,
          provider: imageProvider,
          finalImagePrompt // Pass the constructed prompt
        })
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server image failure: ${response.status}`);
      }
      const data = await response.json();
      return data.imageUrl || '';
    } catch (e: any) {
      handleAPIError(e);
      throw e;
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

    // Fallback for non-firebase users or if Firestore save fails
    fetch('/api/characters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        roleType: roleType as any,
        description: desc,
        imageUrl: base64,
        userId: activeCreator.id // Use activeCreator's ID for non-Firebase too
      })
    })
      .then(res => res.json())
      .then(data => {
        console.log("Character saved via API:", data);
        window.dispatchEvent(new Event('refresh-character-vault'));
      })
      .catch(err => console.error("Error saving character:", err));
  };

  // --- Setup Visibility Logic ---
  useEffect(() => {
    // Automatically hide setup if a project is loaded or if it's the first time
    if (activeProjectId || !localStorage.getItem('story_menu_skin')) {
      setShowSetup(false);
    }
  }, [activeProjectId]);

  // Handle closing the setup screen
  const handleCloseSetup = () => {
    setShowSetup(false);
    setIsTransitioning(true);
    // Ensure the book is visible after setup is closed
    setIsStarted(true);

    // If this is the very first time (no project loaded), generate initial pages
    if (!activeProjectId && comicFaces.length === 0) {
      // Generate first few pages immediately after setup
      const initialPageCount = Math.min(INITIAL_PAGES, TOTAL_PAGES);
      generateBatch(1, initialPageCount);
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
                         body: JSON.stringify({ projectId: projData.id, characterId: activeCreator.id, userEmail: currentUser?.email || (localStorage.getItem('ADMIN_LOGGED_IN') === 'true' ? 'abglco@protonmail.com' : undefined) }) // or link specific cast ids
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
  }

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

  const validateUpload = (file: File): boolean => {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif', 'image/jpg'];
      if (!validTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.heic') && !file.name.toLowerCase().endsWith('.heif')) {
          alert("Invalid file format. Please upload JPG, PNG, WEBP, HEIC or GIF.");
          return false;
      }
      if (file.size > 20 * 1024 * 1024) { // Increased to 20MB to allow raw camera HEIC pictures
          alert("File is too large. Please upload an image under 20MB.");
          return false;
      }
      return true;
  };

const handleHeroUpload = async (file: File) => {
       if (!validateUpload(file)) return;
       try { 
           const base64 = await fileToBase64(file); 
           const newHero = { base64, desc: "The Main Hero" };
           setHero(newHero); 
           localStorage.setItem('offline_hero', JSON.stringify(newHero));
           await syncCharacterToDb("Main Avatar", "Hero", "The Main Hero", base64);
       } catch (e) { alert("Hero upload failed"); }
  }

const handleFriendUpload = async (file: File) => {
       if (!validateUpload(file)) return;
       try { 
           const base64 = await fileToBase64(file); 
           const newFriend = { base64, desc: "The Sidekick/Rival" };
           setFriend(newFriend); 
           localStorage.setItem('offline_friend', JSON.stringify(newFriend));
           await syncCharacterToDb("Socius", "Co-Star", "The Sidekick/Rival", base64);
       } catch (e) { alert("Friend upload failed"); }
  }

const handleVillainUpload = async (file: File) => {
       if (!validateUpload(file)) return;
       try { 
           const base64 = await fileToBase64(file); 
           const newVillain = { base64, desc: "The Arch Nemesis Villain" };
           setVillain(newVillain); 
           localStorage.setItem('offline_villain', JSON.stringify(newVillain));
           await syncCharacterToDb("Rival Rival", "Villain", "The Arch Nemesis Villain", base64);
       } catch (e) { alert("Villain upload failed"); }
  }

  if (!hasSelectedMode) {
    return (
      <ModeSelectionScreen onSelect={(mode) => { 
        // Save the chosen mode globally so MainLayout switches the UI!
        localStorage.setItem('story_menu_skin', mode);
        window.dispatchEvent(new Event('storage'));
        setHasSelectedMode(true); 
      }} />
    );
  }

  return (
    <div className={`app-container relative w-full h-screen overflow-hidden transition-all duration-700 ${isLightMode ? 'bg-amber-50' : 'bg-orange-950'}`}>
      <div className={`main-content flex ${isLightMode ? 'text-amber-900' : 'text-orange-100'} transition-all duration-700`}>

        {/* Left Sidebar / Controls (conditionally rendered) */}
        {!showSetup && (
          <aside className={`w-72 flex-shrink-0 p-6 pt-4 border-r ${isLightMode ? 'bg-white border-amber-200' : 'bg-black/50 border-orange-500/30'} transition-all duration-700`}>
            {/* User Account Info */}
            <div className="flex items-center mb-6 justify-between">
              <div className="flex items-center gap-3">
                <span className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full">
                  <img className="aspect-square h-full w-full" alt="User Avatar" src={currentUser?.isOffline ? `https://api.dicebear.com/6.x/pixel-art/svg?seed=${currentUser?.id || 'avatar'}` : `https://api.dicebear.com/6.x/shapes/svg?seed=${currentUser?.id || 'avatar'}`} />
                </span>
                <div>
                  <p className={`font-bold ${isLightMode ? 'text-amber-800' : 'text-orange-300'}`}>{currentUser?.displayName || currentUser?.email || 'Guest'}</p>
                  <p className={`text-xs ${isLightMode ? 'text-amber-700/80' : 'text-orange-200/70'}`}>{currentUser?.tier || 'Free Tier'}</p>
                </div>
              </div>
              <button onClick={handleLogOut} className={`text-xs font-semibold px-3 py-1 rounded-full transition-all ${isLightMode ? 'bg-amber-100 hover:bg-amber-200 text-amber-600' : 'bg-orange-700 hover:bg-orange-600 text-orange-100'}`}>
                {isAuthLoading ? '...' : 'Sign Out'}
              </button>
            </div>

            {/* Token Balance */}
            <div className={`p-3 rounded-xl mb-6 flex items-center justify-between gap-3 ${isLightMode ? 'bg-amber-100 border border-amber-200' : 'bg-black/40 border border-orange-500/20'}`}>
              <div className="flex items-center gap-2">
                <img src="/icons/token-icon.svg" alt="Token Icon" className="w-5 h-5" />
                <span className="text-sm font-bold">Tokens</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-extrabold ${isLightMode ? 'text-amber-700' : 'text-orange-300'}`}>{currentUser?.tokenBalance ?? 0}</span>
                <button onClick={() => setIsCheckoutOpen(true)} className={`text-xs font-semibold px-3 py-1 rounded-full transition-all ${isLightMode ? 'bg-amber-500 hover:bg-amber-400 text-white' : 'bg-orange-500 hover:bg-orange-400 text-white'}`}>
                  + Add Tokens
                </button>
              </div>
            </div>


            {/* Genre Selection */}
            <div className="mb-6">
              <label className={`block text-xs font-semibold mb-1 ${isLightMode ? 'text-amber-700' : 'text-orange-300'}`}>Genre</label>
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className={`w-full rounded-xl p-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${isLightMode ? 'bg-white border border-amber-200 text-slate-800 placeholder-slate-400' : 'bg-black/40 border border-orange-500/20 text-gray-200 placeholder-gray-600'}`}
              >
                {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            {/* Tone Selection */}
            <div className="mb-6">
              <label className={`block text-xs font-semibold mb-1 ${isLightMode ? 'text-amber-700' : 'text-orange-300'}`}>Story Tone</label>
              <select
                value={storyTone}
                onChange={(e) => setStoryTone(e.target.value)}
                className={`w-full rounded-xl p-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${isLightMode ? 'bg-white border border-amber-200 text-slate-800 placeholder-slate-400' : 'bg-black/40 border border-orange-500/20 text-gray-200 placeholder-gray-600'}`}
              >
                {TONES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Language Selection */}
            <div className="mb-6">
              <label className={`block text-xs font-semibold mb-1 ${isLightMode ? 'text-amber-700' : 'text-orange-300'}`}>Language</label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className={`w-full rounded-xl p-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${isLightMode ? 'bg-white border border-amber-200 text-slate-800 placeholder-slate-400' : 'bg-black/40 border border-orange-500/20 text-gray-200 placeholder-gray-600'}`}
              >
                {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
              </select>
            </div>

            {/* Image Provider Selection */}
            <div className="mb-6">
              <label className={`block text-xs font-semibold mb-1 ${isLightMode ? 'text-amber-700' : 'text-orange-300'}`}>Image Provider</label>
              <select
                value={imageProvider}
                onChange={(e) => setImageProvider(e.target.value as typeof imageProvider)}
                className={`w-full rounded-xl p-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${isLightMode ? 'bg-white border border-amber-200 text-slate-800 placeholder-slate-400' : 'bg-black/40 border border-orange-500/20 text-gray-200 placeholder-gray-600'}`}
              >
                <option value="gemini">Gemini</option>
                <option value="leonardo">Leonardo AI</option>
                {/* Add other providers if supported */}
              </select>
            </div>

            {/* Sound Settings */}
            <div className="mb-6">
              <label className={`block text-xs font-semibold mb-1 ${isLightMode ? 'text-amber-700' : 'text-orange-300'}`}>Voice & Soundtrack</label>
              <div className="flex items-center gap-3">
                <select
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className={`flex-1 rounded-xl p-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50 ${isLightMode ? 'bg-white border border-amber-200 text-slate-800 placeholder-slate-400' : 'bg-black/40 border border-orange-500/20 text-gray-200 placeholder-gray-600'}`}
                >
                  <option value="Zephyr">Zephyr (Default)</option>
                  <option value="Nova">Nova</option>
                  <option value="Orion">Orion</option>
                  {/* Add more voices if available */}
                </select>
                <button onClick={() => setSoundtrackEnabled(!soundtrackEnabled)} className={`px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-1 ${soundtrackEnabled ? (isLightMode ? 'bg-orange-500 hover:bg-orange-400 text-white' : 'bg-orange-500 hover:bg-orange-400 text-white') : (isLightMode ? 'bg-white border border-amber-200 hover:bg-amber-100 text-amber-600' : 'bg-black/40 border border-orange-500/20 hover:bg-black/60 text-orange-300')}`}>
                  {soundtrackEnabled ? <Volume2 size={16} /> : <CloudLightning size={16} />}
                  Soundtrack
                </button>
              </div>
            </div>

            {/* Creative Directives */}
            <div className="mb-6">
              <label htmlFor="creative-directives" className={`block text-xs font-semibold mb-1 ${isLightMode ? 'text-amber-700' : 'text-orange-300'}`}>
                Creative Directives (Optional)
              </label>
              <textarea
                id="creative-directives"
                value={creativeDirectives}
                onChange={(e) => setCreativeDirectives(e.target.value)}
                placeholder="e.g., 'Focus on a melancholic mood', 'Add a sense of urgency'"
                className={`w-full rounded-xl p-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50 min-h-[100px] ${isLightMode ? 'bg-white border border-amber-200 text-slate-800 placeholder-slate-400' : 'bg-black/40 border border-orange-500/20 text-gray-200 placeholder-gray-600'}`}
              />
            </div>

            {/* Actions */}
            <div className="mt-8">
              <button onClick={() => generateBatch(1, 5)} className={`w-full py-3 rounded-xl font-bold transition-all shadow-lg shadow-orange-500/30 ${isLightMode ? 'bg-orange-500 hover:bg-orange-400 text-white' : 'bg-orange-600 hover:bg-orange-500 text-white'}`}>
                Generate Next 5 Pages <Zap size={16} />
              </button>
              <button onClick={() => downloadPDF()} className={`mt-3 w-full py-3 rounded-xl font-bold transition-all shadow-lg ${isLightMode ? 'bg-white border border-amber-200 hover:bg-amber-100 text-amber-600' : 'bg-black/40 border border-orange-500/20 hover:bg-black/60 text-orange-300'}`}>
                Download Book <Download size={16} />
              </button>
              <button onClick={() => handleReset()} className={`mt-3 w-full py-3 rounded-xl font-bold transition-all shadow-lg ${isLightMode ? 'bg-white border border-amber-200 hover:bg-amber-100 text-amber-600' : 'bg-black/40 border border-orange-500/20 hover:bg-black/60 text-orange-300'}`}>
                Reset Book <RotateCcw size={16} />
              </button>
            </div>

          </aside>
        )}

        {/* Main Content Area */}
        <main className={`flex-1 flex items-center justify-center relative overflow-hidden ${isLightMode ? 'bg-amber-50' : 'bg-black/90'} transition-all duration-700`}>
          {appMode === 'studio' ? (
            <>
              {showSetup && (
            <Setup 
                show={showSetup}
                isTransitioning={isTransitioning}
                hero={hero}
                friend={friend}
                villain={villain}
                selectedGenre={selectedGenre}
                selectedArtStyle={selectedStyle}
                onArtStyleChange={setSelectedStyle}
                selectedLanguage={selectedLanguage}
                customPremise={customPremise}
                richMode={richMode}
                selectedVoice={selectedVoice}
                soundtrackEnabled={soundtrackEnabled}
                isPremiumUser={currentUser?.tier === 'Pro Creator'}
                activeCreator={activeCreator}
                onCreatorChange={setActiveCreator}
                onLogOut={handleLogOut}
                onHeroUpload={handleHeroUpload}
                onFriendUpload={handleFriendUpload}
                onVillainUpload={handleVillainUpload}
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
          )}

          {!showSetup && isStarted && !isReadingPreview && (
            <StoryWorkspace
              projectTitle={projectTitle}
              projectType="Story Book"
              selectedGenre={selectedGenre}
              selectedStyle={selectedStyle}
              selectedLanguage={selectedLanguage}
              customPremise={customPremise}
              storyGoal="To entertain and educate"
              selectedVoice={selectedVoice}
              soundtrackEnabled={soundtrackEnabled}
              storyBlueprint={storyBlueprint}
              generalNotes=""
              onStoryBlueprintChange={setStoryBlueprint}
              onStoryGoalChange={() => {}}
              onGeneralNotesChange={() => {}}
              comicFaces={comicFaces as any}
              selectedPageIndex={currentSheetIndex}
              selectedPanelIndex={0}
              onSelectPage={setCurrentSheetIndex}
              onSelectPanel={() => {}}
              onGenerateBatch={generateBatch}
              onGenerateSinglePage={async (type, pageIndex, pageType) => {
                const face = comicFaces.find(f => f.pageIndex === pageIndex);
                if (face) {
                  updateFaceState(face.id, { isLoading: true });
                  await generateSinglePage(face.id, pageIndex, face.type);
                }
              }}
              onApprovePage={(pageIndex) => {
                setComicFaces(prev => prev.map(f => f.pageIndex === pageIndex ? { ...f, isApproved: !f.isApproved } : f));
              }}
              onDuplicatePanel={(pageIndex) => {
                const face = comicFaces.find(f => f.pageIndex === pageIndex);
                if (face) {
                  const newFace = {
                    ...face,
                    id: Math.random().toString(36).substr(2, 9),
                    pageIndex: comicFaces.length,
                    isApproved: false
                  };
                  setComicFaces(prev => [...prev, newFace]);
                }
              }}
              onUpdateText={(pageIndex, field, text) => {
                setComicFaces(prev => prev.map(f => f.pageIndex === pageIndex ? { ...f, [field]: text } : f));
              }}
              onUpdateTranslation={(pageIndex, field, text) => {
                setComicFaces(prev => prev.map(f => f.pageIndex === pageIndex ? { ...f, [field]: text } : f));
              }}
              onUpdateTranslationStatus={(pageIndex, status) => {
                setComicFaces(prev => prev.map(f => f.pageIndex === pageIndex ? { ...f, translationStatus: status } : f));
              }}
              onUpdateAudioScript={(pageIndex, text) => {
                setComicFaces(prev => prev.map(f => f.pageIndex === pageIndex ? { ...f, audioScript: text } : f));
              }}
              onUpdateAudioStatus={(pageIndex, status) => {
                setComicFaces(prev => prev.map(f => f.pageIndex === pageIndex ? { ...f, audioStatus: status } : f));
              }}
              recentActivity={[]}
              onPreviewReader={() => setIsReadingPreview(true)}
              onDownloadPDF={downloadPDF}
              onReset={handleReset}
              currentUser={currentUser as any}
              onLogOut={handleLogOut}
              onOpenCheckout={() => setIsCheckoutOpen(true)}
              totalPages={comicFaces.length}
            />
          )}

          {isReadingPreview && (
            <WorkspaceReader
              projectTitle={projectTitle}
              comicFaces={comicFaces as any}
              selectedLanguage={selectedLanguage}
              onClose={() => setIsReadingPreview(false)}
              onEditPage={(pageIndex) => {
                setIsReadingPreview(false);
                setCurrentSheetIndex(pageIndex);
              }}
              onExport={downloadPDF}
            />
          )}

          {!showSetup && !isStarted && (
            currentUser ? (
              <PersonalizedDashboard 
                currentUser={currentUser}
                onStartProject={() => setIsStarted(true)}
                onNavigateToGallery={() => setAppMode('gallery')}
                onNavigateToStory={(id) => { setSelectedGalleryStoryId(id); setGalleryView('story'); setAppMode('gallery'); }}
                onNavigateToCreator={(id) => { setSelectedGalleryCreatorId(id); setGalleryView('creator'); setAppMode('gallery'); }}
                onNavigateToAdmin={() => { setGalleryView('moderation-dashboard'); setAppMode('gallery'); }}
                creditsAvailable={currentUser.tokenBalance || 0}
                userPlan={currentUser.tier === 'Pro Creator' ? 'Pro Creator' : 'Free'}
                onNavigateToBilling={() => { setGalleryView('usage'); setAppMode('gallery'); }}
              />
            ) : (
              <div className="text-center">
                <h1 className={`text-5xl font-bold mb-4 ${isLightMode ? 'text-amber-800' : 'text-orange-300'}`}>Infinite Heroes</h1>
                <p className={`text-xl mb-8 ${isLightMode ? 'text-amber-700/80' : 'text-orange-200/70'}`}>Your AI-powered comic and story creation studio.</p>
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  <button onClick={() => setIsStarted(true)} className={`px-8 py-4 rounded-full font-bold text-lg shadow-lg transition-all ${isLightMode ? 'bg-orange-500 hover:bg-orange-400 text-white' : 'bg-orange-600 hover:bg-orange-500 text-white'}`}>
                    Start Creating <ArrowRight size={20} className="inline ml-2" />
                  </button>
                  <button onClick={() => setAppMode('gallery')} className={`px-8 py-4 rounded-full font-bold text-lg shadow-lg transition-all ${isLightMode ? 'bg-indigo-500 hover:bg-indigo-400 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}>
                    Explore Gallery
                  </button>
                </div>
                {/* Authentication/Checkout triggers */}
                {!currentUser && (
                  <button onClick={() => setShowAuthModal(true)} className={`ml-4 px-6 py-3 rounded-full font-bold text-lg shadow-lg transition-all ${isLightMode ? 'bg-white border border-amber-200 hover:bg-amber-100 text-amber-600' : 'bg-black/40 border border-orange-500/20 hover:bg-black/60 text-orange-300'}`}>
                    Sign In / Sign Up
                  </button>
                )}
                {!currentUser && (
                  <button onClick={() => setIsCheckoutOpen(true)} className={`ml-4 px-6 py-3 rounded-full font-bold text-lg shadow-lg transition-all ${isLightMode ? 'bg-white border border-amber-200 hover:bg-amber-100 text-amber-600' : 'bg-black/40 border border-orange-500/20 hover:bg-black/60 text-orange-300'}`}>
                    Add Tokens
                  </button>
                )}
              </div>
            )
          )}
            </>
          ) : (
            <div className="w-full h-full overflow-y-auto relative">
              {galleryView === 'home' && (
                <PublicGallery 
                  onNavigateToStory={(id) => { setSelectedGalleryStoryId(id); setGalleryView('story'); }}
                  onNavigateToCreator={(id) => { setSelectedGalleryCreatorId(id); setGalleryView('creator'); }}
                  onReturnToStudio={() => setAppMode('studio')}
                  onOpenLibrary={() => setGalleryView('library')}
                  savedStoryIds={savedStoryIds}
                  onToggleSave={handleToggleSave}
                />
              )}
              {galleryView === 'story' && selectedGalleryStoryId && (
                <PublicStoryDetail 
                  storyId={selectedGalleryStoryId}
                  onBack={() => setGalleryView('home')}
                  onNavigateToCreator={(id) => { setSelectedGalleryCreatorId(id); setGalleryView('creator'); }}
                  onReadStory={() => { 
                    setIsReadingPreview(true);
                    setAppMode('studio'); 
                  }}
                  isSaved={savedStoryIds.includes(selectedGalleryStoryId)}
                  onToggleSave={handleToggleSave}
                  isFollowing={followedCreators.includes(MOCK_STORIES.find(s => s.id === selectedGalleryStoryId)?.creatorId || '')}
                  onToggleFollow={handleToggleFollow}
                  onRemix={handleRemixAction}
                  onReportStory={(storyId) => setReportModalConfig({ targetId: storyId, targetType: 'story' })}
                />
              )}
              {galleryView === 'creator' && selectedGalleryCreatorId && (
                <PublicCreatorProfile 
                  creatorId={selectedGalleryCreatorId}
                  onBack={() => setGalleryView('home')}
                  onNavigateToStory={(id) => { setSelectedGalleryStoryId(id); setGalleryView('story'); }}
                  isFollowing={followedCreators.includes(selectedGalleryCreatorId)}
                  onToggleFollow={handleToggleFollow}
                  onReportCreator={(creatorId) => setReportModalConfig({ targetId: creatorId, targetType: 'creator' })}
                />
              )}
              {galleryView === 'library' && (
                <SavedLibrary 
                  onBack={() => setGalleryView('home')}
                  onNavigateToStory={(id) => { setSelectedGalleryStoryId(id); setGalleryView('story'); }}
                  onNavigateToCreator={(id) => { setSelectedGalleryCreatorId(id); setGalleryView('creator'); }}
                  savedStoryIds={savedStoryIds}
                  onRemoveSaved={handleToggleSave}
                />
              )}
              {galleryView === 'moderation-dashboard' && (
                <ModerationDashboard 
                  reports={reports}
                  onBack={() => setGalleryView('home')}
                  onReviewReport={(id) => {
                    setActiveReviewReportId(id);
                    setGalleryView('moderation-review');
                  }}
                />
              )}
              {galleryView === 'moderation-review' && activeReviewReportId && (
                <ModerationReview 
                  report={reports.find(r => r.id === activeReviewReportId)!}
                  onBack={() => setGalleryView('moderation-dashboard')}
                  onAction={(id, action) => {
                    setReports(prev => prev.map(r => r.id === id ? { ...r, status: 'resolved' } : r));
                    setGalleryView('moderation-dashboard');
                    setActiveReviewReportId(null);
                  }}
                />
              )}
              {galleryView === 'settings' && currentUser && (
                <AccountSettings 
                  currentUser={currentUser} 
                  onClose={() => setGalleryView('home')}
                  onLogout={handleLogOut}
                  onOpenAutomation={() => { setGalleryView('automation'); setAppMode('gallery'); }}
                />
              )}
              {galleryView === 'automation' && currentUser && (
                <AutomationHub
                  currentUser={currentUser}
                  onClose={() => setGalleryView('home')}
                />
              )}
              {galleryView === 'education-dashboard' && currentUser && (
                <EducationDashboard
                  currentUser={currentUser}
                  onClose={() => setGalleryView('home')}
                  onOpenAutomation={() => { setGalleryView('automation'); setAppMode('gallery'); }}
                />
              )}
              {galleryView === 'progress' && currentUser && (
                <ProgressDashboard
                  currentUser={currentUser}
                  onClose={() => setGalleryView('home')}
                />
              )}

              {/* Remix Modal Overlay */}
              {showRemixModal && remixTargetId && (
                <RemixModal 
                  story={MOCK_STORIES.find(s => s.id === remixTargetId)!}
                  onClose={() => setShowRemixModal(false)}
                  onConfirmRemix={handleConfirmRemix}
                />
              )}
            </div>
          )}
        </main>
      </div>

      <AccountPanel
        currentUser={currentUser}
        onUserChange={setCurrentUser}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenCheckout={() => setIsCheckoutOpen(true)}
        onOpenAdmin={() => { setGalleryView('moderation-dashboard'); setAppMode('gallery'); }}
        onOpenSettings={() => { setGalleryView('settings'); setAppMode('gallery'); }}
        onOpenAutomation={() => { setGalleryView('automation'); setAppMode('gallery'); }}
        onOpenEducation={() => { setGalleryView('education-dashboard'); setAppMode('gallery'); }}
        onOpenProgress={() => { setGalleryView('progress'); setAppMode('gallery'); }}
      />

      {/* Modals */}
      {showApiKeyDialog && <ApiKeyDialog onClose={() => setShowApiKeyDialog(false)} onContinue={handleApiKeyDialogContinue} isLightMode={isLightMode} />}
      
      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          selectedTier={checkoutTier}
          currentEmail={currentUser?.email || ''}
          userId={currentUser?.id || ''}
        />
      )}

      {/* Report Modal */}
      {reportModalConfig && (
        <ReportModal 
          targetId={reportModalConfig.targetId}
          targetType={reportModalConfig.targetType}
          onClose={() => setReportModalConfig(null)}
          onSubmit={handleReportSubmit}
        />
      )}
      
      {showAuthModal && <AuthScreen onClose={() => setShowAuthModal(false)} isLightMode={isLightMode} />}

      {/* Offline Sandbox Mode Trigger */}
      {!currentUser && (
        <button onClick={handleLaunchOfflineSandbox} className={`fixed bottom-4 right-4 px-4 py-2 rounded-full text-sm font-bold shadow-md transition-all ${isLightMode ? 'bg-orange-500 hover:bg-orange-400 text-white' : 'bg-orange-600 hover:bg-orange-500 text-white'}`}>
          Use Offline Mode
        </button>
      )}
    </div>
  );
};

export default App;
