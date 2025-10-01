import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface VocalData {
    vocal: string;
    contadorModificaciones: number;
}

interface ChartData {
    vocal: string;
    entrenamientos: number;
}


const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
        return (
            <div className="bg-white border border-gray-300 rounded-lg p-3 shadow-lg">
                <p className="text-blue-800 font-semibold">{payload[0]?.payload?.vocal}</p>
                <p className="text-gray-700">{payload[0]?.value} entrenamientos</p>
            </div>
        );
    }
    return null;
};

const VocalStatistics = () => {
    const [vocalesData, setVocalesData] = useState<VocalData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
            , vocalesData[0])
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

    // Datos de fallback para cuando no hay datos reales
    const datosFallback = [
        { vocal: 'A', entrenamientos: 24 },
        { vocal: 'E', entrenamientos: 18 },
        { vocal: 'I', entrenamientos: 15 },
        { vocal: 'O', entrenamientos: 12 },
        { vocal: 'U', entrenamientos: 8 },
        { vocal: 'B', entrenamientos: 6 },
        { vocal: 'C', entrenamientos: 4 },
        { vocal: 'D', entrenamientos: 3 },
        { vocal: 'F', entrenamientos: 2 },
        { vocal: 'G', entrenamientos: 1 }
    ];

    const stats = calcularEstadisticas();
    const datosGrafico = prepararDatosGrafico();
    
    // Usar los mismos datos que los otros gráficos, pero ordenados para el ranking
    const datosRanking = datosGrafico.length > 0 
        ? [...datosGrafico].sort((a, b) => b.entrenamientos - a.entrenamientos).slice(0, 10)
        : datosFallback;

    // Debug: Log para ver qué datos se están usando
    console.log('Datos para ranking:', datosRanking);
    console.log('Vocales ordenadas:', vocalesOrdenadas);
    console.log('Usando fallback:', datosRanking === datosFallback);


    if (loading && vocalesData.length === 0) {
        return (
            <div className="min-h-screen p-8 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-xl text-white font-medium">Cargando datos...</p>
                </div>
            </div>
        );
    }

    return (
        <section className="p-5 w-full">
            <div className="max-w-6xl mx-auto">
                {/* Header Compacto */}
                <div className="bg-gray-200 bg-opacity-70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-4 mb-5">
                    <h1 className="text-2xl font-bold text-gray-800 text-center">
                        Estadísticas de Entrenamientos
                    </h1>
                    <p className="text-base text-gray-600 text-center mt-1">
                        Visualización del progreso de entrenamiento
                    </p>
                </div>

                {error && (
                    <div className="bg-red-500 border border-red-400 text-red-200 p-4 rounded-xl mb-5">
                        {error}
                    </div>
                )}

                {/* Stats Overview - Contenedores Fijos */}
                <div className="grid grid-cols-4 gap-4 mb-5">
                    <div className="bg-gray-200 bg-opacity-70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-4 text-center">
                        <div className="text-2xl font-bold text-gray-800 mb-1">{stats.totalVocales}</div>
                        <div className="text-sm text-gray-600 font-medium">Letras Registradas</div>
                    </div>
                    <div className="bg-gray-200 bg-opacity-70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-4 text-center">
                        <div className="text-2xl font-bold text-gray-800 mb-1">{stats.totalEntrenamientos}</div>
                        <div className="text-sm text-gray-600 font-medium">Total Entrenamientos</div>
                    </div>
                    <div className="bg-gray-200 bg-opacity-70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-4 text-center">
                        <div className="text-2xl font-bold text-gray-800 mb-1">{stats.promedioEntrenamientos}</div>
                        <div className="text-sm text-gray-600 font-medium">Promedio por Letra</div>
                    </div>
                    <div className="bg-gray-200 bg-opacity-70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-4 text-center">
                        <div className="text-2xl font-bold text-gray-800 mb-1">{stats.vocalMasEntrenada.vocal || '-'}</div>
                        <div className="text-sm text-gray-600 font-medium">Más Entrenada</div>
                    </div>
                </div>

                {/* Charts Grid - Layout Fijo con 3 Gráficos */}
                <div className="grid grid-cols-2 gap-5 mb-5">
                    {/* Gráfico 1: Ranking de Entrenamientos (antes Tendencia) */}
                    <div className="bg-gray-200 bg-opacity-70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">
                            Ranking de Entrenamientos
                            {datosGrafico.length === 0 && (
                                <span className="text-xs text-gray-500 block mt-1">(Datos de ejemplo)</span>
                            )}
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={datosRanking}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="vocal" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="entrenamientos" fill="#DC2626" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Gráfico 2: Progreso de Aprendizaje (Tercer gráfico que ocupa el segundo espacio) */}
                    <div className="bg-gray-200 bg-opacity-70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">
                            Progreso de Aprendizaje
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={datosGrafico} margin={{ top: 20, right: 20, left: 20, bottom: 40 }}>
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
                                    style={{ fontSize: '12px', fontWeight: 600 }}
                                    angle={-45}
                                    textAnchor="end"
                                    height={60}
                                />
                                <YAxis stroke="#374151" style={{ fontSize: '12px' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Line
                                    type="monotone"
                                    dataKey="entrenamientos"
                                    stroke="url(#colorLine)"
                                    strokeWidth={3}
                                    dot={{ fill: '#1E40AF', strokeWidth: 2, r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Gráfico 3: Distribución de Entrenamientos (Tercer gráfico en fila completa) */}
                <div className="bg-gray-200 bg-opacity-70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-4 mb-5">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">
                        Distribución de Entrenamientos
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={datosGrafico} margin={{ top: 20, right: 20, left: 20, bottom: 40 }}>
                            <defs>
                                <linearGradient id="colorDistribution" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10B981" stopOpacity={1}/>
                                    <stop offset="100%" stopColor="#059669" stopOpacity={1}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                            <XAxis
                                dataKey="vocal"
                                stroke="#374151"
                                style={{ fontSize: '12px', fontWeight: 600 }}
                                angle={-45}
                                textAnchor="end"
                                height={60}
                            />
                            <YAxis stroke="#374151" style={{ fontSize: '12px' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="entrenamientos" fill="url(#colorDistribution)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Vocal Details Grid - Compacto */}
                <div className="bg-gray-200 bg-opacity-70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">Detalle por Letra</h3>
                    <div className="grid grid-cols-10 gap-3">
                        {vocalesOrdenadas.map((vocal) => (
                            <div
                                key={vocal.vocal}
                                className="sign-card !w-auto !h-auto min-w-[60px] min-h-[80px] transition-all duration-300"
                            >
                                <div className="sign-letter text-base font-bold mb-1">{vocal.vocal}</div>
                                <div className="text-sm text-gray-700 font-medium">{vocal.contadorModificaciones || 0}</div>
                                <div className="text-xs text-gray-500">entrenamientos</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default VocalStatistics;