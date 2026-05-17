import React from 'react';
import { User } from 'lucide-react';

interface UserAvatarProps {
  url?: string | null;
  level?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showLevel?: boolean;
  frame?: any;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ 
  url, 
  level, 
  size = 'md', 
  className = '',
  showLevel = true,
  frame
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const iconSizes = {
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48
  };

  const frameStyles = frame ? {
    borderColor: frame.color || 'transparent',
    borderStyle: frame.style || 'solid',
    borderWidth: size === 'xl' ? '4px' : '2px',
    boxShadow: frame.glow ? `0 0 15px ${frame.color || '#06b6d4'}` : 'none',
  } : {};

  return (
    <div className={`relative ${className}`}>
      <div 
        className={`${sizeClasses[size]} rounded-full bg-cyan-500/20 flex items-center justify-center border-2 border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.2)] overflow-hidden transition-all`}
        style={frameStyles}
      >
        {url && url.trim() !== '' ? (
          <img 
            src={url} 
            alt="Avatar" 
            className="w-full h-full object-cover"
            onError={(e) => {
              console.warn("Avatar image failed to load:", url);
              (e.target as HTMLImageElement).style.display = 'none';
              const parent = (e.target as HTMLElement).parentElement;
              if (parent) {
                const fallbackIcon = parent.querySelector('.fallback-icon');
                if (fallbackIcon) (fallbackIcon as HTMLElement).style.display = 'flex';
              }
            }}
          />
        ) : null}
        <div className="fallback-icon hidden items-center justify-center w-full h-full" style={{ display: !url || url.trim() === '' ? 'flex' : 'none' }}>
          <User size={iconSizes[size]} className="text-cyan-400" />
        </div>
      </div>
      {showLevel && level !== undefined && (
        <div className={`absolute -bottom-1 -right-1 bg-yellow-500 text-black font-black rounded-lg shadow-lg flex items-center justify-center z-10
          ${size === 'xl' ? 'text-[10px] px-2 py-1' : 'text-[8px] px-1.5 py-0.5'}
        `}>
          LVL {level}
        </div>
      )}
    </div>
  );
};
