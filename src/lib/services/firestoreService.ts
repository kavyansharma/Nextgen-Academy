import { 
  collection,
  doc,
  setDoc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  DocumentData,
  QueryConstraint
} from "firebase/firestore";
import { db, storage } from "../firebase";

/**
 * Adds a new document to a specified collection with an auto-generated ID.
 */
export async function addDocument(collectionName: string, data: Record<string, any>) {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error: any) {
    console.error(`Firestore addDocument Error in collection "${collectionName}":`, error.message);
    throw error;
  }
}

/**
 * Sets (creates or replaces) a document in a collection with a specific document ID.
 */
export async function setDocument(collectionName: string, docId: string, data: Record<string, any>) {
  try {
    await setDoc(doc(db, collectionName, docId), {
      ...data,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return docId;
  } catch (error: any) {
    console.error(`Firestore setDocument Error in document "${collectionName}/${docId}":`, error.message);
    throw error;
  }
}

/**
 * Retrieves a single document from a collection by its ID.
 */
export async function getDocument(collectionName: string, docId: string): Promise<DocumentData | null> {
  try {
    const docSnap = await getDoc(doc(db, collectionName, docId));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error: any) {
    console.error(`Firestore getDocument Error in document "${collectionName}/${docId}":`, error.message);
    throw error;
  }
}

/**
 * Updates specific fields of an existing document.
 */
export async function updateDocument(collectionName: string, docId: string, data: Record<string, any>) {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error(`Firestore updateDocument Error in document "${collectionName}/${docId}":`, error.message);
    throw error;
  }
}

/**
 * Deletes a document from a collection by its ID.
 */
export async function deleteDocument(collectionName: string, docId: string) {
  try {
    await deleteDoc(doc(db, collectionName, docId));
  } catch (error: any) {
    console.error(`Firestore deleteDocument Error in document "${collectionName}/${docId}":`, error.message);
    throw error;
  }
}

/**
 * Queries and retrieves documents from a collection based on standard queries.
 * 
 * @param collectionName The name of the Firestore collection
 * @param constraints List of Firestore query constraints like where(), orderBy(), etc.
 */
export async function queryDocuments(collectionName: string, ...constraints: QueryConstraint[]): Promise<DocumentData[]> {
  try {
    const q = query(collection(db, collectionName), ...constraints);
    const querySnapshot = await getDocs(q);
    const documents: DocumentData[] = [];
    querySnapshot.forEach((doc) => {
      documents.push({ id: doc.id, ...doc.data() });
    });
    return documents;
  } catch (error: any) {
    console.error(`Firestore queryDocuments Error in collection "${collectionName}":`, error.message);
    throw error;
  }
}

/**
 * Uploads a file to Firebase Storage and returns the download URL.
 */
export async function uploadFile(file: File, path: string): Promise<string> {
  try {
    const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  } catch (error: any) {
    console.error(`Firebase Storage uploadFile Error at "${path}":`, error.message);
    throw error;
  }
}

/**
 * Logs an administrative action to the audit_logs collection.
 */
export async function logAdminAction(adminId: string, adminEmail: string, action: string, details: string) {
  try {
    await addDocument("audit_logs", {
      adminId,
      adminEmail,
      action,
      details,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Error logging admin action:", error.message);
  }
}
