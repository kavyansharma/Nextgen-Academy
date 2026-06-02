import { 
  signInWithEmailAndPassword as fbSignIn,
  createUserWithEmailAndPassword as fbSignUp,
  signOut as fbSignOut,
  onAuthStateChanged as fbOnAuthStateChanged,
  User,
  AuthError
} from "firebase/auth";
import { auth } from "../firebase";

/**
 * Signs in a user with email and password.
 */
export async function signIn(email: string, password: string): Promise<User> {
  try {
    const userCredential = await fbSignIn(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    console.error("Firebase Sign In Error:", error.message);
    throw error;
  }
}

/**
 * Registers/Signs up a new user with email and password.
 */
export async function signUp(email: string, password: string): Promise<User> {
  try {
    const userCredential = await fbSignUp(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    console.error("Firebase Sign Up Error:", error.message);
    throw error;
  }
}

/**
 * Signs out the currently authenticated user.
 */
export async function signOut(): Promise<void> {
  try {
    await fbSignOut(auth);
  } catch (error: any) {
    console.error("Firebase Sign Out Error:", error.message);
    throw error;
  }
}

/**
 * Observes changes to the user's sign-in state.
 * 
 * @param callback Callback function that runs whenever authentication state changes
 * @returns Unsubscribe function to clean up the observer
 */
export function onAuthStateChanged(callback: (user: User | null) => void) {
  return fbOnAuthStateChanged(auth, callback);
}

/**
 * Gets the currently signed-in user (null if guest).
 */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}
