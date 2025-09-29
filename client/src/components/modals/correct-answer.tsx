import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

type CorrectAnswerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  riddleAnswer: string;
  explanation: string;
  timeToSolve: number;
  pointsEarned: number;
  onNextRiddle: () => void;
  onBackToMenu: () => void;
};

export const CorrectAnswerModal = ({
  isOpen,
  onClose,
  riddleAnswer,
  explanation,
  timeToSolve,
  pointsEarned,
  onNextRiddle,
  onBackToMenu
}: CorrectAnswerModalProps) => {
  // Add a celebration animation when modal opens
  useEffect(() => {
    if (isOpen) {
      const onConfetti = async () => {
        try {
          // Dynamically import confetti for the celebration
          const confetti = (await import('canvas-confetti')).default;
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch (e) {
          console.error("Could not load confetti", e);
        }
      };
      
      onConfetti();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal={false}>
      <DialogContent className="sm:max-w-md mx-4 rounded-xl shadow-xl p-6 fade-in" onPointerDownOutside={(e) => e.preventDefault()}>
        <div className="text-center">
          <div className="w-20 h-20 mx-auto bg-success bg-opacity-10 rounded-full flex items-center justify-center text-success mb-4 celebrate">
            <i className="ri-check-line text-4xl"></i>
          </div>
          <DialogTitle className="text-2xl font-bold font-poppins text-dark mb-2">Correct!</DialogTitle>
          <DialogDescription className="text-dark-light mb-4">
            The answer is "{riddleAnswer}"
          </DialogDescription>
          
          <div className="bg-light-gray p-3 rounded-lg mb-4">
            <p className="text-dark-light text-sm">{explanation}</p>
          </div>
          
          <div className="flex justify-between items-center bg-light p-3 rounded-lg mb-6">
            <div>
              <p className="text-dark-light text-sm">Time taken</p>
              <p className="font-bold text-dark">{timeToSolve} seconds</p>
            </div>
            <div>
              <p className="text-dark-light text-sm">Points earned</p>
              <p className="font-bold text-success">+{pointsEarned} pts</p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Button
              onClick={onBackToMenu}
              variant="outline"
              className="flex-1 bg-light-gray hover:bg-light-gray/80 text-dark font-medium py-3 rounded-lg transition duration-200"
            >
              Back to Menu
            </Button>
            <Button
              onClick={onNextRiddle}
              className="flex-1 bg-primary hover:bg-primary/90 text-white font-medium py-3 rounded-lg transition duration-200"
            >
              Next Riddle
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-4">You can continue to browse while this dialog is open</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
