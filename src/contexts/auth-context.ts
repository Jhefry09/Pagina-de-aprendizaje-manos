import { createContext } from 'react';
import type { AuthContextType } from './AuthContext';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Re-exportar el tipo para facilitar las importaciones
export type { AuthContextType } from './AuthContext';
