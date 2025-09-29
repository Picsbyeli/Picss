import React from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Home, LogIn, LogOut, User, Settings, Trophy, Swords, Music } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useAudioPlayer } from '@/hooks/use-audio-player';
import { GameMenu } from '@/components/navigation/GameMenu';
import CustomAvatarDisplay from '@/components/avatar/custom-avatar-display';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const [location] = useLocation();
  const { user, isGuest, logoutMutation } = useAuth();
  const { togglePopup, isPopupOpen, currentTrack, isPlaying } = useAudioPlayer();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-light-gray shadow-sm">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg w-8 h-8 flex items-center justify-center text-white mr-2">
            <i className="ri-game-fill text-lg"></i>
          </div>
          <Link href="/">
            <h1 className="text-xl font-bold font-poppins text-dark cursor-pointer">
              Burble
            </h1>
          </Link>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Don't show navigation on auth page */}
          {location !== '/auth' && (
            <>
              {/* Games Menu - Always visible */}
              <GameMenu />
              
              {/* Leaderboard - Keep this separate as it's important */}
              <Link href="/leaderboard">
                <Button variant="ghost" className="hidden sm:flex items-center gap-1">
                  <Trophy className="h-4 w-4" />
                  Leaderboard
                </Button>
              </Link>
              
              {/* Audio Player Toggle */}
              <Button 
                variant="ghost" 
                size="icon" 
                className={`relative ${isPopupOpen ? 'bg-purple-100 text-purple-600' : ''}`}
                onClick={togglePopup}
                data-testid="button-audio-toggle"
                title={isPopupOpen ? 'Close Audio Player' : 'Open Audio Player'}
              >
                <Music className="h-5 w-5" />
                {currentTrack && (
                  <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                )}
              </Button>
              
              {/* User menu, guest prompt, or login button */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full p-1">
                      <CustomAvatarDisplay
                        config={user.avatarConfig ? JSON.parse(user.avatarConfig) : null}
                        username={user.username}
                        profileImageUrl={user.profileImageUrl}
                        size={32}
                        className="cursor-pointer"
                      />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuLabel className="font-normal text-sm text-muted-foreground">
                      {user.username}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <Link href="/profile">
                      <DropdownMenuItem className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>My Profile</span>
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/profile?tab=settings">
                      <DropdownMenuItem className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="cursor-pointer text-destructive focus:text-destructive"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : isGuest ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground hidden sm:inline">
                    Playing as guest
                  </span>
                  <Link href="/auth">
                    <Button variant="default" size="sm" className="flex items-center gap-1">
                      <LogIn className="h-4 w-4 mr-1" />
                      Sign Up to Save Progress
                    </Button>
                  </Link>
                </div>
              ) : (
                <Link href="/auth">
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <LogIn className="h-4 w-4 mr-1" />
                    Login
                  </Button>
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}