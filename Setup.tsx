/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorkspaceContext } from './WorkspaceContext';
import { WorkspaceSidebar } from './WorkspaceSidebar';
import { WorkspaceLibrary } from './WorkspaceLibrary';
import { WorkspaceCasting } from './WorkspaceCasting';
import { WorkspaceDirector } from './WorkspaceDirector';
import React, { useState, useEffect } from 'react';
import { GENRES, LANGUAGES, Persona, VOICES, CharacterIdentitySchema, ChapterGoal, ART_STYLES, WARDROBE_PRESETS } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
    getCharactersFromFirestore, 
    getProjectsFromFirestore, 
    deleteCharacterFromFirestore, 
    deleteProjectFromFirestore, 
    saveProjectToFirestore,
    getDraftsFromFirestore,
    saveCharacterToFirestore,
    saveDraftToFirestore,
    deleteDraftFromFirestore
} from './storageFirestore';

interface SetupProps {
    show: boolean;
    isTransitioning: boolean;
    hero: Persona | null;
    friend: Persona | null;
    villain: Persona | null;
    selectedGenre: string;
    selectedArtStyle?: string;
    onArtStyleChange?: (styleId: string) => void;
    selectedLanguage: string;
    customPremise: string;
    richMode: boolean;
    selectedVoice: string;
    soundtrackEnabled: boolean;
    activeCreator: { id: string; email: string; tier?: string };
    onCreatorChange: (creator: { id: string; email: string; tier?: string }) => void;
    onHeroUpload: (file: File) => void;
    onFriendUpload: (file: File) => void;
    onVillainUpload: (file: File) => void;
    onGenreChange: (val: string) => void;
    onLanguageChange: (val: string) => void;
    onPremiseChange: (val: string) => void;
    onRichModeChange: (val: boolean) => void;
    onVoiceChange: (val: string) => void;
    onSoundtrackChange: (val: boolean) => void;
    onLaunch: () => void;
    onSelectHero: (p: Persona | null) => void;
    onSelectFriend: (p: Persona | null) => void;
    onSelectVillain: (p: Persona | null) => void;
    onLoadProject: (project: any) => void;
    creativeDirectives: string;
    onCreativeDirectivesChange: (val: string) => void;
    heroVisuals: string;
    onHeroVisualsChange: (val: string) => void;
    friendVisuals: string;
    onFriendVisualsChange: (val: string) => void;
    villainVisuals: string;
    onVillainVisualsChange: (val: string) => void;
    villainDna: string;
    onVillainDnaChange: (val: string) => void;
    nemesisDNA: CharacterIdentitySchema;
    onNemesisDnaChange: (val: CharacterIdentitySchema) => void;
    soundPrompt: string;
    onSoundPromptChange: (val: string) => void;
    onHeroHeadUpload?: (file: File) => void;
    onHeroClothesUpload?: (file: File) => void;
    onFriendHeadUpload?: (file: File) => void;
    onFriendClothesUpload?: (file: File) => void;
    onVillainHeadUpload?: (file: File) => void;
    onVillainClothesUpload?: (file: File) => void;
    onHeroHeadClear?: () => void;
    onHeroClothesClear?: () => void;
    onFriendHeadClear?: () => void;
    onFriendClothesClear?: () => void;
    onVillainHeadClear?: () => void;
    onVillainClothesClear?: () => void;
    storyTone?: string;
    storyBlueprint: ChapterGoal[];
    onStoryBlueprintChange: (val: ChapterGoal[]) => void;
    onLoadDraft?: (draft: any) => void;
    comicFaces?: any[];
    onLogOut?: () => void;
}


const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
             const base64String = reader.result?.toString().split(',')[1] || '';
             resolve(base64String);
        };
        reader.onerror = (error) => reject(error);
    });
};

