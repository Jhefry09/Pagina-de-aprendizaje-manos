import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { TransitionContext } from './TransitionContext.tsx';
import '../../src/styles/transitions.css';

export const TransitionProvider = ({ children }: { children: ReactNode }) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const navigate = useNavigate();

  const triggerTransition = (to: string) => {
    setIsTransitioning(true);
    
    // Time for the curtain to close
    setTimeout(() => {
      navigate(to);
      // Time for the new page to load before opening the curtain
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    }, 500); // Match this with the CSS transition duration
  };

  return (
    <TransitionContext.Provider value={{ isTransitioning, triggerTransition }}>
      <div className={`transition-container ${isTransitioning ? 'transitioning' : ''}`}>
        {children}
        <div className="curtain left-curtain"></div>
        <div className="curtain right-curtain"></div>
      </div>
    </TransitionContext.Provider>
  );
};
