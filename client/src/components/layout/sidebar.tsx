import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import CustomAvatarDisplay from "@/components/avatar/custom-avatar-display";

type SidebarProps = {
  isOpen?: boolean;
  onClose: () => void;
  userStats: {
    score: number;
    solvedCount: number;
    avgTimeSeconds: number;
  };
};

export default function Sidebar({ isOpen, onClose, userStats }: SidebarProps) {
  // For mobile sidebar implementation
  const [isMounted, setIsMounted] = useState(false);
  const { user } = useAuth();
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Mobile sidebar
  const MobileSidebar = () => (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>
            <div className="flex items-center mb-2">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg w-10 h-10 flex items-center justify-center text-white">
                <i className="ri-game-fill text-xl"></i>
              </div>
              <h1 className="ml-2 text-2xl font-bold font-poppins text-dark">Burble</h1>
            </div>
          </SheetTitle>
        </SheetHeader>
        <SidebarContent userStats={userStats} user={user} />
      </SheetContent>
    </Sheet>
  );
  
  // Sidebar content shared between desktop and mobile
  const SidebarContent = ({ userStats, user }: { userStats: SidebarProps['userStats'], user: any }) => (
    <>
      <nav className="flex-1 mt-4">
        <ul className="space-y-2">
          <li>
            <a href="/" className="flex items-center p-3 rounded-lg bg-primary/90 text-white font-medium shadow-md hover:bg-primary transition duration-200">
              <i className="ri-home-4-line mr-3 text-lg"></i>
              <span>Home</span>
            </a>
          </li>
          <li>
            <a href="/ev-special" className="flex items-center p-3 rounded-lg hover:bg-light-gray dark:hover:bg-gray-700 text-success dark:text-green-400 font-medium transition duration-200">
              <i className="ri-question-line mr-3 text-lg"></i>
              <span>Are You My Valentine?</span>
            </a>
          </li>
          <li>
            <a href="/submit-riddle" className="flex items-center p-3 rounded-lg hover:bg-light-gray dark:hover:bg-gray-700 text-accent dark:text-pink-400 font-medium transition duration-200">
              <i className="ri-add-circle-line mr-3 text-lg"></i>
              <span>Submit Riddle</span>
            </a>
          </li>
          
          {/* User profile section - Now placed directly under menu items */}
          <li className="mt-4 border-t border-light-gray dark:border-gray-700 pt-4">
            <a href="/profile" className="flex items-center p-2">
              <CustomAvatarDisplay
                config={user?.avatarConfig ? JSON.parse(user.avatarConfig) : null}
                username={user?.username || 'Guest User'}
                profileImageUrl={user?.profileImageUrl}
                size={40}
              />
              <div className="ml-3">
                <p className="font-medium text-dark">{user ? user.username : 'Guest User'}</p>
                <p className="text-sm text-dark-light opacity-75">Score: {userStats.score} pts</p>
              </div>
            </a>
          </li>
        </ul>
      </nav>
      
      <div className="mt-auto">
        {/* Footer content can go here if needed */}
      </div>
    </>
  );
  
  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 flex-col bg-white border-r border-light-gray p-4 h-screen sticky top-0">
        <div className="flex items-center mb-8 mt-2">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg w-10 h-10 flex items-center justify-center text-white">
            <i className="ri-game-fill text-xl"></i>
          </div>
          <h1 className="ml-2 text-2xl font-bold font-poppins text-dark">Burble</h1>
        </div>
        <SidebarContent userStats={userStats} user={user} />
      </div>
      
      {/* Mobile sidebar */}
      {isMounted && <MobileSidebar />}
    </>
  );
}
