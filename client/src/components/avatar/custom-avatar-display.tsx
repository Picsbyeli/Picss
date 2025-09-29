import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { AvatarConfig } from './avatar-creator';

interface CustomAvatarDisplayProps {
  config?: AvatarConfig | null;
  username: string;
  profileImageUrl?: string | null;
  size?: number;
  className?: string;
}

// Default avatar config
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

// Simple SVG Avatar Component for display
const CustomAvatar = ({ config, size = 40 }: { config: AvatarConfig; size?: number }) => {
  const { faceShape, skinTone, hairStyle, hairColor, eyeStyle, eyeColor, glasses, hat, backgroundColor, expression } = config;

  return (
    <div 
      className="rounded-full border-2 border-white shadow-sm"
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

export default function CustomAvatarDisplay({ config, username, profileImageUrl, size = 40, className = "" }: CustomAvatarDisplayProps) {
  // Parse avatar config if it's a string
  let avatarConfig: AvatarConfig;
  try {
    if (typeof config === 'string') {
      avatarConfig = JSON.parse(config);
    } else if (config) {
      avatarConfig = config;
    } else {
      avatarConfig = defaultConfig;
    }
  } catch (error) {
    console.error('Failed to parse avatar config:', error);
    avatarConfig = defaultConfig;
  }

  // Get user initials as fallback
  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className={className}>
      {/* Profile Image, Custom Avatar, or Fallback */}
      {profileImageUrl ? (
        <Avatar style={{ width: size, height: size }}>
          <AvatarImage src={profileImageUrl} alt={username} />
          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
            {getInitials(username)}
          </AvatarFallback>
        </Avatar>
      ) : config ? (
        <CustomAvatar config={avatarConfig} size={size} />
      ) : (
        <Avatar style={{ width: size, height: size }}>
          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
            {getInitials(username)}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}