import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Palette, Shuffle, Save, User, Sparkles } from 'lucide-react';

// Avatar configuration interface
export interface AvatarConfig {
  // Face
  faceShape: 'round' | 'oval' | 'square' | 'heart';
  skinTone: string;
  
  // Hair
  hairStyle: 'short' | 'medium' | 'long' | 'curly' | 'bald' | 'ponytail' | 'buzz';
  hairColor: string;
  
  // Eyes
  eyeStyle: 'normal' | 'large' | 'small' | 'sleepy' | 'wink';
  eyeColor: string;
  
  // Accessories
  glasses: 'none' | 'regular' | 'sunglasses' | 'round' | 'cat-eye';
  hat: 'none' | 'cap' | 'beanie' | 'fedora' | 'crown';
  
  // Colors and style
  backgroundColor: string;
  
  // Expression
  expression: 'happy' | 'neutral' | 'excited' | 'cool' | 'surprised';
}

const defaultConfig: AvatarConfig = {
  faceShape: 'round',
  skinTone: '#FDBCB4',
  hairStyle: 'medium',
  hairColor: '#8B4513',
  eyeStyle: 'normal',
  eyeColor: '#4A5568',
  glasses: 'none',
  hat: 'none',
  backgroundColor: '#E2E8F0',
  expression: 'happy',
};

// Color palettes
const skinTones = [
  '#FDBCB4', '#F4A987', '#E8B982', '#D4A574', '#C49169',
  '#B8956F', '#A67C5C', '#8D5524', '#7C4A03', '#654321'
];

const hairColors = [
  '#000000', '#2D1B1B', '#4A4A4A', '#8B4513', '#D2691E',
  '#CD853F', '#DAA520', '#FFD700', '#FF6347', '#8A2BE2'
];

const eyeColors = [
  '#4A5568', '#2D3748', '#1A202C', '#0F4C75', '#3182CE',
  '#38A169', '#D69E2E', '#B7791F', '#C53030', '#805AD5'
];

const backgroundColors = [
  '#E2E8F0', '#FED7D7', '#FEE2E2', '#FEF5E7', '#F7FAFC',
  '#EDF2F7', '#E6FFFA', '#F0FFF4', '#FAFAFA', '#F5F5F5'
];

interface AvatarCreatorProps {
  initialConfig?: AvatarConfig;
  onSave: (config: AvatarConfig) => void;
  username: string;
}

