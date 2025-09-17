import { useContext } from 'react';
import { TransitionContext } from '../contexts/TransitionContext.tsx';

interface TransitionContextType {
  isTransitioning: boolean;
  triggerTransition: (to: string) => void;
}

export const useTransition = (): TransitionContextType => {
  const context = useContext(TransitionContext);
  if (context === undefined || context === null) {
    throw new Error('useTransition must be used within a TransitionProvider');
  }
  return context as TransitionContextType;
};
