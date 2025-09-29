import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RefreshCw, BarChart3, TrendingUp } from 'lucide-react';

interface VocalData {
    vocal: string;
    contadorModificaciones: number;
}

interface ChartData {
    vocal: string;
    entrenamientos: number;
}

const VocalStatistics = () => {
    const [vocalesData, setVocalesData] = useState<VocalData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentView, setCurrentView] = useState<'barras' | 'linea'>('barras');

    const API_BASE = '/api/vocales';

    useEffect(() => {
        cargarDatos();
        const interval = setInterval(cargarDatos, 30000);
        return () => clearInterval(interval);
    }, []);

    const cargarDatos = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(API_BASE);

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            setVocalesData(data);
        } catch (err) {
            console.error('Error al cargar datos:', err);
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            setError(`Error al cargar datos: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const calcularEstadisticas = () => {
        const totalVocales = vocalesData.length;
        const totalEntrenamientos = vocalesData.reduce((sum, vocal) => sum + (vocal.contadorModificaciones || 0), 0);
        const promedioEntrenamientos = totalVocales > 0 ? Math.round(totalEntrenamientos / totalVocales) : 0;
        const vocalMasEntrenada = vocalesData.length > 0 
            ? vocalesData.reduce((max, vocal) =>
                (vocal.contadorModificaciones || 0) > (max.contadorModificaciones || 0) ? vocal : max
            )
            : { vocal: '', contadorModificaciones: 0 };

        return { totalVocales, totalEntrenamientos, promedioEntrenamientos, vocalMasEntrenada };
    };

    const prepararDatosGrafico = (): ChartData[] => {
        return vocalesData.map(vocal => ({
            vocal: vocal.vocal,
            entrenamientos: vocal.contadorModificaciones || 0
        }));
    };

    const vocalesOrdenadas = [...vocalesData].sort((a, b) =>
        (b.contadorModificaciones || 0) - (a.contadorModificaciones || 0)
    );

    const stats = calcularEstadisticas();
    const datosGrafico = prepararDatosGrafico();

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white border border-gray-300 rounded-lg p-3 shadow-lg">
                    <p className="text-blue-800 font-semibold">{payload[0].payload.vocal}</p>
                    <p className="text-gray-700">{payload[0].value} entrenamientos</p>
                </div>
            );
        }
        return null;
    };

    if (loading && vocalesData.length === 0) {
        return (
            <div className="min-h-screen">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-gray-200 bg-opacity-70 backdrop-blur-sm rounded-3xl border border-gray-300 shadow-lg overflow-hidden">
                        <div className="flex items-center justify-center h-96">
                            <div className="text-center">
                                <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-800 mb-4"></div>
                                <p className="text-blue-800 text-xl font-semibold">Cargando datos de entrenamientos...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen ">
            <div className="max-w-7xl mx-auto p-6">
                <div className="bg-gray-200 bg-opacity-70 backdrop-blur-sm rounded-3xl shadow-lg overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-amber-600 to-amber-700 p-10">
                        <div className="text-center">
                            <h1 className="text-5xl font-bold text-white mb-3 tracking-tight">
                                Estadísticas de Entrenamientos
                            </h1>
                            <p className="text-xl text-white">Visualización del progreso de entrenamiento</p>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-10">
                        {/* Controls */}
                        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                            <button
                                onClick={cargarDatos}
                                disabled={loading}
                                className="bg-blue-800 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
                            >
                                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                                Actualizar Datos
                            </button>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setCurrentView('barras')}
                                    className={`px-5 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${
                                        currentView === 'barras'
                                            ? 'bg-red-400 hover:bg-red-500 text-white shadow-lg'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border border-gray-300'
                                    }`}
                                >
                                    <BarChart3 className="w-4 h-4" />
                                    Barras
                                </button>
                                <button
                                    onClick={() => setCurrentView('linea')}
                                    className={`px-5 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${
                                        currentView === 'linea'
                                            ? 'bg-red-400 hover:bg-red-500 text-white shadow-lg'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border border-gray-300'
                                    }`}
                                >
                                    <TrendingUp className="w-4 h-4" />
                                    Línea
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500 border border-red-400 text-red-200 p-5 rounded-xl mb-8">
                                {error}
                            </div>
                        )}

                        {/* Stats Overview */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                            <div className="bg-blue-800 rounded-2xl p-6 shadow-lg transition-all duration-300 hover:-translate-y-1">
                                <div className="text-4xl font-bold text-white mb-2">{stats.totalVocales}</div>
                                <div className="text-blue-200 font-medium">Letras Registradas</div>
                            </div>
                            <div className="bg-gradient-to-br from-amber-600 to-amber-700 rounded-2xl p-6 shadow-lg transition-all duration-300 hover:-translate-y-1">
                                <div className="text-4xl font-bold text-white mb-2">{stats.totalEntrenamientos}</div>
                                <div className="text-white font-medium">Total Entrenamientos</div>
                            </div>
                            <div className="bg-red-400 rounded-2xl p-6 shadow-lg transition-all duration-300 hover:-translate-y-1">
                                <div className="text-4xl font-bold text-white mb-2">{stats.promedioEntrenamientos}</div>
                                <div className="text-red-200 font-medium">Promedio por Letra</div>
                            </div>
                            <div className="bg-gray-800 rounded-2xl p-6 shadow-lg transition-all duration-300 hover:-translate-y-1">
                                <div className="text-4xl font-bold text-white mb-2">{stats.vocalMasEntrenada.vocal || '-'}</div>
                                <div className="text-gray-200 font-medium">Más Entrenada</div>
                            </div>
                        </div>

                        {/* Charts - Vertical Layout */}
                        <div className="space-y-10">
                            {/* Main Chart - Bar/Line Toggle */}
                            <div className="bg-white rounded-2xl p-8 border border-gray-300 shadow-lg">
                                <h3 className="text-3xl font-semibold text-gray-800 mb-8 text-center">
                                    Entrenamientos por Letra
                                </h3>
                                <ResponsiveContainer width="100%" height={500}>
                                    {currentView === 'barras' ? (
                                        <BarChart data={datosGrafico} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                            <defs>
                                                <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#1E40AF" stopOpacity={1}/>
                                                    <stop offset="100%" stopColor="#D97706" stopOpacity={1}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                            <XAxis 
                                                dataKey="vocal" 
                                                stroke="#374151" 
                                                style={{ fontSize: '16px', fontWeight: 600 }}
                                                angle={-45}
                                                textAnchor="end"
                                                height={80}
                                            />
                                            <YAxis stroke="#374151" style={{ fontSize: '16px' }} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Bar dataKey="entrenamientos" fill="url(#colorBar)" radius={[8, 8, 0, 0]} />
                                        </BarChart>
                                    ) : (
                                        <LineChart data={datosGrafico} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                            <defs>
                                                <linearGradient id="colorLine" x1="0" y1="0" x2="1" y2="0">
                                                    <stop offset="0%" stopColor="#1E40AF" />
                                                    <stop offset="100%" stopColor="#F87171" />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                            <XAxis 
                                                dataKey="vocal" 
                                                stroke="#374151" 
                                                style={{ fontSize: '16px', fontWeight: 600 }}
                                                angle={-45}
                                                textAnchor="end"
                                                height={80}
                                            />
                                            <YAxis stroke="#374151" style={{ fontSize: '16px' }} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Line
                                                type="monotone"
                                                dataKey="entrenamientos"
                                                stroke="url(#colorLine)"
                                                strokeWidth={4}
                                                dot={{ fill: '#1E40AF', strokeWidth: 2, r: 6 }}
                                                activeDot={{ r: 8 }}
                                            />
                                        </LineChart>
                                    )}
                                </ResponsiveContainer>
                            </div>

                            {/* Ranking Chart - Horizontal Bars */}
                            <div className="bg-white rounded-2xl p-8 border border-gray-300 shadow-lg">
                                <h3 className="text-3xl font-semibold text-gray-800 mb-8 text-center">
                                    Ranking de Entrenamientos
                                </h3>
                                <ResponsiveContainer width="100%" height={500}>
                                    <BarChart 
                                        data={vocalesOrdenadas.map(v => ({ vocal: v.vocal, entrenamientos: v.contadorModificaciones || 0 }))} 
                                        layout="vertical"
                                        margin={{ top: 20, right: 30, left: 80, bottom: 20 }}
                                    >
                                        <defs>
                                            <linearGradient id="colorRanking" x1="0" y1="0" x2="1" y2="0">
                                                <stop offset="0%" stopColor="#F87171" stopOpacity={1}/>
                                                <stop offset="100%" stopColor="#D97706" stopOpacity={1}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                        <XAxis type="number" stroke="#374151" style={{ fontSize: '16px' }} />
                                        <YAxis 
                                            type="category" 
                                            dataKey="vocal" 
                                            stroke="#374151" 
                                            style={{ fontSize: '16px', fontWeight: 600 }} 
                                            width={80} 
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="entrenamientos" fill="url(#colorRanking)" radius={[0, 8, 8, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Detail Grid Chart */}
                            <div className="bg-white rounded-2xl p-8 border border-gray-300 shadow-lg">
                                <h3 className="text-3xl font-semibold text-gray-800 mb-8 text-center">
                                    Detalle Completo por Letra
                                </h3>
                                <ResponsiveContainer width="100%" height={400}>
                                    <BarChart data={datosGrafico} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                        <defs>
                                            <linearGradient id="colorDetail" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#D97706" stopOpacity={1}/>
                                                <stop offset="100%" stopColor="#B45309" stopOpacity={1}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                        <XAxis 
                                            dataKey="vocal" 
                                            stroke="#374151" 
                                            style={{ fontSize: '14px', fontWeight: 600 }}
                                            angle={-45}
                                            textAnchor="end"
                                            height={80}
                                        />
                                        <YAxis stroke="#374151" style={{ fontSize: '14px' }} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="entrenamientos" fill="url(#colorDetail)" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Vocal Details Grid */}
                        <div className="bg-white rounded-2xl p-8 border border-gray-300 shadow-lg mt-10">
                            <h3 className="text-3xl font-semibold text-gray-800 mb-8 text-center">🔍 Detalle por Letra</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                                {vocalesOrdenadas.map((vocal) => (
                                    <div
                                        key={vocal.vocal}
                                        className="bg-gray-200 rounded-xl p-5 text-center border border-gray-300 hover:border-blue-800 hover:bg-blue-50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                                    >
                                        <div className="text-3md font-bold text-gray-800 mb-2">{vocal.vocal}</div>
                                        <div className="text-lg text-gray-700">{vocal.contadorModificaciones || 0}</div>
                                        <div className="text-sm text-gray-600">entrenado</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VocalStatistics;