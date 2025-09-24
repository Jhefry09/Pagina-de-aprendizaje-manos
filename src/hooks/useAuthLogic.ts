import { useState } from 'react';

export interface User {
  name: string;
  role: string;
  email?: string;
}

export const useAuthLogic = () => {
  const [user, setUser] = useState<User | null>({
    name: 'Carlos',
    role: 'Estudiante',
  });

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
  };

  return {
    user,
    isAuthenticated: !!user,
    login,
    logout,
  };
};
