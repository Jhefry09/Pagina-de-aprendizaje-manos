import { useState, useEffect } from 'react';
import { CheckCircle, Circle, User as UserIcon } from 'lucide-react';

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

export default function SignLanguageProgress() {
    const [user, setUser] = useState<User | null>(null);
    const [completedLetters, setCompletedLetters] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    // Vocales
    const vowels: LetterItem[] = [
        { letter: "a", color: "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700" },
        { letter: "e", color: "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700" },
        { letter: "i", color: "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700" },
        { letter: "o", color: "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700" },
        { letter: "u", color: "bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700" },
    ];

    // Alfabeto completo
    const alphabet: LetterItem[] = [
        { letter: "a", color: "bg-gradient-to-r from-amber-600 to-amber-700 hover:bg-red-500" },
        { letter: "b", color: "bg-gradient-to-r from-amber-600 to-amber-700 hover:bg-blue-500" },
        { letter: "c", color: "bg-gradient-to-r from-amber-600 to-amber-700 hover:bg-green-500" },
        { letter: "d", color: "bg-gradient-to-r from-amber-600 to-amber-700 hover:bg-yellow-500" },
        { letter: "e", color: "bg-gradient-to-r from-amber-600 to-amber-700 hover:bg-purple-500" },
        { letter: "f", color: "bg-gradient-to-r from-amber-600 to-amber-700 hover:bg-pink-500" },
        { letter: "g", color: "bg-gradient-to-r from-amber-600 to-amber-700 hover:bg-indigo-500" },
        { letter: "h", color: "bg-gradient-to-r from-amber-600 to-amber-700 hover:bg-orange-500" },
        { letter: "i", color: "bg-gradient-to-r from-amber-600 to-amber-700 hover:bg-teal-500" },
        { letter: "j", color: "bg-gradient-to-r from-amber-600 to-amber-700 hover:bg-cyan-500" },
        { letter: "k", color: "bg-gradient-to-r from-amber-600 to-amber-700 hover:bg-emerald-500" },
        { letter: "l", color: "bg-gradient-to-r from-amber-600 to-amber-700 hover:bg-lime-500" },
        { letter: "m", color: "bg-gradient-to-r from-amber-600 to-amber-700 hover:bg-amber-500" },
        { letter: "n", color: "bg-gradient-to-r from-amber-600 to-amber-700 hover:bg-rose-500" },
        { letter: "o", color: "bg-gradient-to-r from-amber-600 to-amber-700 hover:bg-violet-500" },
        { letter: "p", color: "bg-gradient-to-r from-amber-600 to-amber-700 hover:bg-fuchsia-500" },
        { letter: "q", color: "bg-gradient-to-r from-amber-600 to-amber-700 hover:bg-sky-500" },
        { letter: "r", color: "bg-gradient-to-r from-amber-600 to-amber-700 hover:bg-stone-500" },
        { letter: "s", color: "bg-gradient-to-r from-amber-600 to-amber-700 hover:bg-neutral-500" },
        { letter: "t", color: "bg-gradient-to-r from-amber-600 to-amber-700 hover:bg-zinc-500" },
        { letter: "u", color: "bg-gradient-to-r from-amber-600 to-amber-700 hover:bg-slate-500" },
        { letter: "v", color: "bg-gradient-to-r from-amber-600 to-amber-700 hover:bg-gray-500" },
        { letter: "w", color: "bg-gradient-to-r from-amber-600 to-amber-700 hover:bg-red-600" },
        { letter: "x", color: "bg-gradient-to-r from-amber-600 to-amber-700 hover:bg-blue-600" },
        { letter: "y", color: "bg-gradient-to-r from-amber-600 to-amber-700 hover:bg-green-600" },
        { letter: "z", color: "bg-gradient-to-r from-amber-600 to-amber-700 hover:bg-purple-600" },
    ];

    // Números
    const numbers: LetterItem[] = [
        { letter: "0", color: "bg-slate-600 hover:bg-slate-700" },
        { letter: "1", color: "bg-slate-600 hover:bg-slate-700" },
        { letter: "2", color: "bg-slate-600 hover:bg-slate-700" },
        { letter: "3", color: "bg-slate-600 hover:bg-slate-700" },
        { letter: "4", color: "bg-slate-600 hover:bg-slate-700" },
        { letter: "5", color: "bg-slate-600 hover:bg-slate-700" },
        { letter: "6", color: "bg-slate-600 hover:bg-slate-700" },
        { letter: "7", color: "bg-slate-600 hover:bg-slate-700" },
        { letter: "8", color: "bg-slate-600 hover:bg-slate-700" },
        { letter: "9", color: "bg-slate-600 hover:bg-slate-700" },
    ];

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
            console.log('Response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('Progreso data received:', data);
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

    const calculateProgress = (items: LetterItem[]) => {
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
                className="bg-gradient-to-r from-green-500 to-emerald-600 h-full rounded-full transition-all duration-500 ease-out shadow-sm"
                style={{ width: `${percentage}%` }}
            />
        </div>
    );

    const Section = ({ title, items, icon }: { title: string; items: LetterItem[]; icon: string }) => {
        const progress = calculateProgress(items);
        const completedCount = items.filter(item => isCompleted(item.letter)).length;

        return (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <span className="text-3xl">{icon}</span>
                        {title}
                    </h2>
                    <span className="text-sm font-semibold text-gray-600 bg-gray-100 px-4 py-2 rounded-full">
            {completedCount}/{items.length}
          </span>
                </div>

                <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-600">Progreso</span>
                        <span className="text-lg font-bold text-emerald-600">{progress}%</span>
                    </div>
                    <ProgressBar percentage={progress} />
                </div>

                <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-3">
                    {items.map((item) => {
                        const completed = isCompleted(item.letter);
                        return (
                            <div
                                key={item.letter}
                                className={`
                  ${item.color}
                  ${completed ? 'ring-4 ring-green-400 ring-offset-2' : ''}
                  rounded-xl p-4 flex flex-col items-center justify-center
                  transition-all duration-300 transform hover:scale-105 hover:shadow-xl
                  cursor-pointer relative group
                `}
                            >
                <span className="text-white text-2xl font-bold uppercase">
                  {item.letter}
                </span>
                                {completed && (
                                    <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1 shadow-lg">
                                        <CheckCircle className="w-5 h-5 text-white" />
                                    </div>
                                )}
                                {!completed && (
                                    <div className="absolute -top-2 -right-2 bg-gray-300 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Circle className="w-5 h-5 text-white" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen  p-8 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-xl text-white font-medium">Cargando Datos ...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen p-8 flex items-center justify-center">
                <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
                    <UserIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">No has iniciado sesión</h2>
                    <p className="text-gray-600">Por favor, inicia sesión para ver tu progreso</p>
                </div>
            </div>
        );
    }

    // Calcular progreso unificado
    const allItems = [...vowels, ...alphabet, ...numbers];
    const totalProgress = calculateProgress(allItems);
    const totalCompleted = allItems.filter(item => isCompleted(item.letter)).length;
    
    // Progreso por categoría
    const vowelsProgress = calculateProgress(vowels);
    const alphabetProgress = calculateProgress(alphabet);
    const numbersProgress = calculateProgress(numbers);

    return (
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto p-8">
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-extrabold text-white mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                        🤟 Mi Progreso - Lenguaje de Señas
                    </h1>
                    <p className="text-lg text-white">Sigue aprendiendo y completa todos los signos</p>
                </div>

                {/* Progreso Total Unificado */}
                <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8 border border-gray-100">
                    <div className="text-center mb-6">
                        <h2 className="text-3xl font-bold text-gray-800 mb-2">Progreso Total</h2>
                    </div>
                    
                    {/* Círculo de progreso principal */}
                    <div className="flex justify-center mb-8">
                        <div className="relative w-48 h-48">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                {/* Círculo de fondo */}
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    stroke="#e5e7eb"
                                    strokeWidth="8"
                                    fill="none"
                                />
                                {/* Círculo de progreso */}
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    stroke="url(#gradient)"
                                    strokeWidth="8"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeDasharray={`${2 * Math.PI * 45}`}
                                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - totalProgress / 100)}`}
                                    className="transition-all duration-1000 ease-out"
                                />
                                <defs>
                                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#10b981" />
                                        <stop offset="100%" stopColor="#059669" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    <span className="text-4xl font-extrabold text-gray-800">{totalProgress}%</span>
                                    <p className="text-sm text-gray-600 mt-1">Completado</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Estadísticas detalladas */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 text-center">
                            <div className="text-2xl mb-2">🔤</div>
                            <h3 className="font-bold text-gray-800">Vocales</h3>
                            <p className="text-2xl font-bold text-blue-600">{vowelsProgress}%</p>
                            <p className="text-sm text-gray-600">{vowels.filter(v => isCompleted(v.letter)).length}/{vowels.length}</p>
                        </div>
                        <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl p-4 text-center">
                            <div className="text-2xl mb-2">🔡</div>
                            <h3 className="font-bold text-gray-800">Alfabeto</h3>
                            <p className="text-2xl font-bold text-amber-600">{alphabetProgress}%</p>
                            <p className="text-sm text-gray-600">{alphabet.filter(a => isCompleted(a.letter)).length}/{alphabet.length}</p>
                        </div>
                        <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-4 text-center">
                            <div className="text-2xl mb-2">🔢</div>
                            <h3 className="font-bold text-gray-800">Números</h3>
                            <p className="text-2xl font-bold text-slate-600">{numbersProgress}%</p>
                            <p className="text-sm text-gray-600">{numbers.filter(n => isCompleted(n.letter)).length}/{numbers.length}</p>
                        </div>
                    </div>

                    {/* Barra de progreso total */}
                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-lg font-semibold text-gray-700">Progreso General</span>
                            <span className="text-lg font-bold text-emerald-600">{totalCompleted}/{allItems.length} elementos</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                            <div
                                className="bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 h-full rounded-full transition-all duration-1000 ease-out shadow-sm"
                                style={{ width: `${totalProgress}%` }}
                            />
                        </div>
                    </div>

                    {/* Mensaje motivacional */}
                    <div className="text-center mt-6">
                        {totalProgress === 100 ? (
                            <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl p-4">
                                <p className="text-lg font-bold text-green-800">🎉 ¡Felicidades! Has completado todo el contenido</p>
                                <p className="text-green-700">¡Eres un experto en lenguaje de señas!</p>
                            </div>
                        ) : totalProgress >= 75 ? (
                            <div className="bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl p-4">
                                <p className="text-lg font-bold text-blue-800">🚀 ¡Excelente progreso!</p>
                                <p className="text-blue-700">Estás muy cerca de completar todo</p>
                            </div>
                        ) : totalProgress >= 50 ? (
                            <div className="bg-gradient-to-r from-yellow-100 to-amber-100 rounded-xl p-4">
                                <p className="text-lg font-bold text-amber-800">💪 ¡Vas por buen camino!</p>
                                <p className="text-amber-700">Ya tienes la mitad del contenido completado</p>
                            </div>
                        ) : totalProgress >= 25 ? (
                            <div className="bg-gradient-to-r from-orange-100 to-red-100 rounded-xl p-4">
                                <p className="text-lg font-bold text-orange-800">🌟 ¡Buen comienzo!</p>
                                <p className="text-orange-700">Sigue practicando para mejorar tu progreso</p>
                            </div>
                        ) : (
                            <div className="bg-gradient-to-r from-gray-100 to-slate-100 rounded-xl p-4">
                                <p className="text-lg font-bold text-gray-800">🎯 ¡Comienza tu aventura!</p>
                                <p className="text-gray-700">Empieza a practicar para ver tu progreso</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Secciones individuales */}
                <Section title="Vocales" items={vowels} icon="🔤" />
                <Section title="Alfabeto" items={alphabet} icon="🔡" />
                <Section title="Números" items={numbers} icon="🔢" />
            </div>
        </div>
    );
}
