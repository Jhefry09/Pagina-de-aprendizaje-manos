import { createContext } from 'react';

export interface TransitionContextType {
  isTransitioning: boolean;
  triggerTransition: (to: string) => void;
}

export const TransitionContext = createContext<TransitionContextType | undefined>(undefined);
