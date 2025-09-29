import { useState, useEffect } from 'react';
import { User, ChevronDown, X, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NavLinkProps {
    href: string;
    children: React.ReactNode;
    isActive?: boolean;
}

interface NavbarProps {
    activeLink?: string;
}

interface UserData {
    usuario: string;
    name: string;
    id: number;
    rol: string;
}

const NavLink = ({ href, children, isActive = false }: NavLinkProps) => (
    <a
        href={href}
        className={`px-3 py-2.5 text-base font-medium transition-colors duration-200 rounded-lg ${
            isActive
                ? 'text-white bg-gray-800/50'
                : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
        }`}
    >
        {children}
    </a>
);

const Navbar = ({ activeLink = 'inicio' }: NavbarProps) => {
    const navigate = useNavigate();
    const [user, setUser] = useState<UserData | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showClassesDropdown, setShowClassesDropdown] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

    // Cargar datos del usuario desde localStorage
    useEffect(() => {
        const userData = localStorage.getItem('user');

        if (userData) {
            try {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);
            } catch (error) {
                console.error('Error al parsear datos del usuario:', error);
            }
        }
    }, []);

    const handleLogout = () => {
        // Limpiar localStorage
        localStorage.removeItem('user');
        localStorage.removeItem('userProgress');
        localStorage.removeItem('progresoLetras');

        // Reset states
        setUser(null);
        setIsProfileDropdownOpen(false);

        // Redirigir al login
        navigate('/login');
    };

    const userName = user?.usuario || 'Usuario';
    const userRole = user?.rol || 'Invitado';
    const userInitial = userName.charAt(0).toUpperCase();

    const modules = [
        { id: 'vocales', title: 'Vocales', route: '/vocales' },
        { id: 'abecedario', title: 'Abecedario', route: '/abecedario' },
        { id: 'numeros', title: 'Números', route: '/numeros-aprendizaje' },
        { id: 'formar-palabras', title: 'Formar Palabras', route: '/practice/palabras' },
        { id: 'operaciones-matematicas', title: 'Operaciones Matemáticas', route: '/numeros' },
    ];

    const handleModuleNavigation = (route: string) => {
        navigate(route);
        setShowClassesDropdown(false);
    };

    return (
        <nav className="relative z-[9999] px-4 sm:px-6 lg:px-8 pt-4 pb-2">
            <div className="max-w-7xl mx-auto bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-md text-white shadow-2xl rounded-2xl border border-white/10 px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <a href="/" className="flex items-center space-x-2 group">
                <span className="text-2xl font-bold text-white">
                  SeeTalk
                </span>
                            <span className="hidden md:inline-block h-8 w-0.5 bg-gray-500"></span>
                            <span className="hidden md:inline text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                  Comunicación Inteligente
                </span>
                        </a>
                    </div>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center space-x-2 ml-8">
                        <NavLink href="/home" isActive={activeLink === 'inicio'}>Inicio</NavLink>

                        <div 
                            className="relative"
                            onMouseLeave={() => setShowClassesDropdown(false)}
                        >
                            <div className="relative">
                                <button
                                    onClick={() => setShowClassesDropdown(!showClassesDropdown)}
                                    onMouseEnter={() => setShowClassesDropdown(true)}
                                    className={`px-3 py-2.5 text-base font-medium flex items-center space-x-1 rounded-lg transition-all duration-200 ${
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
                                    className={`absolute left-0 mt-1 w-48 rounded-xl shadow-xl bg-gray-800/95 backdrop-blur-sm border border-gray-700/50 z-[99999] transition-all duration-200 origin-top ${
                                        showClassesDropdown
                                            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                                            : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'
                                    }`}
                                    onMouseEnter={() => setShowClassesDropdown(true)}
                                    onMouseLeave={() => setShowClassesDropdown(false)}
                                >
                                    <div className="py-2">
                                        {modules.map((module) => (
                                            <button
                                                key={module.id}
                                                onClick={() => handleModuleNavigation(module.route)}
                                                className="w-full text-left block px-4 py-2.5 text-base text-gray-200 hover:bg-gray-700/70 transition-colors duration-150"
                                            >
                        <span className="flex items-center space-x-2">
                          <span className="flex-1">{module.title}</span>
                        </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <NavLink href="/training">
                            Entrenar IA
                        </NavLink>
                        
                        <NavLink href="/estadisticas" isActive={activeLink === 'estadisticas'}>
                            Estadísticas
                        </NavLink>
                        
                        <NavLink href="/gestion" isActive={activeLink === 'gestion'}>
                            Gestión de usuarios
                        </NavLink>
                    </div>

                    {/* User Profile */}
                    <div className="flex items-center">
                        <div className="relative">
                            <button
                                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                                className="px-3 py-2 rounded-lg text-base font-medium text-gray-200 hover:bg-gray-700/50 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-400 flex items-center space-x-1.5"
                            >
                                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center border border-gray-600">
                                    {user ? (
                                        <span className="text-white font-medium text-sm">{userInitial}</span>
                                    ) : (
                                        <User className="h-4 w-4 text-gray-300" />
                                    )}
                                </div>
                                <span className="hidden sm:inline">{userName}</span>
                                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${
                                    isProfileDropdownOpen ? 'transform rotate-180' : ''
                                }`} />
                            </button>

                            {isProfileDropdownOpen && (
                                <div className={`absolute right-0 mt-2 w-56 rounded-xl shadow-xl bg-gray-800/95 backdrop-blur-sm border border-gray-700/50 z-[99999] overflow-hidden transition-all duration-200 origin-top-right ${
                                    isProfileDropdownOpen
                                        ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                                        : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'
                                }`}
                                     role="menu"
                                     aria-orientation="vertical"
                                     aria-labelledby="options-menu"
                                >
                                    {user && (
                                        <div className="px-4 py-3 border-b border-gray-700/50">
                                            <div className="flex items-center space-x-3">
                                                <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                                                    <span className="text-white font-bold text-lg">{userInitial}</span>
                                                </div>
                                                <div>
                                                    <div className="font-medium text-white">{userName}</div>
                                                    <div className="text-sm text-gray-400">{userRole}</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="py-1">
                                        <a
                                            href="/dashboard"
                                            className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/50 transition-colors"
                                            onClick={() => setIsProfileDropdownOpen(false)}
                                        >
                                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                            Mi Progreso
                                        </a>
                                        <a
                                            href="#"
                                            className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/50 transition-colors"
                                        >
                                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            Configuración
                                        </a>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center px-4 py-2 text-sm text-red-400 hover:bg-gray-700/50 transition-colors"
                                        >
                                            <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            Cerrar sesión
                                        </button>
                                    </div>
                                </div>
                            )}
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
            </div>

            {/* Mobile menu */}
            <div className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${isMobileMenuOpen ? 'max-h-96' : 'max-h-0'}`}>
                <div className="mx-4 mt-2 bg-slate-900/95 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl">
                    <div className="px-4 pt-2 pb-3 space-y-1">
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
                                <button
                                    key={module.id}
                                    onClick={() => {
                                        handleModuleNavigation(module.route);
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="w-full text-left block px-4 py-2 rounded-lg text-base font-medium text-gray-200 hover:bg-gray-700/50 transition-colors"
                                >
                                    {module.title}
                                </button>
                            ))}
                        </div>
                        <div className="border-t border-gray-700 my-1"></div>
                        <a
                            href="#entrenar-ia"
                            className="block px-4 py-3 rounded-lg text-base font-medium text-gray-200 hover:bg-gray-700/50 transition-colors"
                        >
                            Entrenar IA
                        </a>
                        <a
                            href="/estadisticas"
                            className="block px-4 py-3 rounded-lg text-base font-medium text-gray-200 hover:bg-gray-700/50 transition-colors"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Estadísticas
                        </a>
                        <a
                            href="/gestion"
                            className="block px-4 py-3 rounded-lg text-base font-medium text-gray-200 hover:bg-gray-700/50 transition-colors"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Gestión
                        </a>
                    </div>

                    {/* Mobile user menu */}
                    <div className="pt-4 pb-3 border-t border-gray-700">
                        <div className="flex items-center px-5">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                                {user ? (
                                    <span className="text-white font-medium text-lg">{userInitial}</span>
                                ) : (
                                    <User className="h-5 w-5 text-white" />
                                )}
                            </div>
                            <div className="ml-3">
                                <div className="text-base font-medium text-white">{userName}</div>
                                <div className="text-sm font-medium text-gray-400">{userRole}</div>
                            </div>
                        </div>
                        <div className="mt-3 px-2 space-y-1">
                            <a
                                href="/dashboard"
                                className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Mi Progreso
                            </a>
                            <a
                                href="#"
                                className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700/50 transition-colors"
                            >
                                Configuración
                            </a>
                            <button
                                onClick={handleLogout}
                                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-400 hover:text-red-300 hover:bg-gray-700/50 transition-colors"
                            >
                                Cerrar sesión
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;