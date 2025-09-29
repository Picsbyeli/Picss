import { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChange, signInWithGoogle, firebaseSignOut, getUserProfile, updateUserGameStats, updateUserPreferences } from "@/lib/firebase";
const FirebaseContext = createContext(undefined);
export function FirebaseProvider({ children }) {
    const [firebaseUser, setFirebaseUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const unsubscribe = onAuthStateChange(async (user) => {
            setFirebaseUser(user);
            if (user) {
                try {
                    const profile = await getUserProfile(user.uid);
                    setUserProfile(profile);
                }
                catch (error) {
                    console.error("Error loading user profile:", error);
                    setError(error.message);
                }
            }
            else {
                setUserProfile(null);
            }
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);
    const handleSignInWithGoogle = async () => {
        setError(null);
        try {
            await signInWithGoogle();
        }
        catch (error) {
            setError(error.message);
            throw error;
        }
    };
    const handleSignOut = async () => {
        setError(null);
        try {
            await firebaseSignOut();
        }
        catch (error) {
            setError(error.message);
            throw error;
        }
    };
    const handleUpdateGameStats = async (stats) => {
        if (!firebaseUser)
            return;
        try {
            await updateUserGameStats(firebaseUser.uid, stats);
            // Refresh profile
            const profile = await getUserProfile(firebaseUser.uid);
            setUserProfile(profile);
        }
        catch (error) {
            setError(error.message);
        }
    };
    const handleUpdatePreferences = async (prefs) => {
        if (!firebaseUser)
            return;
        try {
            await updateUserPreferences(firebaseUser.uid, prefs);
            // Refresh profile
            const profile = await getUserProfile(firebaseUser.uid);
            setUserProfile(profile);
        }
        catch (error) {
            setError(error.message);
        }
    };
    return (<FirebaseContext.Provider value={{
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
    </FirebaseContext.Provider>);
}
export function useFirebase() {
    const context = useContext(FirebaseContext);
    if (context === undefined) {
        throw new Error("useFirebase must be used within a FirebaseProvider");
    }
    return context;
}
