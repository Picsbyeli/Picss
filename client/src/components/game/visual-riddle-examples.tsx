import React from 'react';
import puzzleGridImage from '@assets/WordPuzzleBrainTeasers.jpg';
import rebusPuzzlesImage from '@assets/images.png';

export default function VisualRiddleExamples() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4">Visual Riddle Examples</h2>
      <p className="text-dark-light mb-6">
        Visual riddles like rebuses and visual brain teasers are a fun way to challenge players.
        Here are some examples to inspire your own submissions:
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="border rounded-lg overflow-hidden">
            <img 
              src={rebusPuzzlesImage} 
              alt="Rebus Puzzles" 
              className="w-full h-auto object-contain"
            />
          </div>
          <h3 className="font-medium text-lg">Rebus Puzzles</h3>
          <p className="text-dark-light text-sm">
            These puzzles use pictures, symbols, and arrangement of words to represent common phrases or expressions.
          </p>
        </div>
        
        <div className="space-y-3">
          <div className="border rounded-lg overflow-hidden">
            <img 
              src={puzzleGridImage} 
              alt="Word Brain Teasers" 
              className="w-full h-auto object-contain"
            />
          </div>
          <h3 className="font-medium text-lg">Word Puzzles</h3>
          <p className="text-dark-light text-sm">
            Word puzzles use creative arrangements of text, symbols, and sometimes images to create a hidden meaning.
          </p>
        </div>
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-100">
        <h3 className="font-medium mb-2">How to Create Great Visual Riddles:</h3>
        <ul className="list-disc list-inside space-y-1 text-dark-light">
          <li>Make sure the image clearly shows all the elements needed to solve the puzzle</li>
          <li>Include a descriptive question to guide the player</li>
          <li>Provide an image URL that is publicly accessible</li>
          <li>Consider sharing a unique visual concept rather than copying existing puzzles</li>
        </ul>
      </div>
    </div>
  );
}