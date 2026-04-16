import { useEffect } from 'react';

export function useTitle(title: string) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title ? `SiAnter - ${title}` : 'SiAnter';
    
    return () => {
      document.title = prevTitle;
    };
  }, [title]);
}
