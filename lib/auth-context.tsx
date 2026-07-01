"use client";

/**
 * Firebase Auth context for the whole app.
 *
 * Wrap the root layout (or the client boundary that needs auth) with
 * <AuthProvider>. Consume with useAuth() anywhere in client components.
 *
 * The context exposes:
 *   user        — Firebase User | null (null while loading or signed out)
 *   loading     — true until the first onAuthStateChanged fires
 *   signIn()    — email + password sign-in
 *   signUp()    — email + password sign-up; also creates the users/{uid} doc
 *   signOut()   — signs out and clears state
 *   getToken()  — returns the current ID token (auto-refreshed by Firebase)
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { UserRole } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    displayName: string,
    role: UserRole
  ) => Promise<void>;
  signOut: () => Promise<void>;
  getToken: () => Promise<string>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      displayName: string,
      role: UserRole
    ) => {
      const credential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const uid = credential.user.uid;

      // Create the users/{uid} document that API routes check for roles.
      // Only write if it doesn't already exist (safety guard for re-registration).
      const userRef = doc(db, "users", uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          displayName,
          role,
          createdAt: serverTimestamp(),
        });
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
  }, []);

  const getToken = useCallback(async (): Promise<string> => {
    if (!auth.currentUser) throw new Error("Not signed in");
    return auth.currentUser.getIdToken();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
