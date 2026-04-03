import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Lightweight navigation tracker — logs page views to console only
export default function NavigationTracker() {
  const location = useLocation();

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Navigation:', location.pathname);
    }
  }, [location]);

  return null;
}
