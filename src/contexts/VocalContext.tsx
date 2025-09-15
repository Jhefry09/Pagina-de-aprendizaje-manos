import { createContext } from 'react';
import { type VocalModel, type NormalizedLandmark } from '../types';

interface VocalContextType {
  vocalModels: VocalModel[];
  updateVocalModel: (vocal: string, landmarks: NormalizedLandmark[]) => void;
}

export const VocalContext = createContext<VocalContextType | undefined>(undefined);

