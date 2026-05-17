import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Crown, ShieldCheck, Infinity as InfinityIcon, Monitor } from 'lucide-react';

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
    
    // Handle legacy string icon
    if (typeof icon === 'string') {
      if (icon === 'Zap') return <Zap size={size === 'sm' ? 12 : 16} className="text-cyan-400" />;
      if (icon === 'Crown') return <Crown size={size === 'sm' ? 12 : 16} className="text-yellow-500" />;
      if (icon === 'ShieldCheck') return <ShieldCheck size={size === 'sm' ? 12 : 16} className="text-emerald-500" />;
      if (icon === 'Infinity') return <InfinityIcon size={size === 'sm' ? 12 : 16} className="text-purple-500" />;
      if (icon === 'Monitor') return <Monitor size={size === 'sm' ? 12 : 16} className="text-blue-400" />;
      return null;
    }

    // Handle new object icon
    if (icon.type === 'image' || icon.url) {
      return (
        <img 
          src={icon.url} 
          alt="icon" 
          className={`${size === 'sm' ? 'w-4 h-4' : 'w-6 h-6'} rounded-md object-cover border border-white/10`} 
        />
      );
    }

    // Handle Lucide icon from object
    if (icon.icon) {
      const iconName = icon.icon;
      if (iconName === 'Zap') return <Zap size={size === 'sm' ? 12 : 16} className="text-cyan-400" />;
      if (iconName === 'Crown') return <Crown size={size === 'sm' ? 12 : 16} className="text-yellow-500" />;
      if (iconName === 'ShieldCheck') return <ShieldCheck size={size === 'sm' ? 12 : 16} className="text-emerald-500" />;
      if (iconName === 'Infinity') return <InfinityIcon size={size === 'sm' ? 12 : 16} className="text-purple-500" />;
      if (iconName === 'Monitor') return <Monitor size={size === 'sm' ? 12 : 16} className="text-blue-400" />;
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
