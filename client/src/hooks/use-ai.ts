import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useToast } from './use-toast';
import { queryClient } from '../lib/queryClient';

export type AIHintResponse = {
  hint: string;
  citations: string[];
};

export type AIRiddleResponse = {
  question: string;
  answer: string;
  explanation: string;
  citations: string[];
};

export function useAI() {
  const { toast } = useToast();
  const [isGeneratingHint, setIsGeneratingHint] = useState(false);
  const [isGeneratingRiddle, setIsGeneratingRiddle] = useState(false);
  
  // API Call for generating AI hint
  const getAIHintMutation = useMutation({
    mutationFn: async ({ riddle }: { riddle: string }): Promise<AIHintResponse> => {
      setIsGeneratingHint(true);
      try {
        const response = await fetch('/api/ai/hint', {
          method: 'POST',
          body: JSON.stringify({ riddle }),
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        return await response.json() as AIHintResponse;
      } catch (error) {
        console.error('Error getting AI hint:', error);
        throw error;
      } finally {
        setIsGeneratingHint(false);
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to generate AI hint. Please try again later.',
        variant: 'destructive'
      });
    }
  });
  
  // API Call for generating AI riddle
  const getAIRiddleMutation = useMutation({
    mutationFn: async ({
      category,
      difficulty
    }: {
      category?: string;
      difficulty?: string;
    }): Promise<AIRiddleResponse> => {
      setIsGeneratingRiddle(true);
      try {
        const response = await fetch('/api/ai/generate-riddle', {
          method: 'POST',
          body: JSON.stringify({ category, difficulty }),
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        return await response.json() as AIRiddleResponse;
      } catch (error) {
        console.error('Error generating AI riddle:', error);
        throw error;
      } finally {
        setIsGeneratingRiddle(false);
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to generate riddle. Please try again later.',
        variant: 'destructive'
      });
    }
  });
  
  // API Call for saving a generated riddle
  const saveRiddleMutation = useMutation({
    mutationFn: async ({
      question,
      answer,
      explanation,
      hint,
      categoryId,
      difficulty
    }: {
      question: string;
      answer: string;
      explanation: string | null;
      hint: string | null;
      categoryId: number;
      difficulty: string;
    }) => {
      const response = await fetch('/api/ai/save-riddle', {
        method: 'POST',
        body: JSON.stringify({
          question,
          answer,
          explanation,
          hint,
          categoryId,
          difficulty
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Riddle saved successfully!'
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to save riddle. Please try again.',
        variant: 'destructive'
      });
    }
  });
  
  const getAIHint = async (riddle: string): Promise<AIHintResponse | null> => {
    try {
      return await getAIHintMutation.mutateAsync({ riddle });
    } catch (error) {
      return null;
    }
  };
  
  const generateAIRiddle = async (
    category?: string,
    difficulty?: string
  ): Promise<AIRiddleResponse | null> => {
    try {
      return await getAIRiddleMutation.mutateAsync({ category, difficulty });
    } catch (error) {
      return null;
    }
  };
  
  const saveGeneratedRiddle = async (
    riddleData: {
      question: string;
      answer: string;
      explanation: string | null;
      hint: string | null;
      categoryId: number;
      difficulty: string;
    }
  ) => {
    return saveRiddleMutation.mutateAsync(riddleData);
  };
  
  return {
    getAIHint,
    generateAIRiddle,
    saveGeneratedRiddle,
    isGeneratingHint,
    isGeneratingRiddle,
    isSaving: saveRiddleMutation.isPending
  };
}