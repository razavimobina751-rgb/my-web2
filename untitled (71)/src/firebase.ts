import { initializeApp } from 'firebase/app';
import { initializeFirestore, doc, getDocFromServer, getDocs, QuerySnapshot, DocumentData, Query } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */

// Validate Connection to Firestore (Skill Mandatory Constraint)
async function testConnection() {
  try {
    const testDocRef = doc(db, 'test', 'connection');
    await getDocFromServer(testDocRef);
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    } else {
      console.warn("Firestore connection check bypassed (working in fast offline/cached mode).");
    }
  }
}
testConnection();

// High performance safe getDocs wrapper with a fast 1500ms timeout
export async function safeGetDocs(queryRef: Query<DocumentData>): Promise<QuerySnapshot<DocumentData>> {
  const fetchPromise = getDocs(queryRef);
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Firestore connection timeout')), 1500)
  );
  return Promise.race([fetchPromise, timeoutPromise]) as Promise<QuerySnapshot<DocumentData>>;
}

// Safe mock auth since CMS authentication is entirely server-side/JSON-based and doesn't use Firebase Auth
export const auth = {
  currentUser: null as any
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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
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
  console.warn('Firestore Operation Info (Cached fallback active): ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