// Simple SVG Avatar Component
const CustomAvatar = ({ config, size = 120 }: { config: AvatarConfig; size?: number }) => {
  const { faceShape, skinTone, hairStyle, hairColor, eyeStyle, eyeColor, glasses, hat, backgroundColor, expression } = config;

  return (
    <div 
      className="rounded-full border-4 border-white shadow-lg"
      style={{ 
        width: size, 
        height: size, 
        backgroundColor: backgroundColor,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <svg width={size} height={size} viewBox="0 0 120 120">
        {/* Background */}
        <circle cx="60" cy="60" r="60" fill={backgroundColor} />
        
        {/* Face */}
        {faceShape === 'round' && <circle cx="60" cy="65" r="25" fill={skinTone} />}
        {faceShape === 'oval' && <ellipse cx="60" cy="65" rx="20" ry="28" fill={skinTone} />}
        {faceShape === 'square' && <rect x="35" y="40" width="50" height="50" rx="8" fill={skinTone} />}
        {faceShape === 'heart' && <path d="M35 55 Q35 40 50 40 Q60 40 60 50 Q60 40 70 40 Q85 40 85 55 Q85 70 60 85 Q35 70 35 55" fill={skinTone} />}
        
        {/* Hair */}
        {hairStyle === 'short' && <circle cx="60" cy="45" r="22" fill={hairColor} />}
        {hairStyle === 'medium' && <ellipse cx="60" cy="40" rx="26" ry="24" fill={hairColor} />}
        {hairStyle === 'long' && <ellipse cx="60" cy="35" rx="28" ry="35" fill={hairColor} />}
        {hairStyle === 'curly' && (
          <>
            <circle cx="45" cy="35" r="8" fill={hairColor} />
            <circle cx="60" cy="30" r="10" fill={hairColor} />
            <circle cx="75" cy="35" r="8" fill={hairColor} />
            <circle cx="52" cy="25" r="6" fill={hairColor} />
            <circle cx="68" cy="25" r="6" fill={hairColor} />
          </>
        )}
        {hairStyle === 'ponytail' && (
          <>
            <ellipse cx="60" cy="40" rx="24" ry="20" fill={hairColor} />
            <ellipse cx="85" cy="45" rx="8" ry="15" fill={hairColor} />
          </>
        )}
        {hairStyle === 'buzz' && <circle cx="60" cy="45" r="18" fill={hairColor} />}
        
        {/* Eyes */}
        {eyeStyle === 'normal' && (
          <>
            <circle cx="52" cy="58" r="3" fill="white" />
            <circle cx="68" cy="58" r="3" fill="white" />
            <circle cx="52" cy="58" r="2" fill={eyeColor} />
            <circle cx="68" cy="58" r="2" fill={eyeColor} />
          </>
        )}
        {eyeStyle === 'large' && (
          <>
            <circle cx="52" cy="58" r="4" fill="white" />
            <circle cx="68" cy="58" r="4" fill="white" />
            <circle cx="52" cy="58" r="3" fill={eyeColor} />
            <circle cx="68" cy="58" r="3" fill={eyeColor} />
          </>
        )}
        {eyeStyle === 'small' && (
          <>
            <circle cx="52" cy="58" r="2" fill="white" />
            <circle cx="68" cy="58" r="2" fill="white" />
            <circle cx="52" cy="58" r="1.5" fill={eyeColor} />
            <circle cx="68" cy="58" r="1.5" fill={eyeColor} />
          </>
        )}
        {eyeStyle === 'sleepy' && (
          <>
            <ellipse cx="52" cy="58" rx="3" ry="1.5" fill={eyeColor} />
            <ellipse cx="68" cy="58" rx="3" ry="1.5" fill={eyeColor} />
          </>
        )}
        {eyeStyle === 'wink' && (
          <>
            <line x1="49" y1="58" x2="55" y2="58" stroke={eyeColor} strokeWidth="2" />
            <circle cx="68" cy="58" r="3" fill="white" />
            <circle cx="68" cy="58" r="2" fill={eyeColor} />
          </>
        )}
        
        {/* Mouth/Expression */}
        {expression === 'happy' && <path d="M50 75 Q60 82 70 75" stroke={skinTone === '#FDBCB4' ? '#D69E2E' : '#4A5568'} strokeWidth="2" fill="none" />}
        {expression === 'neutral' && <line x1="55" y1="75" x2="65" y2="75" stroke={skinTone === '#FDBCB4' ? '#D69E2E' : '#4A5568'} strokeWidth="2" />}
        {expression === 'excited' && <ellipse cx="60" cy="75" rx="8" ry="4" fill="#FF6B6B" />}
        {expression === 'cool' && <path d="M50 75 Q55 72 60 75 Q65 78 70 75" stroke={skinTone === '#FDBCB4' ? '#D69E2E' : '#4A5568'} strokeWidth="2" fill="none" />}
        {expression === 'surprised' && <ellipse cx="60" cy="75" rx="3" ry="5" fill="#FF6B6B" />}
        
        {/* Accessories - Glasses */}
        {glasses === 'regular' && (
          <>
            <circle cx="52" cy="58" r="8" fill="none" stroke="#2D3748" strokeWidth="2" />
            <circle cx="68" cy="58" r="8" fill="none" stroke="#2D3748" strokeWidth="2" />
            <line x1="60" y1="58" x2="60" y2="58" stroke="#2D3748" strokeWidth="2" />
          </>
        )}
        {glasses === 'sunglasses' && (
          <>
            <circle cx="52" cy="58" r="8" fill="#2D3748" />
            <circle cx="68" cy="58" r="8" fill="#2D3748" />
            <line x1="60" y1="58" x2="60" y2="58" stroke="#2D3748" strokeWidth="2" />
          </>
        )}
        {glasses === 'round' && (
          <>
            <circle cx="52" cy="58" r="6" fill="none" stroke="#2D3748" strokeWidth="2" />
            <circle cx="68" cy="58" r="6" fill="none" stroke="#2D3748" strokeWidth="2" />
            <line x1="58" y1="58" x2="62" y2="58" stroke="#2D3748" strokeWidth="2" />
          </>
        )}
        {glasses === 'cat-eye' && (
          <>
            <path d="M44 58 Q52 52 60 58 Q52 64 44 58" fill="none" stroke="#2D3748" strokeWidth="2" />
            <path d="M60 58 Q68 52 76 58 Q68 64 60 58" fill="none" stroke="#2D3748" strokeWidth="2" />
          </>
        )}
        
        {/* Accessories - Hat */}
        {hat === 'cap' && (
          <>
            <ellipse cx="60" cy="35" rx="25" ry="15" fill="#4299E1" />
            <ellipse cx="45" cy="40" rx="15" ry="8" fill="#3182CE" />
          </>
        )}
        {hat === 'beanie' && <ellipse cx="60" cy="32" rx="24" ry="18" fill="#805AD5" />}
        {hat === 'fedora' && (
          <>
            <ellipse cx="60" cy="35" rx="28" ry="12" fill="#8B4513" />
            <ellipse cx="60" cy="30" rx="20" ry="15" fill="#A0522D" />
          </>
        )}
        {hat === 'crown' && (
          <>
            <rect x="40" y="25" width="40" height="15" fill="#FFD700" />
            <polygon points="40,25 45,15 50,25 55,15 60,25 65,15 70,25 75,15 80,25" fill="#FFD700" />
          </>
        )}
      </svg>
    </div>
  );
};

export default function AvatarCreator({ initialConfig = defaultConfig, onSave, username }: AvatarCreatorProps) {
  const [config, setConfig] = useState<AvatarConfig>(initialConfig);
  const [isOpen, setIsOpen] = useState(false);

  const updateConfig = (updates: Partial<AvatarConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const randomizeAvatar = () => {
    const randomConfig: AvatarConfig = {
      faceShape: ['round', 'oval', 'square', 'heart'][Math.floor(Math.random() * 4)] as AvatarConfig['faceShape'],
      skinTone: skinTones[Math.floor(Math.random() * skinTones.length)],
      hairStyle: ['short', 'medium', 'long', 'curly', 'bald', 'ponytail', 'buzz'][Math.floor(Math.random() * 7)] as AvatarConfig['hairStyle'],
      hairColor: hairColors[Math.floor(Math.random() * hairColors.length)],
      eyeStyle: ['normal', 'large', 'small', 'sleepy', 'wink'][Math.floor(Math.random() * 5)] as AvatarConfig['eyeStyle'],
      eyeColor: eyeColors[Math.floor(Math.random() * eyeColors.length)],
      glasses: ['none', 'regular', 'sunglasses', 'round', 'cat-eye'][Math.floor(Math.random() * 5)] as AvatarConfig['glasses'],
      hat: ['none', 'cap', 'beanie', 'fedora', 'crown'][Math.floor(Math.random() * 5)] as AvatarConfig['hat'],
      backgroundColor: backgroundColors[Math.floor(Math.random() * backgroundColors.length)],
      expression: ['happy', 'neutral', 'excited', 'cool', 'surprised'][Math.floor(Math.random() * 5)] as AvatarConfig['expression'],
    };
    setConfig(randomConfig);
  };

  const handleSave = () => {
    onSave(config);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="flex items-center gap-2"
          data-testid="button-open-avatar-creator"
        >
          <Sparkles className="h-4 w-4" />
          Customize Avatar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-6 w-6" />
            Create Your Avatar
          </DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Avatar Preview */}
          <div className="flex flex-col items-center space-y-4">
            <CustomAvatar config={config} size={200} />
            <div className="flex gap-2">
              <Button 
                onClick={randomizeAvatar}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                data-testid="button-randomize-avatar"
              >
                <Shuffle className="h-4 w-4" />
                Randomize
              </Button>
              <Button 
                onClick={handleSave}
                className="flex items-center gap-2"
                data-testid="button-save-avatar"
              >
                <Save className="h-4 w-4" />
                Save Avatar
              </Button>
            </div>
          </div>

          {/* Customization Options */}
          <div className="space-y-4">
            <Tabs defaultValue="face" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="face">Face</TabsTrigger>
                <TabsTrigger value="hair">Hair</TabsTrigger>
                <TabsTrigger value="eyes">Eyes</TabsTrigger>
                <TabsTrigger value="accessories">Style</TabsTrigger>
              </TabsList>

              <TabsContent value="face" className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Face Shape</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {(['round', 'oval', 'square', 'heart'] as const).map(shape => (
                      <Button
                        key={shape}
                        variant={config.faceShape === shape ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateConfig({ faceShape: shape })}
                        data-testid={`face-shape-${shape}`}
                      >
                        {shape.charAt(0).toUpperCase() + shape.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Skin Tone</h3>
                  <div className="grid grid-cols-5 gap-2">
                    {skinTones.map(tone => (
                      <Button
                        key={tone}
                        className={`h-8 w-8 rounded-full border-2 ${config.skinTone === tone ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                        style={{ backgroundColor: tone }}
                        onClick={() => updateConfig({ skinTone: tone })}
                        data-testid={`skin-tone-${tone}`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Expression</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {(['happy', 'neutral', 'excited', 'cool', 'surprised'] as const).map(expression => (
                      <Button
                        key={expression}
                        variant={config.expression === expression ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateConfig({ expression })}
                        data-testid={`expression-${expression}`}
                      >
                        {expression.charAt(0).toUpperCase() + expression.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="hair" className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Hair Style</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {(['short', 'medium', 'long', 'curly', 'bald', 'ponytail', 'buzz'] as const).map(style => (
                      <Button
                        key={style}
                        variant={config.hairStyle === style ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateConfig({ hairStyle: style })}
                        data-testid={`hair-style-${style}`}
                      >
                        {style.charAt(0).toUpperCase() + style.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Hair Color</h3>
                  <div className="grid grid-cols-5 gap-2">
                    {hairColors.map(color => (
                      <Button
                        key={color}
                        className={`h-8 w-8 rounded-full border-2 ${config.hairColor === color ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => updateConfig({ hairColor: color })}
                        data-testid={`hair-color-${color}`}
                      />
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="eyes" className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Eye Style</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {(['normal', 'large', 'small', 'sleepy', 'wink'] as const).map(style => (
                      <Button
                        key={style}
                        variant={config.eyeStyle === style ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateConfig({ eyeStyle: style })}
                        data-testid={`eye-style-${style}`}
                      >
                        {style.charAt(0).toUpperCase() + style.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Eye Color</h3>
                  <div className="grid grid-cols-5 gap-2">
                    {eyeColors.map(color => (
                      <Button
                        key={color}
                        className={`h-8 w-8 rounded-full border-2 ${config.eyeColor === color ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => updateConfig({ eyeColor: color })}
                        data-testid={`eye-color-${color}`}
                      />
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="accessories" className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Glasses</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {(['none', 'regular', 'sunglasses', 'round', 'cat-eye'] as const).map(glasses => (
                      <Button
                        key={glasses}
                        variant={config.glasses === glasses ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateConfig({ glasses })}
                        data-testid={`glasses-${glasses}`}
                      >
                        {glasses === 'none' ? 'None' : glasses.split('-').map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Hat</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {(['none', 'cap', 'beanie', 'fedora', 'crown'] as const).map(hat => (
                      <Button
                        key={hat}
                        variant={config.hat === hat ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateConfig({ hat })}
                        data-testid={`hat-${hat}`}
                      >
                        {hat === 'none' ? 'None' : hat.charAt(0).toUpperCase() + hat.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Background</h3>
                  <div className="grid grid-cols-5 gap-2">
                    {backgroundColors.map(color => (
                      <Button
                        key={color}
                        className={`h-8 w-8 rounded-full border-2 ${config.backgroundColor === color ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => updateConfig({ backgroundColor: color })}
                        data-testid={`bg-color-${color}`}
                      />
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Export the CustomAvatar component for use in other places
export { CustomAvatar };