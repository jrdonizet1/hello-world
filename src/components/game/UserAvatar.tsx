import React from 'react';
import { User } from 'lucide-react';

interface UserAvatarProps {
  url?: string | null;
  level?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showLevel?: boolean;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ 
  url, 
  level, 
  size = 'md', 
  className = '',
  showLevel = true
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

  return (
    <div className={`relative ${className}`}>
      <div className={`${sizeClasses[size]} rounded-full bg-cyan-500/20 flex items-center justify-center border-2 border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.2)] overflow-hidden`}>
        {url ? (
          <img 
            src={url} 
            alt="Avatar" 
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = ''; // Clear source to fallback to icon
            }}
          />
        ) : (
          <User size={iconSizes[size]} className="text-cyan-400" />
        )}
      </div>
      {showLevel && level !== undefined && (
        <div className={`absolute -bottom-1 -right-1 bg-yellow-500 text-black font-black rounded-lg shadow-lg flex items-center justify-center
          ${size === 'xl' ? 'text-[10px] px-2 py-1' : 'text-[8px] px-1.5 py-0.5'}
        `}>
          LVL {level}
        </div>
      )}
    </div>
  );
};
