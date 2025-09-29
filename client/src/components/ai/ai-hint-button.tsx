import { Button } from "@/components/ui/button";
import { useAI } from "@/hooks/use-ai";
import { Lightbulb } from "lucide-react";
import { useState } from "react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

type AIHintButtonProps = {
  riddle: string;
  onGetHint?: (hint: string) => void;
};

export default function AIHintButton({ riddle, onGetHint }: AIHintButtonProps) {
  const { getAIHint, isGeneratingHint } = useAI();
  const [isOpen, setIsOpen] = useState(false);
  const [aiHint, setAIHint] = useState<string | null>(null);
  const [citations, setCitations] = useState<string[]>([]);

  const handleGetAIHint = async () => {
    // If we already have a hint, just show the dialog without blocking
    if (aiHint) {
      setIsOpen(true);
      return;
    }
    
    // Otherwise, fetch a new hint but don't block the UI
    try {
      const response = await getAIHint(riddle);
      if (response) {
        setAIHint(response.hint);
        setCitations(response.citations || []);
        if (onGetHint) {
          onGetHint(response.hint);
        }
        // Show the dialog only after we have the hint
        setIsOpen(true);
      }
    } catch (error) {
      console.error("Error getting AI hint:", error);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-1 bg-gradient-to-r from-purple-500 to-blue-400 hover:from-purple-600 hover:to-blue-500 text-white border-none"
        onClick={handleGetAIHint}
        disabled={isGeneratingHint}
      >
        <Lightbulb className="w-4 h-4" />
        <span>AI Hint</span>
      </Button>

      {/* Dialog that doesn't block interaction */}
      <Dialog open={isOpen} onOpenChange={setIsOpen} modal={false}>
        <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-purple-600">
              AI Assistant Hint
            </DialogTitle>
            <DialogDescription>
              Powered by AI to help you solve the riddle - you can continue playing while viewing this hint
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[300px] mt-4">
            {isGeneratingHint ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-4"></div>
                <p className="text-sm text-gray-500">Generating a helpful hint...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                  <p className="text-gray-800">{aiHint}</p>
                </div>

                {citations.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-700">Sources:</h4>
                    <ul className="text-xs text-gray-500 space-y-1">
                      {citations.map((citation, i) => (
                        <li key={i}>
                          <a 
                            href={citation} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline truncate block"
                          >
                            {citation}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          <DialogFooter>
            <Button onClick={() => setIsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}