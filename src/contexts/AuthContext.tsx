import { type ReactNode } from 'react';
import { useAuthLogic } from '../hooks/useAuthLogic';
import { AuthContext } from './auth-context';

export type AuthContextType = ReturnType<typeof useAuthLogic>;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useAuthLogic();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};
