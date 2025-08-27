// hooks/useDevice.ts
import { useState, useEffect } from 'react';

export const useDevice = () => {
  const [device, setDevice] = useState<'mobile'| 'desktop'>('desktop');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    const checkDevice = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setDevice('mobile');
      } else  {
        setDevice('desktop');
      } 
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // SSR対策：初回レンダリング時はdesktopを返す
  if (!isMounted) {
    return { device: 'desktop', isMobile: false, isDesktop: true };
  }

  return {
    device,
    isMobile: device === 'mobile',
    isDesktop: device === 'desktop',
  };
};