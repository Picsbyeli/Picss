import { Button } from "@/components/ui/button";
import { useAI } from "@/hooks/use-ai";
import { Sparkles, Save, RefreshCw } from "lucide-react";
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
import { useRiddles } from "@/hooks/use-riddles";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AIRiddleGeneratorProps = {
  trigger?: React.ReactNode;
};

export default function AIRiddleGenerator({ trigger }: AIRiddleGeneratorProps) {
  const { generateAIRiddle, saveGeneratedRiddle, isGeneratingRiddle, isSaving } = useAI();
  const { categories } = useRiddles();
  const { toast } = useToast();
  
  const [isOpen, setIsOpen] = useState(false);
  const [generatedRiddle, setGeneratedRiddle] = useState<{
    question: string;
    answer: string;
    explanation: string;
    citations: string[];
  } | null>(null);
  
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("medium");
  
  const handleGenerateRiddle = async () => {
    // Get the category name if one is selected
    const categoryName = selectedCategory 
      ? categories.find(c => c.id.toString() === selectedCategory)?.name 
      : undefined;
    
    const response = await generateAIRiddle(categoryName, selectedDifficulty);
    if (response) {
      setGeneratedRiddle(response);
    }
  };
  
  const handleSaveRiddle = async () => {
    if (!generatedRiddle || !selectedCategory) {
      toast({
        title: "Cannot Save",
        description: "Please select a category and generate a riddle first.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await saveGeneratedRiddle({
        question: generatedRiddle.question,
        answer: generatedRiddle.answer,
        explanation: generatedRiddle.explanation,
        hint: null, // No hint provided from the AI for now
        categoryId: parseInt(selectedCategory),
        difficulty: selectedDifficulty
      });
      
      // Invalidate riddles cache to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/riddles/with-categories'] });
      
      setIsOpen(false);
      setGeneratedRiddle(null);
      
    } catch (error) {
      console.error("Error saving riddle:", error);
    }
  };
  
  const openDialog = () => {
    setIsOpen(true);
    if (!generatedRiddle) {
      handleGenerateRiddle();
    }
  };
  
  return (
    <>
      {trigger ? (
        <div onClick={openDialog}>{trigger}</div>
      ) : (
        <Button
          className="flex items-center gap-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
          onClick={openDialog}
        >
          <Sparkles className="w-4 h-4" />
          <span>Generate AI Riddle</span>
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-indigo-600">
              AI Riddle Generator
            </DialogTitle>
            <DialogDescription>
              Create unique riddles using AI
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any Category</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Difficulty</label>
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <ScrollArea className="h-[350px] border rounded-md p-4">
            {isGeneratingRiddle ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
                <p className="text-gray-500">Generating a unique riddle...</p>
              </div>
            ) : generatedRiddle ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-indigo-600 mb-2">Question:</h3>
                  <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                    <p className="text-gray-800">{generatedRiddle.question}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-green-600 mb-2">Answer:</h3>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                    <p className="text-gray-800">{generatedRiddle.answer}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-amber-600 mb-2">Explanation:</h3>
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                    <p className="text-gray-800">{generatedRiddle.explanation}</p>
                  </div>
                </div>
                
                {generatedRiddle.citations.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700">Sources:</h3>
                    <ul className="text-xs text-gray-500 space-y-1 mt-2">
                      {generatedRiddle.citations.map((citation, i) => (
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
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 py-16">
                <p>Click "Generate" to create a new riddle</p>
              </div>
            )}
          </ScrollArea>

          <DialogFooter className="flex justify-between">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleGenerateRiddle}
                disabled={isGeneratingRiddle}
                className="flex items-center gap-1"
              >
                <RefreshCw className={`w-4 h-4 ${isGeneratingRiddle ? 'animate-spin' : ''}`} />
                Generate New
              </Button>
              
              <Button 
                onClick={handleSaveRiddle}
                disabled={!generatedRiddle || isSaving || !selectedCategory}
                className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
              >
                <Save className="w-4 h-4" />
                Save to Collection
              </Button>
            </div>
            
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}