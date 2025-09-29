import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import AreYouMyValentine from "@/pages/ev-special";
import SubmitRiddle from "@/pages/submit-riddle";
import Burble from "@/pages/burble";
import EmojiGuess from "@/pages/emoji-guess";
import MultiplayerPage from "@/pages/multiplayer";
import AuthPage from "@/pages/auth-page";
import ProfilePage from "@/pages/profile";
import LeaderboardPage from "@/pages/leaderboard";
import CategoryPage from "@/pages/category";
import TriviaPage from "@/pages/trivia";
import AnimalTrivia from "@/pages/animal-trivia";
import AudioManager from "@/pages/audio-manager";
import SchoolTrivia from "@/pages/school-trivia";
import GeoGuesser from "@/pages/geo-guesser";
import BurblemonPage from "@/pages/burblemons";
import SoloDungeonPage from "@/pages/solo-dungeon";
import { useState, useEffect } from "react";
import Header from "@/components/layout/header";
import { AuthProvider } from "@/hooks/use-auth";
import { FirebaseProvider } from "@/hooks/use-firebase";
import { ThemeProvider } from "@/hooks/use-theme";
import { AudioPlayerProvider } from "@/hooks/use-audio-player";
import { AudioPlayerPopup } from "@/components/audio/AudioPlayerPopup";
import { ProtectedRoute } from "@/lib/protected-route";

function Router() {
  return (
    <AudioPlayerProvider>
      {/* Header with visible Home Button */}
      <Header />
      
      <main className="min-h-[calc(100vh-64px)]">
        <Switch>
          <ProtectedRoute path="/" component={Home} />
          <ProtectedRoute path="/ev-special" component={AreYouMyValentine} />
          <ProtectedRoute path="/submit-riddle" component={SubmitRiddle} />
          <ProtectedRoute path="/burble" component={Burble} />
          <ProtectedRoute path="/emoji-guess" component={EmojiGuess} />
          <ProtectedRoute path="/burblemons" component={BurblemonPage} />
          <ProtectedRoute path="/solo-dungeon" component={SoloDungeonPage} />
          <ProtectedRoute path="/trivia" component={TriviaPage} />
          <ProtectedRoute path="/animal-trivia" component={AnimalTrivia} />
          <ProtectedRoute path="/audio-manager" component={AudioManager} />
          <ProtectedRoute path="/school-trivia" component={SchoolTrivia} />
          <ProtectedRoute path="/geo-guesser" component={GeoGuesser} />
          <ProtectedRoute path="/multiplayer" component={MultiplayerPage} />
          <ProtectedRoute path="/profile" component={ProfilePage} />
          <ProtectedRoute path="/leaderboard" component={LeaderboardPage} />
          <ProtectedRoute path="/category/:id" component={CategoryPage} />
          <Route path="/auth" component={AuthPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
      
      {/* Audio Player Popup */}
      <AudioPlayerPopup />
    </AudioPlayerProvider>
  );
}

function App() {
  // Add Remix icon library
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://cdn.jsdelivr.net/npm/remixicon@2.5.0/fonts/remixicon.css";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    
    // Clean up on unmount
    return () => {
      document.head.removeChild(link);
    };
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <FirebaseProvider>
          <ThemeProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </ThemeProvider>
        </FirebaseProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
