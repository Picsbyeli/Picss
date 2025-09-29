// Firebase integration - authentication with last login tracking and secure storage
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
const provider = new GoogleAuthProvider();
// Initialize user profile in Firestore
export async function createUserProfile(user) {
    const userDoc = doc(db, 'users', user.uid);
    const userSnapshot = await getDoc(userDoc);
    if (!userSnapshot.exists()) {
        const newProfile = {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || '',
            photoURL: user.photoURL || '',
            lastSignedIn: serverTimestamp(),
            createdAt: serverTimestamp(),
            gameStats: {
                totalScore: 0,
                gamesPlayed: 0,
                gamesWon: 0,
                riddlesSolved: 0,
                triviaCorrect: 0,
                burbleWins: 0,
                emojiGuesses: 0,
                geoGuesses: 0,
                schoolTriviaScore: 0,
            },
            preferences: {
                favoriteGameMode: '',
                difficulty: 'medium',
                audioFiles: [],
            },
        };
        await setDoc(userDoc, newProfile);
        return newProfile;
    }
    else {
        // Update last signed in
        await updateDoc(userDoc, {
            lastSignedIn: serverTimestamp(),
        });
        return userSnapshot.data();
    }
}
// Get user profile from Firestore
export async function getUserProfile(uid) {
    const userDoc = doc(db, 'users', uid);
    const userSnapshot = await getDoc(userDoc);
    if (userSnapshot.exists()) {
        return userSnapshot.data();
    }
    return null;
}
// Update user game stats
export async function updateUserGameStats(uid, updates) {
    const userDoc = doc(db, 'users', uid);
    await updateDoc(userDoc, {
        [`gameStats.${Object.keys(updates)[0]}`]: Object.values(updates)[0],
        lastSignedIn: serverTimestamp(),
    });
}
// Update user preferences (including audio files)
export async function updateUserPreferences(uid, preferences) {
    const userDoc = doc(db, 'users', uid);
    await updateDoc(userDoc, {
        preferences,
        lastSignedIn: serverTimestamp(),
    });
}
// Sign in with Google
export async function signInWithGoogle() {
    try {
        const result = await signInWithPopup(auth, provider);
        await createUserProfile(result.user);
        return result.user;
    }
    catch (error) {
        console.error('Error signing in with Google:', error);
        throw error;
    }
}
// Sign out
export async function firebaseSignOut() {
    try {
        await signOut(auth);
    }
    catch (error) {
        console.error('Error signing out:', error);
        throw error;
    }
}
// Auth state observer
export function onAuthStateChange(callback) {
    return onAuthStateChanged(auth, callback);
}
