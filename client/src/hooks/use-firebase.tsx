import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { onAuthStateChange, signInWithGoogle, firebaseSignOut, getUserProfile, UserProfile, updateUserGameStats, updateUserPreferences } from "@/lib/firebase";

interface FirebaseContextType {
  firebaseUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateGameStats: (stats: Partial<UserProfile['gameStats']>) => Promise<void>;
  updatePreferences: (prefs: Partial<UserProfile['preferences']>) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      setFirebaseUser(user);
      
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
        } catch (error: any) {
          console.error("Error loading user profile:", error);
          setError(error.message);
        }
      } else {
        setUserProfile(null);
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignInWithGoogle = async (): Promise<void> => {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  const handleSignOut = async (): Promise<void> => {
    setError(null);
    try {
      await firebaseSignOut();
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  };

  const handleUpdateGameStats = async (stats: Partial<UserProfile['gameStats']>) => {
    if (!firebaseUser) return;
    
    try {
      await updateUserGameStats(firebaseUser.uid, stats);
      // Refresh profile
      const profile = await getUserProfile(firebaseUser.uid);
      setUserProfile(profile);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleUpdatePreferences = async (prefs: Partial<UserProfile['preferences']>) => {
    if (!firebaseUser) return;
    
    try {
      await updateUserPreferences(firebaseUser.uid, prefs);
      // Refresh profile
      const profile = await getUserProfile(firebaseUser.uid);
      setUserProfile(profile);
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <FirebaseContext.Provider value={{
      firebaseUser,
      userProfile,
      signInWithGoogle: handleSignInWithGoogle,
      signOut: handleSignOut,
      updateGameStats: handleUpdateGameStats,
      updatePreferences: handleUpdatePreferences,
      isLoading,
      error
    }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error("useFirebase must be used within a FirebaseProvider");
  }
  return context;
}