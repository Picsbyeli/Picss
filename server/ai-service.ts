import { Request, Response } from 'express';
import fetch from 'node-fetch';

type PerplexityMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type PerplexityResponse = {
  id: string;
  model: string;
  object: string;
  created: number;
  choices: {
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  citations?: string[];
};

// Helper function to call Perplexity API
export async function callPerplexityAPI(messages: PerplexityMessage[]): Promise<PerplexityResponse> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  
  if (!apiKey) {
    throw new Error('PERPLEXITY_API_KEY environment variable is not set');
  }

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.1-sonar-small-128k-online',
      messages: messages,
      temperature: 0.2,
      top_p: 0.9,
      search_domain_filter: [],
      return_images: false,
      return_related_questions: false,
      search_recency_filter: 'month',
      stream: false,
      frequency_penalty: 1
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Perplexity API error: ${response.status} ${text}`);
  }

  return await response.json() as PerplexityResponse;
}

// Handler for getting AI-generated hints
export async function getAIHint(req: Request, res: Response) {
  try {
    const { riddle, isQuestion } = req.body;
    
    if (!riddle) {
      return res.status(400).json({ error: 'Riddle is required' });
    }
    
    // Check if this is an emoji puzzle - if so, use a more kid-friendly approach
    const isEmojiPuzzle = riddle.includes('emoji');
    

    let messages: PerplexityMessage[];
    
    // Check if this is a question (for EV Special game mode) that needs a direct answer
    if (isQuestion) {
      messages = [
        {
          role: 'system',
          content: 'You are an assistant for a riddle game called "Are You My Valentine?". In this game, middle school students ask yes/no questions to figure out the answer. The user\'s message will contain their question followed by "(The answer is: X)" where X is the actual answer.\n\nIMPORTANT: NEVER REVEAL THE ANSWER "X" IN YOUR RESPONSES:\n1. NEVER say the answer name or title directly\n2. NEVER mention specific character names\n3. NEVER mention specific places\n4. NEVER mention actors, dates, or unique story elements\n\nYour answers should be simple, clear, and kid-friendly (grade 5-8 reading level).\n\nFor example, if the question asks "Does it have gills?" and the answer is "Avatar", then say "No. This doesn\'t have gills. The characters breathe differently."\n\nALWAYS start with "Yes" or "No", then give a SHORT, SIMPLE explanation. If they guess correctly, say "Yes, that\'s correct!" without repeating the answer.\n\nRULES:\n1. Use simple words middle schoolers understand\n2. Keep answers to 1-2 short sentences\n3. Be factual and accurate\n4. Be helpful without giving away too much\n\nExamples:\nQuestion: "Is it an animal? (The answer is: Elephant)"\nResponse: "Yes. This is a large animal with gray skin."\n\nQuestion: "Can it fly? (The answer is: Penguin)"\nResponse: "No. This bird swims instead of flying."\n\nQuestion: "Is it blue? (The answer is: Avatar)"\nResponse: "Yes. There are blue characters in this movie."\n\nQuestion: "Is it Superman? (The answer is: Superman)"\nResponse: "Yes, that\'s correct!"\n\nKeep answers simple, short, and easy to understand for kids. Never use complex words or give away the exact answer.'
        },
        {
          role: 'user',
          content: `This is a yes/no question related to the riddle I'm thinking of. Please answer honestly and accurately: "${riddle}"`
        }
      ];
    } else if (isEmojiPuzzle) {
      // Special handling for emoji puzzles
      messages = [
        {
          role: 'system',
          content: 'You are an assistant helping middle school students (grades 5-8) solve emoji puzzles. Your hints should be:\n\n1. SUPER CLEAR - Use the simplest language possible that kids understand\n2. DIRECTLY HELPFUL - Give a meaningful clue about what the emojis are trying to represent\n3. CONCRETE - Avoid abstract concepts and focus on things kids can visualize\n4. SHORT - Keep to 1 short sentence only\n\nIMPORTANT RULES:\n- NEVER prefix your hint with "Here\'s a hint:" or similar phrases\n- NEVER add commentary about the hint quality (like "This is a fun hint")\n- NEVER refer to yourself or the student in the hint\n- JUST provide the direct hint and nothing else\n- Your entire response should be 15 words or less\n\nFocus on WHAT the emoji sequence represents, not on describing the emojis themselves.'
        },
        {
          role: 'user',
          content: `Provide a simple, direct hint for this emoji puzzle: "${riddle}". Just give the hint with no introduction or explanation. Focus only on what the emojis represent.`
        }
      ];
    } else {
      // Original hint generation for non-emoji puzzles
      messages = [
        {
          role: 'system',
          content: 'You are an assistant that provides helpful hints for middle school students (grades 5-8) playing a riddle game. Create hints that are:\n\n1. EASY TO UNDERSTAND - Use simple language a middle schooler would know\n2. HELPFUL - Give real clues that actually help figure out the answer\n3. CLEAR - Don\'t use complicated words or confusing language\n4. CONCISE - Use only 1 short sentence (no more than 15 words)\n\nIMPORTANT RULES:\n- NEVER prefix your hint with "Here\'s a hint:" or similar phrases\n- NEVER add commentary about the hint quality (like "This is a fun hint")\n- NEVER refer to yourself or the student in the hint\n- JUST provide the direct hint and nothing else\n- Your entire response should be 15 words or less\n\nNever give away the exact answer, but make the hint genuinely helpful.'
        },
        {
          role: 'user',
          content: `Provide a direct hint for this riddle without any introduction or explanation: "${riddle}". Make it simple enough for a middle school student to understand.`
        }
      ];
    }

    const result = await callPerplexityAPI(messages);
    
    // Process the hint to remove meta-commentary about the hint itself
    let hint = result.choices[0].message.content;
    
    // Remove prefixes like "Here's a fun and clear hint for middle school students:"
    hint = hint.replace(/^(here\'s a|here is a).*hint.*:/i, '');
    hint = hint.replace(/^UNIQUE AI HINT:.*:/i, '');
    
    // Remove explanations about the hint at the end
    hint = hint.replace(/This hint (is|gives).*$/i, '');
    
    // Trim whitespace and ensure first character is capitalized
    hint = hint.trim();
    if (hint.startsWith('"') && hint.endsWith('"')) {
      hint = hint.substring(1, hint.length - 1).trim();
    }
    
    return res.json({
      hint: hint,
      citations: result.citations || []
    });
  } catch (error) {
    console.error('AI hint error:', error);
    return res.status(500).json({ error: 'Failed to generate hint' });
  }
}

