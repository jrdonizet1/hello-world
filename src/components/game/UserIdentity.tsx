import React from 'react';
import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';

interface UserIdentityProps {
  name: string;
  skin?: string;
  title?: string;
  icon?: any;
  effect?: any;
  font?: any;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTitle?: boolean;
}

export const UserIdentity: React.FC<UserIdentityProps> = ({ 
  name, 
  skin, 
  title, 
  icon, 
  effect, 
  font,
  className = '',
  size = 'md',
  showTitle = true
}) => {
  const isCycle = effect?.type === 'cycle';
  const isGlow = effect?.type === 'glow';
  const isRainbowSkin = skin === 'rainbow';

  const fontStyles = font ? {
    fontFamily: font.fontFamily,
    fontSize: font.size ? `calc(100% * ${font.size.replace('em','')})` : 'inherit'
  } : {};

  const getIcon = () => {
    if (!icon) return null;
    
    const iconSize = size === 'sm' ? 12 : 16;

    // Handle legacy string icon or new object with .icon property
    const iconName = typeof icon === 'string' ? icon : icon.icon;
    const iconColor = typeof icon === 'object' ? icon.color : null;

    if (iconName) {
      // Mapping common names to Lucide icons
      const iconMap: Record<string, string> = {
        'Zap': 'Zap',
        'Crown': 'Crown',
        'ShieldCheck': 'ShieldCheck',
        'Infinity': 'Infinity',
        'Monitor': 'Monitor',
        'Flame': 'Flame',
        'Gem': 'Gem',
        'Skull': 'Skull',
        'Star': 'Star'
      };

      const lucideName = iconMap[iconName] || iconName;
      const IconComponent = (LucideIcons as any)[lucideName];

      if (IconComponent) {
        return (
          <IconComponent 
            size={iconSize} 
            style={{ color: iconColor || (iconName === 'Zap' ? '#06b6d4' : (iconName === 'Crown' ? '#eab308' : '#ffffff')) }} 
          />
        );
      }
    }

    // Handle image/gif icons
    if (icon.url) {
      return (
        <img 
          src={icon.url} 
          alt="icon" 
          className={`${size === 'sm' ? 'w-4 h-4' : 'w-6 h-6'} rounded-md object-cover border border-white/10`} 
        />
      );
    }

    return null;
  };

  const nameSizeClasses = {
    sm: 'text-[10px]',
    md: 'text-sm',
    lg: 'text-lg',
    xl: 'text-2xl'
  };

  const titleSizeClasses = {
    sm: 'text-[6px]',
    md: 'text-[8px]',
    lg: 'text-[10px]',
    xl: 'text-xs'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-shrink-0">
        {getIcon()}
      </div>
      <div className="flex flex-col">
        <motion.span 
          className={`font-black italic uppercase tracking-tight ${nameSizeClasses[size]}`}
          animate={isCycle ? {
            color: ['#ff0000', '#00ff00', '#0000ff', '#ff00ff', '#ff0000'],
          } : isRainbowSkin ? {
            color: ['#06b6d4', '#ec4899', '#eab308', '#22c55e', '#06b6d4'],
          } : {
            color: skin || '#ffffff',
          }}
          transition={(isCycle || isRainbowSkin) ? { duration: 3, repeat: Infinity, ease: "linear" } : {}}
          style={{
            ...fontStyles,
            textShadow: isGlow ? `0 0 ${effect.intensity === 'extreme' ? '20px' : (effect.intensity === 'high' ? '12px' : '6px')} ${effect.color || skin || '#06b6d4'}` : 'none'
          }}
        >
          {name}
        </motion.span>
        {showTitle && title && (
          <motion.span 
            className={`font-black uppercase tracking-[0.2em] opacity-70 ${titleSizeClasses[size]}`}
            animate={isCycle ? {
              color: ['#ff0000', '#00ff00', '#0000ff', '#ff00ff', '#ff0000'],
            } : isRainbowSkin ? {
              color: ['#06b6d4', '#ec4899', '#eab308', '#22c55e', '#06b6d4'],
            } : {
              color: skin || '#ffffff',
            }}
            transition={(isCycle || isRainbowSkin) ? { duration: 3, repeat: Infinity, ease: "linear" } : {}}
          >
            « {title} »
          </motion.span>
        )}
      </div>
    </div>
  );
};
