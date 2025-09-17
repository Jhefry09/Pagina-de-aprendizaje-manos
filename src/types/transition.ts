import type { ReactNode } from 'react';

export interface TransitionContextType {
  isTransitioning: boolean;
  triggerTransition: (to: string) => void;
}

export interface TransitionProviderProps {
  children: ReactNode;
}
