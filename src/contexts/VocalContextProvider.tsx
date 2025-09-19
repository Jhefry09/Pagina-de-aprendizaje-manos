import React, { useState, useEffect, type ReactNode } from 'react';
import { type VocalModel, type NormalizedLandmark } from '../types';
import { VocalContext } from './VocalContext';

export const VocalContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [vocalModels, setVocalModels] = useState<VocalModel[]>([]);

  useEffect(() => {
    const fetchVocales = async () => {
      try {
        const response = await fetch('/api/vocales');
        const data: { vocal: string; vectoresJson: string }[] = await response.json();
        const formattedModels = data.map(item => ({
          vocal: item.vocal,
          landmarks: JSON.parse(item.vectoresJson).landmarks || JSON.parse(item.vectoresJson),
        }));
        setVocalModels(formattedModels);
        console.log('Base models loaded:', formattedModels);
      } catch (err) {
        console.error('❌ Error fetching vocales:', err);
      }
    };

    fetchVocales();
  }, []);

  const updateVocalModel = (vocal: string, landmarks: NormalizedLandmark[]) => {
    setVocalModels(prevModels => {
      const index = prevModels.findIndex(m => m.vocal === vocal);
      if (index > -1) {
        const newModels = [...prevModels];
        newModels[index] = { vocal, landmarks };
        return newModels;
      }
      return [...prevModels, { vocal, landmarks }];
    });
  };

  return (
    <VocalContext.Provider value={{ vocalModels, updateVocalModel }}>
      {children}
    </VocalContext.Provider>
  );
};
