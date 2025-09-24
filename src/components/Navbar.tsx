import { useState } from 'react';
import { User, ChevronDown, X, Menu } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import type { AuthContextType } from '../contexts/auth-context';

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  isActive?: boolean;
}

interface NavbarProps {
  activeLink?: string;
}

const NavLink = ({ href, children, isActive = false }: NavLinkProps) => (
  <a
    href={href}
    className={`px-3 py-2.5 text-sm font-medium transition-colors duration-200 rounded-lg ${
      isActive 
        ? 'text-white bg-gray-800/50' 
        : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
    }`}
  >
    {children}
  </a>
);

const Navbar = ({ activeLink = 'inicio' }: NavbarProps) => {
  const auth = useAuth() as AuthContextType;
  const userName = auth.user?.name || 'Usuario';
  const userRole = auth.user?.role || 'Invitado';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showClassesDropdown, setShowClassesDropdown] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const modules = [
    { id: 'vocales', title: 'Vocales' },
    { id: 'abecedario', title: 'Abecedario' },
    { id: 'numeros', title: 'Números' },
    { id: 'formar-palabras', title: 'Formar Palabras' },
    { id: 'operaciones-matematicas', title: 'Operaciones Matemáticas' },
  ];

  return (
    <nav className="bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          {/* Logo */}
          <div className="flex items-center">
              <a href="/" className="flex items-center space-x-2 group">
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                  SignLearn AI
                </span>
                <span className="hidden md:inline-block h-8 w-0.5 bg-gray-500"></span>
                <span className="hidden md:inline text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                  Aprendizaje Inclusivo
                </span>
              </a>
          </div>
          
          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-2 ml-8">
            <NavLink href="/" isActive={activeLink === 'inicio'}>Inicio</NavLink>
            
            <div className="relative">
              <div className="relative">
                <button 
                  onClick={() => setShowClassesDropdown(!showClassesDropdown)}
                  onMouseEnter={() => setShowClassesDropdown(true)}
                  className={`px-3 py-2.5 text-sm font-medium flex items-center space-x-1 rounded-lg transition-all duration-200 ${
                    showClassesDropdown || activeLink === 'clases'
                      ? 'text-white bg-gray-800/50'
                      : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  <span>Clases</span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${
                    showClassesDropdown ? 'transform rotate-180' : ''
                  }`} />
                </button>
                
                <div 
                  className={`absolute left-0 mt-1 w-48 rounded-xl shadow-xl bg-gray-800/95 backdrop-blur-sm border border-gray-700/50 z-50 transition-all duration-200 origin-top ${
                    showClassesDropdown 
                      ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' 
                      : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'
                  }`}
                  onMouseEnter={() => setShowClassesDropdown(true)}
                  onMouseLeave={() => setShowClassesDropdown(false)}
                >
                  <div className="py-2">
                    {modules.map((module) => (
                      <a
                        key={module.id}
                        href={`#${module.id}`}
                        className="block px-4 py-2.5 text-sm text-gray-200 hover:bg-gray-700/70 transition-colors duration-150"
                        onClick={() => setShowClassesDropdown(false)}
                      >
                        <span className="flex items-center space-x-2">
                          <span className="flex-1">{module.title}</span>
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <NavLink href="/training">
              Entrenar IA
            </NavLink>
          </div>
          
          {/* User Profile */}
          <div className="flex items-center">
            <div className="relative">
              <button 
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="px-3 py-2 rounded-lg text-sm font-medium text-gray-200 hover:bg-gray-700/50 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-400 flex items-center space-x-1.5"
              >
                <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center border border-gray-600">
                  <User className="h-4 w-4 text-gray-300" />
                </div>
                <span className="hidden sm:inline">Perfil</span>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${
                  isProfileDropdownOpen ? 'transform rotate-180' : ''
                }`} />
              </button>
              
              {isProfileDropdownOpen && (
                <div className={`absolute right-0 mt-2 w-56 rounded-xl shadow-xl bg-gray-800/95 backdrop-blur-sm border border-gray-700/50 z-10 overflow-hidden transition-all duration-200 origin-top-right ${
                  isProfileDropdownOpen 
                    ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' 
                    : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'
                }`}
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="options-menu"
              >
                <div className="py-1">
                  <a
                    href="#"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Tu perfil
                  </a>
                  <a
                    href="#"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Configuración
                  </a>
                  <a
                    href="#"
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/50 transition-colors"
                  >
                    Cerrar sesión
                  </a>
                </div>
              </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Mobile menu button */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-400 transition-colors"
          >
            <span className="sr-only">Abrir menú principal</span>
            {isMobileMenuOpen ? (
              <X className="block h-6 w-6" />
            ) : (
              <Menu className="block h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${isMobileMenuOpen ? 'max-h-96' : 'max-h-0'}`}>
        <div className="px-2 pt-2 pb-3 space-y-1">
          <a
            href="/"
            className="block px-4 py-3 rounded-lg text-base font-medium text-white hover:bg-gray-700/50 transition-colors"
          >
            Inicio
          </a>
          <div className="border-t border-gray-700 my-1"></div>
          <div className="px-2">
            <p className="text-xs uppercase font-semibold text-gray-400 px-2 py-1">Clases</p>
            {modules.map((module) => (
              <a
                key={module.id}
                href={`/${module.id}`}
                className="block px-4 py-2 rounded-lg text-base font-medium text-gray-200 hover:bg-gray-700/50 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {module.title}
              </a>
            ))}
          </div>
          <div className="border-t border-gray-700 my-1"></div>
          <a
            href="#entrenar-ia"
            className="block px-4 py-3 rounded-lg text-base font-medium text-gray-200 hover:bg-gray-700/50 transition-colors"
          >
            Entrenar IA
          </a>
        </div>
        
        {/* Mobile user menu */}
        <div className="pt-4 pb-3 border-t border-gray-700">
          <div className="flex items-center px-5">
            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div className="ml-3">
              <div className="text-base font-medium text-white">{userName}</div>
              <div className="text-sm font-medium text-gray-400">{userRole}</div>
            </div>
          </div>
          <div className="mt-3 px-2 space-y-1">
            <a
              href="#"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors"
            >
              Tu perfil
            </a>
            <a
              href="#"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors"
            >
              Configuración
            </a>
            <a
              href="#"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors"
            >
              Cerrar sesión
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
