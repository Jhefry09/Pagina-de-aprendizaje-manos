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
                    <p className="text-xl text-white font-medium">Cargando progreso...</p>
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

    const totalProgress = calculateProgress([...vowels, ...alphabet, ...numbers]);

    return (
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto p-8">
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-extrabold text-white mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                        🤟 Mi Progreso - Lenguaje de Señas
                    </h1>
                    <p className="text-lg text-white">Sigue aprendiendo y completa todos los signos</p>

                    <div className="mt-6 bg-white rounded-2xl shadow-lg p-6  mx-auto">
                        <h3 className="text-lg font-bold text-gray-800 mb-3">Progreso Total</h3>
                        <div className="mb-2">
                            <span className="text-4xl font-extrabold text-indigo-600">{totalProgress}%</span>
                        </div>
                        <ProgressBar percentage={totalProgress} />
                        <p className="text-sm text-gray-600 mt-3">
                            {completedLetters.length} de {vowels.length + alphabet.length + numbers.length} completados
                        </p>
                    </div>
                </div>

                <Section title="Vocales" items={vowels} icon="🔤" />
                <Section title="Alfabeto" items={alphabet} icon="🔡" />
                <Section title="Números" items={numbers} icon="🔢" />
            </div>
        </div>
    );
}