export const Setup: React.FC<SetupProps> = (props) => {
    const { t } = useTranslation();

    const [dbConnection, setDbConnection] = useState<{ 
        status: string; 
        mode: string;
        hasUrlEnv?: boolean;
        dbUrlMasked?: string;
    }>({ status: 'Connecting', mode: '' });
    const [cloudRunConfig, setCloudRunConfig] = useState<any>({ isCloudRun: false, service: '', revision: '', configuration: '', project: '', port: '', region: '' });
    const [savedCharacters, setSavedCharacters] = useState<any[]>([]);
        const [dynamicCategories, setDynamicCategories] = useState<any[]>([]);
    const [adminSettings, setAdminSettings] = useState<any[]>([]);
    
    useEffect(() => {
                const loadCategories = async () => {
            try {
                const [catRes, setRes] = await Promise.all([
                    fetch('/api/categories'),
                    fetch('/api/admin/settings')
                ]);
                if (catRes.ok) {
                    const data = await catRes.json();
                    setDynamicCategories(data);
                }
                if (setRes.ok) {
                    const sData = await setRes.json();
                    setAdminSettings(sData);
                }
            } catch (e) {
                console.error("Failed to load backend configurations", e);
            }
        };
        loadCategories();
    }, []);

    const [creatorEmailInput, setCreatorEmailInput] = useState(props.activeCreator.email);
    const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

    // Tab control & Studio Projects Library state
    const [appSkin, setAppSkinState] = useState<'comic' | 'writers-journal' | 'kid-story'>(() => {
        try {
            const saved = localStorage.getItem('story_menu_skin');
            if (saved === 'comic') return 'comic';
            if (saved === 'kid-story') {
                localStorage.setItem('story_menu_skin', 'comic');
                return 'comic';
            }
            return 'comic';
        } catch {
            return 'comic';
        }
    });

    const setAppSkin = (skin: 'comic' | 'writers-journal' | 'kid-story') => {
        setAppSkinState(skin);
        try {
            localStorage.setItem('story_menu_skin', skin);
        } catch (e) {
            console.warn(e);
        }
    };

    const [isScanningHero, setIsScanningHero] = useState(false);
    const [isScanningFriend, setIsScanningFriend] = useState(false);
    const [isScanningVillain, setIsScanningVillain] = useState(false);
    
    const handleDropAsset = (e: React.DragEvent, target: 'hero' | 'friend' | 'villain') => {
        e.preventDefault();
        const dataStr = e.dataTransfer.getData('application/json');
        if (!dataStr) return;
        try {
            const char = JSON.parse(dataStr);
            if (target === 'hero') {
                setIsScanningHero(true);
                setTimeout(() => {
                    props.onSelectHero(char);
                    if (char.desc) props.onHeroVisualsChange(char.desc);
                    setIsScanningHero(false);
                }, 1500);
            } else if (target === 'friend') {
                setIsScanningFriend(true);
                setTimeout(() => {
                    props.onSelectFriend(char);
                    if (char.desc) props.onFriendVisualsChange(char.desc);
                    setIsScanningFriend(false);
                }, 1500);
            } else if (target === 'villain') {
                setIsScanningVillain(true);
                setTimeout(() => {
                    props.onSelectVillain(char);
                    if (char.desc) props.onVillainVisualsChange(char.desc);
                    setIsScanningVillain(false);
                }, 1500);
            }
        } catch (err) {
            console.error("Drop parse error", err);
        }
    };

    const [activeTab, setActiveTab] = useState<'generate' | 'persona' | 'library' | 'blueprint' | 'vault' | 'settings'>('generate');
    const [savedProjects, setSavedProjects] = useState<any[]>([]);

    const [geminiKey, setGeminiKey] = useState<string>(() => {
        return localStorage.getItem('story_menu_gemini_key') || '';
    });
    const [leonardoKey, setLeonardoKey] = useState<string>(() => {
        return localStorage.getItem('story_menu_leonardo_key') || '';
    });
    const [pineconeKey, setPineconeKey] = useState<string>(() => {
        return localStorage.getItem('story_menu_pinecone_key') || '';
    });
    
    // Vault Generator State
    const [vaultCharName, setVaultCharName] = useState('');
    const [vaultReferenceImage, setVaultReferenceImage] = useState<string | null>(null);
    const [vaultCharDesc, setVaultCharDesc] = useState('');
    const [vaultCharStyle, setVaultCharStyle] = useState('Comic Book');
    const [isVaultGenerating, setIsVaultGenerating] = useState(false);
    const [vaultStatusMsg, setVaultStatusMsg] = useState('');
    const [vaultGeneratedImage, setVaultGeneratedImage] = useState<string | null>(null);
    
    // Demographics
    const [vaultAge, setVaultAge] = useState('');
    const [vaultGender, setVaultGender] = useState('');
    const [vaultEthnicity, setVaultEthnicity] = useState('');

    
    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const base64Str = (event.target?.result as string).split(',')[1];
            if (base64Str) setVaultReferenceImage(base64Str);
        };
        reader.readAsDataURL(file);
    };


    const handleSurpriseMeVault = () => {
        const names = ["Zane Flux", "Nova Shift", "Kaelen Volt", "Lyra Trace"];
        const descs = ["A rogue AI hunter with neon tattoos.", "A cybernetic mechanic with a plasma wrench.", "A stealth operative with holographic camo."];
        const ages = ["Teenager", "Young Adult", "Middle-Aged"];
        const genders = ["Male", "Female", "Androgynous"];
        const ethnicities = ["Asian", "Black", "White", "Mixed Race"];
        setVaultCharName(names[Math.floor(Math.random() * names.length)]);
        setVaultCharDesc(descs[Math.floor(Math.random() * descs.length)]);
        setVaultAge(ages[Math.floor(Math.random() * ages.length)]);
        setVaultGender(genders[Math.floor(Math.random() * genders.length)]);
        setVaultEthnicity(ethnicities[Math.floor(Math.random() * ethnicities.length)]);
    };

    const handleVaultGenerate = async () => {
        if (!vaultCharName.trim() || !vaultCharDesc.trim()) {
             setVaultStatusMsg("Name and Description are required.");
             return;
        }
        setIsVaultGenerating(true);
        setVaultGeneratedImage(null);
        setVaultStatusMsg("Summoning artist portal... Handcrafting dynamic cartoon portrait.");
        try {
            const endpoint = vaultReferenceImage ? '/api/leonardo/persona' : '/api/gemini/persona';
            const payload: any = {
                desc: vaultCharDesc,
                selectedGenre: vaultCharStyle,
                userEmail: props.activeCreator.email,
                age: vaultAge,
                gender: vaultGender,
                ethnicity: vaultEthnicity
            };
            if (vaultReferenceImage) {
                payload.referenceImage = vaultReferenceImage;
            }
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-gemini-key': geminiKey },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.base64 || data.imageUrl) {
                setVaultStatusMsg("Avatar generated successfully! Previewing...");
                setVaultGeneratedImage(data.imageUrl ? data.imageUrl : (data.base64.startsWith('data:') ? data.base64 : `data:image/jpeg;base64,${data.base64}`));
            } else {
                setVaultStatusMsg("Art generation returned blank pixels. Please try again.");
            }
        } catch (e: any) {
            console.error("Vault generation failed:", e);
            setVaultStatusMsg("Ethereal art nexus connection lost: " + e.message);
        } finally {
            setIsVaultGenerating(false);
        }
    };

    const handleSaveToVault = async () => {
        if (!vaultGeneratedImage) return;
        
        setVaultStatusMsg("Saving to Vault...");
        const isFirebaseUser = props.activeCreator.id && props.activeCreator.id !== '00000000-0000-0000-0000-000000000000' && !props.activeCreator.id.includes('local-creator') && !props.activeCreator.id.includes('offline');
        
        const newChar = {
            id: 'char_' + Date.now(),
            name: vaultCharName,
            description: vaultCharDesc,
            imageUrl: vaultGeneratedImage,
            role: 'Vaulted',
            powers: 'Unknown'
        };

        if (isFirebaseUser) {
            await saveCharacterToFirestore(props.activeCreator.id, {
                ...newChar,
                userId: props.activeCreator.id,
                createdAt: Date.now()
            });
        } else {
            const list = [...savedCharacters, newChar];
            localStorage.setItem(`characters_${props.activeCreator.id}`, JSON.stringify(list));
        }
        
        // Refresh characters
        window.dispatchEvent(new Event('refresh-character-vault'));
        setVaultStatusMsg(`Character ${vaultCharName} saved to the Vault successfully!`);
        
        // Reset state
        setVaultCharName('');
        setVaultCharDesc('');
        setVaultReferenceImage(null);
        setVaultAge('');
        setVaultGender('');
        setVaultEthnicity('');
        setVaultGeneratedImage(null);
    };

    const handleGeminiKeyChange = (val: string) => {
        setGeminiKey(val);
        try {
            localStorage.setItem('GEMINI_API_KEY', val);
        } catch (e) {
            console.warn(e);
        }
    };

    const isEditorial = appSkin === 'writers-journal';
    const isKidStory = appSkin === 'kid-story';
    const isCyberpunk = !isEditorial && !isKidStory;

    // Skin computed values
    const sOuterContainer = isEditorial 
        ? "max-w-[1100px] w-full bg-[#fbfbfa] text-stone-900 border border-stone-200/80 shadow-2xl p-6 md:p-10 relative rounded-2xl font-sans"
        : isKidStory ? "max-w-[1100px] w-full bg-blue-100 text-black border-4 border-blue-400 p-6 rounded-3xl" : "mx-auto max-w-[1100px] w-full bg-slate-950 text-slate-50 border border-slate-800 shadow-xl p-6 md:p-8 relative overflow-hidden rounded-2xl font-sans";

    const sCard = isEditorial
        ? "bg-white border border-stone-200 shadow-sm p-6 rounded-xl relative flex flex-col justify-between"
        : isKidStory ? "bg-white border-2 border-blue-300 p-4 rounded-2xl" : "bg-slate-900 border border-slate-700/60 p-5 rounded-xl shadow-lg text-slate-100 relative";

    const sPanel = isEditorial
        ? "mb-6 relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 bg-stone-100 border border-stone-200 p-6 rounded-xl shadow-sm text-stone-800"
        : isKidStory ? "mb-6 relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 bg-white border-2 border-blue-200 p-6 rounded-2xl" : "mb-8 relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 bg-slate-950 border border-slate-800/60 p-8 rounded-2xl text-slate-200";

    const sHeaderBadge = isEditorial
        ? "absolute -top-3.5 left-6 bg-stone-800 text-stone-50 border border-stone-850 font-sans text-[11px] uppercase px-3 py-1 font-semibold rounded shadow-sm z-10 tracking-widest leading-relaxed"
        : isKidStory ? "absolute -top-4 left-6 bg-gray-900 text-yellow-400 text-black font-sans text-lg px-4 py-1 rounded-full border-2 border-orange-400 font-bold z-10" : "absolute -top-3 left-6 bg-slate-800 text-slate-200 font-sans text-[11px] uppercase px-3 py-1 border border-slate-700 shadow-sm font-bold z-10 tracking-widest rounded-md";

    const sHeaderBadgeRed = isEditorial
        ? "absolute -top-3.5 left-6 bg-amber-700 text-stone-50 border border-amber-805 font-sans text-[11px] uppercase px-3 py-1 font-semibold rounded shadow-sm z-10 tracking-widest leading-relaxed"
        : isKidStory ? "absolute -top-4 left-6 bg-gray-900 text-red-400 text-white font-sans text-lg px-4 py-1 rounded-full border-2 border-red-600 font-bold z-10" : "absolute -top-3 left-6 bg-gray-900 text-pink-500 font-mono text-xs uppercase px-3 py-1 border border-pink-500/50 shadow-[0_0_10px_rgba(236,72,153,0.2)] font-bold z-10 tracking-widest rounded-sm";

    const sHeaderBadgeGreen = isEditorial
        ? "absolute -top-3.5 left-6 bg-emerald-700 text-stone-50 border border-emerald-850 font-sans text-[11px] uppercase px-3 py-1 font-semibold rounded shadow-sm z-10 tracking-widest leading-relaxed"
        : isKidStory ? "absolute -top-4 left-6 bg-gray-900 text-green-400 text-white font-sans text-lg px-4 py-1 rounded-full border-2 border-green-600 font-bold z-10" : "absolute -top-3 left-6 bg-gray-900 text-emerald-400 font-mono text-xs uppercase px-3 py-1 border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)] font-bold z-10 tracking-widest rounded-sm";

    const sTitle = isEditorial
        ? "font-serif text-3xl font-extrabold tracking-tight text-stone-900 mb-2"
        : isKidStory ? "font-sans text-2xl font-bold text-blue-600 mb-1" : "font-mono text-lg font-bold uppercase text-cyan-300 tracking-widest mb-1 text-glow-cyan";

    const sSubtitle = isEditorial
        ? "text-stone-500 font-sans text-xs leading-relaxed"
        : isKidStory ? "text-gray-600 text-sm" : "text-cyan-600 text-xs leading-relaxed font-mono";

    const sInput = isEditorial
        ? "w-full bg-white border border-stone-200 text-stone-900 text-xs p-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-600 shadow-sm transition-all focus:border-stone-400 font-sans"
        : isKidStory ? "w-full bg-white border-2 border-blue-200 text-black text-sm p-3 rounded-xl focus:border-blue-400" : "w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm p-3 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans";

    const sSelect = isEditorial
        ? "w-full bg-white border border-stone-200 text-stone-900 text-xs p-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-600 shadow-sm transition-all focus:border-stone-400 font-sans font-semibold"
        : isKidStory ? "w-full bg-white border-2 border-blue-200 text-black text-sm p-3 rounded-xl focus:border-blue-400" : "w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm p-3 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans";

    const sLabel = isEditorial
        ? "font-sans text-[11px] uppercase text-stone-500 font-bold tracking-wider block mb-1.5"
        : isKidStory ? "font-sans text-sm text-blue-500 font-bold mb-1" : "font-mono text-[10px] uppercase text-cyan-500 tracking-widest block mb-1 opacity-80";

    const sPrimaryBtn = isEditorial
        ? "bg-stone-900 hover:bg-stone-805 text-stone-50 font-sans uppercase tracking-widest text-[11px] font-bold px-4 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer"
        : isKidStory ? "bg-blue-500 hover:bg-blue-400 text-white font-bold px-5 py-3 rounded-full" : "flex items-center gap-1.5 disabled:opacity-50 bg-indigo-600 hover:bg-indigo-500 text-white font-sans uppercase tracking-widest text-xs font-bold px-5 py-2.5 rounded-lg shadow-md transition-all cursor-pointer active:scale-95 border border-indigo-500/50";

    const sRedBtn = isEditorial
        ? "bg-red-700 hover:bg-red-800 text-white font-sans uppercase tracking-widest text-[11px] font-bold px-4 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer border border-red-800"
        : isKidStory ? "bg-gray-900 text-red-400 hover:bg-gray-900 text-red-400 text-white font-bold px-5 py-3 rounded-full" : "flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-pink-500 font-mono uppercase tracking-widest text-[11px] font-bold px-4 py-2.5 rounded border border-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.3)] transition-all cursor-pointer";
    
    // Draft state hooks
    const [savedDrafts, setSavedDrafts] = useState<any[]>([]);
    const [isSavingDraft, setIsSavingDraft] = useState(false);

    const fetchDrafts = async () => {
        const isFirebaseUser = props.activeCreator.id && props.activeCreator.id !== '00000000-0000-0000-0000-000000000000' && !props.activeCreator.id.includes('local-creator') && !props.activeCreator.id.includes('offline');
        if (isFirebaseUser) {
            try {
                const list = await getDraftsFromFirestore(props.activeCreator.id);
                setSavedDrafts(list || []);
                return;
            } catch (fsErr) {
                console.warn("[Setup] Firestore drafts fetch error, falling back to localStorage:", fsErr);
            }
        }
        // Fallback to offline drafts in localStorage
        try {
            const stored = localStorage.getItem(`drafts_${props.activeCreator.id}`);
            if (stored) {
                setSavedDrafts(JSON.parse(stored));
            } else {
                setSavedDrafts([]);
            }
        } catch (e) {
            console.error("Failed to load local drafts:", e);
            setSavedDrafts([]);
        }
    };

    const handleSaveDraft = async () => {
        if (!props.activeCreator.id) {
            alert("Please sign in or configure a creator profile to save drafts!");
            return;
        }
        
        setIsSavingDraft(true);
        const draftTitle = prompt("Enter a title for your comic project draft:", `Draft: ${props.selectedGenre} (${new Date().toLocaleDateString()})`);
        if (draftTitle === null) {
            setIsSavingDraft(false);
            return;
        }
        
        const titleText = draftTitle.trim() || `Draft: ${props.selectedGenre} (${new Date().toLocaleDateString()})`;
        
        const isFirebaseUser = props.activeCreator.id && props.activeCreator.id !== '00000000-0000-0000-0000-000000000000' && !props.activeCreator.id.includes('local-creator') && !props.activeCreator.id.includes('offline');
        
        const comicFacesStr = JSON.stringify(props.comicFaces || []);
        const storyBlueprintStr = JSON.stringify(props.storyBlueprint || []);
        const draftId = `draft_${Math.random().toString(36).substring(2, 11)}`;

        if (isFirebaseUser) {
            try {
                await saveDraftToFirestore(props.activeCreator.id, {
                    id: draftId,
                    userId: props.activeCreator.id,
                    title: titleText,
                    genre: props.selectedGenre,
                            artStyle: props.selectedArtStyle,
                    comicFaces: comicFacesStr,
                    storyBlueprint: storyBlueprintStr
                });
                alert("💾 Draft snapshot successfully saved to Firebase Firestore!");
                fetchDrafts();
            } catch (err) {
                console.error("Failed to save draft to Firestore:", err);
                alert("Failed to save draft to Firestore cloud storage. Falling back to offline local storage.");
                saveDraftLocally(titleText, comicFacesStr, storyBlueprintStr);
            } finally {
                setIsSavingDraft(false);
            }
        } else {
            saveDraftLocally(titleText, comicFacesStr, storyBlueprintStr);
            setIsSavingDraft(false);
        }
    };

    const saveDraftLocally = (titleText: string, comicFacesStr: string, storyBlueprintStr: string) => {
        try {
            const draftId = `draft_local_${Math.random().toString(36).substring(2, 11)}`;
            const localDraft = {
                id: draftId,
                userId: props.activeCreator.id,
                title: titleText,
                genre: props.selectedGenre,
                            artStyle: props.selectedArtStyle,
                comicFaces: comicFacesStr,
                storyBlueprint: storyBlueprintStr,
                updatedAt: new Date().toISOString(),
                createdAt: new Date().toISOString()
            };
            const stored = localStorage.getItem(`drafts_${props.activeCreator.id}`);
            const list = stored ? JSON.parse(stored) : [];
            list.unshift(localDraft);
            localStorage.setItem(`drafts_${props.activeCreator.id}`, JSON.stringify(list));
            alert("💾 Draft snapshots saved locally (Offline mode)!");
            fetchDrafts();
        } catch (e) {
            console.error("Local draft save error:", e);
        }
    };

    const handleDeleteDraft = async (draftId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to shred this draft snapshot? This cannot be undone.")) return;
        
        const isFirebaseUser = props.activeCreator.id && props.activeCreator.id !== '00000000-0000-0000-0000-000000000000' && !props.activeCreator.id.includes('local-creator') && !props.activeCreator.id.includes('offline');
        
        if (isFirebaseUser && !draftId.includes('draft_local')) {
            try {
                await deleteDraftFromFirestore(props.activeCreator.id, draftId);
                fetchDrafts();
                return;
            } catch (fsErr) {
                console.warn("[Setup] Firestore draft deletion failed, trying local fallback:", fsErr);
            }
        }
        
        try {
            const stored = localStorage.getItem(`drafts_${props.activeCreator.id}`);
            if (stored) {
                let list = JSON.parse(stored);
                list = list.filter((d: any) => d.id !== draftId);
                localStorage.setItem(`drafts_${props.activeCreator.id}`, JSON.stringify(list));
                fetchDrafts();
            }
        } catch (e) {
            console.error("Failed to delete local draft:", e);
        }
    };

    // Story Blueprint Manager State & Handlers
    const [generatingBlueprint, setGeneratingBlueprint] = useState(false);
    const [generatingPageGoal, setGeneratingPageGoal] = useState<number | null>(null);

    const handleGenerateStoryBlueprint = async () => {
        setGeneratingBlueprint(true);
        try {
            const response = await fetch('/api/gemini/suggest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-gemini-key': geminiKey },
                body: JSON.stringify({
                    fieldName: 'storyBlueprint',
                    genre: props.selectedGenre,
                            artStyle: props.selectedArtStyle,
                    customPremise: props.customPremise,
                    storyTone: props.storyTone || 'Exciting & Action-packed',
                    userEmail: props.activeCreator.email
                })
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || 'Blueprint generate failed');
            }
            const data = await response.json();
            if (data.blueprint && Array.isArray(data.blueprint)) {
                props.onStoryBlueprintChange(data.blueprint);
            } else {
                alert("Failed to extract valid chapter blueprint formats. Please retry!");
            }
        } catch (e: any) {
            console.error("Story Blueprint Generate Error:", e);
            alert(`Saga error generating story blueprint: ${e.message}`);
        } finally {
            setGeneratingBlueprint(false);
        }
    };

    const handleGeneratePageGoal = async (pageNum: number) => {
        setGeneratingPageGoal(pageNum);
        try {
            const currentGoalObj = props.storyBlueprint ? props.storyBlueprint.find((b: any) => b.chapterNum === pageNum) : null;
            const response = await fetch('/api/gemini/suggest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-gemini-key': geminiKey },
                body: JSON.stringify({
                    fieldName: `Chapter ${pageNum} Goal`,
                    genre: props.selectedGenre,
                            artStyle: props.selectedArtStyle,
                    customPremise: props.customPremise,
                    currentValue: currentGoalObj ? `${currentGoalObj.title || ''} - ${currentGoalObj.goal || ''}` : '',
                    userEmail: props.activeCreator.email
                })
            });
            if (!response.ok) throw new Error('Failed to brainstorm chapter beat');
            const data = await response.json();
            const suggestion = data.suggestion || '';
            
            let finalTitle = `Chapter Beat ${pageNum}`;
            let finalGoal = suggestion;
            if (suggestion.includes(':')) {
                const idx = suggestion.indexOf(':');
                finalTitle = suggestion.substring(0, idx).trim();
                finalGoal = suggestion.substring(idx + 1).trim();
            } else if (suggestion.includes(' - ')) {
                const idx = suggestion.indexOf(' - ');
                finalTitle = suggestion.substring(0, idx).trim();
                finalGoal = suggestion.substring(idx + 3).trim();
            }
            
            if (finalTitle.length > 50) finalTitle = finalTitle.substring(0, 47) + "...";

            let updated = props.storyBlueprint ? [...props.storyBlueprint] : [];
            if (updated.length === 0) {
                updated = Array.from({ length: 10 }, (_, i) => ({
                    chapterNum: i + 1,
                    title: `Beat ${i + 1}`,
                    goal: `Continue the adventure in ${props.selectedGenre} style.`
                }));
            }
            const targetIndex = updated.findIndex((b: any) => b.chapterNum === pageNum);
            if (targetIndex !== -1) {
                updated[targetIndex] = {
                    chapterNum: pageNum,
                    title: finalTitle,
                    goal: finalGoal
                };
            } else {
                updated.push({
                    chapterNum: pageNum,
                    title: finalTitle,
                    goal: finalGoal
                });
            }
            props.onStoryBlueprintChange(updated);
        } catch (e: any) {
            console.error("Chapter Goal Generate Error:", e);
            alert(`Error brainstorming chapter: ${e.message}`);
        } finally {
            setGeneratingPageGoal(null);
        }
    };

    const handleInitializeDefaultBlueprint = () => {
        const defaults = [
            { chapterNum: 1, title: "Inciting Incident", goal: "Introduce protagonist & primary catalyst. Disrupt the norm in style." },
            { chapterNum: 2, title: "Initial Pursuit", goal: "Establish co-star companion. Heroes embark on first milestone target." },
            { chapterNum: 3, title: "The Crossroads", goal: "Force a high-stakes choice. Showcase primary villain's initial trap." },
            { chapterNum: 4, title: "Trial of Faith", goal: "A major complication occurs. Protagonists face a significant emotional barrier." },
            { chapterNum: 5, title: "Unlikely Revelation", goal: "A hidden secret deepens. Uncover clues regarding the key lore or power source." },
            { chapterNum: 6, title: "The Counter-Offensive", goal: "Heroes execute a dangerous heist or offensive strike directly against the odds." },
            { chapterNum: 7, title: "Darkest Hour", goal: "A shocking reversal. Villain gains the absolute upper-hand, testing user loyalty." },
            { chapterNum: 8, title: "Awakened resolve", goal: "protagonist learns or retrieves key wisdom or specialized energy to rebuild." },
            { chapterNum: 9, title: "Final Confrontation", goal: "The grand climax. Collide face-to-face with the Nemesis in spectacular stakes." },
            { chapterNum: 10, title: "Karmic Destiny", goal: "Resolve core conflict based on user's choice philosophy. Lock in the epic cliffhanger." }
        ];
        props.onStoryBlueprintChange(defaults);
    };

    // AI Persona Studio States
    const [personaStudioRole, setPersonaStudioRole] = useState<'Hero' | 'Co-Star' | 'Villain'>('Hero');
    const [personaStudioName, setPersonaStudioName] = useState('');
    const [personaStudioConcept, setPersonaStudioConcept] = useState('');
    const [personaStudioStyle, setPersonaStudioStyle] = useState(props.selectedGenre || 'Superhero Action');
    const [selectedArtStyle, setSelectedArtStyle] = useState(() => {
        return props.selectedArtStyle || localStorage.getItem('story_menu_preferred_style') || 'vibrant-comic';
    });

    const [personaStudioSuggestedName, setPersonaStudioSuggestedName] = useState('');
    const [personaStudioSuggestedBio, setPersonaStudioSuggestedBio] = useState('');
    const [personaStudioSuggestedVisuals, setPersonaStudioSuggestedVisuals] = useState('');
    const [personaStudioSuggestedPowers, setPersonaStudioSuggestedPowers] = useState('');
    const [personaStudioSuggestedNemesisDna, setPersonaStudioSuggestedNemesisDna] = useState<CharacterIdentitySchema | null>(null);

    const [personaStudioSuggesting, setPersonaStudioSuggesting] = useState(false);
    const [personaStudioPortrait, setPersonaStudioPortrait] = useState<string | null>(null);
    const [personaStudioGeneratingImg, setPersonaStudioGeneratingImg] = useState(false);
    const [personaStudioStatusMsg, setPersonaStudioStatusMsg] = useState('');

    // AI Suggestions Field state
    const [suggestingFields, setSuggestingFields] = useState<Record<string, boolean>>({});

    // Sync Art Style Lock when Genre changes
    useEffect(() => {
        if (props.selectedGenre && props.villain) {
            const dynamicCat = dynamicCategories.find(c => c.category_type === 'Genre' && c.name === props.selectedGenre);
            const newArtStyle = dynamicCat?.prompt_instruction || "clean illustration, modern aesthetic, highly detailed, professional art";
            if (props.nemesisDNA?.rendering_directives?.art_style_lock !== newArtStyle) {
                const updated = {
                    ...props.nemesisDNA,
                    rendering_directives: {
                        ...props.nemesisDNA?.rendering_directives,
                        continuity_weight: props.nemesisDNA?.rendering_directives?.continuity_weight || 'MEDIUM',
                        art_style_lock: newArtStyle
                    }
                } as CharacterIdentitySchema;
                props.onNemesisDnaChange(updated);
                props.onVillainDnaChange(JSON.stringify(updated));
            }
        }
    }, [props.selectedGenre, props.villain]);

    // Predefined Wardrobe Presets matching specific rendering aesthetics and character role profiles
    

    // Wardrobe Drawer state tracker
    const [cohesionSliderValue, setCohesionSliderValue] = useState(50);
    const [terminalLogs, setTerminalLogs] = useState<string[]>(['> SYSTEM BOOT...', '> INITIALIZING MULTIVERSE MATRIX...']);
    
    useEffect(() => {
        setTerminalLogs(prev => [...prev.slice(-4), `> GENRE LOCKED: ${props.selectedGenre}`]);
    }, [props.selectedGenre]);
    
    useEffect(() => {
        setTerminalLogs(prev => [...prev.slice(-4), `> LANGUAGE LOCKED: ${props.selectedLanguage}`]);
    }, [props.selectedLanguage]);
    
    useEffect(() => {
        setTerminalLogs(prev => [...prev.slice(-4), `> NARRATOR PERSONA: ${props.selectedVoice}`]);
    }, [props.selectedVoice]);

    const [isWardrobeOpen, setIsWardrobeOpen] = useState(false);
    const [wardrobeTargetRole, setWardrobeTargetRole] = useState<'Hero' | 'Co-Star' | 'Villain'>('Hero');
    const [activePresets, setActivePresets] = useState<Record<'Hero' | 'Co-Star' | 'Villain', 'Tactical' | 'Gala' | 'Casual' | 'Custom'>>({
        Hero: 'Custom',
        'Co-Star': 'Custom',
        Villain: 'Custom'
    });
    const [wardrobeAlert, setWardrobeAlert] = useState<string | null>(null);

    const handleApplyWardrobePreset = (role: 'Hero' | 'Co-Star' | 'Villain', presetKey: 'Tactical' | 'Gala' | 'Casual') => {
        const pData = WARDROBE_PRESETS[role][presetKey];
        
        // Update active preset tracking
        setActivePresets(prev => ({
            ...prev,
            [role]: presetKey
        }));

        // Set high-visibility alert banner inside drawer
        setWardrobeAlert(`Wardrobe Dynamic Shift: ${role} casted in '${pData.name}'!`);
        setTimeout(() => setWardrobeAlert(null), 3000);

        // Instantly synchronises studio inputs if target matches focus
        if (personaStudioRole === role) {
            setPersonaStudioSuggestedVisuals(pData.desc);
            setPersonaStudioStyle(pData.styleLock);
        }

        // Parent state bindings updated instantly
        if (role === 'Hero') {
            props.onHeroVisualsChange(pData.desc);
            if (props.hero) {
                props.onSelectHero({
                    ...props.hero,
                    desc: pData.desc
                });
            }
        } else if (role === 'Co-Star') {
            props.onFriendVisualsChange(pData.desc);
            if (props.friend) {
                props.onSelectFriend({
                    ...props.friend,
                    desc: pData.desc
                });
            }
        } else if (role === 'Villain') {
            props.onVillainVisualsChange(pData.desc);
            if (props.villain) {
                props.onSelectVillain({
                    ...props.villain,
                    desc: pData.desc
                });
            }
            
            const currentDna = props.nemesisDNA || {
                actor_id: "villain_spy_01",
                archetype_role: "Nemesis",
                persistence_layer: {
                    biometric_backbone: "Striking look, calculated gaze.",
                    structural_constants: "Defined facial structures, sharp details.",
                    chromatic_anchor: "Deep shadows, ambient glow."
                },
                adaptive_layer: {
                    sartorial_style: "Standard uniform",
                    active_wardrobe: "Standard look"
                },
                rendering_directives: {
                    art_style_lock: "Photorealistic Neon Noir Comic Book Style",
                    continuity_weight: "HIGH"
                }
            };
            
            const updatedDna: CharacterIdentitySchema = {
                ...currentDna,
                adaptive_layer: {
                    sartorial_style: pData.sartorialStyle,
                    active_wardrobe: pData.desc
                },
                rendering_directives: {
                    ...currentDna.rendering_directives,
                    art_style_lock: pData.styleLock
                }
            };

            setPersonaStudioSuggestedNemesisDna(updatedDna);
            props.onNemesisDnaChange(updatedDna);
            props.onVillainDnaChange(JSON.stringify(updatedDna));
        }
    };

    const handlePersonaStudioSelectRole = (role: 'Hero' | 'Co-Star' | 'Villain') => {
        setPersonaStudioRole(role);
        setPersonaStudioSuggestedName('');
        setPersonaStudioSuggestedBio('');
        setPersonaStudioSuggestedVisuals('');
        setPersonaStudioSuggestedPowers('');
        setPersonaStudioSuggestedNemesisDna(null);
        setPersonaStudioPortrait(null);
        setPersonaStudioStatusMsg('');
    };

    const handlePersonaStudioBrainstorm = async () => {
        setPersonaStudioSuggesting(true);
        setPersonaStudioStatusMsg('Querying neural creative arrays...');
        try {
            const res = await fetch('/api/gemini/suggest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-gemini-key': geminiKey },
                body: JSON.stringify({
                    fieldName: 'personaBrainstorm',
                    genre: personaStudioStyle,
                    artStyle: selectedArtStyle,
                    roleType: personaStudioRole,
                    characterName: personaStudioName,
                    concept: personaStudioConcept,
                    userEmail: props.activeCreator.email
                })
            });
            const data = await res.json();
            if (data.name) {
                setPersonaStudioSuggestedName(data.name);
                setPersonaStudioSuggestedBio(data.description || '');
                setPersonaStudioSuggestedVisuals(data.visuals || '');
                setPersonaStudioSuggestedPowers(data.powers || '');

                if (personaStudioRole === 'Villain') {
                    if (data.identitySchema) {
                        setPersonaStudioSuggestedNemesisDna({
                            actor_id: 'villain_spy_01',
                            archetype_role: 'Nemesis',
                            persistence_layer: {
                                biometric_backbone: data.identitySchema.persistence_layer?.biometric_backbone || data.visuals || 'Deep contrast features.',
                                structural_constants: data.identitySchema.persistence_layer?.structural_constants || 'Constant dark contours and defining details.',
                                chromatic_anchor: data.identitySchema.persistence_layer?.chromatic_anchor || 'Deep moody lighting, cold rim light highlights.'
                            },
                            adaptive_layer: {
                                sartorial_style: data.identitySchema.adaptive_layer?.sartorial_style || 'High-fashion elite dark uniform.',
                                active_wardrobe: data.identitySchema.adaptive_layer?.active_wardrobe || 'Tailored utility suit and heavy trenchcoat cloak.'
                            },
                            rendering_directives: {
                                art_style_lock: data.identitySchema.rendering_directives?.art_style_lock || 'Neon Noir Comic Art, cinematic chiaroscuro.',
                                continuity_weight: data.identitySchema.rendering_directives?.continuity_weight || 'HIGH'
                            }
                        });
                    } else {
                        // Fallback
                        setPersonaStudioSuggestedNemesisDna({
                            actor_id: 'villain_spy_01',
                            archetype_role: 'Nemesis',
                            persistence_layer: {
                                biometric_backbone: data.visuals || 'Striking looks with heavy contrast locks.',
                                structural_constants: 'Defined cheekbones and constant dark highlights.',
                                chromatic_anchor: 'Matte tones, heavy shadows, cinema ambient glow.'
                            },
                            adaptive_layer: {
                                sartorial_style: 'Modern high-fashion dark utility combat threads.',
                                active_wardrobe: 'Tailored dark armor and matching lightweight tactical cloak.'
                            },
                            rendering_directives: {
                                art_style_lock: 'Photorealistic Neon Noir Comic Book Style, sharp cinematic chiaroscuro',
                                continuity_weight: 'HIGH'
                            }
                        });
                    }
                }

                setPersonaStudioStatusMsg('Character profile successfully designed! Ready for art synthesis.');
            } else {
                setPersonaStudioStatusMsg('Parsing error: received incomplete response. Please retry.');
            }
        } catch (e: any) {
            console.error("Persona brainstorm failed:", e);
            setPersonaStudioStatusMsg('Error brainstorming persona profile: ' + e.message);
        } finally {
            setPersonaStudioSuggesting(false);
        }
    };

    const handlePersonaStudioGeneratePortrait = async () => {
        setPersonaStudioGeneratingImg(true);
        setPersonaStudioStatusMsg('Summoning artist portal... Handcrafting dynamic cartoon portrait.');

        const promptDesc = personaStudioSuggestedVisuals || `${personaStudioName || 'Secret agent'} wearing ${personaStudioConcept || 'futuristic clothes'}`;

        try {
            const res = await fetch('/api/gemini/persona', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-gemini-key': geminiKey },
                body: JSON.stringify({
                    desc: promptDesc,
                    selectedGenre: personaStudioStyle,
                    userEmail: props.activeCreator.email
                })
            });
            const data = await res.json();
            if (data.base64) {
                setPersonaStudioPortrait(data.base64);
                setPersonaStudioStatusMsg('Avatar summoned successfully! Connect this character below.');
            } else {
                setPersonaStudioStatusMsg('Art generation returned blank pixels. Please try again.');
            }
        } catch (e: any) {
            console.error("Portrait generation failed:", e);
            setPersonaStudioStatusMsg('Ethereal art nexus connection lost: ' + e.message);
        } finally {
            setPersonaStudioGeneratingImg(false);
        }
    };

    const handlePersonaStudioCastCharacter = async () => {
        if (!personaStudioPortrait) {
            alert("Synthesize a portrait before casting this character!");
            return;
        }

        const charName = personaStudioSuggestedName || personaStudioName || `${personaStudioRole} Alpha`;
        const charBio = personaStudioSuggestedBio || personaStudioConcept || `A dynamic ${personaStudioRole}`;
        const charVisuals = personaStudioSuggestedVisuals || 'Standard visual suit details.';
        const charPowers = personaStudioSuggestedPowers || 'No visible superpowers';

        setPersonaStudioStatusMsg('Connecting character to timeline & saving to Character Vault...');

        const p: Persona = {
            base64: personaStudioPortrait,
            desc: charBio
        };

        if (personaStudioRole === 'Hero') {
            props.onSelectHero(p);
            props.onHeroVisualsChange(charVisuals);
        } else if (personaStudioRole === 'Co-Star') {
            props.onSelectFriend(p);
            props.onFriendVisualsChange(charVisuals);
        } else {
            props.onSelectVillain(p);
            props.onVillainVisualsChange(charVisuals);
            props.onVillainDnaChange(charPowers);
            if (personaStudioSuggestedNemesisDna) {
                props.onNemesisDnaChange(personaStudioSuggestedNemesisDna);
                props.onVillainDnaChange(JSON.stringify(personaStudioSuggestedNemesisDna));
            }
        }

        const isFirebaseUser = props.activeCreator.id && props.activeCreator.id !== '00000000-0000-0000-0000-000000000000' && !props.activeCreator.id.includes('local-creator') && !props.activeCreator.id.includes('offline');
        if (isFirebaseUser) {
            try {
                await saveCharacterToFirestore(props.activeCreator.id, {
                    userId: props.activeCreator.id,
                    name: charName,
                    roleType: personaStudioRole as any,
                    description: charBio,
                    imageUrl: personaStudioPortrait
                });
            } catch (fsErr) {
                console.warn("[Setup] Firestore sync fallback inside studio:", fsErr);
            }
        } else {
            try {
                await fetch('/api/characters', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: props.activeCreator.id,
                        name: charName,
                        roleType: personaStudioRole,
                        description: charBio,
                        imageUrl: personaStudioPortrait
                    })
                });
            } catch (e) {
                console.error("Database vault sync failed within studio:", e);
            }
        }

        window.dispatchEvent(new Event('refresh-character-vault'));
        fetchVault();

        alert(`🎉 Success! ${charName} has been cast into the active roster as ${personaStudioRole}!`);
        setActiveTab('generate');
    };

    const handleSuggestField = async (fieldName: string, currentValue: string) => {
        setSuggestingFields(prev => ({ ...prev, [fieldName]: true }));
        try {
            const res = await fetch('/api/gemini/suggest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-gemini-key': geminiKey },
                body: JSON.stringify({
                    fieldName,
                    currentValue,
                    genre: props.selectedGenre,
                            artStyle: props.selectedArtStyle,
                    userEmail: props.activeCreator.email
                })
            });
            const data = await res.json();
            if (data.suggestion) {
                if (fieldName === 'heroVisuals') props.onHeroVisualsChange(data.suggestion);
                else if (fieldName === 'friendVisuals') props.onFriendVisualsChange(data.suggestion);
                else if (fieldName === 'villainVisuals') props.onVillainVisualsChange(data.suggestion);
                else if (fieldName === 'villainDna') props.onVillainDnaChange(data.suggestion);
                else if (fieldName === 'customPremise') props.onPremiseChange(data.suggestion);
                else if (fieldName === 'creativeDirectives') props.onCreativeDirectivesChange(data.suggestion);
                else if (fieldName === 'soundPrompt') props.onSoundPromptChange(data.suggestion);
            }
        } catch (e) {
            console.error("Field suggestion failed:", e);
        } finally {
            setSuggestingFields(prev => ({ ...prev, [fieldName]: false }));
        }
    };
    
    // Manual comic publisher states
    const [manualComicTitle, setManualComicTitle] = useState('');
    const [manualComicGenre, setManualComicGenre] = useState('Sci-Fi');
    const [manualComicLanguage, setManualComicLanguage] = useState('en-US');
    const [manualComicCover, setManualComicCover] = useState<string | null>(null);
    const [isPublishingManual, setIsPublishingManual] = useState(false);

    // Dynamic Database URL tester
    const [testConnectionString, setTestConnectionString] = useState('');
    const [isTestingConnection, setIsTestingConnection] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string; tested: boolean } | null>(null);

    const [isReconnecting, setIsReconnecting] = useState(false);
    const [reconnectResultMessage, setReconnectResultMessage] = useState<string | null>(null);

    // Fetch DB Status
    const fetchDbStatus = async () => {
        try {
            const res = await fetch('/api/db-status');
            const data = await res.json();
            setDbConnection({ 
                status: data.status, 
                mode: data.mode,
                hasUrlEnv: data.hasUrlEnv,
                dbUrlMasked: data.dbUrlMasked
            });
        } catch (e) {
            setDbConnection({ status: 'error', mode: 'In-Memory Fallback Sandbox' });
        }
    };

    // Fetch Cloud Run Config
    const fetchCloudRunConfig = async () => {
        try {
            const res = await fetch('/api/cloudrun-config');
            const data = await res.json();
            setCloudRunConfig(data);
        } catch (e) {
            console.error("Failed to detect Cloud Run container setup:", e);
        }
    };

    // Fetch Character Vault Saved Items
    const fetchVault = async () => {
        const isFirebaseUser = props.activeCreator.id && props.activeCreator.id !== '00000000-0000-0000-0000-000000000000' && !props.activeCreator.id.includes('local-creator') && !props.activeCreator.id.includes('offline');
        if (isFirebaseUser) {
            try {
                const list = await getCharactersFromFirestore(props.activeCreator.id);
                const mapped = list.map(c => ({
                    id: c.id,
                    user_id: c.userId,
                    character_name: c.name,
                    role_type: c.roleType,
                    description: c.description,
                    image_url: c.imageUrl,
                    created_at: c.createdAt
                }));
                setSavedCharacters(mapped);
                return;
            } catch (fsErr) {
                console.warn("[Setup] Firestore characters fetch error, falling back to server api:", fsErr);
            }
        }
        try {
            const res = await fetch(`/api/characters?userId=${props.activeCreator.id}`);
            const list = await res.json();
            setSavedCharacters(Array.isArray(list) ? list : []);
        } catch (e) {
            console.error("Failed to load character vault", e);
        }
    };

    // Fetch Creator Dynamic Comic Book Projects
    const fetchProjects = async () => {
        const isFirebaseUser = props.activeCreator.id && props.activeCreator.id !== '00000000-0000-0000-0000-000000000000' && !props.activeCreator.id.includes('local-creator') && !props.activeCreator.id.includes('offline');
        if (isFirebaseUser) {
            try {
                const list = await getProjectsFromFirestore(props.activeCreator.id);
                const mapped = list.map(p => ({
                    id: p.id,
                    user_id: p.userId,
                    title: p.title,
                    genre: p.genre,
                    language: p.language,
                    comic_faces: p.comicFaces,
                    created_at: p.createdAt,
                    updated_at: p.updatedAt
                }));
                setSavedProjects(mapped);
                return;
            } catch (fsErr) {
                console.warn("[Setup] Firestore projects fetch error, falling back to server api:", fsErr);
            }
        }
        try {
            const res = await fetch(`/api/projects?userId=${props.activeCreator.id}`);
            const list = await res.json();
            setSavedProjects(Array.isArray(list) ? list : []);
        } catch (e) {
            console.error("Failed to load creator projects library:", e);
        }
    };

    const handleDeleteProject = async (projectId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to shred this comic book completely from your library?")) return;
        const isFirebaseUser = props.activeCreator.id && props.activeCreator.id !== '00000000-0000-0000-0000-000000000000' && !props.activeCreator.id.includes('local-creator') && !props.activeCreator.id.includes('offline');
        if (isFirebaseUser) {
            try {
                await deleteProjectFromFirestore(props.activeCreator.id, projectId);
                fetchProjects();
                return;
            } catch (fsErr) {
                console.warn("[Setup] Firestore project deletion failed, falling back to API:", fsErr);
            }
        }
        try {
            await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
            fetchProjects();
        } catch (err) {
            console.error("Shred error", err);
        }
    };

    const handleManualPublish = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualComicTitle.trim()) {
            alert("Please enter a comic book title.");
            return;
        }
        setIsPublishingManual(true);
        try {
            // Pack manual image as cover page-0 inside comicFaces
            const initialFaces = [
                {
                    id: 'page-0',
                    type: 'cover',
                    imageUrl: manualComicCover || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=400&auto=format&fit=crop',
                    pageIndex: 0,
                    isLoading: false,
                    narrative: {
                        scene: "A custom curated published comic book.",
                        caption: "An original visual epic.",
                        choices: ["The Beginning"]
                    }
                }
            ];

            const isFirebaseUser = props.activeCreator.id && props.activeCreator.id !== '00000000-0000-0000-0000-000000000000' && !props.activeCreator.id.includes('local-creator') && !props.activeCreator.id.includes('offline');
            if (isFirebaseUser) {
                await saveProjectToFirestore(props.activeCreator.id, {
                    title: manualComicTitle.trim(),
                    genre: manualComicGenre,
                    language: manualComicLanguage,
                    comicFaces: JSON.stringify(initialFaces),
                    userId: props.activeCreator.id
                });
                alert("🎉 Success! Your original comic book has been successfully saved to your cloud library.\n\nLogging you out and returning to the Landing Page as requested...");
                setManualComicTitle('');
                setManualComicCover(null);
                fetchProjects();
                if (props.onLogOut) {
                    props.onLogOut();
                }
                return;
            }

            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: props.activeCreator.id,
                    title: manualComicTitle.trim(),
                    genre: manualComicGenre,
                    language: manualComicLanguage,
                    comicFaces: JSON.stringify(initialFaces)
                })
            });
            if (res.ok) {
                alert("🎉 Success! Your original comic book has been successfully published to your creator library.\n\nLogging you out and returning to the Landing Page as requested...");
                setManualComicTitle('');
                setManualComicCover(null);
                fetchProjects();
                if (props.onLogOut) {
                    props.onLogOut();
                }
            }
        } catch (err) {
            console.error("Failed to upload published comic:", err);
        } finally {
            setIsPublishingManual(false);
        }
    };

    useEffect(() => {
        fetchDbStatus();
        fetchCloudRunConfig();
    }, []);

    useEffect(() => {
        if (props.activeCreator.id) {
            fetchVault();
            fetchProjects();
            fetchDrafts();
        }
    }, [props.activeCreator.id]);

    // Handle custom event from App when a character is synced
    useEffect(() => {
        const handler = () => {
             fetchVault();
             fetchProjects();
             fetchDrafts();
        };
        window.addEventListener('refresh-character-vault', handler);
        return () => {
             window.removeEventListener('refresh-character-vault', handler);
        };
    }, [props.activeCreator.id]);

    if (!props.show && !props.isTransitioning) return null;

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!creatorEmailInput.trim()) return;
        setIsUpdatingEmail(true);
        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: creatorEmailInput.trim() })
            });
            const data = await res.json();
            if (data && data.id) {
                const userObj = { id: data.id, email: data.email };
                props.onCreatorChange(userObj);
                localStorage.setItem('infinite_heroes_creator', JSON.stringify(userObj));
                alert(`Welcome back, Creator! Profile active: ${data.email}`);
            }
        } catch (err) {
            alert("Creator registration fallback active. Loaded.");
        } finally {
            setIsUpdatingEmail(false);
        }
    };

    const handleDeleteFromVault = async (charId: string) => {
        if (!confirm("Are you sure you want to retire this character from the vault?")) return;
        const isFirebaseUser = props.activeCreator.id && props.activeCreator.id !== '00000000-0000-0000-0000-000000000000' && !props.activeCreator.id.includes('local-creator') && !props.activeCreator.id.includes('offline');
        if (isFirebaseUser) {
            try {
                await deleteCharacterFromFirestore(props.activeCreator.id, charId);
                fetchVault();
                return;
            } catch (fsErr) {
                console.warn("[Setup] Firestore character deletion failed, falling back to API:", fsErr);
            }
        }
        try {
            await fetch(`/api/characters/${charId}`, { method: 'DELETE' });
            fetchVault();
        } catch (e) {
            console.error("Retire failed", e);
        }
    };

    const handleLoadMyUrl = async () => {
        try {
            const res = await fetch('/api/get-raw-database-url');
            const data = await res.json();
            if (data.url) {
                setTestConnectionString(data.url);
            } else {
                setTestConnectionString("postgresql://angelburgosrosado:75727572Ab%21@34.148.244.49:5432/comics-v1");
            }
        } catch (e) {
            setTestConnectionString("postgresql://angelburgosrosado:75727572Ab%21@34.148.244.49:5432/comics-v1");
        }
    };

    const handleTestConnection = async (e: React.FormEvent<any> | null, forceEnvUrl = false) => {
        if (e) e.preventDefault();
        const str = forceEnvUrl ? "" : testConnectionString.trim();
        if (!str && !forceEnvUrl) {
            alert("Please paste a database connection URL format to test, or click 'TEST SERVER-SIDE URL' to evaluate the loaded environment variables!");
            return;
        }
        setIsTestingConnection(true);
        setTestResult(null);
        try {
            const res = await fetch('/api/verify-database-connection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ connectionString: str })
            });
            const data = await res.json();
            if (data.success) {
                setTestResult({
                    success: true,
                    message: data.version || "Connection active! Table structures successfully verified.",
                    tested: true
                });
                // Succeeded, refresh database pool connection states on the server too!
                fetchDbStatus();
            } else {
                setTestResult({
                    success: false,
                    message: data.error || "Connection timed out or returned credentials/firewall error.",
                    tested: true
                });
            }
        } catch (err: any) {
            setTestResult({
                success: false,
                message: err.message || "Failed to contact verification proxy service.",
                tested: true
            });
        } finally {
            setIsTestingConnection(false);
        }
    };

    const handleForceReconnect = async () => {
        setIsReconnecting(true);
        setReconnectResultMessage(null);
        try {
            const res = await fetch('/api/db-reconnect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (data.success) {
                setReconnectResultMessage("✓ CONNECTED! Active PostgreSQL pool is fully established.");
                alert("Server-side Database connection established successfully! Live multi-tenant synchronization is active.");
                fetchDbStatus();
                if (props.activeCreator.id) {
                    fetchVault();
                }
            } else {
                setReconnectResultMessage("❌ " + (data.message || "Forced reconnect failed. Check credentials/firewall rules."));
            }
        } catch (e: any) {
            setReconnectResultMessage("❌ Network connection proxy failure: " + e.message);
        } finally {
            setIsReconnecting(false);
        }
    };

    // Helper map of genre symbols/emojis
    const genreIcons: Record<string, string> = {
        "Classic Horror": "💀",
        "Superhero Action": "⚡",
        "Dark Sci-Fi": "🚀",
        "High Fantasy": "🏰",
        "Neon Noir Detective": "🕵️",
        "Wasteland Apocalypse": "☣️",
        "Lighthearted Comedy": "🎭",
        "Teen Drama / Slice of Life": "🎒",
        "Anime Story": "🌸",
        "Historical Archeology Tales": "🏺",
        "Custom": "✨"
    };

    const wardrobePresetsByGenre: Record<string, string[]> = {
        "Classic Horror": [
            "Vintage Victorian mourning attire with distressed lace.",
            "Asymmetrical asylum straightjacket with heavy leather straps.",
            "Tattered ceremonial cultist robes with blood-red lining."
        ],
        "Superhero Action": [
            "High-tech tactical nanosuit with glowing energy conduits.",
            "Flowing majestic cape over reinforced Kevlar body armor.",
            "Form-fitting athletic spandex with striking geometric patterns."
        ],
        "Dark Sci-Fi": [
            "Cybernetic exo-suit with exposed hydraulic joints and neon wiring.",
            "Grimy scavenger duster over atmospheric rebreather gear.",
            "Sleek corporate security armor with mirrored biometric visor."
        ],
        "High Fantasy": [
            "Ornate mythril plate armor with glowing runic etchings.",
            "Flowing archmage robes woven with starlight and shadow.",
            "Rugged leather ranger gear with enchanted forest cloaking."
        ],
        "Neon Noir Detective": [
            "Classic heavy trench coat with a popped collar and fedora.",
            "Sharp tailored pinstripe suit with neon-lit lapel pins.",
            "Gritty street-level leather jacket over a bloodstained button-down."
        ],
        "Wasteland Apocalypse": [
            "Scavenged rusted metal armor with spiked tire-tread shoulder pads.",
            "Heavy canvas duster over tactical webbing and gasmask.",
            "Nomad survivalist gear wrapped in dusty camo netting."
        ],
        "Lighthearted Comedy": [
            "Absurdly oversized novelty costume with bright primary colors.",
            "Quirky mismatched thrift-store sweater and patterned pants.",
            "Exaggerated superhero parody suit with a cape that's too long."
        ],
        "Teen Drama / Slice of Life": [
            "Trendy high school varsity jacket over a casual graphic tee.",
            "Grunge-inspired flannel shirt with ripped denim and combat boots.",
            "Preppy private school uniform with a perfectly tied blazer."
        ],
        "Anime Story": [
            "Gravity-defying stylized school uniform with combat modifications.",
            "Mecha-pilot plug-suit with sleek aerodynamic paneling.",
            "Over-the-top gothic lolita dress with hidden weapon holsters."
        ],
        "Historical Archeology Tales": [
            "Rugged explorer gear with a leather satchel and wide-brimmed hat.",
            "Elegant 1920s expedition tailoring with brass compass accents.",
            "Dusty canvas khakis and a utility vest packed with ancient relics."
        ],
        "Custom": [
            "A tailored charcoal evening dress with hidden utility structural seams",
            "A high-mobility cybernetic stealth bodysuit with integrated cooling lines",
            "A heavy leather duster coat over high-collar tactical body Kevlar mesh"
        ]
    };

    const artStyleLockByGenre: Record<string, string> = {
        "Classic Horror": "Macabre gothic illustration, high contrast shadows, ink wash, chilling atmosphere",
        "Superhero Action": "Vibrant comic book style, dynamic action poses, cel-shaded, bold ink lines, halftone patterns",
        "Dark Sci-Fi": "Cyberpunk concept art, neon lighting, gritty industrial textures, photorealistic sci-fi render",
        "High Fantasy": "Epic High Fantasy digital painting, intricate details, cinematic lighting, ArtStation concept art",
        "Neon Noir Detective": "Cinematic neo-noir, moody chiaroscuro lighting, rain-slicked streets, stylized graphic novel",
        "Wasteland Apocalypse": "Gritty post-apocalyptic concept art, dusty atmosphere, muted desaturated colors, harsh lighting",
        "Lighthearted Comedy": "Bright and colorful cartoon style, expressive characters, clean vector lines, cheerful atmosphere",
        "Teen Drama / Slice of Life": "Soft aesthetic indie comic style, pastel color palette, warm lighting, expressive faces",
        "Anime Story": "High-budget anime studio key visual, vibrant cel-shading, dynamic perspective, stylized fx",
        "Historical Archeology Tales": "Vintage pulp magazine cover illustration, sepia tones, dramatic adventure lighting",
        "Custom": "Photorealistic Neon Noir Comic Book Style, sharp cinematic chiaroscuro"
    };

    const workspaceContextValue = {
        ...props,
        t,
        isCyberpunk,
        isEditorial,
        isKidStory,
        activePresets,
        activeTab,
        appSkin,
        cloudRunConfig,
        cohesionSliderValue,
        creatorEmailInput,
        dbConnection,
        dynamicCategories,
        fileToBase64,
        geminiKey,
        generatingBlueprint,
        generatingPageGoal,
        handleApplyWardrobePreset,
        handleAvatarUpload,
        handleDeleteDraft,
        handleDeleteFromVault,
        handleDeleteProject,
        handleDropAsset,
        handleEmailSubmit,
        handleForceReconnect,
        handleGeminiKeyChange,
        handleGeneratePageGoal,
        handleGenerateStoryBlueprint,
        handleInitializeDefaultBlueprint,
        handleLoadMyUrl,
        handleManualPublish,
        handlePersonaStudioBrainstorm,
        handlePersonaStudioCastCharacter,
        handlePersonaStudioGeneratePortrait,
        handlePersonaStudioSelectRole,
        handleSaveDraft,
        handleSaveToVault,
        handleSuggestField,
        handleSurpriseMeVault,
        handleTestConnection,
        handleVaultGenerate,
        isPublishingManual,
        isReconnecting,
        isSavingDraft,
        isScanningFriend,
        isScanningHero,
        isScanningVillain,
        isTestingConnection,
        isUpdatingEmail,
        isVaultGenerating,
        isWardrobeOpen,
        leonardoKey,
        manualComicCover,
        manualComicGenre,
        manualComicLanguage,
        manualComicTitle,
        personaStudioConcept,
        personaStudioGeneratingImg,
        personaStudioName,
        personaStudioPortrait,
        personaStudioRole,
        personaStudioStatusMsg,
        personaStudioStyle,
        personaStudioSuggestedBio,
        personaStudioSuggestedName,
        personaStudioSuggestedNemesisDna,
        personaStudioSuggestedPowers,
        personaStudioSuggestedVisuals,
        personaStudioSuggesting,
        pineconeKey,
        reconnectResultMessage,
        savedCharacters,
        savedDrafts,
        savedProjects,
        selectedArtStyle,
        setActivePresets,
        setActiveTab,
        setAppSkin,
        setAppSkinState,
        setCloudRunConfig,
        setCohesionSliderValue,
        setCreatorEmailInput,
        setDbConnection,
        setDynamicCategories,
        setGeminiKey,
        setGeneratingBlueprint,
        setGeneratingPageGoal,
        setIsPublishingManual,
        setIsReconnecting,
        setIsSavingDraft,
        setIsScanningFriend,
        setIsScanningHero,
        setIsScanningVillain,
        setIsTestingConnection,
        setIsUpdatingEmail,
        setIsVaultGenerating,
        setIsWardrobeOpen,
        setLeonardoKey,
        setManualComicCover,
        setManualComicGenre,
        setManualComicLanguage,
        setManualComicTitle,
        setPersonaStudioConcept,
        setPersonaStudioGeneratingImg,
        setPersonaStudioName,
        setPersonaStudioPortrait,
        setPersonaStudioRole,
        setPersonaStudioStatusMsg,
        setPersonaStudioStyle,
        setPersonaStudioSuggestedBio,
        setPersonaStudioSuggestedName,
        setPersonaStudioSuggestedNemesisDna,
        setPersonaStudioSuggestedPowers,
        setPersonaStudioSuggestedVisuals,
        setPersonaStudioSuggesting,
        setPineconeKey,
        setReconnectResultMessage,
        setSavedCharacters,
        setSavedDrafts,
        setSavedProjects,
        setSelectedArtStyle,
        setSuggestingFields,
        setTerminalLogs,
        setTestConnectionString,
        setTestResult,
        setVaultAge,
        setVaultCharDesc,
        setVaultCharName,
        setVaultCharStyle,
        setVaultEthnicity,
        setVaultGender,
        setVaultGeneratedImage,
        setVaultReferenceImage,
        setVaultStatusMsg,
        setWardrobeAlert,
        setWardrobeTargetRole,
        suggestingFields,
        terminalLogs,
        testConnectionString,
        testResult,
        vaultAge,
        vaultCharDesc,
        vaultCharName,
        vaultCharStyle,
        vaultEthnicity,
        vaultGender,
        vaultGeneratedImage,
        vaultReferenceImage,
        vaultStatusMsg,
        wardrobeAlert,
        wardrobeTargetRole
    };
    return (
        <WorkspaceContext.Provider value={workspaceContextValue}>
        <>
        <style>{`
             @keyframes knockout-exit {
                0% { transform: scale(1) rotate(1deg); }
                15% { transform: scale(1.08) rotate(-4deg); }
                100% { transform: translateY(-200vh) rotate(720deg) scale(0.3); opacity: 0; }
             }
             @keyframes pow-enter {
                 0% { transform: translate(-50%, -50%) scale(0) rotate(-45deg); opacity: 0; }
                 30% { transform: translate(-50%, -50%) scale(1.6) rotate(12deg); opacity: 1; }
                 100% { transform: translate(-50%, -50%) scale(1.9) rotate(0deg); opacity: 0; }
             }
             @keyframes pulse-glow {
                 0%, 100% { box-shadow: 0 0 12px rgba(239, 68, 68, 0.4); }
                 50% { box-shadow: 0 0 28px rgba(239, 68, 68, 0.85); }
             }
             @keyframes shimmer {
                 0% { background-position: -200% 0; }
                 100% { background-position: 200% 0; }
             }
             .animate-pulse-glow {
                 animation: pulse-glow 2s infinite ease-in-out;
             }
             .retro-halftone {
                 background-image: radial-gradient(rgba(0, 0, 0, 0.15) 15%, transparent 16%), radial-gradient(rgba(0, 0, 0, 0.15) 15%, transparent 16%);
                 background-size: 8px 8px;
                 background-position: 0 0, 4px 4px;
             }
             .shiny-btn {
                 background: linear-gradient(90deg, #dc2626 0%, #ea580c 50%, #dc2626 100%);
                 background-size: 200% auto;
                 animation: shimmer 2s linear infinite;
             }
             /* Custom Scrollbars */
             .custom-scrollbar::-webkit-scrollbar {
                 height: 6px;
                 width: 6px;
             }
             .custom-scrollbar::-webkit-scrollbar-track {
                 background: #111827;
             }
             .custom-scrollbar::-webkit-scrollbar-thumb {
                 background: #f59e0b;
                 border-radius: 3px;
             }
          `}</style>

        {props.isTransitioning && (
            <div className="fixed top-1/2 left-1/2 z-[210] pointer-events-none" style={{ animation: 'pow-enter 1s forwards ease-out' }}>
                <svg viewBox="0 0 200 150" className="w-[500px] h-[400px] drop-shadow-[0_12px_0_rgba(0,0,0,0.6)]">
                    <path d="M95.7,12.8 L110.2,48.5 L148.5,45.2 L125.6,74.3 L156.8,96.8 L119.4,105.5 L122.7,143.8 L92.5,118.6 L60.3,139.7 L72.1,103.2 L34.5,108.8 L59.9,79.9 L24.7,57.3 L62.5,54.4 L61.2,16.5 z" fill="#FFD700" stroke="black" strokeWidth="5"/>
                    <text x="100" y="95" textAnchor="middle" fontFamily="'Bangers', cursive" fontSize="72" fill="#DC2626" stroke="black" strokeWidth="2.5" transform="rotate(-6 100 75)">{t('setup.auto1', 'BOOM!')}</text>
                </svg>
            </div>
        )}
        
                <div className="fixed inset-0 z-[200] bg-black/90 flex flex-row overflow-hidden transition-all duration-500 ease-in-out"
             style={{
                 animation: props.isTransitioning ? 'knockout-exit 1s forwards cubic-bezier(.6,-0.28,.74,.05)' : 'none',
                 pointerEvents: props.isTransitioning ? 'none' : 'auto'
             }}>
          
          {/* New Vertical Sidebar */}
          {!isCyberpunk && <WorkspaceSidebar />}

          {/* Main Content Area */}
          <div className="flex-1 min-h-full overflow-y-auto p-4 pb-36 md:p-8 relative">
            <div className={sOuterContainer}>
                
                {/* Comic Halftone texture wrapper behind everything */}
                {!isEditorial && <div className="absolute inset-0 opacity-15 retro-halftone pointer-events-none" />}

                {/* Aesthetic Top Ribbon */}
                <div className={`absolute top-0 right-0 ${isEditorial ? 'bg-stone-200 text-stone-700 border-b border-l border-stone-300 font-sans text-[10px] uppercase font-bold tracking-widest px-4.5 py-1 z-10' : 'bg-gray-900 text-yellow-400 text-black font-mono text-xs uppercase px-4 py-1 border-b-2 border-l-2 border-black tracking-widest font-bold z-10'}`}>
                     {isKidStory ? "🌟 Kid Storymaker v1.0" : isEditorial ? t('setup.dashboard.editorialBadge') : t('setup.dashboard.comicBadge')}
                </div>

                {/* SKIN COMPILER SELECTOR */}
                <div className={`flex justify-between items-center mb-6 relative z-10 select-none pb-4 border-b ${isEditorial ? 'border-stone-200 text-stone-900' : 'border-slate-800 text-slate-300'}`}>
                     <div className="flex items-center gap-2">
                          <span className="text-xl">🛠️</span>
                          <span className={`${isEditorial ? 'text-xs uppercase tracking-widest text-[#5c5449] font-black font-sans' : 'text-xs uppercase tracking-widest text-yellow-400 font-mono font-black'}`}>{t('setup.dashboard.skinLabel')}</span>
                     </div>
                     <div className={`flex items-center gap-1.5 p-1 rounded-lg text-xs ${isEditorial ? 'bg-stone-200/65' : 'bg-black/40 border border-white/5'}`}>
                          <button
                               type="button"
                               onClick={() => setAppSkin('comic')}
                               className={`px-3 py-1.5 rounded-md font-bold uppercase tracking-wider transition-all cursor-pointer ${appSkin === 'comic' ? 'bg-amber-500 text-black font-black shadow-sm' : isEditorial ? 'text-stone-500 hover:text-stone-900' : 'text-gray-400 hover:text-white'}`}
                          >
                               {t('setup.dashboard.skinComic')}
                          </button>
                          {/*
                          <button
                               type="button"
                               onClick={() => setAppSkin('writers-journal')}
                               className={`px-3 py-1.5 rounded-md font-bold uppercase tracking-wider transition-all cursor-pointer ${appSkin === 'writers-journal' ? 'bg-[#3c3730] text-stone-50 font-black shadow-sm' : isEditorial ? 'text-stone-500 hover:text-stone-900' : 'text-gray-400 hover:text-white'}`}
                          >
                               Writer's Journal
                          </button>
                          */}
                          <button
                               type="button"
                               onClick={() => setAppSkin('kid-story')}
                               className={`px-3 py-1.5 rounded-md font-bold uppercase tracking-wider transition-all cursor-pointer ${appSkin === 'kid-story' ? 'bg-[#10b981] text-white font-black shadow-sm' : 'text-gray-400 hover:text-white'}`}
                          >
                               Kid Story
                          </button>

                     </div>
                </div>

                {/* Dashboard Title Block */}
                <div className="text-center mb-8 relative z-10 select-none">
                    {isEditorial ? (
                         <div className="py-2">
                              <span className="block font-sans text-[#786c5f] text-xs font-black tracking-widest uppercase mb-1">{t('setup.dashboard.proSubtitle')}</span>
                              <h1 className="font-serif text-4xl md:text-5xl text-stone-900 font-extrabold tracking-tight leading-none">
                                   Story<span className="text-[#92400e]">{t('setup.auto2', '.Menu')}</span>
                              </h1>
                              <p className="text-stone-500 text-xs mt-2 font-serif max-w-lg mx-auto leading-relaxed">
                                   {t('setup.dashboard.proDesc')}
                              </p>
                         </div>
                    ) : (
                         <>
                              <span className="block font-mono text-red-500 text-xl md:text-2xl tracking-widest uppercase mb-1 drop-shadow-[1px_1px_0px_#000]">{t('setup.dashboard.comicSubtitle')}</span>
                              <div className="inline-flex items-center justify-center gap-1.5 bg-gray-900 text-red-400 border-4 border-black px-6 py-2 shadow-[4px_4px_0px_#000] transform -rotate-1">
                                  <span className="font-mono text-4xl md:text-6xl text-white tracking-wider" style={{ textShadow: '3px 3px 0px black' }}>{t('setup.auto3', 'STORY')}</span>
                                  <span className="font-mono text-4xl md:text-6xl text-yellow-300 tracking-wider font-extrabold" style={{ textShadow: '3px 3px 0px black' }}>{t('setup.auto4', '.MENU')}</span>
                              </div>
                         </>
                    )}
                </div>

                {/* COMMERCIAL STATUS & INTRODUCTION BANNER */}
                <div className={sPanel}>
                    <div className="md:col-span-12 text-center font-sans">
                        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 ${isEditorial ? 'border-stone-200 pb-4 mb-4' : 'border-slate-800 pb-4 mb-4'}`}>
                            <div className="flex-1 text-center">
                                <h3 className={isEditorial ? "font-sans font-black text-base text-stone-800 tracking-wider uppercase" : "font-mono font-black text-xl text-yellow-400 tracking-wider uppercase inline-block"}>
                                     {t('setup.dashboard.cloudActive')}
                                </h3>
                                <p className={isEditorial ? "text-stone-500 font-sans text-xs mt-1" : "text-slate-400 font-mono text-xs mt-1 max-w-2xl mx-auto"}>
                                     {t('setup.dashboard.cloudDesc')}
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2.5">
                                 <button
                                      type="button"
                                      disabled={isSavingDraft}
                                      onClick={handleSaveDraft}
                                      className={sPrimaryBtn}
                                 >
                                      {isSavingDraft ? t('setup.dashboard.saving') : t('setup.dashboard.saveDraft')}
                                 </button>
                                 {props.onLogOut && (
                                      <button
                                           type="button"
                                           onClick={props.onLogOut}
                                           className={sRedBtn}
                                      >
                                           {t('setup.dashboard.signOut')}
                                      </button>
                                 )}
                                 <div className={isEditorial ? "flex items-center gap-2 bg-stone-200/60 p-2 rounded-lg text-xs font-semibold" : "flex items-center gap-2 bg-gray-950/50 border border-cyan-800/80 px-3 py-2 rounded text-xs select-none"}>
                                     <span className="w-2.5 h-2.5 rounded-full bg-gray-900 text-green-400 animate-pulse" />
                                     <span className={isEditorial ? "font-sans text-stone-600 uppercase tracking-wider text-[11px]" : "font-mono text-slate-300 uppercase tracking-widest text-[11px] font-bold"}>
                                          {t('setup.dashboard.firestoreLive')}
                                     </span>
                                 </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm font-sans mt-2">
                            <div className="flex gap-3">
                                <span className="text-3xl select-none">🌌</span>
                                <div>
                                    <h4 className={isEditorial ? "font-sans font-bold text-stone-900 uppercase text-xs tracking-wider mb-1" : "font-mono font-bold text-white uppercase text-xs tracking-wider mb-1"}>{t('setup.dashboard.f1Title')}</h4>
                                    <p className={isEditorial ? "text-stone-500 text-xs leading-relaxed font-sans" : "text-slate-400 text-xs leading-relaxed"}>
                                         {t('setup.dashboard.f1Desc')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <span className="text-3xl select-none">🎭</span>
                                <div>
                                    <h4 className={isEditorial ? "font-sans font-bold text-stone-900 uppercase text-xs tracking-wider mb-1" : "font-mono font-bold text-white uppercase text-xs tracking-wider mb-1"}>{t('setup.dashboard.f2Title')}</h4>
                                    <p className={isEditorial ? "text-stone-500 text-xs leading-relaxed font-sans" : "text-slate-400 text-xs leading-relaxed"}>
                                         {t('setup.dashboard.f2Desc')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <span className="text-3xl select-none">📚</span>
                                <div>
                                    <h4 className={isEditorial ? "font-sans font-bold text-stone-900 uppercase text-xs tracking-wider mb-1" : "font-mono font-bold text-white uppercase text-xs tracking-wider mb-1"}>{t('setup.dashboard.f3Title')}</h4>
                                    <p className={isEditorial ? "text-stone-500 text-xs leading-relaxed font-sans" : "text-slate-400 text-xs leading-relaxed"}>
                                         {t('setup.dashboard.f3Desc')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>


                {(isCyberpunk || activeTab === 'generate') && (
                    <>
                        {/* Main Config Workspace split in 2 bold frames */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8 relative z-10">
                    
                    {/* Section 1: The Cast Grid (7 cols) */}
                    <div className={`lg:col-span-7 flex flex-col ${sCard}`}>
                        <div className={sHeaderBadge}>
                              {isEditorial ? t('setup.cast.titleEditorial') : t('setup.cast.titleComic')}
                         </div>
                         
                         <p className={`text-xs ${isEditorial ? 'text-stone-505 font-sans leading-relaxed' : 'text-gray-300 font-medium'} mb-5 mt-2`}>
                              {isEditorial 
                                   ? t('setup.cast.descEditorial')
                                   : t('setup.cast.descComic')}
                              <br/><span className="opacity-70 mt-1 block">Supported formats: JPG, PNG, WEBP, GIF, HEIC (Max 5MB)</span>
                         </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            
                            {/* HERO CARD (BLUE THEME) */}
                            <div className={`sm:col-span-2 relative group min-h-[450px] pb-6 px-6 rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 transform hover:-translate-y-2 hover:scale-[1.01] cursor-pointer ${
                                 isEditorial
                                      ? `border bg-stone-100/90 ${props.hero ? 'border-stone-500 shadow-md' : 'border-stone-300 hover:border-stone-400'}`
                                      : `border-4 bg-slate-950 ${props.hero ? 'border-blue-500 hover:shadow-[0_0_24px_rgba(59,130,246,0.5)]' : 'border-blue-700/80 hover:shadow-[0_0_24px_rgba(59,130,246,0.3)] hover:border-blue-500'}`
                            }`}>
                                 <input type="file" accept="image/*,.heic" id="hero-upload-input" className="hidden" onChange={(e) => { if (e.target.files?.[0]) { props.onHeroUpload(e.target.files[0]); } e.target.value = ''; }} />
                                 
                                 {props.hero ? (
                                      <div className={`relative w-full h-36 mt-3 rounded-lg overflow-hidden group/main min-h-[220px] flex-shrink-0 ${isEditorial ? 'border border-stone-300' : 'border-2 border-black'}`}>
                                           <label htmlFor="hero-upload-input" className="absolute inset-0 cursor-pointer z-30">
                                                <span className="sr-only">{t('setup.auto7', 'Upload Hero')}</span>
                                           </label>
                                           <img src={`data:image/jpeg;base64,${props.hero.base64}`} alt="Hero Roster" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                           <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                                           
                                           <div className={isEditorial ? "absolute top-1.5 left-1.5 bg-[#4c443c] text-stone-100 font-sans text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded shadow-sm z-20" : "absolute top-1.5 left-1.5 bg-blue-600 text-white border border-black font-mono text-[10px] uppercase px-1.5 py-0.5 rotate-[-2deg] z-20 font-bold shadow-[1px_1px_0px_#000]"}>
                                                {isEditorial ? "PROTAGONIST ACTIVE" : "HERO ACTIVE"}
                                           </div>

                                           <div className={`absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 ${isEditorial ? 'bg-stone-900/90' : 'bg-blue-950/90'}`}>
                                                <span className={`text-xs font-bold uppercase tracking-wider ${isEditorial ? 'text-stone-100 font-sans' : 'text-yellow-400 font-mono'}`}>{isEditorial ? "REPLACE IMAGE" : "CHANGE PROFILE"}</span>
                                                <span className={`text-[8px] font-mono mt-0.5 ${isEditorial ? 'text-stone-300' : 'text-gray-300'}`}>{isEditorial ? "SELECT FILE" : "CLICK TO SWAP"}</span>
                                           </div>
                                      </div>
                                 ) : (
                                      <label htmlFor="hero-upload-input" className={`flex flex-col justify-center items-center text-center h-36 mt-3 p-4 relative z-20 min-h-[220px] flex-shrink-0 rounded-lg border-2 border-dashed ${isEditorial ? 'border-stone-300 hover:bg-stone-200' : 'border-blue-800 hover:bg-blue-950/50'} cursor-pointer transition-colors group/upload`}>
                                           <div className="absolute top-2 left-2 right-2 flex justify-between items-center">
                                                <span className={isEditorial ? "bg-stone-300 text-stone-700 font-sans text-[10px] uppercase font-bold px-2 py-0.5 rounded" : "bg-blue-600 text-white border border-black font-mono text-[10px] uppercase px-2 py-0.5 rounded-full shadow-[1px_1px_0px_#000]"}>{t('setup.auto8', 'REQUIRED')}</span>
                                                <span className={`w-2 h-2 rounded-full ${isEditorial ? 'bg-stone-400' : 'bg-blue-500 animate-ping'}`} />
                                           </div>

                                           <div className={`mt-2 mb-1 transform group-hover/upload:scale-110 transition-transform duration-300 ${isEditorial ? 'text-stone-400' : 'text-blue-400'}`}>
                                                <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                     <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                           </div>
                                           <span className={`text-sm tracking-wide ${isEditorial ? 'font-sans font-bold text-stone-700' : 'font-mono text-blue-300'}`}>{isEditorial ? "PORTRAIT" : "HERO AVATAR"}</span>
                                           <span className={`text-[9px] uppercase tracking-widest font-mono mt-0.5 ${isEditorial ? 'text-stone-400' : 'text-gray-400'}`}>{isEditorial ? "CLICK TO ADD FILE" : "CLICK TO SCAN"}</span>
                                      </label>
                                 )}
                                 
                                 <div className="flex flex-col flex-1 justify-between pt-3">
                                      <div className="text-left">
                                           <span className={`text-[9px] font-mono tracking-wider font-bold block mb-0.5 ${isEditorial ? 'text-stone-600' : 'text-green-400'}`}>
                                                {isEditorial ? "🖋️ PROTAGONIST DATA" : "⚡ IDENTITY RECORD"}
                                           </span>
                                           <p className={`text-sm leading-none uppercase tracking-wide truncate ${isEditorial ? 'text-stone-850 font-sans font-black' : 'text-white font-mono'}`}>
                                                {isEditorial ? "PROTAGONIST" : "MAIN HERO"}
                                           </p>
                                           <p className={`text-[9.5px] line-clamp-2 mt-1 font-sans ${isEditorial ? 'text-stone-600' : 'text-gray-300'}`}>{props.hero?.desc || (isEditorial ? "A central figure of the narrative..." : "Ready for battle")}</p>
                                      </div>

                                      <div className={`mt-2 pt-2 border-t ${isEditorial ? 'border-stone-200' : 'border-slate-800'}`}>
                                           <div className="flex items-center justify-between mb-1.5">
                                                <span className={`text-[9px] font-mono font-bold tracking-wide block text-left ${isEditorial ? 'text-stone-600' : 'text-blue-400'}`}>
                                                     {isEditorial ? "✒️ VISUAL DESIGN:" : "🎨 ATTIRE & HAIR:"}
                                                </span>
                                                <button
                                                     type="button"
                                                     onClick={(e) => { e.preventDefault(); handleSuggestField('heroVisuals', props.heroVisuals); }}
                                                     disabled={suggestingFields['heroVisuals']}
                                                     className={`text-[8px] rounded px-1.5 py-0.5 font-bold uppercase transition-all disabled:opacity-40 ${
                                                          isEditorial
                                                               ? 'bg-stone-200 hover:bg-stone-300 text-stone-700'
                                                               : 'bg-blue-900/60 hover:bg-blue-800 text-blue-200 border border-blue-500/40'
                                                     }`}
                                                >
                                                     {suggestingFields['heroVisuals'] ? '✨...' : '✨ SUGGEST'}
                                                </button>
                                           </div>
                                           <textarea 
                                                rows={2}
                                                value={props.heroVisuals} 
                                                onChange={(e) => props.onHeroVisualsChange(e.target.value)} 
                                                placeholder={isEditorial ? "e.g. classic tweed jacket, wireframe spectacles" : "e.g. silver messy hair, glowing neon nanosuit"} 
                                                className={`w-full text-[10px] p-2 resize-none rounded focus:outline-none font-sans ${
                                                     isEditorial
                                                          ? 'bg-white border border-stone-300 text-stone-900 focus:border-stone-500'
                                                          : 'bg-slate-900 border border-slate-700 text-white focus:border-blue-500'
                                                }`}
                                           />
                                      </div>
                                 </div>
                            </div>

                            {/* CO-STAR CARD (PURPLE THEME) */}
                            <div className={`relative group min-h-[415px] pb-3 px-3 rounded-xl overflow-hidden flex flex-col justify-between transition-all duration-300 transform hover:-translate-y-2 hover:scale-[1.01] cursor-pointer ${
                                 isEditorial
                                      ? `border bg-stone-100/90 ${props.friend ? 'border-stone-500 shadow-md' : 'border-stone-300 hover:border-stone-400'}`
                                      : `border-4 bg-slate-950 ${props.friend ? 'border-purple-500 hover:shadow-[0_0_24px_rgba(168,85,247,0.5)]' : 'border-purple-800 hover:shadow-[0_0_24px_rgba(168,85,247,0.3)] hover:border-purple-500'}`
                            }`}>
                                 <input type="file" accept="image/*,.heic" id="friend-upload-input" className="hidden" onChange={(e) => { if (e.target.files?.[0]) { props.onFriendUpload(e.target.files[0]); } e.target.value = ''; }} />
                                 
                                 {props.friend ? (
                                      <div className={`relative w-full h-36 mt-3 rounded-lg overflow-hidden group/main min-h-[144px] flex-shrink-0 ${isEditorial ? 'border border-stone-300' : 'border-2 border-black'}`}>
                                           <label htmlFor="friend-upload-input" className="absolute inset-0 cursor-pointer z-30">
                                                <span className="sr-only">{t('setup.auto9', 'Upload Co-Star')}</span>
                                           </label>
                                           <img src={`data:image/jpeg;base64,${props.friend.base64}`} alt="Co-Star Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                           <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                                           
                                           <div className={isEditorial ? "absolute top-1.5 left-1.5 bg-[#4c443c] text-stone-100 font-sans text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded shadow-sm z-20" : "absolute top-1.5 left-1.5 bg-gray-900 text-purple-400 text-white border border-black font-mono text-[10px] uppercase px-1.5 py-0.5 rotate-[2deg] z-20 font-bold shadow-[1px_1px_0px_#000]"}>
                                                {isEditorial ? "SUPPORTING CAST READY" : "CO-STAR READY"}
                                           </div>

                                           <div className={`absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 ${isEditorial ? 'bg-stone-900/90' : 'bg-purple-950/90'}`}>
                                                <span className={`text-xs font-bold uppercase tracking-wider ${isEditorial ? 'text-stone-100 font-sans' : 'text-yellow-400 font-mono'}`}>{isEditorial ? "REPLACE IMAGE" : "CHANGE PROFILE"}</span>
                                                <span className={`text-[8px] font-mono mt-0.5 ${isEditorial ? 'text-stone-300' : 'text-gray-300'}`}>{isEditorial ? "SELECT FILE" : "CLICK TO SWAP"}</span>
                                           </div>
                                      </div>
                                 ) : (
                                      <label htmlFor="friend-upload-input" className={`flex flex-col justify-center items-center text-center h-36 mt-3 p-4 relative z-20 min-h-[144px] flex-shrink-0 rounded-lg border-2 border-dashed ${isEditorial ? 'border-stone-300 hover:bg-stone-200' : 'border-purple-800 hover:bg-purple-950/50'} cursor-pointer transition-colors group/upload`}>
                                           <div className="absolute top-2 left-2 right-2 flex justify-end items-center">
                                                <span className={isEditorial ? "bg-stone-200 text-stone-600 font-sans text-[10px] uppercase font-bold px-2 py-0.5 rounded" : "bg-purple-900 border border-purple-700 text-purple-200 font-mono text-[10px] uppercase px-2 py-0.5 rounded-full"}>{t('setup.auto10', 'OPTIONAL')}</span>
                                           </div>

                                           <div className={`mt-2 mb-1 transform group-hover/upload:scale-110 transition-transform duration-300 ${isEditorial ? 'text-stone-400' : 'text-purple-400'}`}>
                                                <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                     <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                           </div>
                                           <span className={`text-sm tracking-wide ${isEditorial ? 'font-sans font-bold text-stone-700' : 'font-mono text-purple-300'}`}>{isEditorial ? "PORTRAIT" : "CO-STAR AVATAR"}</span>
                                           <span className={`text-[9px] uppercase tracking-widest font-mono mt-0.5 ${isEditorial ? 'text-stone-400' : 'text-gray-400'}`}>{isEditorial ? "CLICK TO ADD FILE" : "CLICK TO SCAN"}</span>
                                      </label>
                                 )}
                                 
                                 <div className="flex flex-col flex-1 justify-between pt-3">
                                      <div className="text-left">
                                           <span className={`text-[9px] font-mono tracking-wider font-bold block mb-0.5 ${isEditorial ? 'text-stone-600' : 'text-purple-400 animate-pulse'}`}>
                                                {isEditorial ? "📜 SUPPORTING CAST REGISTERED" : "🌟 ALLY DISCOVERED"}
                                           </span>
                                           <p className={`text-sm leading-none uppercase tracking-wide truncate ${isEditorial ? 'text-stone-850 font-sans font-black' : 'text-white font-mono'}`}>
                                                {isEditorial ? "CO-STAR / ALLY" : "SOCIUS / SIDEKICK"}
                                           </p>
                                           <p className={`text-[9.5px] line-clamp-1 mt-0.5 font-sans ${isEditorial ? 'text-stone-600' : 'text-gray-300'}`}>{props.friend?.desc || (isEditorial ? "Supporting the main narrative thread..." : "Ready for combat support")}</p>
                                      </div>

                                      <div className={`mt-2 pt-2 border-t ${isEditorial ? 'border-stone-200' : 'border-slate-800'}`}>
                                           <div className="flex items-center justify-between mb-1">
                                                <span className={`text-[9px] font-mono font-bold tracking-wide block text-left ${isEditorial ? 'text-stone-600' : 'text-purple-400'}`}>
                                                     {isEditorial ? "✒️ VISUAL DESIGN:" : "🎨 ATTIRE & HAIR:"}
                                                </span>
                                                <button
                                                     type="button"
                                                     onClick={(e) => { e.preventDefault(); handleSuggestField('friendVisuals', props.friendVisuals); }}
                                                     disabled={suggestingFields['friendVisuals']}
                                                     className={`text-[8px] rounded px-1.5 py-0.5 font-bold uppercase transition-all disabled:opacity-40 ${
                                                          isEditorial
                                                               ? 'bg-stone-200 hover:bg-stone-300 text-stone-700'
                                                               : 'bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-500/40'
                                                     }`}
                                                >
                                                     {suggestingFields['friendVisuals'] ? '✨...' : '✨ SUGGEST'}
                                                </button>
                                           </div>
                                           <textarea 
                                                rows={2}
                                                value={props.friendVisuals} 
                                                onChange={(e) => props.onFriendVisualsChange(e.target.value)} 
                                                placeholder={isEditorial ? "e.g. trench coat, slicked back hair" : "e.g. auburn ponytail, leather bomber jacket"} 
                                                className={`w-full text-[10px] p-2 resize-none rounded focus:outline-none font-sans ${
                                                     isEditorial
                                                          ? 'bg-white border border-stone-300 text-stone-900 focus:border-stone-500'
                                                          : 'bg-slate-900 border border-slate-700 text-white focus:border-purple-500'
                                                }`}
                                           />
                                      </div>
                                 </div>
                            </div>

                            {/* VILLAIN CARD (RED THEME) */}
                            <div className={`relative group min-h-[415px] pb-3 px-3 rounded-xl overflow-hidden flex flex-col justify-between transition-all duration-300 transform hover:-translate-y-2 hover:scale-[1.01] cursor-pointer ${
                                 isEditorial
                                      ? `border bg-stone-100/90 ${props.villain ? 'border-stone-500 shadow-md' : 'border-stone-300 hover:border-stone-400'}`
                                      : `border-4 bg-slate-950 ${props.villain ? 'border-red-500 hover:shadow-[0_0_24px_rgba(239,68,68,0.5)]' : 'border-red-800 hover:shadow-[0_0_24px_rgba(239,68,68,0.3)] hover:border-red-500'}`
                            }`}>
                                 <input type="file" accept="image/*,.heic" id="villain-upload-input" className="hidden" onChange={(e) => { if (e.target.files?.[0]) { props.onVillainUpload(e.target.files[0]); } e.target.value = ''; }} />
                                 
                                 {props.villain ? (
                                      <div className={`relative w-full h-36 mt-3 rounded-lg overflow-hidden group/main min-h-[144px] flex-shrink-0 ${isEditorial ? 'border border-stone-300' : 'border-2 border-black'}`}>
                                           <label htmlFor="villain-upload-input" className="absolute inset-0 cursor-pointer z-30">
                                                <span className="sr-only">{t('setup.auto11', 'Upload Villain')}</span>
                                           </label>
                                           <img src={`data:image/jpeg;base64,${props.villain.base64}`} alt="Villain Preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                           <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                                           
                                           <div className={isEditorial ? "absolute top-1.5 left-1.5 bg-[#4c443c] text-stone-100 font-sans text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded shadow-sm z-20" : "absolute top-1.5 left-1.5 bg-gray-900 text-red-400 text-white border border-black font-mono text-[10px] uppercase px-1.5 py-0.5 rotate-[-1deg] z-20 font-bold shadow-[1px_1px_0px_#000] animate-pulse"}>
                                                {isEditorial ? "ANTAGONIST ACTIVE" : "NEMESIS ACTIVE"}
                                           </div>

                                           <div className={`absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 ${isEditorial ? 'bg-stone-900/90' : 'bg-red-950/90'}`}>
                                                <span className={`text-xs font-bold uppercase tracking-wider ${isEditorial ? 'text-stone-100 font-sans' : 'text-yellow-400 font-mono'}`}>{isEditorial ? "REPLACE IMAGE" : "CHANGE PROFILE"}</span>
                                                <span className={`text-[8px] font-mono mt-0.5 ${isEditorial ? 'text-stone-300' : 'text-gray-300'}`}>{isEditorial ? "SELECT FILE" : "CLICK TO SWAP"}</span>
                                           </div>
                                      </div>
                                 ) : (
                                      <label htmlFor="villain-upload-input" className={`flex flex-col justify-center items-center text-center h-36 mt-3 p-4 relative z-20 min-h-[144px] flex-shrink-0 rounded-lg border-2 border-dashed ${isEditorial ? 'border-stone-300 hover:bg-stone-200' : 'border-red-800 hover:bg-red-950/50'} cursor-pointer transition-colors group/upload`}>
                                           <div className="absolute top-2 left-2 right-2 flex justify-end items-center">
                                                <span className={isEditorial ? "bg-stone-200 text-stone-600 font-sans text-[10px] uppercase font-bold px-2 py-0.5 rounded" : "bg-red-950 border border-red-900 text-red-200 font-mono text-[10px] uppercase px-2 py-0.5 rounded-full"}>{t('setup.auto12', 'OPTIONAL')}</span>
                                           </div>

                                           <div className={`mt-2 mb-1 transform group-hover/upload:scale-110 transition-transform duration-300 ${isEditorial ? 'text-stone-400' : 'text-red-400'}`}>
                                                <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                     <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728m-1.414-1.414a7 7 0 000-9.9" />
                                                     <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01" />
                                                </svg>
                                           </div>
                                           <span className={`text-sm tracking-wide ${isEditorial ? 'font-sans font-bold text-stone-700' : 'font-mono text-red-300'}`}>{isEditorial ? "PORTRAIT" : "ARC-RIVAL AVATAR"}</span>
                                           <span className={`text-[9px] uppercase tracking-widest font-mono mt-0.5 ${isEditorial ? 'text-stone-400' : 'text-gray-400'}`}>{isEditorial ? "CLICK TO ADD FILE" : "CLICK TO SCAN"}</span>
                                      </label>
                                 )}
                                 
                                 <div className="flex flex-col flex-1 justify-between pt-3">
                                      <div className="text-left">
                                           <span className={`text-[9px] font-mono tracking-wider font-bold block mb-0.5 ${isEditorial ? 'text-stone-600' : 'text-red-500'}`}>
                                                {isEditorial ? "⚖️ CONFLICT CORE REGISTERED" : "⚠️ MENACE UNLEASHED"}
                                           </span>
                                           <p className={`text-sm leading-none uppercase tracking-wide truncate ${isEditorial ? 'text-stone-850 font-sans font-black' : 'text-white font-mono'}`}>
                                                {isEditorial ? "ANTAGONIST" : "ARC-RIVAL"}
                                           </p>
                                           <p className={`text-[9.5px] line-clamp-1 mt-0.5 font-sans ${isEditorial ? 'text-stone-600' : 'text-gray-300'}`}>{props.villain?.desc || (isEditorial ? "The central source of narrative tension..." : "Plotting doom...")}</p>
                                      </div>

                                      <div className={`mt-2 pt-2 border-t ${isEditorial ? 'border-stone-200' : 'border-slate-800'}`}>
                                           <div className="flex items-center justify-between mb-1">
                                                <span className={`text-[9px] font-mono font-bold tracking-wide block text-left ${isEditorial ? 'text-stone-600' : 'text-red-400'}`}>
                                                     {isEditorial ? "✒️ VISUAL DESIGN:" : "🎨 ATTIRE & HAIR:"}
                                                </span>
                                                <button
                                                     type="button"
                                                     onClick={(e) => { e.preventDefault(); handleSuggestField('villainVisuals', props.villainVisuals); }}
                                                     disabled={suggestingFields['villainVisuals']}
                                                     className={`text-[8px] rounded px-1.5 py-0.5 font-bold uppercase transition-all disabled:opacity-40 ${
                                                          isEditorial
                                                               ? 'bg-stone-200 hover:bg-stone-300 text-stone-700'
                                                               : 'bg-red-900/60 hover:bg-red-800 text-red-200 border border-red-500/40'
                                                     }`}
                                                >
                                                     {suggestingFields['villainVisuals'] ? '✨...' : '✨ SUGGEST'}
                                                </button>
                                           </div>
                                           <textarea 
                                                rows={2}
                                                value={props.villainVisuals} 
                                                onChange={(e) => props.onVillainVisualsChange(e.target.value)} 
                                                placeholder={isEditorial ? "e.g. sharp tailored suit, slicked hair" : "e.g. regal high-collared obsidian armor"} 
                                                className={`w-full text-[10px] p-2 resize-none rounded focus:outline-none font-sans ${
                                                     isEditorial
                                                          ? 'bg-white border border-stone-300 text-stone-900 focus:border-stone-500'
                                                          : 'bg-slate-900 border border-slate-700 text-white focus:border-red-500'
                                                }`}
                                           />
                                      </div>
                                 </div>
                            </div>

                        </div>

                        {/* CHARACTER VAULT SAVED ITEMS MODULE */}
                        {savedCharacters.length > 0 && (
                            <div className={`mt-5 pt-4 border-t-2 ${isEditorial ? 'border-stone-200' : 'border-slate-700'}`}>
                                <div className="flex justify-between items-center mb-2.5">
                                     <span className={isEditorial ? "font-sans text-xs uppercase text-stone-700 font-black tracking-wider" : "font-mono text-xs uppercase text-yellow-300 font-bold tracking-wider"}>
                                          {isEditorial ? "🗃️ Character Index (Stored Profiles)" : "🗃️ Character Vault (Saved in pg DB)"}
                                     </span>
                                     <span className={`text-[10px] font-mono ${isEditorial ? 'text-stone-500' : 'text-slate-400'}`}>
                                          {savedCharacters.length} active profiles
                                     </span>
                                </div>
                                <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar pr-1">
                                     {savedCharacters.map((char) => (
                                          <div 
                                               key={char.id} 
                                               className={`flex-shrink-0 w-36 rounded-lg p-2 flex flex-col justify-between group/vault relative text-left ${
                                                    isEditorial 
                                                         ? 'bg-stone-205 border border-stone-300' 
                                                         : 'bg-gray-950/50 border border-cyan-800'
                                               }`}
                                          >
                                               <div className={`relative h-20 w-full mb-1 rounded overflow-hidden ${isEditorial ? 'bg-stone-200' : 'bg-slate-950'}`}>
                                                    {char.image_url ? (
                                                         <img 
                                                              src={char.image_url.startsWith('data:') ? char.image_url : `data:image/jpeg;base64,${char.image_url}`} 
                                                              alt={char.character_name} 
                                                              className="w-full h-full object-cover select-none" 
                                                         />
                                                    ) : (
                                                         <div className={`w-full h-full flex items-center justify-center text-xs font-mono ${isEditorial ? 'text-stone-500' : 'text-slate-400'}`}>
                                                              [No Avatar]
                                                         </div>
                                                    )}
                                                    <button 
                                                         onClick={(e) => { e.stopPropagation(); handleDeleteFromVault(char.id); }}
                                                         className="absolute top-1 right-1 bg-black/75 hover:bg-gray-900 text-red-400 rounded p-1 text-white border border-black opacity-0 group-hover/vault:opacity-100 transition-opacity duration-200"
                                                         title="Retire Character"
                                                    >
                                                         <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                         </svg>
                                                    </button>
                                               </div>
                                               <div>
                                                    <p className={`text-xs uppercase truncate leading-tight select-none ${isEditorial ? 'font-sans font-black text-stone-850' : 'font-mono font-bold text-gray-200'}`}>
                                                         {char.character_name}
                                                    </p>
                                                    <span className={`text-[9px] font-mono uppercase px-1 py-0.2 rounded border inline-block mt-0.5 select-none ${
                                                         isEditorial
                                                              ? char.role_type === 'Hero' ? 'bg-stone-200 text-stone-700 border-stone-300' :
                                                                char.role_type === 'Co-Star' ? 'bg-stone-200 text-stone-700 border-stone-300' :
                                                                'bg-stone-300 text-stone-800 border-stone-400'
                                                              : char.role_type === 'Hero' ? 'bg-blue-900/40 text-blue-300 border-blue-800 border-black' :
                                                                char.role_type === 'Co-Star' ? 'bg-purple-900/40 text-purple-300 border-purple-800 border-black' :
                                                                'bg-red-900/40 text-red-300 border-red-800 border-black'
                                                    }`}>
                                                         {isEditorial 
                                                              ? char.role_type === 'Hero' ? 'Protagonist' : char.role_type === 'Co-Star' ? 'Supporting' : 'Antagonist'
                                                              : char.role_type
                                                         }
                                                    </span>
                                               </div>
                                               
                                               <div className="mt-2 grid grid-cols-1 gap-1">
                                                    <button 
                                                         onClick={() => {
                                                              const persona = { base64: char.image_url || '', desc: char.description || '' };
                                                              if (char.role_type === 'Hero') props.onSelectHero(persona);
                                                              else if (char.role_type === 'Co-Star') props.onSelectFriend(persona);
                                                              else if (char.role_type === 'Villain') props.onSelectVillain(persona);
                                                         }}
                                                         className={`text-[10px] py-0.5 uppercase tracking-wide rounded border transition-colors ${
                                                              isEditorial
                                                                   ? 'bg-stone-200 hover:bg-[#3c3730] text-stone-700 hover:text-white border-stone-300 font-sans font-bold'
                                                    : 'bg-zinc-805 hover:bg-gray-900 text-yellow-400 font-mono text-gray-300 hover:text-black border-black'
                                                         }`}
                                                    >
                                                         {isEditorial ? "ASSIGN ROLE" : "CAST ROLE"}
                                                    </button>
                                               </div>
                                          </div>
                                     ))}
                                </div>
                            </div>
                        )}

                        {/* CHARACTER VISUAL COHESION CONTROLS (HAIR & OUTIFT STYLING) */}
                        <div className={`mt-4 p-5 rounded-lg text-left ${
                             isEditorial 
                                  ? 'bg-stone-100/90 border border-stone-300 shadow-sm' 
                                  : 'bg-slate-900 border border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                        }`}>
                             <div className="flex items-center gap-2 mb-2">
                                  <span className="text-xl">{isEditorial ? '✒️' : '💈'}</span>
                                  <span className={
                                       isEditorial 
                                            ? "font-sans text-sm uppercase text-stone-700 font-black tracking-wider" 
                                            : "font-mono text-sm uppercase text-green-400 font-extrabold tracking-wider animate-pulse"
                                  }>
                                       {isEditorial ? "Character Cohesion & Editorial Style Sheets" : "Character Visual Cohesion & Design Coordinates"}
                                  </span>
                             </div>
                             <p className={`text-xs mb-4 font-sans leading-relaxed ${isEditorial ? 'text-stone-600' : 'text-gray-300'}`}>
                                  {isEditorial 
                                       ? "Specify character descriptions, garments, and recurring motifs. To ensure style continuity across generated manuscript chapters, these visual anchors are blended dynamically into every scene composition."
                                       : "Specify matching hairstyles, garments, and distinctive accessories below. To guarantee absolute design consistency across generated panels, our AI engines enforce these descriptors recursively into every scene's prompt layout."
                                  }
                             </p>
                             <div className="hidden">
                                   {/* Visual References moved into Character Cards */}
                              </div>

                                  {/* Structured Nemesis Identity Schema (Commercial Grade) */}
                                  <div className={`md:col-span-3 mt-4 p-4 rounded ${
                                       isEditorial 
                                            ? 'border border-stone-300 bg-stone-50' 
                                            : 'border-2 border-red-500/30 bg-slate-950 shadow-[0_4px_12px_rgba(0,0,0,0.8)]'
                                  }`}>
                                        <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-3 mb-3 gap-2 ${isEditorial ? 'border-stone-200' : 'border-red-500/20'}`}>
                                             <div className="flex flex-col text-left">
                                                  <span className={`text-xs uppercase tracking-wide flex items-center gap-1.5 leading-tight select-none ${isEditorial ? 'font-sans font-black text-stone-700' : 'font-mono font-black text-red-400'}`}>
                                                       {isEditorial ? "🔒 Antagonist Archetype Schema (Persistent Character Model)" : "🔒 Nemesis Identity Schema (Google Firestore Sync Layer)"}
                                                  </span>
                                                  <span className={`text-[10px] ${isEditorial ? 'text-stone-500 font-sans' : 'text-gray-400 font-mono'}`}>
                                                       {isEditorial ? "Structured narrative constants and visual attention locks" : "Decoupled Persistence & Adaptive Layers • Attention Weights Matrix"}
                                                  </span>
                                             </div>
                                             <button
                                                  type="button"
                                                  onClick={() => {
                                                       const defaultSchema: CharacterIdentitySchema = {
                                                            actor_id: "villain_spy_01",
                                                            archetype_role: "Nemesis",
                                                            persistence_layer: {
                                                                 biometric_backbone: "Striking youthful female in early 20s, sharp calculating hazel eyes, subtle freckles, long dark wavy hair flowing past shoulders",
                                                                 structural_constants: "High defined cheekbones, a sharp angular jawline, a tiny distinct silver snake ear-cuff on left cartilage",
                                                                 chromatic_anchor: "Pale matte complexion, deep contrast shadows, crisp cold highlights cutting background lighting"
                                                            },
                                                            adaptive_layer: {
                                                                 sartorial_style: "Elegant high-society sophistication blended with covert tactical-stealth armor",
                                                                 active_wardrobe: "A tailored charcoal evening dress with hidden utility structural seams and a concealed thigh-holster line"
                                                            },
                                                            rendering_directives: {
                                                                 art_style_lock: "Photorealistic Neon Noir Comic Book Style, sharp cinematic chiaroscuro",
                                                                 continuity_weight: "HIGH"
                                                            }
                                                       };
                                                       props.onNemesisDnaChange(defaultSchema);
                                                       props.onVillainDnaChange(JSON.stringify(defaultSchema));
                                                  }}
                                                  className={`self-start sm:self-center text-[9.5px] rounded px-2.5 py-1 font-bold uppercase transition-all tracking-wide disabled:opacity-40 ${
                                                       isEditorial
                                                            ? 'bg-stone-200 hover:bg-[#3c3730] text-stone-700 hover:text-white border border-stone-300 font-sans'
                                                            : 'bg-red-955/65 hover:bg-red-900 text-red-200 border border-red-500/40 font-mono'
                                                  }`}
                                                  disabled={!props.villain}
                                             >
                                                  {isEditorial ? "✨ RESET NARRATIVE SCHEMAS" : "✨ RESET SCHEMA CONSTANTS"}
                                             </button>
                                        </div>

                                        {/* Persistence Layer inputs */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                             <div className={`flex flex-col gap-1 p-2 rounded border text-left ${isEditorial ? 'bg-stone-105 border-stone-200' : 'bg-slate-900/60 border-slate-800'}`}>
                                                  <label className={`text-[10px] uppercase font-bold tracking-wide ${isEditorial ? 'font-sans text-stone-700 font-black' : 'font-mono text-red-400'}`}>
                                                       {isEditorial ? "🧬 Physical Characteristics (Likeness)" : "🧬 Biometric Backbone (Likeness)"}
                                                  </label>
                                                  <textarea
                                                       value={props.nemesisDNA?.persistence_layer?.biometric_backbone || ""}
                                                       onChange={(e) => {
                                                            const updated = {
                                                                 ...props.nemesisDNA,
                                                                 persistence_layer: {
                                                                      ...props.nemesisDNA.persistence_layer,
                                                                      biometric_backbone: e.target.value
                                                                 }
                                                            };
                                                            props.onNemesisDnaChange(updated);
                                                            props.onVillainDnaChange(JSON.stringify(updated));
                                                       }}
                                                       disabled={!props.villain}
                                                       rows={6}
                                                       className={`w-full text-[11px] p-2 rounded focus:outline-none font-sans border ${
                                                            isEditorial
                                                                 ? 'bg-white border-stone-300 text-stone-900 focus:border-stone-500'
                                                                 : 'bg-slate-950 text-white focus:border-red-500 border-slate-800'
                                                       }`}
                                                       placeholder="Core physical features and likeness anchors..."
                                                  />
                                             </div>

                                             <div className={`flex flex-col gap-1 p-2 rounded border text-left ${isEditorial ? 'bg-stone-105 border-stone-200' : 'bg-slate-900/60 border-slate-800'}`}>
                                                  <label className={`text-[10px] uppercase font-bold tracking-wide ${isEditorial ? 'font-sans text-stone-700 font-black' : 'font-mono text-red-400'}`}>
                                                       {isEditorial ? "🔩 Distinctive Accessories (Details)" : "🔩 Structural Constants (Anchors)"}
                                                  </label>
                                                  <textarea
                                                       value={props.nemesisDNA?.persistence_layer?.structural_constants || ""}
                                                       onChange={(e) => {
                                                            const updated = {
                                                                 ...props.nemesisDNA,
                                                                 persistence_layer: {
                                                                      ...props.nemesisDNA.persistence_layer,
                                                                      structural_constants: e.target.value
                                                                 }
                                                            };
                                                            props.onNemesisDnaChange(updated);
                                                            props.onVillainDnaChange(JSON.stringify(updated));
                                                       }}
                                                       disabled={!props.villain}
                                                       rows={6}
                                                       className={`w-full text-[11px] p-2 rounded focus:outline-none font-sans border ${
                                                            isEditorial
                                                                 ? 'bg-white border-stone-300 text-stone-900 focus:border-stone-500'
                                                                 : 'bg-slate-950 text-white focus:border-red-500 border-slate-800'
                                                       }`}
                                                       placeholder="Piercings, scars, jewelry, micro-anchors..."
                                                  />
                                             </div>

                                             <div className={`flex flex-col gap-1 p-2 rounded border text-left ${isEditorial ? 'bg-stone-105 border-stone-200' : 'bg-slate-900/60 border-slate-800'}`}>
                                                  <label className={`text-[10px] uppercase font-bold tracking-wide ${isEditorial ? 'font-sans text-stone-700 font-black' : 'font-mono text-red-400'}`}>
                                                       {isEditorial ? "🎨 Contrast & Tone Guidelines (Atmosphere)" : "🎨 Chromatic Anchor (Lighting)"}
                                                  </label>
                                                  <textarea
                                                       value={props.nemesisDNA?.persistence_layer?.chromatic_anchor || ""}
                                                       onChange={(e) => {
                                                            const updated = {
                                                                 ...props.nemesisDNA,
                                                                 persistence_layer: {
                                                                      ...props.nemesisDNA.persistence_layer,
                                                                      chromatic_anchor: e.target.value
                                                                 }
                                                            };
                                                            props.onNemesisDnaChange(updated);
                                                            props.onVillainDnaChange(JSON.stringify(updated));
                                                       }}
                                                       disabled={!props.villain}
                                                       rows={6}
                                                       className={`w-full text-[11px] p-2 rounded focus:outline-none font-sans border ${
                                                            isEditorial
                                                                 ? 'bg-white border-stone-300 text-stone-900 focus:border-stone-500'
                                                                 : 'bg-slate-950 text-white focus:border-red-500 border-slate-800'
                                                       }`}
                                                       placeholder="Contrast parameters, spotlight anchors, tones..."
                                                  />
                                             </div>
                                        </div>

                                        {/* Adaptive Layer inputs */}
                                        <div className={`pt-3 mb-4 text-left font-sans border-t ${isEditorial ? 'border-stone-200' : 'border-slate-800/80'}`}>
                                             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                                                  <span className={`text-[11px] uppercase font-bold tracking-wide ${isEditorial ? 'font-sans text-stone-700 font-black' : 'font-mono text-cyan-400'}`}>
                                                       {isEditorial ? "🕶️ Attire Variations (Scene Clothing Closet)" : "🕶️ Adaptive Dressing (Active Wardrobe Closet)"}
                                                  </span>
                                                  <div className="flex items-center gap-1.5 mt-1 sm:mt-0">
                                                       <span className={`text-[10px] ${isEditorial ? 'text-stone-500' : 'text-gray-400'}`}>{t('setup.auto13', 'Presets:')}</span>
                                                       <select
                                                            onChange={(e) => {
                                                                 const updated = {
                                                                      ...props.nemesisDNA,
                                                                      adaptive_layer: {
                                                                           ...props.nemesisDNA.adaptive_layer,
                                                                           active_wardrobe: e.target.value
                                                                      }
                                                                 };
                                                                 props.onNemesisDnaChange(updated);
                                                                 props.onVillainDnaChange(JSON.stringify(updated));
                                                            }}
                                                            disabled={!props.villain}
                                                            className={`rounded text-[10px] px-2 py-0.5 border ${
                                                                 isEditorial 
                                                                      ? 'bg-white border-stone-300 text-stone-700' 
                                                                      : 'bg-slate-900 text-gray-300 border-slate-700/60'
                                                            }`}
                                                       >
                                                            {(wardrobePresetsByGenre[props.selectedGenre || 'Custom'] || wardrobePresetsByGenre['Custom']).map((preset, idx) => (
                                                                <option key={idx} value={preset}>
                                                                    {preset.substring(0, 40)}...
                                                                </option>
                                                            ))}
                                                       </select>
                                                  </div>
                                             </div>
                                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                  <div className="flex flex-col gap-1">
                                                       <label className={`text-[9.5px] uppercase font-semibold ${isEditorial ? 'text-stone-500' : 'text-gray-400'}`}>
                                                            {isEditorial ? "Sartorial Style / Theme" : "Sartorial Style Theme"}
                                                       </label>
                                                       <input
                                                            type="text"
                                                            value={props.nemesisDNA?.adaptive_layer?.sartorial_style || ""}
                                                            onChange={(e) => {
                                                                 const updated = {
                                                                      ...props.nemesisDNA,
                                                                      adaptive_layer: {
                                                                           ...props.nemesisDNA.adaptive_layer,
                                                                           sartorial_style: e.target.value
                                                                      }
                                                                 };
                                                                 props.onNemesisDnaChange(updated);
                                                                 props.onVillainDnaChange(JSON.stringify(updated));
                                                            }}
                                                            disabled={!props.villain}
                                                            className={`w-full text-xs p-2 rounded focus:outline-none font-sans border ${
                                                                 isEditorial
                                                                      ? 'bg-white border-stone-300 text-stone-900 focus:border-stone-500'
                                                                      : 'bg-slate-900 border-slate-800 text-white focus:border-red-500'
                                                            }`}
                                                       />
                                                  </div>
                                                  <div className="flex flex-col gap-1">
                                                       <label className={`text-[9.5px] uppercase font-semibold ${isEditorial ? 'text-stone-500' : 'text-gray-400'}`}>
                                                            {isEditorial ? "Current Scene Active Outfit" : "Current Scene Combat Closet"}
                                                       </label>
                                                       <input
                                                            type="text"
                                                            value={props.nemesisDNA?.adaptive_layer?.active_wardrobe || ""}
                                                            onChange={(e) => {
                                                                 const updated = {
                                                                      ...props.nemesisDNA,
                                                                      adaptive_layer: {
                                                                           ...props.nemesisDNA.adaptive_layer,
                                                                           active_wardrobe: e.target.value
                                                                      }
                                                                 };
                                                                 props.onNemesisDnaChange(updated);
                                                                 props.onVillainDnaChange(JSON.stringify(updated));
                                                            }}
                                                            disabled={!props.villain}
                                                            className={`w-full text-xs p-2 rounded focus:outline-none font-sans border ${
                                                                 isEditorial
                                                                      ? 'bg-white border-stone-300 text-stone-900 focus:border-stone-500'
                                                                      : 'bg-slate-900 border-slate-800 text-white focus:border-red-500'
                                                            }`}
                                                       />
                                                  </div>
                                             </div>
                                        </div>

                                        {/* Coordinate Attention Weighting Details */}
                                        <div className={`pt-3 mt-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-left border-t ${isEditorial ? 'border-stone-200' : 'border-slate-800/80'}`}>
                                             <div className="flex flex-col gap-1 w-full md:w-auto">
                                                  <label className={`text-[10px] uppercase font-bold tracking-wide flex items-center gap-1 ${isEditorial ? 'font-sans text-stone-700 font-black' : 'font-mono text-yellow-400'}`}>
                                                       {isEditorial ? "🔒 Continuity Constraints Locked:" : "🔒 Attention Matrix Descriptors Locked:"}
                                                  </label>
                                                  <div className="flex flex-wrap gap-1.5 mt-1">
                                                        {(() => {
                                                            const pLayer = props.nemesisDNA?.persistence_layer;
                                                            if (!pLayer) return null;
                                                            const combined = `${pLayer.biometric_backbone || ''}, ${pLayer.structural_constants || ''}`;
                                                            const keywords = combined.split(/[,.]/).map(s => s.trim()).filter(s => s.length > 3 && s.length < 30).slice(0, 4);
                                                            if (keywords.length === 0) {
                                                                return <span className={`text-[9px] font-mono border rounded px-2 py-0.5 ${isEditorial ? 'bg-stone-200 border-stone-300 text-stone-500' : 'bg-slate-900 border-slate-700 text-gray-500'}`}>Awaiting DNA Input...</span>;
                                                            }
                                                            return keywords.map((kw, i) => (
                                                                <span key={i} className={`text-[9px] font-mono border rounded px-2 py-0.5 flex items-center gap-1 ${isEditorial ? 'bg-stone-200 border-stone-300 text-stone-700' : 'bg-red-950 border-red-500/30 text-red-200'}`}>
                                                                    <span>{kw}</span>
                                                                    <span className={`text-[7.5px] px-1 font-bold rounded-sm ${isEditorial ? 'bg-stone-500 text-stone-100 font-sans' : 'bg-red-700 text-white'}`}>1.4 Locked</span>
                                                                </span>
                                                            ));
                                                        })()}
                                                  </div>
                                             </div>
                                             <div className="flex gap-3 items-center w-full md:w-auto mt-2 md:mt-0">
                                                  <div className="flex flex-col gap-1 w-1/2 md:w-32">
                                                       <label className={`text-[9px] uppercase ${isEditorial ? 'text-stone-500' : 'text-gray-400'}`}>{isEditorial ? "Cohesion Strength" : "Cohesion Weight"}</label>
                                                       <div className={`flex rounded overflow-hidden border ${isEditorial ? 'border-stone-300' : 'border-slate-700'}`}>
                                                            {(['LOW', 'MEDIUM', 'HIGH'] as const).map((w) => (
                                                                 <button
                                                                      key={w}
                                                                      type="button"
                                                                      onClick={() => {
                                                                           const updated = {
                                                                                ...props.nemesisDNA,
                                                                                rendering_directives: {
                                                                                     ...props.nemesisDNA.rendering_directives,
                                                                                     continuity_weight: w
                                                                                }
                                                                           };
                                                                           props.onNemesisDnaChange(updated);
                                                                           props.onVillainDnaChange(JSON.stringify(updated));
                                                                      }}
                                                                      disabled={!props.villain}
                                                                      className={`flex-1 text-[8.5px] py-1 font-mono uppercase font-black transition-colors ${
                                                                           props.nemesisDNA?.rendering_directives?.continuity_weight === w
                                                                                ? isEditorial ? 'bg-[#3c3730] text-stone-50' : 'bg-gray-900 text-red-400 text-white'
                                                                                : isEditorial ? 'bg-stone-200 text-stone-600 hover:bg-stone-300' : 'bg-slate-900 text-gray-400 hover:text-white'
                                                                      }`}
                                                                 >
                                                                      {w}
                                                                 </button>
                                                            ))}
                                                       </div>
                                                  </div>
                                                  <div className="flex flex-col gap-1 w-1/2 md:w-44">
                                                       <label className={`text-[9px] uppercase ${isEditorial ? 'text-stone-500' : 'text-gray-400'}`}>{isEditorial ? "Visual Style Continuity" : "Art Style Lock"}</label>
                                                            <input
                                                                 type="text"
                                                                 value={props.nemesisDNA?.rendering_directives?.art_style_lock || ""}
                                                                 onChange={(e) => {
                                                                      const updated = {
                                                                           ...props.nemesisDNA,
                                                                           rendering_directives: {
                                                                                ...props.nemesisDNA.rendering_directives,
                                                                                art_style_lock: e.target.value
                                                                           }
                                                                      };
                                                                      props.onNemesisDnaChange(updated);
                                                                      props.onVillainDnaChange(JSON.stringify(updated));
                                                                 }}
                                                                 disabled={!props.villain}
                                                                 className={`w-full text-xs p-1 rounded focus:outline-none font-sans border ${
                                                                      isEditorial 
                                                                           ? 'bg-white border-stone-300 text-stone-900 focus:border-stone-500' 
                                                                           : 'bg-slate-900 border-slate-800 text-white focus:border-red-500'
                                                                 }`}
                                                            />
                                                       </div>
                                                  </div>
                                             </div>
                                        </div>
                                   </div>

                         {/* Terms Guardrails/* Terms Guardrails disclaimer style */}
                        <div className="mt-4 p-2.5 bg-slate-900/60 border border-slate-700 rounded text-[11px] text-gray-400 leading-tight">
                             <span className="text-yellow-400 font-bold uppercase tracking-wider">{t('setup.auto22', '🔒 MULTIVERSE SECURITY:')}</span> Pictures are parsed server-side to extract spatial vectors for coherent layout synthesis. No files are stored or kept. Build guidelines apply.
                        </div>
                    </div>

                    {/* Section 2: Config Console (5 cols) */}
                    <div className={`lg:col-span-5 flex flex-col ${sCard}`}>
                        <div className={sHeaderBadgeRed}>
                             {isEditorial ? "2. SCENARIO DESIGN" : "2. ENVIRONMENT SYNAPSE"}
                        </div>

                        <div className="flex flex-col gap-5 mt-4 flex-1">
                            
                            {/* Visual Genre Selection (Grid of Custom Chips) */}
                            <div>
                                <p className={sLabel}>{isEditorial ? "Narrative Direction (Genre)" : "Select Story Path (Genre)"}</p>
                                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                    {dynamicCategories.filter(c => c.category_type === 'Genre').map((cat) => {
                                        const g = cat.name;
                                        const isSelected = props.selectedGenre === g;
                                        return (
                                            <button 
                                                key={g}
                                                onClick={() => props.onGenreChange(g)}
                                                className={`py-2 px-3 text-left rounded transition-all duration-150 transform flex items-center gap-1.5 ${
                                                    isSelected 
                                                    ? (isEditorial
                                                        ? 'bg-stone-800 text-stone-50 border border-stone-700 font-semibold shadow-sm'
                                                        : 'bg-gray-900 text-yellow-400 text-black border-2 border-black font-bold -rotate-1 translate-x-px translate-y-px shadow-[2px_2px_0px_rgba(0,0,0,1)]')
                                                    : (isEditorial
                                                        ? 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100 hover:text-stone-900 hover:border-stone-400'
                                                        : 'bg-slate-900 text-gray-300 border-2 border-slate-700 hover:bg-slate-750 hover:text-white hover:border-gray-500 hover:-translate-y-px shadow-sm')
                                                }`}
                                            >
                                                <span className="text-base select-none">{cat.emoji || "📖"}</span>
                                                <span className={`text-xs tracking-wide uppercase truncate ${isEditorial ? 'font-sans font-medium' : 'font-mono'}`}>{g}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Visual Art Style Selection */}
                            <div className="mt-4">
                                <p className={sLabel}>{isEditorial ? "Visual Art Direction" : "Select Visual Art Style"}</p>
                                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                    {ART_STYLES.map((style) => {
                                        const isSelected = props.selectedArtStyle === style.id;
                                        return (
                                            <button 
                                                key={style.id}
                                                onClick={() => props.onArtStyleChange && props.onArtStyleChange(style.id)}
                                                className={`py-2 px-3 text-left rounded transition-all duration-150 transform flex items-center gap-1.5 ${
                                                    isSelected 
                                                    ? (isEditorial
                                                        ? 'bg-stone-800 text-stone-50 border border-stone-700 font-semibold shadow-sm'
                                                        : 'bg-gray-900 text-pink-400 text-black border-2 border-black font-bold -rotate-1 translate-x-px translate-y-px shadow-[2px_2px_0px_rgba(0,0,0,1)]')
                                                    : (isEditorial
                                                        ? 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100 hover:text-stone-900 hover:border-stone-400'
                                                        : 'bg-slate-900 text-gray-300 border-2 border-slate-700 hover:bg-slate-750 hover:text-white hover:border-gray-500 hover:-translate-y-px shadow-sm')
                                                }`}
                                            >
                                                <span className="text-base select-none">🎨</span>
                                                <span className={`text-xs tracking-wide uppercase truncate ${isEditorial ? 'font-sans font-medium' : 'font-mono'}`}>{style.name}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>


                            {/* Dense Grid chips for Common Languages */}
                            <div>
                                <p className={isEditorial
                                    ? 'font-sans text-xs font-semibold tracking-widest text-stone-600 uppercase mb-2'
                                    : 'font-mono text-base tracking-wide text-cyan-400 uppercase mb-2'}>
                                    {isEditorial ? 'Multilingual Lexicon (Output)' : 'Multilingual Lexicon (Language)'}
                                </p>
                                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1 custom-scrollbar">
                                     {LANGUAGES.map((l) => {
                                         const isSelected = props.selectedLanguage === l.code;
                                         return (
                                             <button
                                                 key={l.code}
                                                 onClick={() => props.onLanguageChange(l.code)}
                                                 className={`text-[10px] px-2 py-1 uppercase font-bold tracking-tight rounded-md transition-all ${
                                                     isSelected
                                                     ? (isEditorial
                                                         ? 'bg-stone-800 text-stone-50 border border-stone-700 font-semibold shadow-sm font-sans'
                                                         : 'bg-gray-900 text-cyan-400 text-black border-2 border-black shadow-[1px_1px_0px_black] font-mono')
                                                     : (isEditorial
                                                         ? 'bg-white text-stone-500 border border-stone-200 hover:bg-stone-100 hover:text-stone-800 hover:border-stone-400 font-sans'
                                                         : 'bg-slate-900 text-gray-400 border-2 border-slate-700 hover:text-white hover:border-gray-500 font-mono')
                                                 }`}
                                             >
                                                 {l.name}
                                             </button>
                                         );
                                     })}
                                </div>
                            </div>

                            {/* Narrator TTS Pick Option */}
                            <div>
                                <p className={isEditorial
                                    ? 'font-sans text-xs font-semibold tracking-widest text-stone-600 uppercase mb-2'
                                    : 'font-mono text-base tracking-wide text-purple-300 uppercase mb-2'}>
                                    {isEditorial ? 'Voice Narrator Persona' : 'Voice Narrator (Gemini Audio)'}
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-1.5">
                                     {VOICES.map((v) => {
                                         const isSelected = props.selectedVoice === v.id;
                                         const emoji = v.id === 'Zephyr' ? '🌬️' : v.id === 'Kore' ? '🎭' : v.id === 'Fenrir' ? '🐺' : v.id === 'Puck' ? '🧚' : '💀';
                                         return (
                                             <button
                                                 key={v.id}
                                                 onClick={() => props.onVoiceChange(v.id)}
                                                 className={`flex items-center gap-2 px-3 py-1.5 text-left rounded transition-all text-xs ${
                                                     isSelected
                                                     ? (isEditorial
                                                         ? 'bg-stone-800 text-stone-50 border border-stone-700 font-semibold shadow-sm'
                                                         : 'bg-gray-900 text-purple-400 text-white border-2 border-black shadow-[2px_2px_0px_black] scale-[1.01] font-bold')
                                                     : (isEditorial
                                                         ? 'bg-white text-stone-500 border border-stone-200 hover:bg-stone-100 hover:text-stone-800 hover:border-stone-400'
                                                         : 'bg-slate-900 text-gray-400 border-2 border-slate-700 hover:text-white hover:border-gray-500')
                                                 }`}
                                             >
                                                 <span className="text-sm select-none">{emoji}</span>
                                                 <span className="font-sans tracking-wide uppercase truncate">{v.name}</span>
                                             </button>
                                         );
                                     })}
                                </div>
                            </div>

                            {/* Dynamic Textarea prompt for Custom Genre */}
                            {props.selectedGenre === 'Custom' && (
                                <div className="animate-fadeIn">
                                    <div className="flex items-center justify-between mb-1">
                                         <p className={isEditorial
                                             ? 'font-sans text-xs font-semibold tracking-widest text-stone-600 uppercase'
                                             : 'font-mono text-xs tracking-wide text-red-400 uppercase'}>
                                             {isEditorial ? 'Author\'s Premise (Optional)' : 'Enter Your Unique Multiverse Concept'}
                                         </p>
                                         <button
                                              type="button"
                                              onClick={() => handleSuggestField('customPremise', props.customPremise)}
                                              disabled={suggestingFields['customPremise']}
                                              className={isEditorial
                                                  ? 'text-[9.5px] bg-stone-100 hover:bg-stone-200 text-stone-600 border border-stone-300 rounded px-2 py-0.5 font-sans tracking-wide transition-all disabled:opacity-40 font-semibold uppercase'
                                                  : 'text-[9.5px] bg-red-950/60 hover:bg-red-900 text-red-200 border border-red-500/40 rounded px-2 py-0.5 font-mono tracking-wide transition-all disabled:opacity-40 font-bold uppercase'}
                                         >
                                              {suggestingFields['customPremise'] ? (isEditorial ? '✨ Thinking…' : '✨ THINKING...') : (isEditorial ? '✨ AI Suggest' : '✨ AI SUGGEST')}
                                         </button>
                                    </div>
                                    <textarea 
                                        value={props.customPremise} 
                                        onChange={(e) => props.onPremiseChange(e.target.value)} 
                                        placeholder={isEditorial
                                            ? "e.g., A Victorian-era botanist unravels an ancient conspiracy through encrypted herbarium notes…"
                                            : "Space cats fighting medieval robot wizards in a neon cathedral..."} 
                                        className={isEditorial
                                            ? 'w-full p-2 bg-white border border-stone-300 text-stone-800 text-xs font-sans h-16 resize-none rounded shadow-sm focus:outline-none focus:border-stone-500 transition-colors'
                                            : 'w-full p-2 bg-slate-950 border-2 border-black text-white text-xs font-sans h-16 resize-none rounded shadow-[inset_0px_2px_6px_rgba(0,0,0,0.8)] focus:outline-none focus:border-yellow-400 transition-colors'}
                                    />
                                </div>
                            )}

                            {/* ADVANCED STORY DIRECTIONS & NARRATIVE DIRECTIVES */}
                            <div className={`border-t pt-4 mt-2 text-left ${isEditorial ? 'border-stone-200' : 'border-slate-700/60 font-mono'}`}>
                                {/* Header with neon elements */}
                                <div className="flex flex-col mb-2.5">
                                     <div className="flex items-center justify-between">
                                          <div className={`flex items-center gap-1.5 ${isEditorial ? '' : 'animate-pulse'}`}>
                                               <span className="text-base">{isEditorial ? '📋' : '🔮'}</span>
                                               <span className={isEditorial
                                                   ? 'font-sans text-[13px] font-bold uppercase text-stone-700 tracking-wider'
                                                   : 'font-mono text-[13px] font-extrabold uppercase text-cyan-300 tracking-wider'}
                                                   style={isEditorial ? {} : { textShadow: '1px 1px 0px black' }}>
                                                    {isEditorial ? 'Saga Blueprint & Author Guidelines' : 'Saga Blueprint Console'}
                                               </span>
                                          </div>
                                          <button
                                               type="button"
                                               onClick={() => handleSuggestField('creativeDirectives', props.creativeDirectives)}
                                               disabled={suggestingFields['creativeDirectives']}
                                               className={isEditorial
                                                   ? 'text-[9px] bg-stone-100 hover:bg-stone-200 text-stone-600 border border-stone-300 rounded px-2 py-0.5 tracking-wide transition-all disabled:opacity-40 font-semibold uppercase font-sans'
                                                   : 'text-[9px] bg-cyan-950/60 hover:bg-cyan-900 text-cyan-200 border border-cyan-500/40 rounded px-2 py-0.5 tracking-wide transition-all disabled:opacity-40 font-bold uppercase hover:text-white'}
                                          >
                                               {suggestingFields['creativeDirectives']
                                                   ? (isEditorial ? '✨ Thinking…' : '⚡ AI THINKING...')
                                                   : (isEditorial ? '✨ AI Draft' : '✨ AI GENERATE BLUEPRINT')}
                                          </button>
                                     </div>
                                     <span className={`text-[10px] mt-1 leading-normal font-sans ${isEditorial ? 'text-stone-500' : 'text-slate-400'}`}>
                                          {isEditorial
                                              ? 'Outline plot structure, chapter goals, themes, and any narrative constraints for your manuscript.'
                                              : 'Specify plot outlines, milestones, customer spotlights, or custom narrative formulas.'}
                                     </span>
                                </div>

                                {/* PRESETS CONTAINER WITH ACCORDION / CONTAINER CARDS */}
                                <div className={isEditorial
                                    ? 'bg-stone-100/70 border border-stone-200 rounded-xl p-3.5 mb-4'
                                    : 'bg-slate-900/60 border-2 border-black rounded p-3.5 mb-4 shadow-[inner_0px_2px_8px_rgba(0,0,0,0.5)]'}>
                                     <span className={`text-[10px] uppercase tracking-widest font-bold block mb-2 ${isEditorial ? 'text-stone-500 font-sans' : 'text-gray-400 font-mono'}`}>
                                          {isEditorial ? '📚 Structural Templates' : '⚡ Choose Predefined Narrative Blueprint'}
                                     </span>

                                     {/* Horizontal Scroll of presets cards */}
                                     <div className="flex gap-2.5 overflow-x-auto pb-2 mb-3.5 custom-scrollbar snap-x">
                                          {(isEditorial ? [
                                               {
                                                    name: "Three-Act Structure",
                                                    emoji: "📐",
                                                    desc: "Classic setup, confrontation, resolution arc.",
                                                    prompt: "STRUCTURE: THREE-ACT NARRATIVE\n[ACT 1 — SETUP]: Introduce protagonist in their ordinary world, establish the inciting incident.\n[ACT 2 — CONFRONTATION]: Rising stakes, character growth, midpoint revelation.\n[ACT 3 — RESOLUTION]: Climax confrontation, denouement, thematic resonance."
                                               },
                                               {
                                                    name: "Hero's Journey",
                                                    emoji: "🗺️",
                                                    desc: "Departure, initiation, and return.",
                                                    prompt: "STRUCTURE: HERO'S JOURNEY (CAMPBELL)\n[CALL TO ADVENTURE]: Protagonist receives the call and initially refuses.\n[CROSSING THE THRESHOLD]: Commits to the journey, enters the unknown.\n[ORDEAL]: Faces the central crisis — death and rebirth motif.\n[RETURN]: Brings wisdom or a gift back to the ordinary world."
                                               },
                                               {
                                                    name: "In Medias Res",
                                                    emoji: "⚡",
                                                    desc: "Start at the dramatic peak, then unfold.",
                                                    prompt: "STRUCTURE: IN MEDIAS RES\n[OPENING]: Begin at the height of action — mid-scene, mid-crisis.\n[FLASHBACK]: Weave in backstory through memory, dialogue, and discovery.\n[REVELATION]: The past catches up and recontextualises the opening."
                                               },
                                               {
                                                    name: "Parallel Narratives",
                                                    emoji: "🔀",
                                                    desc: "Two timelines converging on one truth.",
                                                    prompt: "STRUCTURE: PARALLEL NARRATIVES\n[TIMELINE A]: Contemporary storyline revealing the present consequences.\n[TIMELINE B]: Historical or past storyline revealing origins.\n[CONVERGENCE]: Both timelines intersect in a climactic revelation that recontextualises both."
                                               },
                                               {
                                                    name: "Epistolary Form",
                                                    emoji: "✉️",
                                                    desc: "Told through letters, journals, documents.",
                                                    prompt: "STRUCTURE: EPISTOLARY NARRATIVE\n[FORMAT]: Story told through letters, diary entries, news clippings, and documents.\n[UNRELIABLE NARRATOR]: Each document reveals only a partial truth.\n[COLLAGE EFFECT]: Reader assembles the full picture from fragmented sources."
                                               }
                                          ] : [
                                               {
                                                    name: "Episodic Campaign",
                                                    emoji: "📺",
                                                    desc: "Spotlight milestones & problem solving.",
                                                    prompt: "BLUEPRINT: CUSTOMER SPOTLIGHT SERIES\n[CAMPAIGN GOAL]: Highlight collaborative problem-solving and joint success.\n[GENRE INTEGRATION]: Blend real-world success smoothly into the active genre.\n[PLOT CONSTRAINT]: Start with a setback representing past legacy, introduce an allied character with advice, and retrieve a golden emblem."
                                               },
                                               {
                                                    name: "Shonen Anime Battle",
                                                    emoji: "🌀",
                                                    desc: "High-energy tournaments & ultimate techniques.",
                                                    prompt: "BLUEPRINT: SHONEN ANIME TOURNAMENT ARC\n[GENRE INTEGRATION]: High-octane battle-shonen anime aesthetic.\n[SCENESTART]: Initiate in a glittering dust-streaked martial arena.\n[ACTION CLIMAX]: Characters must declare their ultimate superpower techniques in ALL CAPS with dramatic energy signatures.\n[LORE BEAT]: Insert a quick mental flashback about partner loyalty."
                                               },
                                               {
                                                    name: "Archaeology Expedition",
                                                    emoji: "🏺",
                                                    desc: "Decoding glyphs, solving tomb traps.",
                                                    prompt: "BLUEPRINT: ARCHAEOLOGICAL TOMB EXTRACTION\n[THEME]: High-tension historical mystery and artifacts.\n[SCENESTART]: Navigating deep, structural sandstone passageways.\n[NARRATIVE CLIMAX]: Decoding pre-modern glyphs on a monolithic gate, dodging a dart/block trap, and retrieving a crystalline ancient crown."
                                               },
                                               {
                                                    name: "Dramatic Redemption",
                                                    emoji: "🎭",
                                                    desc: "Setback, heart-to-heart, high stakes.",
                                                    prompt: "BLUEPRINT: DRAMATIC REDEMPTION CRISIS\n[NARRATIVE CONSTRAINTS]: Setback / Trial of Faith.\n[SCENESTART]: Dimly-lit rain-slicked neon street corner with high shadow contrasts.\n[EMOTIONAL PEAK]: protagonist admits an old fear. protagonist gets a sudden, vibrant power rejuvenation."
                                               },
                                               {
                                                    name: "Temporal Loop Paradox",
                                                    emoji: "🚀",
                                                    desc: "Déjà-vu, cosmic countdowns, quantum anomalies.",
                                                    prompt: "BLUEPRINT: TEMPORAL MATRIX PARADOX\n[GENRE INTEGRATION]: High-tech retro-futurism.\n[SCENESTART]: Temporal lab inside a raging celestial solar storm.\n[NARRATIVE CONSTRAINT]: Every character has slight déjà-vu, noticing identical recurring audio ticks. The clock displays a countdown sequence that matches their heartbeats."
                                               }
                                          ]).map((item) => (
                                               <button
                                                    key={item.name}
                                                    type="button"
                                                    onClick={() => props.onCreativeDirectivesChange(item.prompt)}
                                                    className={`flex-shrink-0 w-36 p-2 text-left rounded-md transition-all snap-start ${isEditorial
                                                        ? 'bg-white border border-stone-200 hover:border-stone-500 hover:shadow-sm'
                                                        : 'bg-slate-950 border border-slate-700/60 hover:border-yellow-400'}`}
                                               >
                                                    <div className="flex items-center gap-1 mb-1">
                                                         <span className="text-sm">{item.emoji}</span>
                                                         <span className={`text-[10px] uppercase tracking-wider truncate block w-full ${isEditorial ? 'font-semibold text-stone-800 font-sans' : 'font-black text-white'}`}>{item.name}</span>
                                                    </div>
                                                    <p className={`text-[9px] font-sans leading-tight line-clamp-2 h-6 ${isEditorial ? 'text-stone-500' : 'text-gray-400'}`}>
                                                         {item.desc}
                                                    </p>
                                                    <span className={`text-[8px] px-1 py-0.5 rounded tracking-wide uppercase block text-center mt-1.5 ${isEditorial
                                                        ? 'bg-stone-100 text-stone-600 border border-stone-200 font-semibold font-sans'
                                                        : 'bg-cyan-950 text-cyan-300 font-black font-mono border border-cyan-800/30'}`}>
                                                         {isEditorial ? 'Use Template' : 'APPLY SETUP'}
                                                    </span>
                                               </button>
                                          ))}
                                     </div>

                                     {/* Quick formatting Insert Tags */}
                                     <div>
                                          <span className={`text-[9px] font-bold uppercase tracking-widest block mb-1.5 ${isEditorial ? 'text-stone-500 font-sans' : 'text-slate-400 font-mono'}`}>
                                               {isEditorial ? '➕ Insert narrative anchors' : '➕ Click To Insert Story anchors / tags'}
                                          </span>
                                          <div className="flex flex-wrap gap-1">
                                               {(isEditorial ? [
                                                    { label: "Chapter Goal", tag: "[CHAPTER GOAL]: " },
                                                    { label: "Theme", tag: "[THEME]: " },
                                                    { label: "Tone", tag: "[TONE]: " },
                                                    { label: "Character Arc", tag: "[CHARACTER ARC]: " },
                                                    { label: "Turning Point", tag: "[TURNING POINT]: " },
                                                    { label: "Subtext", tag: "[SUBTEXT]: " }
                                               ] : [
                                                    { label: "Plot Constraint", tag: "[PLOT CONSTRAINT]: " },
                                                    { label: "Key Artifact", tag: "[KEY ARTIFACT]: " },
                                                    { label: "Dialogue Style", tag: "[DIALOGUE STYLE]: " },
                                                    { label: "Saga Milestone", tag: "[SAGA MILESTONE]: " },
                                                    { label: "Client Monument", tag: "[CLIENT MONUMENT]: " },
                                                    { label: "CliffHanger", tag: "[CLIFFHANGER]: " }
                                               ]).map((tagObj) => (
                                                    <button
                                                         key={tagObj.label}
                                                         type="button"
                                                         onClick={() => {
                                                              const currentVal = props.creativeDirectives || "";
                                                              const spacing = currentVal ? (currentVal.endsWith("\n") ? "" : "\n") : "";
                                                              props.onCreativeDirectivesChange(currentVal + spacing + tagObj.tag);
                                                         }}
                                                         className={`text-[8.5px] font-sans tracking-wide px-1.5 py-0.5 rounded transition-colors uppercase font-bold ${isEditorial
                                                             ? 'bg-white hover:bg-stone-100 text-stone-600 border border-stone-200 hover:border-stone-400'
                                                             : 'bg-slate-950 hover:bg-slate-800 text-gray-300 border border-slate-800 hover:border-cyan-500/50'}`}
                                                    >
                                                         + {tagObj.label}
                                                    </button>
                                               ))}
                                          </div>
                                     </div>
                                </div>

                                {/* Deep Textarea layout */}
                                <div className="space-y-1 mb-4">
                                     <label className={`text-[10px] font-bold uppercase tracking-wider block ${isEditorial ? 'text-stone-500 font-sans' : 'text-slate-400 font-mono'}`}>
                                          {isEditorial ? 'Story Guidelines & Author Notes' : 'GUIDELINES FIELD (AI or Author Prompts)'}
                                     </label>
                                     <textarea 
                                         value={props.creativeDirectives} 
                                         onChange={(e) => props.onCreativeDirectivesChange(e.target.value)} 
                                         placeholder={isEditorial
                                             ? "e.g., Explore themes of grief and resilience. Keep the prose lyrical with short chapters. Each scene should reveal one character secret. The ending must be ambiguous…"
                                             : "e.g., Weave in a client spotlight where they discover a transformative artifact, start the scene in a futuristic solar storm, highlight values of perseverance, or ensure a specific golden emblem is found..."} 
                                         className={isEditorial
                                             ? 'w-full p-3 bg-white border border-stone-300 text-stone-800 text-xs font-sans h-32 resize-y rounded shadow-sm focus:outline-none focus:border-stone-500 transition-colors'
                                             : 'w-full p-3 bg-slate-950 border-2 border-black text-white text-xs font-sans h-32 resize-y rounded shadow-[inset_0px_2px_6px_rgba(0,0,0,0.8)] focus:outline-none focus:border-cyan-400 transition-colors'}
                                     />
                                     <div className={`flex items-center justify-between text-[9px] font-mono ${isEditorial ? 'text-stone-400' : 'text-gray-500'}`}>
                                          <span>Characters: {(props.creativeDirectives || "").length}</span>
                                          <span>{isEditorial ? 'Influences narrative generation' : 'Fully compatible with server custom story synthesis'}</span>
                                     </div>
                                </div>

                                {/* COMPILED GUIDELINE DOSSIER */}
                                <div className={`transition-colors rounded-md p-3 text-left relative overflow-hidden ${isEditorial
                                    ? 'border border-stone-200 hover:border-stone-400 bg-stone-50'
                                    : 'border border-slate-800 hover:border-cyan-900/60 bg-slate-950/70 font-mono'}`}>
                                     {!isEditorial && <div className="absolute top-0 right-0 h-10 w-10 bg-gray-900 text-cyan-400/5 blur-2xl rounded-full" />}
                                     
                                     <div className={`flex items-center justify-between pb-1.5 mb-2 ${isEditorial ? 'border-b border-stone-200' : 'border-b border-slate-800'}`}>
                                          <div className="flex items-center gap-1.5">
                                               <span className={isEditorial ? 'text-stone-600' : 'text-yellow-400'}>📋</span>
                                               <span className={`text-[10px] font-black tracking-wider uppercase ${isEditorial ? 'text-stone-700 font-sans' : 'text-yellow-400'}`}>
                                                    {isEditorial ? 'Active Story Configuration' : 'COMPILED GUIDELINE DOSSIER'}
                                               </span>
                                          </div>
                                          <span className={`text-[8px] border uppercase font-bold px-1.5 rounded tracking-widest animate-pulse ${isEditorial
                                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                              : 'bg-emerald-950 text-emerald-400 font-mono border-emerald-800/40'}`}>
                                               {isEditorial ? '● Ready' : '● READY FOR CHAPTER GEN'}
                                          </span>
                                     </div>

                                     <p className={`text-[10.5px] leading-normal mb-3 leading-relaxed font-sans ${isEditorial ? 'text-stone-500' : 'text-gray-300'}`}>
                                          {isEditorial
                                              ? 'Summarises your active genre, language, narration voice, and any custom guidelines before passing to the manuscript generation engine.'
                                              : 'This compiles the full context of the active chapter script guidelines, merging selected paths, lexicon systems, custom-authored concepts, and active narrations before submitting to the Multiverse story generation.'}
                                     </p>

                                     {/* Guideline parameter pills */}
                                     <div className="grid grid-cols-2 md:grid-cols-1 xl:grid-cols-2 gap-1.5 font-sans">
                                          <div className={`p-1.5 rounded ${isEditorial ? 'bg-white border border-stone-200' : 'bg-slate-900/80 border border-slate-800'}`}>
                                               <span className={`text-[8px] uppercase block font-bold ${isEditorial ? 'text-stone-500 font-sans' : 'text-slate-500 font-mono'}`}>{isEditorial ? 'Genre' : 'STORY PATH (GENRE)'}</span>
                                               <span className={`text-[10.5px] font-extrabold ${isEditorial ? 'text-stone-800 font-sans' : 'text-white font-mono'}`}>
                                                    {genreIcons[props.selectedGenre] || "📖"} {props.selectedGenre || "Custom"}
                                               </span>
                                          </div>

                                          <div className={`p-1.5 rounded ${isEditorial ? 'bg-white border border-stone-200' : 'bg-slate-900/80 border border-slate-800'}`}>
                                               <span className={`text-[8px] uppercase block font-bold ${isEditorial ? 'text-stone-500 font-sans' : 'text-slate-500 font-mono'}`}>{isEditorial ? 'Language' : 'LEXICON SYSTEM'}</span>
                                               <span className={`text-[10.5px] font-bold uppercase ${isEditorial ? 'text-stone-700 font-sans' : 'text-cyan-300 font-mono'}`}>
                                                    🌐 {LANGUAGES.find(l => l.code === props.selectedLanguage)?.name || props.selectedLanguage}
                                               </span>
                                          </div>

                                          <div className={`p-1.5 rounded ${isEditorial ? 'bg-white border border-stone-200' : 'bg-slate-900/80 border border-slate-800'}`}>
                                               <span className={`text-[8px] uppercase block font-bold ${isEditorial ? 'text-stone-500 font-sans' : 'text-slate-500 font-mono'}`}>{isEditorial ? 'Ambient Sound' : 'AUDITORY SOUNDTRACK'}</span>
                                               <span className={`text-[10.5px] font-semibold truncate block ${isEditorial ? 'text-stone-600 font-sans' : 'text-yellow-300'}`}>
                                                    🎵 {props.soundPrompt || (isEditorial ? "No ambient sound set" : "Standard Cinematic Soundtrack")}
                                               </span>
                                          </div>

                                          <div className={`p-1.5 rounded ${isEditorial ? 'bg-white border border-stone-200' : 'bg-slate-900/80 border border-slate-800'}`}>
                                               <span className={`text-[8px] uppercase block font-bold ${isEditorial ? 'text-stone-500 font-sans' : 'text-slate-500 font-mono'}`}>{isEditorial ? 'Story Template' : 'STORY OUTLINE TYPE'}</span>
                                               <span className={`text-[10.5px] font-medium block ${isEditorial ? 'text-stone-700 font-sans' : 'text-purple-300 font-mono'}`}>
                                                    {props.creativeDirectives
                                                        ? (isEditorial ? "📝 Custom guidelines active" : "📝 Author Blueprint Customised")
                                                        : (isEditorial ? "📖 Default narrative formula" : "🤖 Standard Co-Creative Formula")}
                                               </span>
                                          </div>
                                     </div>

                                     {props.creativeDirectives && (
                                          <div className={`mt-2 text-[9px] p-2 rounded font-sans leading-relaxed ${isEditorial
                                              ? 'bg-stone-100 border border-stone-200 text-stone-500'
                                              : 'bg-slate-900/40 border border-slate-800 text-slate-400'}`}>
                                               <span className={`font-bold uppercase block mb-1 ${isEditorial ? 'text-stone-600' : 'text-slate-300'}`}>
                                                    {isEditorial ? '🔍 Active author guidelines:' : '🔍 ACTIVE AUTHOR OUTLINE CAPTIONS:'}
                                               </span>
                                               <p className="line-clamp-2 italic">
                                                    "{props.creativeDirectives}"
                                               </p>
                                          </div>
                                     )}
                                </div>
                            </div>

                            {/* Slider Toggles for soundtrack & Mode */}
                            <div className={`flex flex-col gap-2.5 pt-3 border-t mt-2 ${isEditorial ? 'border-stone-200' : 'border-slate-700'}`}>
                                {props.soundtrackEnabled && (
                                     <div className={`flex flex-col gap-1.5 mb-2 p-2.5 rounded animate-fadeIn text-left ${isEditorial
                                         ? 'bg-stone-100 border border-stone-200'
                                         : 'bg-slate-950 border border-yellow-500/30'}`}>
                                         <div className="flex items-center justify-between">
                                              <span className={`text-[10.5px] uppercase font-bold tracking-wide ${isEditorial ? 'font-sans text-stone-600' : 'font-mono text-yellow-500'}`}>
                                                   {isEditorial ? '🎵 Ambient Sound & Atmosphere' : '🎵 Generative Auditory Bibles & Sound Prompts'}
                                              </span>
                                              <button
                                                   type="button"
                                                   onClick={() => handleSuggestField('soundPrompt', props.soundPrompt)}
                                                   disabled={suggestingFields['soundPrompt']}
                                                   className={isEditorial
                                                       ? 'text-[9.5px] bg-stone-200 hover:bg-stone-300 text-stone-600 border border-stone-300 rounded px-2 py-0.5 font-sans tracking-wide transition-all disabled:opacity-40 font-semibold uppercase'
                                                       : 'text-[9.5px] bg-yellow-950/60 hover:bg-yellow-900 text-yellow-200 border border-yellow-500/40 rounded px-2 py-0.5 font-mono tracking-wide transition-all disabled:opacity-40 font-bold uppercase'}
                                              >
                                                   {suggestingFields['soundPrompt']
                                                       ? (isEditorial ? '✨ Thinking…' : '✨ THINKING...')
                                                       : (isEditorial ? '✨ AI Suggest' : '✨ AI SUGGEST')}
                                              </button>
                                         </div>
                                         <input 
                                             type="text"
                                             value={props.soundPrompt} 
                                             onChange={(e) => props.onSoundPromptChange(e.target.value)} 
                                             placeholder={isEditorial
                                                 ? "e.g. Melancholic piano, rain on cobblestones, candlelit library ambience"
                                                 : "e.g. 80s arcade synthesizer, cosmic cyberbass, retro spooky pipe organ"} 
                                             className={isEditorial
                                                 ? 'w-full bg-white border border-stone-300 text-stone-800 text-xs p-2 rounded focus:outline-none focus:border-stone-500 font-sans'
                                                 : 'w-full bg-gray-950/50 border border-cyan-800 text-white text-xs p-2 rounded focus:outline-none focus:border-yellow-400 font-sans'}
                                         />
                                         {/* Clickable Sound Presets */}
                                         <div className="mt-2 flex flex-wrap gap-1.5">
                                              {(isEditorial ? [
                                                   { label: "🕯️ Candlelit", value: "Soft crackling fireplace with gentle rain on old windows and distant clock chimes" },
                                                   { label: "☕ Coffee Shop", value: "Warm café ambience with soft jazz piano and quiet background murmur" },
                                                   { label: "🌿 Forest", value: "Gentle forest birdsong, rustling leaves, and a distant stream in a quiet woodland glade" },
                                                   { label: "🌊 Coastal", value: "Melancholic coastal wind with slow tide, distant foghorn, and solitary seabird calls" }
                                              ] : [
                                                   { label: "⚡ J-Rock Anime", value: "High-octane energetic J-Rock Anime OST with driving electric guitars and heavy synthesizer lead" },
                                                   { label: "🏺 Tomb Flute", value: "Eerie ancient wooden flute melody echoed inside a deep sandstone tomb with heavy orchestral drone chords" },
                                                   { label: "🌌 Cyberbass", value: "Low-frequency cosmic cyberbass rumble, retro hardware sequencer patterns and mechanical synth soundscapes" },
                                                   { label: "🎻 Cathedral", value: "Chilling, gothic pipe organ progressions with rain and distant low thunder ambience" }
                                              ]).map((snd) => (
                                                   <button
                                                        key={snd.label}
                                                        type="button"
                                                        onClick={() => props.onSoundPromptChange(snd.value)}
                                                        className={`text-[8.5px] tracking-wide px-2 py-0.5 rounded transition-colors uppercase font-bold ${isEditorial
                                                            ? 'bg-white hover:bg-stone-100 text-stone-600 border border-stone-200 hover:border-stone-400 font-sans'
                                                            : 'bg-slate-900 hover:bg-slate-800 text-yellow-500 font-mono border border-slate-700/60 hover:border-yellow-400'}`}
                                                   >
                                                        {snd.label}
                                                   </button>
                                              ))}
                                         </div>
                                     </div>
                                 )}
                                
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                         <span className={`text-xs font-bold tracking-wide uppercase ${isEditorial ? 'text-stone-700 font-sans' : 'text-white font-mono'}`}>
                                             {isEditorial ? 'Rich Prose Mode' : 'Novel Mode / Rich Content'}
                                         </span>
                                         <span className={`text-[10px] ${isEditorial ? 'text-stone-500' : 'text-gray-400'}`}>
                                             {isEditorial ? 'Deeper prose, expanded internal monologue' : 'Deep dialogues & full scenery descriptors'}
                                         </span>
                                    </div>
                                    <button 
                                        onClick={() => props.onRichModeChange(!props.richMode)}
                                        className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-300 ${props.richMode ? (isEditorial ? 'bg-stone-700' : 'bg-gray-900 text-cyan-400') : 'bg-slate-700'} relative`}
                                        aria-label="Toggle Rich Prose Mode"
                                    >
                                         <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${props.richMode ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                         <span className={`text-xs font-bold tracking-wide uppercase ${isEditorial ? 'text-stone-700 font-sans' : 'text-yellow-400 font-mono animate-pulse'}`}>
                                             {isEditorial ? '🎵 Ambient Soundscape' : '🎵 SYNAPSE Retro SOUNDTRACK'}
                                         </span>
                                         <span className={`text-[10px] ${isEditorial ? 'text-stone-500' : 'text-gray-400'}`}>
                                             {isEditorial ? 'Procedural atmospheric audio' : 'Generative procedural synth loops'}
                                         </span>
                                    </div>
                                    <button 
                                        onClick={() => props.onSoundtrackChange(!props.soundtrackEnabled)}
                                        className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-300 ${props.soundtrackEnabled
                                            ? (isEditorial ? 'bg-stone-700' : 'bg-gray-900 text-yellow-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]')
                                            : 'bg-slate-700'} relative`}
                                        aria-label="Toggle Ambient Soundscape"
                                    >
                                         <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${props.soundtrackEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                            </div>

                        </div>
                    </div>

                </div>

                {/* Overhauled, pulsating, shimmering call-to-action button */}
                <div className="relative group select-none">
                     {/* Pulsing button shadow */}
                     {!isEditorial && (
                          <div className={`absolute -inset-1 rounded-lg blur opacity-75 group-hover:opacity-100 transition-opacity duration-300 ${props.hero ? 'bg-gray-900 text-red-400 animate-pulse-glow' : 'bg-gray-700'}`} />
                     )}
                     
                     <button 
                          onClick={props.onLaunch} 
                          disabled={!props.hero || props.isTransitioning} 
                          className={isEditorial
                               ? "relative w-full py-4 text-base md:text-lg text-stone-50 bg-stone-900 hover:bg-stone-850 font-sans font-black uppercase tracking-widest rounded-xl shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center border border-stone-800"
                               : "shiny-btn relative comic-btn w-full py-4 text-2xl md:text-4xl text-white font-mono uppercase tracking-widest border-4 border-black disabled:grayscale disabled:opacity-50 disabled:cursor-not-allowed shadow-[6px_6px_0px_#000] hover:scale-[1.01] active:translate-y-1 active:shadow-[2px_2px_0px_#000] transition-all"
                          }
                     >
                          {props.isTransitioning ? (
                               <span className="flex items-center justify-center gap-3">
                                    <svg className="animate-spin h-8 w-8 text-white" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                    {isEditorial ? t("setup.buttons.compiling") : t("setup.buttons.crafting")}
                               </span>
                          ) : props.hero ? (
                               isEditorial ? t("setup.buttons.launchEditorial") : t("setup.buttons.launchComic")
                          ) : (
                               isEditorial ? t("setup.buttons.reqEditorial") : t("setup.buttons.reqComic")
                          )}
                     </button>
                </div>
            </>
        )}
{(!isCyberpunk && activeTab === 'settings') && (
            <div className="p-8">
                <div className={sCard}>
                    <h3 className={sTitle}>Global Settings</h3>
                    <p className={sSubtitle + " mb-6"}>Configure API keys and global preferences.</p>
                    <div className="mb-4">
                        <label className={sLabel}>Gemini API Key</label>
                        <input
                            type="password"
                            value={geminiKey}
                            onChange={(e) => handleGeminiKeyChange(e.target.value)}
                            className={sInput}
                            placeholder="AIzaSy..."
                        />
                        <p className="text-[10px] text-gray-500 mt-1">This key is stored locally in your browser and used for AI generations.</p>
                    </div>
                </div>
            </div>
        )}
        {(isCyberpunk || activeTab === 'persona') && (
            <WorkspaceCasting />
        )}
        {(isCyberpunk || activeTab === 'blueprint') && (
            <WorkspaceDirector />
        )}
        {(activeTab === 'vault') && (
             <div className={isEditorial 
                  ? "relative z-10 bg-[#fdfdfc] border border-stone-200 p-6 rounded-xl shadow-sm text-stone-900 text-left select-none font-sans"
                  : "relative z-10 bg-slate-900 border-4 border-black p-6 rounded-xl shadow-[8px_8px_0px_rgba(0,0,0,1)] text-white text-left select-none"}>
                  <span className={isEditorial
                      ? "block font-sans text-[#3c3730] font-black text-2xl uppercase tracking-wider mb-2"
                      : "block font-mono text-purple-400 font-extrabold text-2.5xl uppercase tracking-wider mb-2"}
                      style={isEditorial ? {} : { textShadow: '2px 2px 0px black' }}>
                      {isEditorial ? "💎 THE CHARACTER FORGE" : "💎 THE CHARACTER VAULT"}
                  </span>
                  
                  {/* VAULT GENERATION & GALLERY */}
                  <div className="flex flex-col gap-12 mt-6">
                      {(!props.activeCreator.tier || props.activeCreator.tier === 'Free') ? (
                          <div className="p-12 border-4 border-dashed border-purple-900/50 rounded bg-slate-950/40 text-center text-slate-400 font-mono my-4">
                              <span className="text-4xl mb-4 block">🔒</span>
                              <p className="text-lg font-bold text-white mb-2">Vault Generation Locked</p>
                              <p className="text-sm">The Character Vault is an exclusive feature for registered, paying customers. Upgrade your account to gain access to unlimited direct-to-vault character generation.</p>
                          </div>
                      ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                              {/* GENERATOR FORM */}
                              <div className="bg-slate-950 border-4 border-black p-6 rounded-[2rem] shadow-xl flex flex-col justify-between">
                                  <div>
                                      <h3 className="font-mono text-yellow-300 font-bold mb-6 uppercase text-sm border-b-2 border-slate-800 pb-2 flex items-center gap-2">
                                          <span className="text-xl">🛠️</span> Character Forge
                                      </h3>
                                      <div className="space-y-5 font-mono text-xs">
                                          <div>
                                              <div className="flex justify-between items-center mb-2">
                                                  <label className="block text-slate-400 font-bold">1. Character Identity</label>
                                                  <button type="button" onClick={handleSurpriseMeVault} className="text-[10px] bg-purple-900/50 hover:bg-purple-800 text-purple-200 px-3 py-1.5 rounded-full border border-purple-700 transition-colors">🎲 Surprise Me</button>
                                              </div>
                                              <input value={vaultCharName} onChange={e => setVaultCharName(e.target.value)} type="text" className="w-full bg-slate-900 border-2 border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500" placeholder="e.g. Zara Nexus" />
                                          </div>
                                          
                                          <div>
                                              <label className="block text-slate-400 mb-2 font-bold">2. Demographic Profile</label>
                                              <div className="grid grid-cols-3 gap-3">
                                                  <select value={vaultAge} onChange={(e) => setVaultAge(e.target.value)} className="w-full bg-slate-900 border-2 border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500">
                                                      <option value="">Age</option>
                                                      <option value="Child">Child</option>
                                                      <option value="Teenager">Teenager</option>
                                                      <option value="Young Adult">Young Adult</option>
                                                      <option value="Middle-Aged">Middle-Aged</option>
                                                      <option value="Elderly">Elderly</option>
                                                  </select>
                                                  <select value={vaultGender} onChange={(e) => setVaultGender(e.target.value)} className="w-full bg-slate-900 border-2 border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500">
                                                      <option value="">Gender</option>
                                                      <option value="Male">Male</option>
                                                      <option value="Female">Female</option>
                                                      <option value="Non-Binary">Non-Binary</option>
                                                      <option value="Androgynous">Androgynous</option>
                                                  </select>
                                                  <select value={vaultEthnicity} onChange={(e) => setVaultEthnicity(e.target.value)} className="w-full bg-slate-900 border-2 border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500">
                                                      <option value="">Ethnicity</option>
                                                      <option value="Asian">Asian</option>
                                                      <option value="Black">Black</option>
                                                      <option value="Hispanic/Latino">Hispanic/Latino</option>
                                                      <option value="Middle Eastern">Middle Eastern</option>
                                                      <option value="White">White</option>
                                                      <option value="Mixed Race">Mixed Race</option>
                                                      <option value="Indigenous">Indigenous</option>
                                                  </select>
                                              </div>
                                          </div>

                                          <div>
                                              <label className="block text-slate-400 mb-2 font-bold">3. Core Traits & Concept</label>
                                              <textarea value={vaultCharDesc} onChange={e => setVaultCharDesc(e.target.value)} rows={3} className="w-full bg-slate-900 border-2 border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500" placeholder="A futuristic hacker with neon blue hair and a cybernetic eye..." />
                                          </div>
                                          
                                          <div>
                                              <label className="block text-slate-400 mb-2 font-bold">4. Art Style</label>
                                              <select value={vaultCharStyle} onChange={e => setVaultCharStyle(e.target.value)} className="w-full bg-slate-900 border-2 border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500">
                                                  {ART_STYLES.map(style => (
                                                      <option key={style.id} value={style.id}>{style.name}</option>
                                                  ))}
                                              </select>
                                          </div>
                                          
                                          <div>
                                              <label className="block text-slate-400 mb-2 font-bold">5. Digital Avatar Photo (Optional)</label>
                                              <input type="file" accept="image/*,.heic" onChange={handleAvatarUpload} className="w-full bg-slate-900 border-2 border-slate-800 rounded-xl p-2 text-white focus:outline-none focus:border-purple-500 text-[10px]" />
                                              {vaultReferenceImage && <p className="text-[10px] text-green-400 mt-1">✓ Image selected for Leonardo processing</p>}
                                          </div>
                                          
                                          {vaultStatusMsg && (
                                              <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl text-cyan-400 text-[10px] text-center">
                                                  {vaultStatusMsg}
                                              </div>
                                          )}
                                      </div>
                                  </div>
                                  
                                  <button disabled={isVaultGenerating} className="w-full mt-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-4 px-4 rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-all uppercase tracking-wider disabled:opacity-50" onClick={handleVaultGenerate}>
                                      {isVaultGenerating ? "Generating..." : "✨ Generate Profile"}
                                  </button>
                              </div>

                              {/* PREVIEW SIDE */}
                              <div className="bg-slate-900 border-4 border-slate-800 p-6 rounded-[2rem] shadow-inner flex flex-col">
                                  <h3 className="font-mono text-cyan-400 font-bold mb-6 uppercase text-sm border-b-2 border-slate-800 pb-2 flex items-center gap-2">
                                      <span className="text-xl">👁️</span> Live Preview
                                  </h3>
                                  
                                  <div className="flex-1 flex flex-col items-center justify-center relative aspect-[3/4] rounded-2xl overflow-hidden border-2 border-slate-800 bg-black">
                                      {vaultGeneratedImage ? (
                                          <img src={vaultGeneratedImage} alt="Generated Avatar" className="w-full h-full object-cover" />
                                      ) : isVaultGenerating ? (
                                          <div className="text-center text-indigo-500">
                                              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                              <p className="font-bold animate-pulse font-mono text-xs">Summoning Leonardo.ai...</p>
                                          </div>
                                      ) : vaultReferenceImage ? (
                                          <img src={`data:image/jpeg;base64,${vaultReferenceImage}`} alt="Uploaded Preview" className="w-full h-full object-cover opacity-30 grayscale blur-sm" />
                                      ) : (
                                          <div className="text-center px-6 text-slate-600 font-mono text-xs">
                                              <div className="text-4xl mb-4 opacity-50">👤</div>
                                              <p>Your generated avatar will appear here.</p>
                                          </div>
                                      )}
                                  </div>
                                  
                                  <div className="mt-6">
                                      <button 
                                          disabled={!vaultGeneratedImage || isVaultGenerating} 
                                          onClick={handleSaveToVault}
                                          className={`w-full py-4 rounded-xl font-bold transition-all uppercase tracking-wider ${!vaultGeneratedImage || isVaultGenerating ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[4px_4px_0px_rgba(0,0,0,1)]'}`}
                                      >
                                          💾 Save to Vault
                                      </button>
                                  </div>
                              </div>
                          </div>
                      )}

                      {/* VAULT GALLERY SECTION (Always visible) */}
                      <div className="bg-slate-950 border-4 border-black p-8 rounded-[2rem] shadow-[8px_8px_0px_rgba(0,0,0,1)]">
                          <h3 className="font-mono text-emerald-400 font-bold mb-6 uppercase text-sm border-b-2 border-slate-800 pb-2 flex items-center gap-2">
                              <span className="text-xl">💎</span> Your Saved Characters ({savedCharacters.length})
                          </h3>
                          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                {savedCharacters.length === 0 ? (
                                    <div className="col-span-full p-12 border-4 border-dashed border-slate-800 rounded-2xl bg-slate-950/20 text-center text-slate-500 font-mono">
                                        <p className="text-sm font-bold">Your Vault is empty.</p>
                                    </div>
                                ) : (
                                    savedCharacters.map(char => (
                                          <div key={char.id} className="group relative bg-slate-900 border-2 border-slate-800 p-2 rounded-xl hover:border-emerald-500 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all cursor-pointer">
                                              <div className="aspect-[3/4] w-full bg-black rounded-lg overflow-hidden mb-3 relative">
                                                  <img src={char.imageUrl || 'https://via.placeholder.com/150'} alt={char.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                              </div>
                                              <span className="font-mono font-bold text-xs text-white truncate block text-center mb-1">{char.name}</span>
                                              {char.role === 'Vaulted' && (
                                                  <span className="font-mono text-[9px] text-emerald-400 block text-center uppercase tracking-widest">Vaulted</span>
                                              )}
                                          </div>
                                    ))
                                )}
                          </div>
                      </div>
                  </div>
             </div>
        )}

            </div>
          </div>
        </div>


        </>
        </WorkspaceContext.Provider>
    );
}
