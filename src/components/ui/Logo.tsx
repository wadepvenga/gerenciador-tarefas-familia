import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'text';
}

const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  variant = 'full'
}) => {
  const sizeClasses = {
    xs: 'w-10 h-10 text-xs',
    sm: 'w-16 h-16 text-sm',
    md: 'w-24 h-24 text-base',
    lg: 'w-32 h-32 text-lg',
    xl: 'w-48 h-48 text-2xl'
  };

  const textSizeClasses = {
    xs: 'text-sm',
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-5xl'
  };

  // ✅ NOVO DESIGN: Ícone estilizado "FV" (Família Venga)
  // Removida a logo da Rockfeller conforme solicitado
  const renderIcon = () => (
    <div className={`rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center shadow-lg border-2 border-white/20 ${sizeClasses[size]} ${className}`}>
      <span className="text-white font-black tracking-tighter">FV</span>
    </div>
  );

  if (variant === 'icon') {
    return renderIcon();
  }

  if (variant === 'text') {
    return (
      <div className={`${textSizeClasses[size]} font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 ${className}`}>
        FAMÍLIA VENGA
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      {renderIcon()}
      <div className={`${textSizeClasses[size]} font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 text-center leading-none`}>
        FAMÍLIA<br />VENGA
      </div>
    </div>
  );
};

export default Logo; 