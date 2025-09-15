import { useContext } from 'react';
import { VocalContext } from '../contexts/VocalContext';

export const useVocalContext = () => {
  const context = useContext(VocalContext);
  if (context === undefined) {
    throw new Error('useVocalContext must be used within a VocalContextProvider');
  }
  return context;
};
