import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// ProgressTracking is now consolidated into MyProgress
export default function ProgressTracking() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/MyProgress', { replace: true }); }, []);
  return null;
}
