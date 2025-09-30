import { useState, useEffect } from 'react';
import { CheckCircle, Circle, TrendingUp, Award } from 'lucide-react';

interface User {
    name: string;
    usuario: string;
    role: string;
    rol: string;
    id: number;
}

interface LetterItem {
    letter: string;
    color: string;
}

interface ProgressTableProps {
    items: LetterItem[];
    title: string;
    icon: string;
    type: 'vocales' | 'abecedario' | 'numeros';
}

export default function ProgressTable({ items, icon, type }: ProgressTableProps) {
    const [user, setUser] = useState<User | null>(null);
    const [completedLetters, setCompletedLetters] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Cargar usuario desde localStorage
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);
                // Obtener progreso con el ID del usuario
                obtenerLetrasCompletadas(parsedUser.id);
            } catch (error) {
                console.error('Error al parsear datos del usuario:', error);
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
    }, []);

    async function obtenerLetrasCompletadas(usuarioId: number) {
        try {
            setLoading(true);
            let url = `/api/progreso/letras/${usuarioId}`;
            let response = await fetch(url, {
                method: 'GET',
            });

            if (response.ok) {
                const data = await response.json();
                setCompletedLetters(data);
            } else {
                console.error('Error al obtener progreso:', response.status);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    }

    const calculateProgress = () => {
        const completed = items.filter(item =>
            completedLetters.includes(item.letter.toLowerCase())
        ).length;
        return Math.round((completed / items.length) * 100);
    };

    const isCompleted = (letter: string) => {
        return completedLetters.includes(letter.toLowerCase());
    };

    const ProgressBar = ({ percentage }: { percentage: number }) => (
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
            <div
                className="bg-gradient-to-r from-emerald-500 to-green-600 h-full rounded-full transition-all duration-700 ease-out shadow-sm relative"
                style={{ width: `${percentage}%` }}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20 rounded-full"></div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-6 h-full">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-3 border-emerald-500 mx-auto mb-3"></div>
                    <h3 className="text-xl font-bold mb-2 text-gray-800">Mi Progreso</h3>
                    <p className="text-sm text-gray-600">Cargando datos...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-6 h-full">
                <div className="text-center">
                    <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center justify-center gap-2">
                        <TrendingUp className="w-6 h-6 text-emerald-500" />
                        Mi Progreso
                    </h3>
                    <div className="text-gray-400 mb-4">
                        <svg className="w-16 h-16 mx-auto mb-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <p className="text-sm text-gray-600 mb-2 font-medium">Inicia sesión para ver</p>
                    <p className="text-sm text-gray-600">tu progreso detallado</p>
                </div>
            </div>
        );
    }

    const progress = calculateProgress();
    const completedCount = items.filter(item => isCompleted(item.letter)).length;

    return (
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-6 h-full">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <TrendingUp className="w-6 h-6 text-emerald-500" />
                        Mi Progreso
                    </h3>
                    <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-amber-500" />
                        <span className="text-sm font-bold text-gray-700">
                            {completedCount}/{items.length}
                        </span>
                    </div>
                </div>

                {/* Progress Overview */}
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-4 mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-gray-700">Progreso General</span>
                        <span className="text-2xl font-bold text-emerald-600">{progress}%</span>
                    </div>
                    <ProgressBar percentage={progress} />
                    <p className="text-xs text-gray-600 mt-2">
                        {completedCount > 0 ? 
                            `¡Excelente! Has completado ${completedCount} ${type === 'vocales' ? 'vocales' : type === 'numeros' ? 'números' : 'letras'}` :
                            `Comienza tu aprendizaje de ${type === 'vocales' ? 'vocales' : type === 'numeros' ? 'números' : 'letras'}`
                        }
                    </p>
                </div>
            </div>

            {/* Detailed Progress List */}
            <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="text-lg">{icon}</span>
                    Detalle de Aprendizaje
                </h4>
                
                <div className="max-h-64 overflow-y-auto space-y-2">
                    {items.map((item) => {
                        const completed = isCompleted(item.letter);
                        const accuracy = completed ? Math.floor(Math.random() * 20) + 80 : 0; // Simulación de precisión
                        
                        return (
                            <div
                                key={item.letter}
                                className={`flex items-center justify-between p-3 rounded-lg transition-all duration-300 ${
                                    completed 
                                        ? 'bg-emerald-50 border border-emerald-200' 
                                        : 'bg-gray-50 border border-gray-200'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                        completed 
                                            ? 'bg-emerald-500 text-white' 
                                            : 'bg-gray-300 text-gray-600'
                                    }`}>
                                        {item.letter.toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">
                                            {type === 'vocales' ? `Vocal ${item.letter.toUpperCase()}` :
                                             type === 'numeros' ? `Número ${item.letter}` :
                                             `Letra ${item.letter.toUpperCase()}`}
                                        </p>
                                        {completed && (
                                            <p className="text-xs text-emerald-600 font-medium">
                                                Precisión: {accuracy}%
                                            </p>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    {completed ? (
                                        <div className="flex items-center gap-1">
                                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                                            <span className="text-xs font-semibold text-emerald-600">Completado</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1">
                                            <Circle className="w-5 h-5 text-gray-400" />
                                            <span className="text-xs text-gray-500">Pendiente</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
