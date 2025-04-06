import type { FC } from 'react';

interface PixelArtProps {
  type: 'hacker' | 'computer' | 'pizza' | 'mit' | 'harvard';
  className?: string;
}

const PixelArt: FC<PixelArtProps> = ({ type, className = '' }) => {
  const getPixelArt = () => {
    switch (type) {
      case 'hacker':
        return (
          <div className={`w-16 h-16 ${className}`}>
            {/* Hacker pixel art - simple representation */}
            <div className="grid grid-cols-4 gap-0.5">
              <div className="bg-primary col-span-4 h-1"></div>
              <div className="bg-primary h-3"></div>
              <div className="bg-secondary h-3"></div>
              <div className="bg-accent h-3"></div>
              <div className="bg-primary h-3"></div>
              <div className="bg-primary col-span-4 h-1"></div>
            </div>
          </div>
        );
      case 'computer':
        return (
          <div className={`w-16 h-16 ${className}`}>
            {/* Computer pixel art */}
            <div className="grid grid-cols-4 gap-0.5">
              <div className="bg-secondary col-span-4 h-2"></div>
              <div className="bg-primary h-8"></div>
              <div className="bg-accent h-8"></div>
              <div className="bg-primary h-8"></div>
              <div className="bg-secondary h-8"></div>
              <div className="bg-secondary col-span-4 h-2"></div>
            </div>
          </div>
        );
      case 'pizza':
        return (
          <div className={`w-16 h-16 ${className}`}>
            {/* Pizza pixel art */}
            <div className="grid grid-cols-4 gap-0.5">
              <div className="bg-accent col-span-4 h-2 rounded-t-full"></div>
              <div className="bg-primary h-6"></div>
              <div className="bg-secondary h-6"></div>
              <div className="bg-accent h-6"></div>
              <div className="bg-primary h-6"></div>
              <div className="bg-accent col-span-4 h-2 rounded-b-full"></div>
            </div>
          </div>
        );
      case 'mit':
        return (
          <div className={`w-16 h-16 ${className}`}>
            {/* MIT pixel art */}
            <div className="grid grid-cols-4 gap-0.5">
              <div className="bg-primary col-span-4 h-1"></div>
              <div className="bg-secondary h-4"></div>
              <div className="bg-accent h-4"></div>
              <div className="bg-primary h-4"></div>
              <div className="bg-secondary h-4"></div>
              <div className="bg-primary col-span-4 h-1"></div>
            </div>
          </div>
        );
      case 'harvard':
        return (
          <div className={`w-16 h-16 ${className}`}>
            {/* Harvard pixel art */}
            <div className="grid grid-cols-4 gap-0.5">
              <div className="bg-accent col-span-4 h-1"></div>
              <div className="bg-primary h-4"></div>
              <div className="bg-secondary h-4"></div>
              <div className="bg-accent h-4"></div>
              <div className="bg-primary h-4"></div>
              <div className="bg-accent col-span-4 h-1"></div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return getPixelArt();
};

export default PixelArt; 