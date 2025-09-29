import React from 'react';
import { Link } from 'wouter';

export default function MobileNav() {
  return (
    <nav className="lg:hidden bg-white border-t border-light-gray py-2 sticky bottom-0 z-10">
      <div className="flex justify-around">
        <Link href="/">
          <div className="flex flex-col items-center p-2 text-primary cursor-pointer">
            <i className="ri-home-4-line text-xl"></i>
            <span className="text-xs mt-1">Home</span>
          </div>
        </Link>
        <Link href="/ev-special">
          <div className="flex flex-col items-center p-2 text-success cursor-pointer">
            <i className="ri-question-line text-xl"></i>
            <span className="text-xs mt-1">Valentine</span>
          </div>
        </Link>
        <Link href="/burble">
          <div className="flex flex-col items-center p-2 text-purple-500 cursor-pointer">
            <i className="ri-game-fill text-xl"></i>
            <span className="text-xs mt-1">Burble</span>
          </div>
        </Link>
        <Link href="/trivia">
          <div className="flex flex-col items-center p-2 text-blue-500 cursor-pointer">
            <i className="ri-brain-line text-xl"></i>
            <span className="text-xs mt-1">Trivia</span>
          </div>
        </Link>
        <Link href="/animal-trivia">
          <div className="flex flex-col items-center p-2 text-green-500 cursor-pointer">
            <span className="text-xl">🐾</span>
            <span className="text-xs mt-1">Animals</span>
          </div>
        </Link>
        <Link href="/submit-riddle">
          <div className="flex flex-col items-center p-2 text-accent cursor-pointer">
            <i className="ri-add-circle-line text-xl"></i>
            <span className="text-xs mt-1">Submit</span>
          </div>
        </Link>
      </div>
    </nav>
  );
}
