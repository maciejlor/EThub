import { useState, useEffect } from 'react';

const IMAGES = [
  '/src/assets/background.png',
  '/src/assets/bg2.png',
  '/src/assets/bg3.png',
  '/src/assets/bg4.png',
  '/src/assets/bg5.png',
  '/src/assets/bg6.png',
];

export function BackgroundSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reset timer when manually clicking a dot
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % IMAGES.length);
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [currentIndex]); // Depend on currentIndex to reset timer on manual click

  return (
    <>
      <style>
        {`
          @keyframes slider-progress {
            from { width: 0%; }
            to { width: 100%; }
          }
        `}
      </style>
      <div className='absolute inset-0 z-0 overflow-hidden'>
        {IMAGES.map((src, index) => (
          <img
            key={src}
            src={src}
            alt={`Background ${index + 1}`}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}
        <div className='absolute inset-0 bg-black/60' />
        
        {/* Navigation Indicators */}
        <div className='absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2'>
          {IMAGES.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`relative h-1.5 overflow-hidden rounded-full transition-all duration-300 ${
                index === currentIndex ? 'w-8 bg-white' : 'w-1.5 bg-white/70 hover:bg-white cursor-pointer'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            >
              {index === currentIndex && (
                <div
                  key={currentIndex}
                  className='h-full bg-purple-500 rounded-full'
                  style={{
                    animation: 'slider-progress 10s linear forwards',
                  }}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
