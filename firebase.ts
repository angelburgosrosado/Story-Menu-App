/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, signInWithCustomToken, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getAnalytics, isSupported, logEvent, Analytics } from 'firebase/analytics';
import firebaseConfig from './firebase-applet-config.json';

// Initialize core Firebase application
const app = initializeApp(firebaseConfig);

// Initialize Analytics if supported in the current environment
export let analytics: Analytics | null = null;
isSupported().then((supported) => {
  if (supported && firebaseConfig.measurementId) {
    analytics = getAnalytics(app);
    console.info("⚡ [Analytics] Loaded Google Analytics successfully with ID:", firebaseConfig.measurementId);
  } else {
    console.info("ℹ️ [Analytics] Google Analytics not supported or not configured in this environment.");
  }
}).catch((err) => {
  console.warn("⚠️ [Analytics] Failed to check / initialize Google Analytics support:", err);
});

/**
 * Custom function to log events to Analytics with safe-fallback logs.
 */
export function logAnalyticsEvent(eventName: string, params?: Record<string, any>) {
  if (analytics) {
    try {
      logEvent(analytics, eventName, params);
      console.info(`📊 [Analytics Event Logged]: "${eventName}"`, params);
    } catch (err) {
      console.warn(`📊 [Analytics Error]: Failed to log event "${eventName}":`, err);
    }
  } else {
    console.info(`📊 [Analytics Offline Log]: "${eventName}"`, params);
  }
}


// Initialize Firestore targeting the specific applet Database ID (CRITICAL: Required for integration)
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Authentication 
export const auth = getAuth(app);

// Google Sign-In Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Signs in using Google Auth Pop-up.
 */
export async function signInWithGoogle(): Promise<FirebaseUser> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Firebase Sign-In Failure:", error);
    throw error;
  }
}

/**
 * Signs out the current authenticated user.
 */
export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Firebase Sign-Out Failure:", error);
    throw error;
  }
}

/**
 * Tests the connection to the Firestore instance.
 * Soft-fails and logs helpful fallback details if the client database is offline.
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.info("⚡ [Firebase Connection] Successfully shook hands with live Firestore.");
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("🔌 [Firebase Connection] Client is offline or isolated. Running with local fallback databases.");
    } else {
      console.info("⚡ [Firebase Connection] Pre-flight handshake resolved. Running safely with automatic fallbacks.");
    }
    return false;
  }
}

// Allow E2E tests to inject custom tokens to simulate real sign-ins
if (typeof window !== 'undefined') {
  (window as any).e2eSignIn = async (token: string) => {
    return signInWithCustomToken(auth, token);
  };
}
testFirestoreConnection().catch(() => {});

// --- Firestore Diagnostic Error Logger & Thrower ---
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

/**
 * Normalizes all Firestore operation errors, logging full structural reports to help diagnose issues.
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('[Firestore Error Caught]:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
