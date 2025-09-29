import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RiddleWithCategory } from "@shared/schema";

export default function AreYouMyValentine() {
  const { toast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [isLoadingAnswer, setIsLoadingAnswer] = useState(false);
  const [guessesRemaining, setGuessesRemaining] = useState(0);
  const [currentGuess, setCurrentGuess] = useState("");
  const [gameMode, setGameMode] = useState<"setup" | "playing" | "complete">("setup");
  const [selectedRiddle, setSelectedRiddle] = useState<RiddleWithCategory | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | "extreme">("medium");
  const [category, setCategory] = useState<string>("movies");
  const [hintCount, setHintCount] = useState(0);
  const [hintsRevealed, setHintsRevealed] = useState<string[]>([]);
  const [isLoadingHint, setIsLoadingHint] = useState(false);
  
  // Get user stats
  const { data: userStats = { score: 0, solvedCount: 0, avgTimeSeconds: 0 } } = useQuery({
    queryKey: ['/api/user/1/stats'],
  });
  
  // Get EV Special riddles (category id 6)
  const { data: allRiddles = [] } = useQuery<RiddleWithCategory[]>({
    queryKey: ['/api/riddles/with-categories']
  });
  
  // Filter riddles by the selected category
  const valentineRiddles = allRiddles.filter(riddle => {
    // Filter by category from all riddles
    const riddleCategory = riddle.category.name.toLowerCase();
    // Check if the riddle matches either "ev special" or "are you my valentine?" or the selected category
    return (
      riddleCategory === "ev special" || 
      riddleCategory === "are you my valentine?" || 
      riddleCategory === category.toLowerCase()
    );
  });
  
  // Set hints based on difficulty
  useEffect(() => {
    if (difficulty === "easy") setHintCount(5);
    else if (difficulty === "medium") setHintCount(4);
    else if (difficulty === "hard") setHintCount(3);
    else if (difficulty === "extreme") setHintCount(2);
  }, [difficulty]);
  
  // Set guesses remaining based on player count
  useEffect(() => {
    // Default to single player + 3 for more time
    setGuessesRemaining(4);
  }, []);
  
  // Handle selecting a random riddle from the database
  const handleStartGame = () => {
    if (valentineRiddles.length > 0) {
      const randomIndex = Math.floor(Math.random() * valentineRiddles.length);
      const riddle = valentineRiddles[randomIndex];
      
      // Category-specific answers override (for consistent category content)
      let updatedAnswer = riddle.answer;
      
      // Define category-appropriate answers with cryptic but informative hints
      const categoryAnswers = {
        "movies": [
          { answer: "Avatar", hints: [
            "Blue-skinned natives defend their exotic environment from resource-hungry invaders", 
            "A paraplegic war veteran controls a synthetic body to interact with the indigenous population",
            "A fusion of cutting-edge motion capture and photorealistic CGI pioneered new filming techniques", 
            "Features floating mountains and bioluminescent landscapes on an alien moon", 
            "The protagonist transfers his consciousness and eventually chooses to remain in his new form"
          ]},
          { answer: "Titanic", hints: [
            "A forbidden romance blooms aboard a vessel on its maiden voyage across the Atlantic", 
            "An elderly survivor recounts her experience of a catastrophic nautical disaster", 
            "Features an iconic scene on the bow with arms outstretched like flying", 
            "A priceless blue gemstone plays a central role in connecting past and present", 
            "Based on a real-life tragedy that occurred in April and shocked the world"
          ]},
          { answer: "Star Wars", hints: [
            "Features an ancient mystical energy that binds the universe together", 
            "A farm boy discovers his extraordinary lineage and confronts a masked antagonist", 
            "Includes a cantina filled with diverse alien species from across the cosmos", 
            "Combines elements of medieval chivalry with futuristic technology", 
            "Spans multiple generations of conflict between opposing ideological forces"
          ]},
          { answer: "The Lion King", hints: [
            "A young royal must reclaim his birthright after being manipulated by a treacherous relative", 
            "Features wise counsel from a baboon shaman and a meerkat-warthog duo", 
            "The protagonist experiences a transformative vision of his deceased father in the stars", 
            "Set in the savanna with themes of responsibility and the circle of life", 
            "Incorporates musical sequences about growing up carefree and preparing to lead"
          ]},
          { answer: "Jurassic Park", hints: [
            "Ancient creatures are reconstructed from preserved genetic material", 
            "A chaotic demonstration of a groundbreaking attraction goes terribly wrong", 
            "Features protagonists evading predators in a kitchen and control center", 
            "Life persistently finds a way to reproduce despite scientific controls", 
            "Warning against the hubris of manipulating nature for commercial gain"
          ]}
        ],
        "tv-shows": [
          { answer: "Friends", hints: [
            "Six young adults navigate careers and relationships in Manhattan", 
            "A central hangout spot serves as a gathering place with purple walls", 
            "Features an on-again-off-again romance between paleontologist and fashion buyer", 
            "Includes a womanizing character known for asking 'How you doin'?'", 
            "Contains recurring jokes about an unusual pet duck and chicken"
          ]},
          { answer: "Game of Thrones", hints: [
            "Noble families vie for control of an iron seat of power", 
            "Features an ominous warning that a harsh season is approaching", 
            "Includes three flying reptilian creatures belonging to a silver-haired ruler", 
            "A massive protective barrier in the north conceals ancient threats", 
            "Based on A Song of Ice and Fire with numerous shocking character deaths"
          ]},
          { answer: "Breaking Bad", hints: [
            "A terminally ill educator turns to illicit activities to secure his family's future", 
            "Features distinctive blue-colored contraband with exceptional purity", 
            "Set in the desert southwest with frequent scenes in an RV laboratory", 
            "Chronicles a protagonist's transformation from meek to menacing", 
            "Includes a lawyer with colorful suits who later gets his own series"
          ]},
          { answer: "Stranger Things", hints: [
            "Children encounter mysterious phenomena in a small Indiana town", 
            "Features a girl with telekinetic abilities and a fondness for frozen waffles", 
            "Incorporates a shadowy government laboratory conducting secret experiments", 
            "Includes an alternate dimension described as the reverse of our reality", 
            "Blends supernatural elements with nostalgic references to 80s pop culture"
          ]},
          { answer: "The Office", hints: [
            "Documents the daily absurdities of paper sales professionals", 
            "Features direct-to-camera interviews revealing characters' true thoughts", 
            "Centers on an oblivious regional manager with misguided leadership techniques", 
            "Includes a long-running romance that begins with desk items in gelatin", 
            "Set in the unremarkable corporate environment of northeastern Pennsylvania"
          ]}
        ],
        "famous-people": [
          { answer: "Albert Einstein", hints: [
            "Developed relative perspectives on time and space that revolutionized physics", 
            "Known for distinctive wild hair and protruding tongue in famous photographs", 
            "Left Europe for America in the 1930s due to political persecution", 
            "Expressed that divinity doesn't play dice games with the cosmos", 
            "His theories enabled later development of nuclear technology"
          ]},
          { answer: "Michael Jordan", hints: [
            "Known for extraordinary aerial abilities on the hardwood", 
            "Won championships in two separate three-year sequences", 
            "Temporarily pursued a career in baseball between athletic peaks", 
            "Identifiable by his protruding tongue during moments of concentration", 
            "His footwear collection became a cultural phenomenon beyond sports"
          ]},
          { answer: "Leonardo da Vinci", hints: [
            "Created a famous enigmatic smile that continues to captivate viewers", 
            "Designed flying machines and anatomical studies centuries ahead of his time", 
            "Wrote his notes in mirror-image handwriting that reads right to left", 
            "Studied cadavers to improve understanding of human musculature and structure", 
            "Master of sfumato technique creating softness between light and shadow"
          ]},
          { answer: "Walt Disney", hints: [
            "Built an empire starting with a cartoon mouse wearing red shorts", 
            "Pioneered synchronized sound in animated short films", 
            "Created an experimental prototype community of tomorrow in Florida", 
            "Revolutionized amusement attractions with narrative-driven experiences", 
            "His remains are rumored to be preserved through cryogenics (though untrue)"
          ]},
          { answer: "Taylor Swift", hints: [
            "Known for narrative lyrics chronicling personal relationships and experiences", 
            "Strategically re-recorded early work to reclaim artistic ownership", 
            "Shifts between musical styles while maintaining storytelling emphasis", 
            "Incorporates hidden messages and Easter eggs throughout artistic output", 
            "Stadium performances feature elaborate staging and multiple costume changes"
          ]}
        ],
        "animals": [
          { answer: "Elephant", hints: [
            "Possesses extraordinary nasal dexterity for manipulating objects", 
            "Communicates through low-frequency rumbles that travel miles through ground", 
            "Matriarchal societies led by oldest female with decades of environmental knowledge", 
            "Can consume up to 300 pounds of vegetation daily", 
            "Known for remarkable memory, particularly remembering water sources during drought"
          ]},
          { answer: "Lion", hints: [
            "Males develop distinctive neck ornamentation upon maturity", 
            "Females perform majority of hunting while males defend territory", 
            "Cubs face significant hazards from new dominant males", 
            "Sleeps up to 20 hours daily, conserving energy between hunts", 
            "Territorial roars can be heard up to five miles away"
          ]},
          { answer: "Penguin", hints: [
            "Adapted for aquatic agility but awkward terrestrial movement", 
            "Males incubate eggs on feet while females hunt during brutal winter", 
            "Specialized feathers create insulating air layer against frigid waters", 
            "Forms massive colonies for breeding and protection", 
            "Unique glands filter salt from seawater for hydration"
          ]},
          { answer: "Dolphin", hints: [
            "Navigates using biosonar clicks that create acoustic imaging", 
            "Maintains alertness by resting one brain hemisphere at a time", 
            "Forms complex social bonds and uses unique whistle signatures as names", 
            "Possesses larger brain-to-body ratio than great apes", 
            "Capable of recognizing self in mirrors, indicating self-awareness"
          ]},
          { answer: "Giraffe", hints: [
            "Possesses specialized cardiovascular adaptations for vertical blood circulation", 
            "Requires only 30 minutes of sleep daily, often while standing", 
            "Each coat pattern is unique, like human fingerprints", 
            "Has approximately 21-inch prehensile tongue, typically bluish-black in color", 
            "Males establish dominance through ritualized neck swinging contests"
          ]}
        ],
        "household-items": [
          { answer: "Television", hints: [
            "Evolved from cathode ray tubes to flat panels using light-emitting diodes", 
            "Receives encoded electromagnetic signals and converts them to audio-visual output", 
            "Early versions displayed moving images in monochrome before advancing to color", 
            "Average American homes contain multiple units, often as the living room focal point", 
            "Remote interface has expanded from basic channel/volume to complex menu navigation"
          ]},
          { answer: "Refrigerator", hints: [
            "Utilizes compressed gas to transfer heat from interior to exterior environment", 
            "Early versions required ice delivery before mechanical cooling became standard", 
            "Door shelves typically store condiments while lower drawers maintain humidity", 
            "Consumes substantial household electricity running continuously", 
            "Modern versions include water filtration and customizable temperature zones"
          ]},
          { answer: "Microwave", hints: [
            "Utilizes electromagnetic radiation to excite water molecules in food", 
            "Discovered accidentally when a chocolate bar melted near radar equipment", 
            "Features a protective mesh screen in the viewing door to block waves", 
            "Requires special containers as metal can cause dangerous arcing", 
            "Dramatically reduced cooking times compared to conventional methods"
          ]},
          { answer: "Chair", hints: [
            "Ranges from utilitarian designs to ornate status symbols throughout history", 
            "Ergonomic variations consider lumbar support and pressure distribution", 
            "Dining varieties typically stand 18 inches from floor to seat", 
            "Rocking versions originated in North America in the early 18th century", 
            "Executive models often feature height adjustment and swivel mechanisms"
          ]},
          { answer: "Smartphone", hints: [
            "Combines telecommunications with computing power exceeding early space missions", 
            "Contains multiple electromagnetic sensors for location and orientation", 
            "Features micro-cameras capable of capturing professional-quality imagery", 
            "Utilizes touch-sensitive glass that detects electrical properties of skin", 
            "Requires regular charging due to power demands of processor and display"
          ]}
        ],
        "places": [
          { answer: "Paris", hints: [
            "Divided by a winding river with its historic heart on an island", 
            "Underground tunnels lined with millions of human remains beneath the streets", 
            "Central landmark constructed for a world exhibition celebrates engineering", 
            "Houses the world's most visited portrait of a mysterious smiling woman", 
            "19th century urban planning created wide boulevards radiating from monuments"
          ]},
          { answer: "New York", hints: [
            "Built on multiple islands connected by numerous bridges and tunnels", 
            "Contains a massive urban greenspace designed in the 1850s", 
            "Copper-clad neoclassical figure greets maritime arrivals with upraised torch", 
            "Grid-pattern streets numbered rather than named above Houston Street", 
            "Financial district where traders gather at the southern tip of Manhattan"
          ]},
          { answer: "Grand Canyon", hints: [
            "Carved by flowing water over approximately six million years", 
            "Exposes nearly two billion years of geological history in stratified layers", 
            "Spans 277 miles with up to 18 miles between opposing rims", 
            "Indigenous peoples established dwellings in the sheltered caves", 
            "Colorado River continues to shape its depths while visitors observe from above"
          ]},
          { answer: "Tokyo", hints: [
            "Phoenix-like metropolis rebuilt multiple times after seismic destruction", 
            "Maintains ancient imperial grounds surrounded by modern skyscrapers", 
            "Complex rail network moves millions with legendary punctuality", 
            "World's largest metropolitan economy despite limited natural resources", 
            "Embraces contradictions: serene temples alongside neon entertainment districts"
          ]},
          { answer: "Great Wall of China", hints: [
            "Network of fortifications rather than single continuous structure", 
            "Built and rebuilt across multiple dynasties over two millennia", 
            "Designed to control immigration and trade as much as military invasion", 
            "Constructed using materials available locally, from stone to compacted earth", 
            "Watchtowers positioned for smoke signal communication across vast distances"
          ]}
        ],
        "foods": [
          { answer: "Pizza", hints: [
            "Neapolitan creation featuring flatbread with savory toppings", 
            "Traditional varieties require wood-fired ovens exceeding 800°F", 
            "Regional variations include deep dish, thin crust, and folded styles", 
            "Hawaiian controversial variant introduced pineapple in the 1960s", 
            "Global variations incorporate local ingredients from tandoori chicken to eel"
          ]},
          { answer: "Sushi", hints: [
            "Originated as preservation method for fish fermented in seasoned rice", 
            "Modern form emphasizes vinegared rice with fresh, uncooked ingredients", 
            "Master practitioners train for years, beginning with rice preparation alone", 
            "Wasabi root traditionally grated against sharkskin for proper texture", 
            "Omakase dining experience leaves selection entirely to the chef's discretion"
          ]},
          { answer: "Hamburger", hints: [
            "Disputed origin between multiple American locations in late 19th century", 
            "Popularized through early 20th century diners and drive-ins", 
            "Global chains standardized production with assembly-line techniques", 
            "Patty preparation ranges from smashed thin to thick and loosely packed", 
            "Variations include regional specialties like green chile or butter-filled Juicy Lucy"
          ]},
          { answer: "Chocolate", hints: [
            "Seeds of tropical tree fermented, dried, roasted, and ground for consumption", 
            "Mesoamerican civilizations consumed it as spiced, bitter beverage", 
            "Europeans added sugar and milk solids after 16th century introduction", 
            "Contains over 600 flavor compounds - more than almost any other food", 
            "Percentage indicates proportion of cacao mass to other ingredients"
          ]},
          { answer: "Ice Cream", hints: [
            "Requires constant agitation during freezing to incorporate air and prevent crystallization", 
            "Ancient precursors included snow mixed with honey and fruit in royal courts", 
            "Commercial production revolutionized by continuous freezer invented in 1843", 
            "American parlors became social centers during Prohibition", 
            "Stabilizers like guar gum improve texture and extend shelf life"
          ]}
        ],
        "sports": [
          { answer: "Basketball", hints: [
            "Originally played with peach baskets requiring manual retrieval after scoring", 
            "Developed by Canadian physical education instructor for winter indoor activity", 
            "Professional leagues initially banned dunking the object into the target", 
            "Strategic violations of rules provide advantage in certain situations", 
            "Evolved from set plays to increasingly position-less style emphasizing spacing"
          ]},
          { answer: "Soccer", hints: [
            "Originated from various ball games played with feet across ancient civilizations", 
            "Standardized rules established at English university in 1863", 
            "Positions include sweepers, strikers, and defensive midfielders", 
            "Global tournament held quadrennially since 1930 with one interruption", 
            "Only one position may legally use hands within the field of play"
          ]},
          { answer: "Tennis", hints: [
            "Evolved from royal indoor game played with hands instead of implements", 
            "Scoring system derives from medieval clock face divisions", 
            "Surface varieties dramatically affect speed and ball behavior", 
            "Technique transition from wooden equipment to modern materials", 
            "Baseline power game largely replaced serve-and-volley strategy in modern era"
          ]},
          { answer: "Swimming", hints: [
            "Competitive forms include butterfly technique developed in the 1930s", 
            "Event distances range from explosive sprints to marathon open water", 
            "Hydrodynamic principles apply to body position and minimal resistance", 
            "Training often exceeds 10,000 meters daily at elite levels", 
            "Specialized indoor facilities maintain precise chemical balance and temperature"
          ]},
          { answer: "Golf", hints: [
            "Scottish origin with earliest documented mention in 15th century", 
            "Strategic layout includes hazards of sand and water to challenge players", 
            "Equipment evolution from hickory shafts to precisely engineered materials", 
            "Par scoring system indicates expected strokes needed per hole", 
            "Etiquette traditions include dress codes and maintaining course conditions"
          ]}
        ]
      };
      
      // Get a random answer with accurate hints for the selected category
      type AnswerWithHints = { answer: string; hints: string[] };
      
      let selectedAnswerWithHints: AnswerWithHints;
      
      // Safe category mapping
      const getAnswersForCategory = (cat: string): AnswerWithHints[] => {
        switch(cat.toLowerCase()) {
          case "movies":
            return categoryAnswers.movies;
          case "tv-shows":
            return categoryAnswers["tv-shows"];
          case "famous-people":
            return categoryAnswers["famous-people"];
          case "animals":
            return categoryAnswers.animals;
          case "household-items":
            return categoryAnswers["household-items"];
          case "places":
            return categoryAnswers.places;
          case "foods":
            return categoryAnswers.foods;
          case "sports":
            return categoryAnswers.sports;
          default:
            return [];
        }
      };
      
      const categoryOptions = getAnswersForCategory(category);
      
      if (categoryOptions.length > 0) {
        const randomOption = Math.floor(Math.random() * categoryOptions.length);
        selectedAnswerWithHints = categoryOptions[randomOption];
        updatedAnswer = selectedAnswerWithHints.answer;
      } else {
        // Fallback if category not matched (shouldn't happen)
        const defaultAnswers: AnswerWithHints[] = [
          { answer: "Elephant", hints: ["This has a distinctive feature extending from its face", "This is known for exceptional recall abilities", "This is the largest land mammal", "This creates complex social structures with family bonds", "This consumes massive quantities of vegetation daily"] },
          { answer: "Pizza", hints: ["This originated in Mediterranean cuisine", "This serves as a base for various added components", "This requires high-temperature heating methods", "This varies regionally with distinctive local styles", "This combines baked dough with savory toppings"] },
          { answer: "Computer", hints: ["This processes information through programmatic instructions", "This contains multiple electronic components working in concert", "This has evolved from room-sized to pocket-sized", "This interfaces with users through input and output systems", "This enables communication, calculation, and content creation"] }
        ];
        const randomDefault = Math.floor(Math.random() * defaultAnswers.length);
        selectedAnswerWithHints = defaultAnswers[randomDefault];
        updatedAnswer = selectedAnswerWithHints.answer;
      }
      
      // Update the riddle with the category-appropriate answer
      const updatedRiddle = { ...riddle, answer: updatedAnswer };
      
      setSelectedRiddle(updatedRiddle);
      setCorrectAnswer(updatedAnswer);
      
      // Filter hints to ensure they don't reveal the answer
      const safeHints = selectedAnswerWithHints.hints.filter((hint: string) => {
        if (!hint) return false;
        
        const lowerHint = hint.toLowerCase();
        const lowerAnswer = updatedAnswer.toLowerCase();
        
        // Don't directly include the answer
        if (lowerHint.includes(lowerAnswer)) {
          return false;
        }
        
        // Check for parts of multi-word answers (ignore common words)
        const answerWords = lowerAnswer.split(' ');
        const containsSignificantAnswerPart = answerWords.some(word => {
          // Skip short words and common words
          if (word.length <= 3 || ['the', 'and', 'but', 'for', 'not', 'with', 'this', 'that', 'has', 'was', 'is'].includes(word.toLowerCase())) {
            return false;
          }
          return lowerHint.includes(word);
        });
        
        if (containsSignificantAnswerPart) {
          return false;
        }
        
        return true;
      });
      
      // Provide generic, accurate category-specific hints if needed
      const getGenericHints = () => {
        switch(category) {
          case "movies":
            return [
              "This tells a specific story",
              "This evokes certain emotions",
              "This was released in theaters",
              "This has a specific runtime",
              "This features actors and actresses"
            ];
          case "tv-shows":
            return [
              "This has multiple episodes",
              "This tells an ongoing story",
              "This has a specific number of seasons",
              "This features recurring characters",
              "This was broadcast on a network or streaming service"
            ];
          case "famous-people":
            return [
              "This person has a specific profession",
              "This person is well-known for their work",
              "This person has specific achievements",
              "This person has influenced their field",
              "This person has a unique talent or skill"
            ];
          case "animals":
            return [
              "This lives in specific habitats",
              "This has distinctive physical traits",
              "This eats a particular diet",
              "This has evolved specific adaptations",
              "This interacts with its environment in unique ways"
            ];
          case "household-items":
            return [
              "This serves a specific function",
              "This has a distinctive design",
              "This is used regularly in homes",
              "This makes certain tasks easier",
              "This can be found in specific rooms"
            ];
          case "places":
            return [
              "This has a specific geography",
              "This has a particular climate",
              "This has distinct cultural elements",
              "This is known for certain features",
              "This has historical significance"
            ];
          case "foods":
            return [
              "This has specific ingredients",
              "This has a distinctive flavor",
              "This is prepared in a particular way",
              "This originated in a specific region",
              "This is eaten in certain contexts"
            ];
          case "sports":
            return [
              "This has specific rules",
              "This requires particular skills",
              "This is played on a designated field or court",
              "This involves specific equipment",
              "This has professional leagues"
            ];
          default:
            return [
              "This has distinctive characteristics",
              "This has specific properties",
              "This has notable features",
              "This has a particular significance",
              "This has recognizable traits"
            ];
        }
      };
      
      // If we need more hints, add generic ones
      const genericHints = getGenericHints();
      const finalHints = safeHints.length >= hintCount 
        ? safeHints.slice(0, hintCount) 
        : [
            ...safeHints,
            ...genericHints.slice(0, hintCount - safeHints.length)
          ];
      
      // Reveal hints based on difficulty level
      setHintsRevealed(finalHints.slice(0, hintCount));
      
      setGameMode("playing");
    } else {
      toast({
        title: "No riddles available",
        description: "There are no Valentine riddles available. Try again later.",
        variant: "destructive"
      });
    }
  };
  
  // Function to detect if a question is actually a direct guess
  const isDirectGuess = (question: string): boolean => {
    // Normalize the question and correct answer for better matching
    const normalizedQuestion = question.toLowerCase().trim().replace(/[,.?!'"]/g, '');
    const normalizedAnswer = correctAnswer.toLowerCase().trim();
    
    // Check for exact match of the answer in the question
    if (normalizedQuestion.includes(normalizedAnswer)) {
      // Check that it's surrounded by spaces or at the beginning/end of the string
      const answerIndex = normalizedQuestion.indexOf(normalizedAnswer);
      const isAtStart = answerIndex === 0;
      const isAtEnd = answerIndex + normalizedAnswer.length === normalizedQuestion.length;
      const hasSpaceBefore = answerIndex > 0 && normalizedQuestion[answerIndex - 1] === ' ';
      const hasSpaceAfter = answerIndex + normalizedAnswer.length < normalizedQuestion.length && 
                          normalizedQuestion[answerIndex + normalizedAnswer.length] === ' ';
      
      if (isAtStart || isAtEnd || (hasSpaceBefore && hasSpaceAfter)) {
        // Look for guessing language patterns
        const guessIndicators = [
          'is it', 'could it be', 'is this', 'is the answer', 'might it be',
          'is that', 'would it be', 'are we thinking of', 'is the character',
          'is the movie', 'is the object', 'is the person'
        ];
        
        return guessIndicators.some(indicator => normalizedQuestion.includes(indicator));
      }
    }
    
    // Common guess patterns for more structure questioning
    const guessPatterns = [
      /^is it (\w+)[\s\W]*$/i,                           // "Is it Superman?"
      /^is the answer (\w+)[\s\W]*$/i,                   // "Is the answer Superman?"
      /^could it be (\w+)[\s\W]*$/i,                     // "Could it be Superman?"
      /^is this (\w+)[\s\W]*$/i,                         // "Is this Superman?"
      /^are we thinking of (\w+)[\s\W]*$/i,              // "Are we thinking of Superman?"
      /^is the object (\w+)[\s\W]*$/i,                   // "Is the object Superman?" 
      /^is the person (\w+)[\s\W]*$/i,                   // "Is the person Superman?"
      /^is the character (\w+)[\s\W]*$/i,                // "Is the character Superman?"
      /^is the movie (\w+)[\s\W]*$/i,                    // "Is the movie Superman?"
      /^would it be (\w+)[\s\W]*$/i,                     // "Would it be Superman?"
      /^am i correct in saying it'?s (\w+)[\s\W]*$/i,    // "Am I correct in saying it's Superman?"
      /^is it called (\w+)[\s\W]*$/i,                    // "Is it called Superman?"
      /^is the title (\w+)[\s\W]*$/i,                    // "Is the title Superman?"
      /^is the name (\w+)[\s\W]*$/i,                     // "Is the name Superman?"
      /^are you thinking of (\w+)[\s\W]*$/i              // "Are you thinking of Superman?"
    ];
    
    // Check if the question matches any of the guess patterns
    for (const pattern of guessPatterns) {
      const match = question.match(pattern);
      if (match && match[1]) {
        // Extract the potential answer and compare with correct answer
        const potentialAnswer = match[1].toLowerCase().trim();
        return potentialAnswer === normalizedAnswer || 
               normalizedAnswer.includes(potentialAnswer) || 
               potentialAnswer.includes(normalizedAnswer);
      }
    }
    
    // If the answer has multiple words, check for multi-word guesses
    if (normalizedAnswer.includes(' ')) {
      const answerWords = normalizedAnswer.split(' ');
      if (answerWords.length > 1) {
        // Check for questions that have most of the answer words in sequence
        let wordCount = 0;
        for (const word of answerWords) {
          if (normalizedQuestion.includes(word)) {
            wordCount++;
          }
        }
        
        // If most of the words are present and the question has guess indicators
        if (wordCount >= Math.ceil(answerWords.length * 0.7)) {
          const guessIndicators = [
            'is it', 'could it be', 'is this', 'is the answer', 
            'would it be', 'is that', 'might it be'
          ];
          return guessIndicators.some(indicator => normalizedQuestion.includes(indicator));
        }
      }
    }
    
    return false;
  };

  // Get additional AI hint
  const getAIHint = async () => {
    try {
      // First decrement guesses remaining since this counts as a question
      setGuessesRemaining(prev => prev - 1);
      
      setIsLoadingHint(true);
      
      // Create a special prompt for the AI to generate a hint
      const response = await fetch('/api/ai/hint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          riddle: `I need a simple, clear hint about "${correctAnswer}" that middle school students (grades 5-8) can easily understand. The hint should be helpful and use basic language that kids know. Don't use any complicated words or confusing descriptions. The hint should be fun and give them a real clue, but without giving away the exact answer. Keep it to 1-2 simple sentences.`,
          isQuestion: false
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get AI hint');
      }
      
      const data = await response.json();
      
      // Add the hint to displayed hints with special formatting to differentiate it
      setHintsRevealed(prev => [...prev, `💡 UNIQUE AI HINT: ${data.hint}`]);
      
      // Check if out of guesses
      if (guessesRemaining <= 1) { // Already decremented above, but the state may not have updated yet
        setTimeout(() => {
          toast({
            title: "Game Over",
            description: "You're out of questions! The answer was: " + correctAnswer,
            variant: "destructive"
          });
          setGameMode("complete");
        }, 1500);
      } else {
        toast({
          title: "Unique AI Hint Revealed",
          description: `A special hint with new perspective has been provided. ${guessesRemaining - 1} questions remaining.`,
          variant: "default"
        });
      }
      
    } catch (error) {
      console.error('Error getting AI hint:', error);
      toast({
        title: "Error",
        description: "We had trouble getting a hint. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingHint(false);
    }
  };

  // Handle submitting a question
  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentQuestion.trim()) return;
    
    // Add the question to the list
    setQuestions(prev => [...prev, currentQuestion]);
    setCurrentQuestion("");
    
    // Decrement guesses remaining since questions count as guesses
    setGuessesRemaining(prev => prev - 1);
    
    // Check if this is a direct guess that's correct
    if (isDirectGuess(currentQuestion)) {
      // If it's a correct direct guess - don't show the answer in the response
      setAnswers(prev => [...prev, `Yes, that's correct!`]);
      
      // Short delay before showing the complete screen
      setTimeout(() => {
        toast({
          title: "Correct!",
          description: `You guessed correctly with your question!`,
          variant: "default"
        });
        setGameMode("complete");
      }, 1500);
      
      return;
    }
    
    // Get AI to answer the question
    setIsLoadingAnswer(true);
    
    try {
      // Send question to AI for an accurate answer
      const response = await fetch('/api/ai/hint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          riddle: `${currentQuestion} (The answer is: ${correctAnswer})`, 
          isQuestion: true
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get AI answer');
      }
      
      const data = await response.json();
      
      // Check if AI response indicates a correct guess
      const aiResponse = data.hint.toLowerCase();
      const correctGuessIndicators = [
        'correct', 'that\'s right', 'you got it', 'you\'ve guessed', 'that is the answer'
      ];
      
      if (correctGuessIndicators.some(indicator => aiResponse.includes(indicator))) {
        // If AI indicated this was a correct guess
        setAnswers(prev => [...prev, data.hint]);
        
        // Short delay before showing the complete screen
        setTimeout(() => {
          toast({
            title: "Correct!",
            description: "You've correctly guessed the answer!",
            variant: "default"
          });
          setGameMode("complete");
        }, 1500);
      } else {
        // Normal question/answer flow
        setAnswers(prev => [...prev, data.hint]);
      }
    } catch (error) {
      console.error('Error getting AI answer:', error);
      toast({
        title: "Error",
        description: "We had trouble getting an answer. Please try again.",
        variant: "destructive"
      });
      
      // Fallback answers if AI fails - designed to be safe and general
      const fallbackResponses = [
        "I can't provide a definitive answer to that.",
        "That question is difficult to answer with just yes or no.",
        "I'd need more context to answer that properly.",
        "Let's try a different approach to your question.",
        "Could you rephrase your question to be more specific?",
      ];
      
      const randomIndex = Math.floor(Math.random() * fallbackResponses.length);
      setAnswers(prev => [...prev, fallbackResponses[randomIndex]]);
    } finally {
      setIsLoadingAnswer(false);
    }
  };
  
  // Handle submitting a guess
  const handleSubmitGuess = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentGuess.trim()) return;
    
    // Check if the guess is correct
    if (currentGuess.toLowerCase() === correctAnswer.toLowerCase()) {
      toast({
        title: "Correct!",
        description: "You've made the correct guess!",
        variant: "default"
      });
      setGameMode("complete");
    } else {
      toast({
        title: "Try Again!",
        description: `Your guess "${currentGuess}" is not correct. You still have ${guessesRemaining - 1} guesses left.`,
        variant: "default"
      });
      
      // Decrement guesses remaining
      setGuessesRemaining(prev => prev - 1);
      
      // If no guesses remaining, end the game
      if (guessesRemaining <= 1) {
        toast({
          title: "Game Over",
          description: `You ran out of guesses. The answer was "${correctAnswer}".`,
          variant: "destructive"
        });
        setGameMode("complete");
      }
      
      // Don't clear the guess field to allow for quick corrections
      // setCurrentGuess("");
    }
  };
  
  // Note: All hints are now revealed at the start based on difficulty level
  // This function is kept for potential future use but should never be triggered
  const handleRevealHint = () => {
    // All hints are now shown at the start of the game, based on difficulty level
    // This function is here only for expandability
    if (selectedRiddle) {
      toast({
        title: "All Hints Already Revealed",
        description: "All available hints for your difficulty level were automatically revealed at the start of the game.",
        variant: "default"
      });
    }
  };
  
  // Reset the game
  const handleReset = () => {
    setQuestions([]);
    setAnswers([]);
    setGuessesRemaining(4); // Updated to match the initial value
    setCurrentGuess("");
    setCurrentQuestion("");
    setGameMode("setup");
    setSelectedRiddle(null);
    setCorrectAnswer("");
    setHintsRevealed([]);
    setIsLoadingAnswer(false);
  };
  
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-light">
      {/* Sidebar for desktop */}
      <Sidebar 
        userStats={{
          score: 0,
          solvedCount: 0,
          avgTimeSeconds: 0,
          // Add a safe cast to get around TypeScript errors
          ...(typeof userStats === 'object' && userStats !== null ? userStats as any : {})
        }}
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
      />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-light-gray p-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-success rounded-lg w-8 h-8 flex items-center justify-center text-white">
                <i className="ri-question-line text-lg"></i>
              </div>
              <h1 className="ml-2 text-xl font-bold font-poppins text-dark">Are You My Valentine?</h1>
            </div>
            <button 
              className="text-dark-light focus:outline-none"
              onClick={() => setIsMenuOpen(true)}
            >
              <i className="ri-menu-line text-2xl"></i>
            </button>
          </div>
        </header>
        
        {/* Main content area */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold font-poppins text-dark">Are You My Valentine?</h1>
            <p className="text-dark-light mt-1">Guess the hidden subject with yes/no questions</p>
          </div>
          
          {/* Game Rules */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2">
                <li>You have 1 more guess than total amount of players on a team (currently set to 4 guesses for more gameplay time)</li>
                <li>Questions and guesses count as the same thing</li>
                <li><span className="font-semibold">Players start with hints:</span> You'll receive all hints corresponding to your selected difficulty level before starting</li>
                <li><span className="font-semibold">4 difficulties:</span> Easy (5 hints), Medium (4 hints), Hard (3 hints), Extreme (2 hints)</li>
                <li>Categories include: movies, tv-shows, famous-people, animals, household-items, places, foods, sports</li>
                <li>Yes or no answer can be asked only</li>
                <li><span className="font-bold bg-red-100 text-red-800 px-2 py-1 rounded-md border border-red-300">HINTS MUST NEVER GIVE AWAY WHAT THE PERSON/OBJECT IS</span> - they should only describe characteristics or qualities indirectly</li>
                <li><span className="font-bold text-red-500 uppercase">Cannot give title, actor names, or character names</span> if it's a movie or TV show! You can describe them but be careful about giving away too much information.</li>
              </ul>
            </CardContent>
          </Card>
          
          {/* Game Setup */}
          {gameMode === "setup" && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Start a New Game</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Difficulty</label>
                    <div className="flex flex-wrap gap-2">
                      <Badge 
                        className={`cursor-pointer px-4 py-2 text-sm font-semibold border-2 ${
                          difficulty === "easy" 
                            ? "bg-green-600 text-white border-green-800 shadow-md" 
                            : "bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300"
                        }`}
                        onClick={() => setDifficulty("easy")}
                      >
                        Easy (5 hints)
                      </Badge>
                      <Badge 
                        className={`cursor-pointer px-4 py-2 text-sm font-semibold border-2 ${
                          difficulty === "medium" 
                            ? "bg-blue-600 text-white border-blue-800 shadow-md" 
                            : "bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300"
                        }`}
                        onClick={() => setDifficulty("medium")}
                      >
                        Medium (4 hints)
                      </Badge>
                      <Badge 
                        className={`cursor-pointer px-4 py-2 text-sm font-semibold border-2 ${
                          difficulty === "hard" 
                            ? "bg-amber-600 text-white border-amber-800 shadow-md" 
                            : "bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300"
                        }`}
                        onClick={() => setDifficulty("hard")}
                      >
                        Hard (3 hints)
                      </Badge>
                      <Badge 
                        className={`cursor-pointer px-4 py-2 text-sm font-semibold border-2 ${
                          difficulty === "extreme" 
                            ? "bg-red-600 text-white border-red-800 shadow-md" 
                            : "bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300"
                        }`}
                        onClick={() => setDifficulty("extreme")}
                      >
                        Extreme (2 hints)
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <div className="flex flex-wrap gap-2">
                      <Badge 
                        className={`cursor-pointer px-4 py-2 text-sm font-semibold border-2 ${
                          category === "movies" 
                            ? "bg-purple-600 text-white border-purple-800 shadow-md" 
                            : "bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300"
                        }`}
                        onClick={() => setCategory("movies")}
                      >
                        Movies
                      </Badge>
                      <Badge 
                        className={`cursor-pointer px-4 py-2 text-sm font-semibold border-2 ${
                          category === "tv-shows" 
                            ? "bg-purple-600 text-white border-purple-800 shadow-md" 
                            : "bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300"
                        }`}
                        onClick={() => setCategory("tv-shows")}
                      >
                        TV Shows
                      </Badge>
                      <Badge 
                        className={`cursor-pointer px-4 py-2 text-sm font-semibold border-2 ${
                          category === "famous-people" 
                            ? "bg-purple-600 text-white border-purple-800 shadow-md" 
                            : "bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300"
                        }`}
                        onClick={() => setCategory("famous-people")}
                      >
                        Famous People
                      </Badge>
                      <Badge 
                        className={`cursor-pointer px-4 py-2 text-sm font-semibold border-2 ${
                          category === "animals" 
                            ? "bg-purple-600 text-white border-purple-800 shadow-md" 
                            : "bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300"
                        }`}
                        onClick={() => setCategory("animals")}
                      >
                        Animals
                      </Badge>
                      <Badge 
                        className={`cursor-pointer px-4 py-2 text-sm font-semibold border-2 ${
                          category === "household-items" 
                            ? "bg-purple-600 text-white border-purple-800 shadow-md" 
                            : "bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300"
                        }`}
                        onClick={() => setCategory("household-items")}
                      >
                        Household Items
                      </Badge>
                      <Badge 
                        className={`cursor-pointer px-4 py-2 text-sm font-semibold border-2 ${
                          category === "places" 
                            ? "bg-purple-600 text-white border-purple-800 shadow-md" 
                            : "bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300"
                        }`}
                        onClick={() => setCategory("places")}
                      >
                        Places
                      </Badge>
                      <Badge 
                        className={`cursor-pointer px-4 py-2 text-sm font-semibold border-2 ${
                          category === "foods" 
                            ? "bg-purple-600 text-white border-purple-800 shadow-md" 
                            : "bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300"
                        }`}
                        onClick={() => setCategory("foods")}
                      >
                        Foods
                      </Badge>
                      <Badge 
                        className={`cursor-pointer px-4 py-2 text-sm font-semibold border-2 ${
                          category === "sports" 
                            ? "bg-purple-600 text-white border-purple-800 shadow-md" 
                            : "bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300"
                        }`}
                        onClick={() => setCategory("sports")}
                      >
                        Sports
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleStartGame} 
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg shadow-md text-lg w-full"
                >
                  Start Game
                </Button>
              </CardFooter>
            </Card>
          )}
          
          {/* Active Game */}
          {gameMode === "playing" && (
            <div className="space-y-6">
              {/* Game Info */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <div className="bg-purple-100 px-3 py-2 rounded-md border border-purple-300">
                      <span className="font-bold text-purple-800">Category:</span> <span className="text-purple-700 font-medium uppercase">{category}</span>
                    </div>
                    <div className="bg-blue-100 px-3 py-2 rounded-md border border-blue-300">
                      <span className="font-bold text-blue-800">Difficulty:</span> <span className="text-blue-700 font-medium uppercase">{difficulty}</span>
                    </div>
                    <div className="bg-amber-100 px-3 py-2 rounded-md border border-amber-300">
                      <span className="font-bold text-amber-800">Guesses Left:</span> <span className="text-amber-700 font-medium">{guessesRemaining}</span>
                    </div>
                  </div>
                  
                  {/* Movie/Show specific reminder */}
                  {(category === "movies" || category === "tv-shows") && (
                    <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4 mb-4 text-base">
                      <div className="flex items-center mb-2">
                        <i className="ri-error-warning-fill text-xl text-red-500 mr-2"></i>
                        <p className="font-bold text-red-700 uppercase">Critical Rules:</p>
                      </div>
                      <ul className="list-disc pl-5 space-y-1 text-red-700">
                        <li className="font-medium">DO NOT mention the title of the movie/show</li>
                        <li className="font-medium">DO NOT mention actor names</li>
                        <li className="font-medium">DO NOT mention character names</li>
                      </ul>
                      <p className="mt-2 font-medium text-red-800">
                        Violation of these rules may spoil the game for everyone!
                      </p>
                    </div>
                  )}
                  
                  {/* Hints */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-bold text-lg bg-indigo-100 px-3 py-1 rounded-md border border-indigo-300 text-indigo-800">
                        Hints Revealed: {hintsRevealed.length}/{hintCount}
                      </h3>
                      <div className="text-sm font-bold text-red-600 bg-red-100 px-4 py-2 rounded-md border-2 border-red-300 shadow-md flex items-center">
                        <i className="ri-error-warning-fill text-red-700 mr-2 text-xl"></i>
                        NEVER REVEAL WHO/WHAT IS BEING GUESSED IN HINTS
                      </div>
                    </div>
                    
                    <div className="bg-blue-100 border-2 border-blue-300 rounded-lg p-4 shadow-sm">
                      {hintsRevealed.length === 0 ? (
                        <p className="text-blue-700 font-medium italic">No hints revealed yet. Click the button below to reveal your first hint.</p>
                      ) : (
                        <ul className="list-disc pl-5 space-y-2">
                          {hintsRevealed.map((hint, index) => (
                            <li key={index} className="text-blue-800 font-medium text-base">{hint}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                    
                    <div className="mt-3">
                      {/* No more "Reveal Next Hint" button since all hints are shown at the start */}
                      <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 p-2 rounded-md shadow-sm">
                        <div className="flex items-center">
                          <i className="ri-information-line text-blue-600 mr-2 text-lg"></i>
                          <span className="text-sm font-medium text-blue-800">
                            All {hintCount} hints for your selected difficulty level are shown above.
                          </span>
                        </div>
                        
                        <Button 
                          onClick={getAIHint}
                          variant="outline"
                          size="sm"
                          className="bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-300"
                          disabled={isLoadingHint || gameMode !== "playing" || guessesRemaining <= 1}
                          title={guessesRemaining <= 1 ? "No questions remaining" : "Get an additional hint (uses 1 question)"}
                        >
                          {isLoadingHint ? (
                            <>
                              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2"></span>
                              Loading...
                            </>
                          ) : (
                            <>
                              <i className="ri-lightbulb-line mr-1"></i>
                              Get AI Hint (-1 Question)
                            </>
                          )}
                        </Button>
                      </div>
                      
                      {hintsRevealed.length > 0 && (
                        <div className="text-sm font-bold text-red-700 bg-red-50 border-2 border-red-200 p-3 mt-2 rounded-md flex items-center">
                          <i className="ri-error-warning-fill text-red-600 mr-2 text-xl"></i>
                          <span>
                            <span className="underline text-red-800">IMPORTANT:</span> Hints should <span className="underline">NEVER reveal who or what</span> is being guessed. 
                            <span className="block mt-1">Good hints describe characteristics, qualities, or behaviors without naming the subject.</span>
                            {(category === "movies" || category === "tv-shows") && (
                              <span className="block mt-1">For movies/shows, never mention titles, actors, or characters!</span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Questions and Answers */}
              <Card>
                <CardHeader>
                  <CardTitle>Questions and Answers</CardTitle>
                </CardHeader>
                <CardContent>
                  {questions.length === 0 ? (
                    <p className="text-gray-600 bg-gray-50 p-3 rounded-md border border-gray-200 italic">No questions asked yet. Ask a yes/no question or make a guess.</p>
                  ) : (
                    <ul className="space-y-4">
                      {questions.map((q, index) => (
                        <li key={index} className="pb-4 border-b border-gray-200">
                          <div className="flex items-start mb-2">
                            <span className="flex-shrink-0 bg-purple-100 text-purple-800 font-bold rounded-full w-7 h-7 flex items-center justify-center text-xs mr-2 border border-purple-300 shadow-sm">
                              Q{index + 1}
                            </span>
                            <span className="text-base font-medium text-gray-800 pt-1">{q}</span>
                          </div>
                          
                          {/* Display the corresponding answer */}
                          {index < answers.length ? (
                            <div className="flex items-start ml-9 mt-2">
                              <span className="flex-shrink-0 bg-blue-100 text-blue-800 font-bold rounded-full w-7 h-7 flex items-center justify-center text-xs mr-2 border border-blue-300 shadow-sm">
                                A
                              </span>
                              <div className="text-base text-gray-700 pt-1 bg-blue-50 p-2 rounded-md border border-blue-100 flex-grow">
                                {answers[index]}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center ml-9 mt-2">
                              {isLoadingAnswer ? (
                                <div className="flex items-center text-gray-500">
                                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2"></span>
                                  <span>Getting answer...</span>
                                </div>
                              ) : (
                                <span className="text-gray-500 italic">No answer available</span>
                              )}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
              
              {/* Question Input */}
              <Card>
                <CardHeader>
                  <CardTitle>Ask a Question</CardTitle>
                  {(category === "movies" || category === "tv-shows") && (
                    <div className="flex items-center mt-2 bg-red-50 border border-red-300 rounded p-2">
                      <i className="ri-error-warning-fill text-red-500 mr-2"></i>
                      <p className="text-sm font-medium text-red-700">
                        Remember: NO title, actor names, or character names in your questions!
                      </p>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitQuestion} className="space-y-4">
                    <Input
                      type="text"
                      placeholder="Ask a yes/no question..."
                      value={currentQuestion}
                      onChange={(e) => setCurrentQuestion(e.target.value)}
                      disabled={guessesRemaining <= 0}
                    />
                    <Button 
                      type="submit" 
                      disabled={!currentQuestion.trim() || guessesRemaining <= 0}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm"
                    >
                      Submit Question
                    </Button>
                  </form>
                </CardContent>
              </Card>
              
              {/* Guess Input */}
              <Card>
                <CardHeader>
                  <CardTitle>Make a Guess</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitGuess} className="space-y-4">
                    <Input
                      type="text"
                      placeholder="Enter your guess..."
                      value={currentGuess}
                      onChange={(e) => setCurrentGuess(e.target.value)}
                      disabled={guessesRemaining <= 0}
                    />
                    <Button 
                      type="submit" 
                      disabled={!currentGuess.trim() || guessesRemaining <= 0}
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm"
                    >
                      Submit Guess
                    </Button>
                  </form>
                  
                  {/* Show Answer Button */}
                  <div className="mt-4 pt-4 border-t border-gray-300">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-2 border-red-300 text-red-600 hover:bg-red-50 font-medium"
                      onClick={() => {
                        if (window.confirm("Are you sure you want to see the answer? Game will end with no points awarded.")) {
                          setGameMode("complete");
                          setCurrentGuess(""); // Clear the guess
                          // No points will be awarded since we're ending the game without a correct guess
                        }
                      }}
                    >
                      <i className="ri-eye-line mr-1 text-lg"></i>
                      Show Answer
                      <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold border border-red-200">0 pts</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Game Complete */}
          {gameMode === "complete" && (
            <Card>
              <CardHeader className={currentGuess.toLowerCase() === correctAnswer.toLowerCase() 
                ? "bg-green-50 border-b border-green-200" 
                : "bg-red-50 border-b border-red-200"}>
                <CardTitle className={currentGuess.toLowerCase() === correctAnswer.toLowerCase() 
                  ? "text-green-700" 
                  : "text-red-700"}>
                  {currentGuess.toLowerCase() === correctAnswer.toLowerCase() ? "Congratulations!" : "Game Over"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  {currentGuess.toLowerCase() === correctAnswer.toLowerCase() ? (
                    <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4 border-4 border-green-300 shadow-md">
                      <i className="ri-check-line text-5xl"></i>
                    </div>
                  ) : (
                    <div className="w-24 h-24 mx-auto bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-4 border-4 border-red-300 shadow-md">
                      <i className="ri-close-line text-5xl"></i>
                    </div>
                  )}
                  
                  <h3 className="text-2xl font-bold mb-3">
                    {currentGuess.toLowerCase() === correctAnswer.toLowerCase() 
                      ? "You guessed correctly!" 
                      : guessesRemaining <= 0 ? "You ran out of guesses." : "Answer revealed."}
                  </h3>
                  
                  <p className="mb-5 text-lg">Answer revealed only in direct play! Return to Brain Teasers to unlock all puzzles.</p>
                  
                  <Button 
                    onClick={handleReset}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-md shadow-sm text-lg"
                  >
                    Play Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
        
        {/* Mobile Navigation */}
        <MobileNav />
      </div>
    </div>
  );
}