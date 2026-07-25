/**
 * Real-time Collaboration — Task 3.5
 * Firestore real-time listeners for shared story editing.
 * Uses Firestore's native real-time sync — no WebSocket server needed.
 */

import { getFirestore, FieldValue } from 'firebase-admin/firestore';

export interface PresenceInfo {
    userId: string;
    displayName: string;
    cursorPosition?: { x: number; y: number };
    color: string;
    lastSeen: string;
}

export interface CollaborationSession {
    storyId: string;
    ownerId: string;
    collaborators: PresenceInfo[];
    currentContent: any;
    version: number;
    lastModifiedBy: string;
    lastModifiedAt: string;
}

// Colors for presence indicators
const PRESENCE_COLORS = [
    '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6',
    '#EC4899', '#06B6D4', '#F97316', '#84CC16', '#6366F1',
];

function getRandomColor(): string {
    return PRESENCE_COLORS[Math.floor(Math.random() * PRESENCE_COLORS.length)];
}

/**
 * Create a collaboration session for a story.
 */
export async function createSession(storyId: string, ownerId: string): Promise<string> {
    const db = getFirestore();
    const sessionRef = db.collection('collaboration_sessions').doc(storyId);

    const session: CollaborationSession = {
        storyId,
        ownerId,
        collaborators: [],
        currentContent: null,
        version: 1,
        lastModifiedBy: ownerId,
        lastModifiedAt: new Date().toISOString(),
    };

    await sessionRef.set(session);
    return storyId;
}

/**
 * Join a collaboration session (set presence).
 */
export async function joinSession(
    storyId: string,
    userId: string,
    displayName: string
): Promise<PresenceInfo> {
    const db = getFirestore();
    const sessionRef = db.collection('collaboration_sessions').doc(storyId);
    const presenceRef = sessionRef.collection('presence').doc(userId);

    const presence: PresenceInfo = {
        userId,
        displayName,
        color: getRandomColor(),
        lastSeen: new Date().toISOString(),
    };

    await presenceRef.set(presence);
    return presence;
}

/**
 * Update cursor position in a collaboration session.
 */
export async function updateCursor(
    storyId: string,
    userId: string,
    position: { x: number; y: number }
): Promise<void> {
    const db = getFirestore();
    const presenceRef = db.collection('collaboration_sessions')
        .doc(storyId).collection('presence').doc(userId);

    await presenceRef.update({
        cursorPosition: position,
        lastSeen: new Date().toISOString(),
    });
}

/**
 * Leave a collaboration session (remove presence).
 */
export async function leaveSession(storyId: string, userId: string): Promise<void> {
    const db = getFirestore();
    const presenceRef = db.collection('collaboration_sessions')
        .doc(storyId).collection('presence').doc(userId);

    await presenceRef.delete();
}

/**
 * Save content with conflict detection (optimistic concurrency).
 */
export async function saveContent(
    storyId: string,
    userId: string,
    content: any,
    expectedVersion: number
): Promise<{ success: boolean; error?: string }> {
    const db = getFirestore();
    const sessionRef = db.collection('collaboration_sessions').doc(storyId);

    try {
        await db.runTransaction(async (transaction) => {
            const sessionSnap = await transaction.get(sessionRef);
            if (!sessionSnap.exists) throw new Error('Session not found');

            const sessionData = sessionSnap.data()!;
            if (sessionData.version !== expectedVersion) {
                throw new Error('CONFLICT: Content modified by another user');
            }

            transaction.update(sessionRef, {
                currentContent: content,
                version: FieldValue.increment(1),
                lastModifiedBy: userId,
                lastModifiedAt: new Date().toISOString(),
            });
        });

        return { success: true };
    } catch (err: any) {
        if (err.message.includes('CONFLICT')) {
            return { success: false, error: 'conflict' };
        }
        return { success: false, error: err.message };
    }
}

/**
 * Subscribe to real-time presence changes.
 * Client-side: use Firestore onSnapshot() directly.
 * Server-side: poll for stale presence entries.
 */
export async function cleanupStalePresence(storyId: string, staleAfterMs: number = 60000): Promise<number> {
    const db = getFirestore();
    const presenceRef = db.collection('collaboration_sessions')
        .doc(storyId).collection('presence');

    const cutoff = new Date(Date.now() - staleAfterMs).toISOString();
    const staleSnap = await presenceRef.where('lastSeen', '<', cutoff).get();

    let cleaned = 0;
    for (const doc of staleSnap.docs) {
        await doc.ref.delete();
        cleaned++;
    }

    return cleaned;
}
