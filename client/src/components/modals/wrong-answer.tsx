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

type WrongAnswerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  userAnswer: string;
  onShowAnswer: () => void;
  onTryAgain: () => void;
  onNextQuestion?: () => void;
  hint: string;
  isAttemptsExhausted?: boolean;
};

export const WrongAnswerModal = ({
  isOpen,
  onClose,
  userAnswer,
  onShowAnswer,
  onTryAgain,
  onNextQuestion,
  hint,
  isAttemptsExhausted = false
}: WrongAnswerModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal={false}>
      <DialogContent className="sm:max-w-md mx-4 rounded-xl shadow-xl p-6 fade-in" onPointerDownOutside={(e) => e.preventDefault()}>
        <div className="text-center">
          <div className="w-20 h-20 mx-auto bg-error bg-opacity-10 rounded-full flex items-center justify-center text-error mb-4">
            <i className="ri-close-line text-4xl"></i>
          </div>
          <DialogTitle className="text-2xl font-bold font-poppins text-dark mb-2">Not Quite!</DialogTitle>
          <DialogDescription className="text-dark-light mb-4">
            Your answer: "{userAnswer}"
          </DialogDescription>
          
          <div className="bg-light-gray p-3 rounded-lg mb-6">
            <p className="text-dark-light text-sm">{hint}</p>
          </div>
          
          <div className="flex space-x-3">
            <Button
              onClick={onShowAnswer}
              variant="outline"
              className="flex-1 bg-light-gray hover:bg-light-gray/80 text-dark font-medium py-3 rounded-lg transition duration-200"
            >
              <i className="ri-lightbulb-line mr-1"></i>
              Show Answer
            </Button>
            {isAttemptsExhausted && onNextQuestion ? (
              <Button
                onClick={onNextQuestion}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg transition duration-200"
              >
                <i className="ri-arrow-right-line mr-1"></i>
                Next Question
              </Button>
            ) : (
              <Button
                onClick={onTryAgain}
                className="flex-1 bg-primary hover:bg-primary/90 text-white font-medium py-3 rounded-lg transition duration-200"
              >
                Try Again
              </Button>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-4">You can continue playing while this dialog is open</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