// Handler for getting new riddles
export async function getNewRiddle(req: Request, res: Response) {
  try {
    const { category, difficulty } = req.body;
    
    let promptCategory = category || 'any subject';
    let promptDifficulty = difficulty || 'medium';
    
    const messages: PerplexityMessage[] = [
      {
        role: 'system',
        content: `You are a master riddle creator who specializes in creating challenging, creative, and original brain teasers. 
Create riddles that are clever and require lateral thinking. The riddles should be engaging for players of all ages, with a focus on making them fun for younger audiences without being too easy. 
Your answers should be specific but allow for some flexibility (for example, "reading between the lines" and "reading between the lines" should both be acceptable).

Format your response with these exact sections:
Question: [the riddle text]
Answer: [the exact answer]
Explanation: [a clear explanation of the wordplay, logic, or trick involved]`
      },
      {
        role: 'user',
        content: `Create a new, original ${promptDifficulty} difficulty brain teaser or riddle about ${promptCategory}. The riddle should:
1. Be creative and not commonly known
2. Have a clear, unambiguous answer that could be expressed in a few words
3. Include wordplay, misdirection, or clever thinking
4. Be appropriate for all ages, especially appealing to a younger audience
5. Have an "aha!" moment when the solution is discovered

Please make sure this is completely original and not a well-known riddle.`
      }
    ];

    const result = await callPerplexityAPI(messages);
    
    // Process the result to extract structured information
    const content = result.choices[0].message.content;
    
    // Simple parsing logic - can be improved (without using /s flag)
    const questionMatch = content.match(/Question:([\s\S]+?)(?=Answer:|$)/);
    const answerMatch = content.match(/Answer:([\s\S]+?)(?=Explanation:|$)/);
    const explanationMatch = content.match(/Explanation:([\s\S]+?)$/);
    
    
    const structuredRiddle = {
      question: questionMatch ? questionMatch[1].trim() : content,
      answer: answerMatch ? answerMatch[1].trim() : '',
      explanation: explanationMatch ? explanationMatch[1].trim() : '',
      citations: result.citations || []
    };
    
    return res.json(structuredRiddle);
  } catch (error) {
    console.error('AI riddle generation error:', error);
    return res.status(500).json({ error: 'Failed to generate riddle' });
  }
}