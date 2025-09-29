import fetch from 'node-fetch';

// AI-powered answer checker for emoji riddles and brain teasers
export interface AnswerCheckResult {
  isCorrect: boolean;
  confidence: number;
  explanation?: string;
  suggestedAnswer?: string;
}

// String similarity using Levenshtein distance
function calculateSimilarity(str1: string, str2: string): number {
  const matrix = [];
  const len1 = str1.length;
  const len2 = str2.length;

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,      // deletion
          matrix[i][j - 1] + 1,      // insertion
          matrix[i - 1][j - 1] + 1   // substitution
        );
      }
    }
  }

  const maxLen = Math.max(len1, len2);
  return maxLen === 0 ? 1 : (maxLen - matrix[len1][len2]) / maxLen;
}

// Basic fuzzy matching for common misspellings and variations
function fuzzyMatch(userAnswer: string, correctAnswer: string): AnswerCheckResult {
  const normalizeText = (text: string) => 
    text.toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ')    // Normalize spaces
      .trim();

  const userNormalized = normalizeText(userAnswer);
  const correctNormalized = normalizeText(correctAnswer);

  // Exact match
  if (userNormalized === correctNormalized) {
    return { isCorrect: true, confidence: 1.0 };
  }

  // Calculate similarity
  const similarity = calculateSimilarity(userNormalized, correctNormalized);
  
  // High similarity threshold for acceptance
  if (similarity >= 0.85) {
    return { 
      isCorrect: true, 
      confidence: similarity,
      explanation: `Close match: "${userAnswer}" is very similar to "${correctAnswer}"`
    };
  }

  // Medium similarity - check for partial matches
  if (similarity >= 0.6) {
    // Check if one contains the other
    const userWords = userNormalized.split(' ');
    const correctWords = correctNormalized.split(' ');
    
    const hasAllMainWords = correctWords.every(word => 
      word.length <= 2 || userWords.some(userWord => 
        userWord.includes(word) || word.includes(userWord)
      )
    );

    if (hasAllMainWords) {
      return { 
        isCorrect: true, 
        confidence: similarity,
        explanation: `Partial match: "${userAnswer}" contains the key elements of "${correctAnswer}"`
      };
    }
  }

  return { 
    isCorrect: false, 
    confidence: similarity,
    suggestedAnswer: correctAnswer
  };
}

// AI-powered semantic checking using Perplexity API
async function checkAnswerWithAI(
  userAnswer: string, 
  correctAnswer: string, 
  question: string, 
  hint?: string
): Promise<AnswerCheckResult> {
  try {
    const prompt = `
You are an intelligent answer checker for riddles and brain teasers. 
Analyze if the user's answer is correct or acceptably close to the intended answer.

Question: "${question}"
${hint ? `Hint: "${hint}"` : ''}
Correct Answer: "${correctAnswer}"
User's Answer: "${userAnswer}"

Consider these factors:
1. Exact matches (obviously correct)
2. Synonyms and alternative words with same meaning
3. Minor spelling mistakes or typos
4. Different word forms (singular/plural, verb tenses)
5. Abbreviated forms or common nicknames
6. Different but equivalent expressions

Respond with JSON in this exact format:
{
  "isCorrect": boolean,
  "confidence": number (0.0 to 1.0),
  "explanation": "Brief explanation of why the answer is or isn't acceptable"
}

Examples:
- If correct answer is "telephone" and user says "phone" → isCorrect: true
- If correct answer is "rainbow" and user says "rainbo" → isCorrect: true (typo)
- If correct answer is "computer" and user says "banana" → isCorrect: false
- If correct answer is "car" and user says "automobile" → isCorrect: true (synonym)
    `;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a precise answer checker. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json() as any;
    const content = data.choices[0].message.content;
    
    try {
      const result = JSON.parse(content);
      return {
        isCorrect: result.isCorrect,
        confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
        explanation: result.explanation
      };
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      // Fallback to fuzzy matching
      return fuzzyMatch(userAnswer, correctAnswer);
    }

  } catch (error) {
    console.error('AI answer checking failed:', error);
    // Fallback to fuzzy matching
    return fuzzyMatch(userAnswer, correctAnswer);
  }
}

// Main function to check if an answer is correct
export async function checkAnswer(
  userAnswer: string,
  correctAnswer: string,
  question: string,
  hint?: string,
  useAI: boolean = true
): Promise<AnswerCheckResult> {
  // First try basic fuzzy matching
  const fuzzyResult = fuzzyMatch(userAnswer, correctAnswer);
  
  // If fuzzy matching says it's correct with high confidence, return that
  if (fuzzyResult.isCorrect && fuzzyResult.confidence >= 0.9) {
    return fuzzyResult;
  }

  // If fuzzy matching is uncertain and AI is enabled, use AI
  if (useAI && process.env.PERPLEXITY_API_KEY && fuzzyResult.confidence < 0.8) {
    const aiResult = await checkAnswerWithAI(userAnswer, correctAnswer, question, hint);
    
    // If AI has higher confidence or different result, use AI result
    if (aiResult.confidence > fuzzyResult.confidence || aiResult.isCorrect !== fuzzyResult.isCorrect) {
      return aiResult;
    }
  }

  return fuzzyResult;
}