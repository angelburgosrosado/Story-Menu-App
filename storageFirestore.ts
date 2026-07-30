/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  setDoc,
  getDoc,
  getDocs, 
  deleteDoc, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';

export interface FirestoreCharacter {
  id: string;
  userId: string;
  name: string;
  roleType: 'Hero' | 'Co-Star' | 'Villain';
  description: string;
  imageUrl?: string;
  createdAt?: any;
}

export interface FirestoreProject {
  id: string;
  userId: string;
  title: string;
  genre: string;
  language: string;
  comicFaces: string; // JSON String
  artStyle?: string;
  storyHtml?: string;
  heroId?: string;
  friendId?: string;
  villainId?: string;
  createdAt?: any;
  updatedAt?: any;
}

/**
 * --- Character Operations ---
 */
export async function saveCharacterToFirestore(userId: string, char: Omit<FirestoreCharacter, 'createdAt' | 'id'> & { id?: string }): Promise<void> {
  const charId = char.id || `char_${Math.random().toString(36).substring(2, 11)}`;
  const path = `users/${userId}/characters/${charId}`;
  try {
    const docRef = doc(db, 'users', userId, 'characters', charId);
    await setDoc(docRef, {
      id: charId,
      userId,
      name: char.name,
      roleType: char.roleType,
      description: char.description || '',
      imageUrl: char.imageUrl || '',
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    }, { merge: true });
    console.info(`🔥 [Firestore] Saved character ${charId} successfully!`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getCharactersFromFirestore(userId: string): Promise<FirestoreCharacter[]> {
  const path = `users/${userId}/characters`;
  try {
    const colRef = collection(db, 'users', userId, 'characters');
    const q = query(colRef, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const chars: FirestoreCharacter[] = [];
    snap.forEach((doc) => {
      const data = doc.data();
      chars.push({
        id: data.id || doc.id,
        userId: data.userId || userId,
        name: data.name || '',
        roleType: data.roleType || 'Hero',
        description: data.description || '',
        imageUrl: data.imageUrl || '',
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      });
    });
    return chars;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function deleteCharacterFromFirestore(userId: string, charId: string): Promise<void> {
  const path = `users/${userId}/characters/${charId}`;
  try {
    const docRef = doc(db, 'users', userId, 'characters', charId);
    await deleteDoc(docRef);
    console.info(`🔥 [Firestore] Deleted character ${charId} successfully!`);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * --- Project Operations ---
 */
export async function saveProjectToFirestore(userId: string, project: Omit<FirestoreProject, 'createdAt' | 'updatedAt' | 'id' | 'userId'> & { id?: string, userId?: string }): Promise<string> {
  const projectId = project.id || `proj_${Math.random().toString(36).substring(2, 11)}`;
  const path = `users/${userId}/projects/${projectId}`;
  try {
    const docRef = doc(db, 'users', userId, 'projects', projectId);
    await setDoc(docRef, {
      id: projectId,
      userId,
      title: project.title,
      genre: project.genre,
      language: project.language,
      comicFaces: project.comicFaces,
      artStyle: project.artStyle || '',
      storyHtml: project.storyHtml || '',
      heroId: project.heroId || '',
      friendId: project.friendId || '',
      villainId: project.villainId || '',
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    }, { merge: true });
    console.info(`🔥 [Firestore] Saved project ${projectId} successfully!`);
    return projectId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getProjectsFromFirestore(userId: string): Promise<FirestoreProject[]> {
  const path = `users/${userId}/projects`;
  try {
    const colRef = collection(db, 'users', userId, 'projects');
    const q = query(colRef, orderBy('updatedAt', 'desc'));
    const snap = await getDocs(q);
    const projects: FirestoreProject[] = [];
    snap.forEach((doc) => {
      const data = doc.data();
      projects.push({
        id: data.id || doc.id,
        userId: data.userId || userId,
        title: data.title || 'Untitled Comic',
        genre: data.genre || 'Action',
        language: data.language || 'en-US',
        comicFaces: data.comicFaces || '[]',
        artStyle: data.artStyle || '',
        storyHtml: data.storyHtml || '',
        heroId: data.heroId || '',
        friendId: data.friendId || '',
        villainId: data.villainId || '',
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
      });
    });
    return projects;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function deleteProjectFromFirestore(userId: string, projectId: string): Promise<void> {
  const path = `users/${userId}/projects/${projectId}`;
  try {
    const docRef = doc(db, 'users', userId, 'projects', projectId);
    await deleteDoc(docRef);
    console.info(`🔥 [Firestore] Deleted project ${projectId} successfully!`);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * --- Draft Operations ---
 */
export interface FirestoreDraft {
  id: string;
  userId: string;
  title: string;
  genre: string;
  artStyle?: string;
  comicFaces: string; // Serialized ComicFace[]
  storyBlueprint: string; // Serialized ChapterGoal[]
  
  // Expanded Wizard State
  selectedFormatId?: string;
  selectedFlowId?: string;
  selectedPrimaryGoalId?: string;
  selectedSecondaryGoalId?: string;
  freeformGoalNote?: string;
  selectedPersonaId?: string;
  personaRole?: string;
  isPrimaryPersona?: boolean;
  recurringIntent?: boolean;
  personaStoryNotes?: string;
  bilingualMode?: boolean;
  sourceLanguage?: string;
  targetLanguage?: string;
  readingMode?: string;
  voiceStyle?: string;
  soundtrackTheme?: string;

  settings?: any; // To catch all UI wizard state
  createdAt?: any;
  updatedAt?: any;
}

export async function saveDraftToFirestore(userId: string, draft: Omit<FirestoreDraft, 'createdAt' | 'updatedAt' | 'id'> & { id?: string }): Promise<string> {
  const draftId = draft.id || `draft_${Math.random().toString(36).substring(2, 11)}`;
  const path = `users/${userId}/drafts/${draftId}`;
  try {
    const docRef = doc(db, 'users', userId, 'drafts', draftId);
    await setDoc(docRef, {
      id: draftId,
      userId,
      title: draft.title,
      genre: draft.genre,
      artStyle: draft.artStyle || '',
      comicFaces: draft.comicFaces,
      storyBlueprint: draft.storyBlueprint,
      selectedFormatId: draft.selectedFormatId || null,
      selectedFlowId: draft.selectedFlowId || null,
      selectedPrimaryGoalId: draft.selectedPrimaryGoalId || null,
      selectedSecondaryGoalId: draft.selectedSecondaryGoalId || null,
      freeformGoalNote: draft.freeformGoalNote || '',
      selectedPersonaId: draft.selectedPersonaId || null,
      personaRole: draft.personaRole || '',
      isPrimaryPersona: draft.isPrimaryPersona ?? true,
      recurringIntent: draft.recurringIntent ?? true,
      personaStoryNotes: draft.personaStoryNotes || '',
      bilingualMode: draft.bilingualMode ?? false,
      sourceLanguage: draft.sourceLanguage || '',
      targetLanguage: draft.targetLanguage || '',
      readingMode: draft.readingMode || '',
      voiceStyle: draft.voiceStyle || '',
      soundtrackTheme: draft.soundtrackTheme || '',
      settings: draft.settings || {},
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    }, { merge: true });
    console.info(`🔥 [Firestore] Saved draft ${draftId} successfully!`);
    return draftId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getDraftsFromFirestore(userId: string): Promise<FirestoreDraft[]> {
  const path = `users/${userId}/drafts`;
  try {
    const colRef = collection(db, 'users', userId, 'drafts');
    const q = query(colRef, orderBy('updatedAt', 'desc'));
    const snap = await getDocs(q);
    const drafts: FirestoreDraft[] = [];
    snap.forEach((doc) => {
      const data = doc.data();
      drafts.push({
        id: data.id || doc.id,
        userId: data.userId || userId,
        title: data.title || 'Untitled Draft',
        genre: data.genre || 'Action',
        artStyle: data.artStyle || '',
        comicFaces: data.comicFaces || '[]',
        storyBlueprint: data.storyBlueprint || '[]',
        selectedFormatId: data.selectedFormatId,
        selectedFlowId: data.selectedFlowId,
        selectedPrimaryGoalId: data.selectedPrimaryGoalId,
        selectedSecondaryGoalId: data.selectedSecondaryGoalId,
        freeformGoalNote: data.freeformGoalNote,
        selectedPersonaId: data.selectedPersonaId,
        personaRole: data.personaRole,
        isPrimaryPersona: data.isPrimaryPersona,
        recurringIntent: data.recurringIntent,
        personaStoryNotes: data.personaStoryNotes,
        bilingualMode: data.bilingualMode,
        sourceLanguage: data.sourceLanguage,
        targetLanguage: data.targetLanguage,
        readingMode: data.readingMode,
        voiceStyle: data.voiceStyle,
        soundtrackTheme: data.soundtrackTheme,
        settings: data.settings || {},
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
      });
    });
    return drafts;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function deleteDraftFromFirestore(userId: string, draftId: string): Promise<void> {
  const path = `users/${userId}/drafts/${draftId}`;
  try {
    const docRef = doc(db, 'users', userId, 'drafts', draftId);
    await deleteDoc(docRef);
    console.info(`🔥 [Firestore] Deleted draft ${draftId} successfully!`);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * --- User / Subscription Operations ---
 */
export async function updateUserSubscriptionInFirestore(userId: string, subscription: { tier: string; subscriptionId: string; paymentMethod: string; tokensAwarded?: number }): Promise<void> {
  const path = `users/${userId}`;
  try {
    const docRef = doc(db, 'users', userId);
    
    // If this is a token top-up, we don't necessarily change the tier, we just add tokens.
    // We will handle token addition separately or via addTokensToUser.
    
    await setDoc(docRef, {
      tier: subscription.tier,
      subscriptionId: subscription.subscriptionId,
      paymentMethod: subscription.paymentMethod,
      updatedAt: serverTimestamp()
    }, { merge: true });
    console.info(`🔥 [Firestore] Upgraded user ${userId} to ${subscription.tier} via ${subscription.paymentMethod} in database!`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

