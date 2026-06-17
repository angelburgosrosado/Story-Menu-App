/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ComicFace } from './types';

// Storage Key Constants
const PROJECTS_LOCAL_KEY = 'infinite_heroes_local_projects';
const CHARACTERS_LOCAL_KEY = 'infinite_heroes_local_characters';
const DAILY_LIMITS_LOCAL_KEY = 'infinite_heroes_daily_credits';

export interface SavedProject {
  id: string;
  userId: string;
  title: string;
  genre: string;
  language: string;
  comicFaces: string; // Dynamic JSON array of pages/comics
  createdAt: string;
  updatedAt: string;
}

export interface SavedCharacter {
  id: string;
  userId: string;
  name: string;
  roleType: 'Hero' | 'Co-Star' | 'Villain';
  description: string;
  imageUrl?: string; // Base64 or URL
  createdAt: string;
}

export interface GenerationCredits {
  date: string; // YYYY-MM-DD
  count: number;
}

const CONST_MAX_DAILY_PAGES = 30;

/**
 * --- Project Storage Handlers ---
 */
export function getLocalProjects(userId: string): SavedProject[] {
  try {
    const raw = localStorage.getItem(PROJECTS_LOCAL_KEY);
    if (!raw) return [];
    const allProjects: SavedProject[] = JSON.parse(raw);
    return allProjects.filter(p => p.userId === userId);
  } catch (e) {
    console.error("Failed to read local projects:", e);
    return [];
  }
}

export function saveLocalProject(project: SavedProject): void {
  try {
    const raw = localStorage.getItem(PROJECTS_LOCAL_KEY);
    let allProjects: SavedProject[] = raw ? JSON.parse(raw) : [];
    
    const index = allProjects.findIndex(p => p.id === project.id);
    if (index !== -1) {
      allProjects[index] = { ...project, updatedAt: new Date().toISOString() };
    } else {
      allProjects.push(project);
    }
    
    localStorage.setItem(PROJECTS_LOCAL_KEY, JSON.stringify(allProjects));
  } catch (e) {
    console.error("Failed to write local project:", e);
  }
}

export function deleteLocalProject(projectId: string): void {
  try {
    const raw = localStorage.getItem(PROJECTS_LOCAL_KEY);
    if (!raw) return;
    let allProjects: SavedProject[] = JSON.parse(raw);
    allProjects = allProjects.filter(p => p.id !== projectId);
    localStorage.setItem(PROJECTS_LOCAL_KEY, JSON.stringify(allProjects));
  } catch (e) {
    console.error("Failed to delete local project:", e);
  }
}

/**
 * --- Character Storage Handlers ---
 */
export function getLocalCharacters(userId: string): SavedCharacter[] {
  try {
    const raw = localStorage.getItem(CHARACTERS_LOCAL_KEY);
    if (!raw) return [];
    const allCharacters: SavedCharacter[] = JSON.parse(raw);
    return allCharacters.filter(c => c.userId === userId);
  } catch (e) {
    console.error("Failed to read local characters:", e);
    return [];
  }
}

export function saveLocalCharacter(char: SavedCharacter): void {
  try {
    const raw = localStorage.getItem(CHARACTERS_LOCAL_KEY);
    let allCharacters: SavedCharacter[] = raw ? JSON.parse(raw) : [];
    
    const index = allCharacters.findIndex(c => c.id === char.id);
    if (index !== -1) {
      allCharacters[index] = char;
    } else {
      allCharacters.push(char);
    }
    
    localStorage.setItem(CHARACTERS_LOCAL_KEY, JSON.stringify(allCharacters));
  } catch (e) {
    console.error("Failed to write local character:", e);
  }
}

export function deleteLocalCharacter(charId: string): void {
  try {
    const raw = localStorage.getItem(CHARACTERS_LOCAL_KEY);
    if (!raw) return;
    let allCharacters: SavedCharacter[] = JSON.parse(raw);
    allCharacters = allCharacters.filter(c => c.id !== charId);
    localStorage.setItem(CHARACTERS_LOCAL_KEY, JSON.stringify(allCharacters));
  } catch (e) {
    console.error("Failed to delete local character:", e);
  }
}

/**
 * --- Daily Generation Quota Control ---
 * Limits page generations per browser to protect the developer API Key.
 */
export function checkGenerationLimit(): { allowed: boolean; remaining: number; total: number } {
  try {
    const today = new Date().toISOString().split('T')[0];
    const raw = localStorage.getItem(DAILY_LIMITS_LOCAL_KEY);
    let limits: GenerationCredits = raw ? JSON.parse(raw) : { date: today, count: 0 };
    
    if (limits.date !== today) {
      limits = { date: today, count: 0 };
    }
    
    const remaining = Math.max(0, CONST_MAX_DAILY_PAGES - limits.count);
    return {
      allowed: limits.count < CONST_MAX_DAILY_PAGES,
      remaining,
      total: CONST_MAX_DAILY_PAGES
    };
  } catch (e) {
    return { allowed: true, remaining: CONST_MAX_DAILY_PAGES, total: CONST_MAX_DAILY_PAGES };
  }
}

export function recordPageGenerated(): number {
  try {
    const today = new Date().toISOString().split('T')[0];
    const raw = localStorage.getItem(DAILY_LIMITS_LOCAL_KEY);
    let limits: GenerationCredits = raw ? JSON.parse(raw) : { date: today, count: 0 };
    
    if (limits.date !== today) {
      limits = { date: today, count: 0 };
    }
    
    limits.count += 1;
    localStorage.setItem(DAILY_LIMITS_LOCAL_KEY, JSON.stringify(limits));
    return limits.count;
  } catch (e) {
    return 0;
  }
}


// CDN Strategy: Replace direct local file paths with https://cdn.story.menu/... for production
