import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, getFirestore, doc, getDocFromServer, collection, setLogLevel } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';
import { getFunctions } from 'firebase/functions';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
export const functions = getFunctions(app);

// Initialize Firestore with explicit database ID from config if present
const databaseId = (firebaseConfig as any).firestoreDatabaseId || '(default)';
console.log('[Firebase Info] Project ID:', firebaseConfig.projectId);
console.log('[Firebase Info] Database ID:', databaseId);

let dbInstance;
try {
  dbInstance = initializeFirestore(app, {
    localCache: persistentLocalCache()
  }, databaseId);
  console.log('[Firebase Info] Initialized Firestore explicitly with DB ID:', databaseId);
} catch (e: any) {
  if (e.message.includes('already been initialized')) {
    dbInstance = getFirestore(app, databaseId);
  } else {
    throw e;
  }
}
export const db = dbInstance;

// Initialize Analytics gracefully
export const analytics = (() => {
  if (typeof window === 'undefined') return null;
  try {
    // Only attempt to initialize if measurementId is present
    if (firebaseConfig.measurementId) {
      return getAnalytics(app);
    }
    return null;
  } catch (error) {
    console.warn('Firebase Analytics failed to initialize:', error);
    return null;
  }
})();

// Suppress Firestore offline warnings which are completely normal for a PWA
setLogLevel('silent');

export const auth = getAuth(app);

// Set persistence to LOCAL to handle mobile redirects better
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.error("Error setting persistence:", err);
  });
}

export const storage = getStorage(app);

export async function checkIsAdmin(user: any): Promise<boolean> {
  if (!user) return false;
  try {
    const idTokenResult = await user.getIdTokenResult();
    return !!idTokenResult.claims.admin;
  } catch (error) {
    console.error("Error checking admin claim:", error);
    return false;
  }
}

/**
 * Performs a connectivity test to Firestore with retries.
 * Required per instruction 8: "When the application initially boots, call getFromServer to test the connection."
 */
export async function testFirestoreConnection(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const testDoc = doc(db, '_connection_test_', 'connectivity_check');
      await getDocFromServer(testDoc);
      console.log(`Firebase: Connection test passed (attempt ${i + 1}).`);
      return true;
    } catch (error: any) {
      console.warn(`Firebase: Connection test attempt ${i + 1} failed:`, error.message);
      
      // If we are reaching the server but blocked by rules, we are connected!
      const errStr = (error.message || '').toLowerCase();
      const errCode = (error.code || '').toLowerCase();
      
      if (errCode === 'permission-denied' || 
          errStr.includes('permission') || 
          errStr.includes('missing or insufficient') ||
          errCode === 'unauthenticated' ||
          errCode === 'failed-precondition' ) {
        console.log(`Firebase: Connection test passed via permission denial (server reached).`);
        return true;
      }

      // If we are on the last attempt and it failed
      if (i === retries - 1) {
        const databaseId = (db as any)._databaseId?.database || 'Unknown';
        console.error('Firebase: All connection attempts failed.');
        if (error.message.includes('the client is offline')) {
          console.error(`CRITICAL: Connection timed out or database not found. Target Database: "${databaseId}".`);
          console.error("Please verify that this Database ID exists in your Firebase Console (Enterprise Edition).");
        }
        return false;
      }
      
      // Wait before next retry (1s, 2s, 4s...)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
  return false;
}

/**
 * Gets a user-scoped collection reference.
 * Path: schools/{schoolId}/{collectionName}
 */
export const getUserCollection = (schoolId: string, collectionName: string) => {
  if (!auth.currentUser) {
    console.error("DEBUG: getUserCollection called without auth.currentUser. Collection:", collectionName);
    throw new Error("User must be authenticated to access personal data");
  }
  const path = `schools/${schoolId}/${collectionName}`;
  console.log(`DEBUG: Getting collection at path: ${path}`);
  return collection(db, 'schools', schoolId, collectionName);
};



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
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const currentUid = auth.currentUser?.uid;
  
  console.error("DEBUG FLOG: handleFirestoreError called.", { 
    operationType, 
    path, 
    currentUid, 
    errorMessage 
  });

  if (errorMessage.includes('auth/unauthorized-domain')) {
    const domainMsg = "نطاق هذا الموقع غير مصرح به في إعدادات Firebase. يرجى إضافة النطاقات التالية إلى Authorized Domains في Firebase Console:";
    const domains = [
      window.location.hostname,
      "ais-dev-szpfy7hlvbt6f6dfitbcum-711250098837.europe-west2.run.app",
      "ais-pre-szpfy7hlvbt6f6dfitbcum-711250098837.europe-west2.run.app"
    ].join(', ');
    
    throw new Error(JSON.stringify({
      error: domainMsg,
      domains: domains,
      code: 'auth/unauthorized-domain',
      operationType,
      path
    }));
  }

  if (errorMessage.includes('the client is offline') || errorMessage.includes('Failed to get document from cache')) {
    const offlineMsg = "أنت في وضع عدم الاتصال (Offline). يتم استخدام البيانات المحفوظة محلياً، وسيتم المزامنة تلقائياً عند عودة الاتصال.";
    console.log(offlineMsg);
    
    // We still throw an error so the calling function knows the operation couldn't fully complete via network (if it was forcing network), 
    // but with a friendly message instead of a scary configuration warning.
    throw new Error(JSON.stringify({
      error: offlineMsg,
      isOffline: true,
      operationType,
      path,
      originalError: errorMessage
    }));
  }

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default app;
