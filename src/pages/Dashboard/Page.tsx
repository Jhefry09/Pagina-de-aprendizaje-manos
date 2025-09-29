import React, { useEffect, useMemo, useState } from 'react';

type ProgresoUsuario = {
    usuarioId: number;
    nombreUsuario: string;
    totalCompletadas: number;
    totalLetras: number;
    porcentajeProgreso: number;
    letrasCompletadas: string[];
};

const SectionCard: React.FC<{
    title: string;
    icon?: string;
    accent?: string;
    children: React.ReactNode;
}> = ({ title, icon = '📊', accent = 'from-blue-400 to-blue-500', children }) => {
    return (
        <section className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
            <div className={`px-5 py-4 bg-gradient-to-r ${accent} text-white font-semibold`}>{icon} {title}</div>
            <div className="p-5">{children}</div>
        </section>
    );
};

const Field: React.FC<{
    label: string;
    children: React.ReactNode;
}> = ({ label, children }) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
        {children}
    </div>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input
        {...props}
        className={`w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-sm ${props.className || ''}`}
    />
);

const Button: React.FC<{
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'success' | 'danger';
    onClick?: () => void;
    disabled?: boolean;
}> = ({ children, variant = 'primary', onClick, disabled }) => {
    const styles = {
        primary: 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600',
        secondary: 'bg-gradient-to-r from-gray-500 to-slate-600 hover:from-gray-600 hover:to-slate-700',
        success: 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600',
        danger: 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700',
    } as const;
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`inline-flex items-center justify-center px-4 py-2 rounded-lg text-white text-sm font-medium shadow-sm transition-transform active:scale-[0.98] mr-2 mb-2 disabled:opacity-60 disabled:cursor-not-allowed ${styles[variant]}`}
        >
            {children}
        </button>
    );
};

const Badge: React.FC<{ completed?: boolean; children: React.ReactNode }> = ({ completed = false, children }) => (
    <span className={`inline-flex items-center justify-center px-3 py-2 rounded-lg font-semibold text-sm ${completed ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white' : 'bg-gray-50 text-gray-600 border-2 border-dashed border-gray-200'}`}>
    {children}
  </span>
);

const DashboardPage: React.FC = () => {
    // Estados por sección
    const [usuarioId1, setUsuarioId1] = useState<number>(1);
    const [usuarioId2, setUsuarioId2] = useState<number>(1);
    const [usuarioId3, setUsuarioId3] = useState<number>(1);
    const [usuarioId4, setUsuarioId4] = useState<number>(1);
    const [usuarioIdSim, setUsuarioIdSim] = useState<number>(1);
    const [vocalId, setVocalId] = useState<number>(1);
    const [vocalId3, setVocalId3] = useState<number>(1);

    const [loading1, setLoading1] = useState(false);
    const [loading2, setLoading2] = useState(false);
    const [loading3, setLoading3] = useState(false);
    const [loading4, setLoading4] = useState(false);
    const [loadingSim, setLoadingSim] = useState(false);

    const [resp1, setResp1] = useState<React.ReactNode>(null);
    const [resp2, setResp2] = useState<React.ReactNode>(null);
    const [resp3, setResp3] = useState<React.ReactNode>(null);
    const [resp4, setResp4] = useState<React.ReactNode>(null);
    const [respSim, setRespSim] = useState<React.ReactNode>(null);

    const endpoints = useMemo(() => ({
        progresoUsuario: (id: number) => `/api/progreso/usuario/${id}`,
        letrasCompletadas: (id: number) => `/api/progreso/letras/${id}`,
        completar: () => `/api/progreso/completar`,
        verificar: (usuario: number, vocal: number) => `/api/progreso/verificar/${usuario}/${vocal}`,
        reiniciar: (id: number) => `/api/progreso/reiniciar/${id}`,
    }), []);

    async function makeRequest<T>(url: string, method: 'GET' | 'POST' | 'PUT' = 'GET', body?: unknown): Promise<T> {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(body) : undefined,
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) return response.json();
        // @ts-expect-error allow text as any
        return response.text();
    }

    // 1. Obtener progreso completo
    const obtenerProgreso = async () => {
        setLoading1(true);
        try {
            const url = endpoints.progresoUsuario(usuarioId1);
            const data = await makeRequest<ProgresoUsuario>(url);
            const porcentaje = data.porcentajeProgreso ?? 0;
            setResp1(
                <div>
                    <div className="text-xs font-mono bg-gray-50 border rounded px-3 py-2 mb-3">GET: {url}</div>
                    <div className="text-sm text-gray-700 space-y-2">
                        <div><strong>👤 Usuario:</strong> {data.nombreUsuario} (ID: {data.usuarioId})</div>
                        <div><strong>📈 Progreso:</strong> {data.totalCompletadas}/{data.totalLetras} letras</div>
                        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 text-[10px] text-white text-center font-bold flex items-center justify-center"
                                 style={{ width: `${porcentaje}%` }}>
                                {porcentaje}%
                            </div>
                        </div>
                        <div className="mt-2"><strong>✅ Letras:</strong></div>
                        <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-2 mt-2">
                            {(data.letrasCompletadas || []).map((l) => (
                                <Badge key={l} completed>{l}</Badge>
                            ))}
                        </div>
                        <details className="mt-3">
                            <summary className="cursor-pointer text-indigo-600">Ver JSON completo</summary>
                            <pre className="mt-2 bg-gray-50 p-3 rounded text-xs overflow-auto">{JSON.stringify(data, null, 2)}</pre>
                        </details>
                    </div>
                </div>
            );
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Error desconocido';
            setResp1(
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded">
                    <div className="text-xs font-mono bg-white border rounded px-3 py-2 mb-2">GET: {endpoints.progresoUsuario(usuarioId1)}</div>
                    <strong>❌ Error:</strong> {message}
                </div>
            );
        } finally { setLoading1(false); }
    };

    // 2. Obtener solo letras
    const obtenerLetrasCompletadas = async () => {
        setLoading1(true);
        try {
            const url = endpoints.letrasCompletadas(usuarioId1);
            const data = await makeRequest<string[]>(url);
            setResp1(
                <div>
                    <div className="text-xs font-mono bg-gray-50 border rounded px-3 py-2 mb-3">GET: {url}</div>
                    <div className="text-sm text-gray-700 space-y-2">
                        <div><strong>📝 Letras Completadas:</strong> [{data.join(', ')}]</div>
                        <div><strong>📊 Total:</strong> {data.length} letras</div>
                        <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-2 mt-2">
                            {data.map((l) => (<Badge key={l} completed>{l}</Badge>))}
                        </div>
                        <details className="mt-3">
                            <summary className="cursor-pointer text-indigo-600">Ver JSON completo</summary>
                            <pre className="mt-2 bg-gray-50 p-3 rounded text-xs overflow-auto">{JSON.stringify(data, null, 2)}</pre>
                        </details>
                    </div>
                </div>
            );
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Error desconocido';
            setResp1(
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded">
                    <div className="text-xs font-mono bg-white border rounded px-3 py-2 mb-2">GET: {endpoints.letrasCompletadas(usuarioId1)}</div>
                    <strong>❌ Error:</strong> {message}
                </div>
            );
        } finally { setLoading1(false); }
    };

    // 3. Completar letra
    const completarLetra = async () => {
        setLoading2(true);
        const url = endpoints.completar();
        const body = { usuarioId: usuarioId2, vocalId };
        try {
            // eslint-disable-next-line
            const data = await makeRequest<any>(url, 'POST', body);
            setResp2(
                <div>
                    <div className="text-xs font-mono bg-gray-50 border rounded px-3 py-2 mb-2">POST: {url}</div>
                    <div className="text-xs font-mono bg-gray-50 border rounded px-3 py-2 mb-3">Body: {JSON.stringify(body)}</div>
                    <div className="text-sm text-gray-700 space-y-2">
                        <div><strong>✅ ¡Letra Completada!</strong></div>
                        <div><strong>👤 Usuario:</strong> {data.nombreUsuario} (ID: {data.usuarioId})</div>
                        <div><strong>🔤 Vocal:</strong> {data.vocal} (ID: {data.vocalId})</div>
                        <div><strong>📊 Estado:</strong> <Badge completed>{data.estado}</Badge></div>
                        <details className="mt-3">
                            <summary className="cursor-pointer text-indigo-600">Ver JSON completo</summary>
                            <pre className="mt-2 bg-gray-50 p-3 rounded text-xs overflow-auto">{JSON.stringify(data, null, 2)}</pre>
                        </details>
                    </div>
                </div>
            );
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Error desconocido';
            setResp2(
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded">
                    <div className="text-xs font-mono bg-white border rounded px-3 py-2 mb-2">POST: {url}</div>
                    <div className="text-xs font-mono bg-white border rounded px-3 py-2 mb-2">Body: {JSON.stringify(body)}</div>
                    <strong>❌ Error:</strong> {message}
                </div>
            );
        } finally { setLoading2(false); }
    };

    // 4. Verificar letra específica
    const verificarLetra = async () => {
        setLoading3(true);
        const url = endpoints.verificar(usuarioId3, vocalId3);
        try {
            const data = await makeRequest<boolean>(url);
            setResp3(
                <div>
                    <div className="text-xs font-mono bg-gray-50 border rounded px-3 py-2 mb-3">GET: {url}</div>
                    <div className="flex items-center justify-center my-3">
                        <Badge completed={data}>{data ? '✅ COMPLETADA' : '⏳ PENDIENTE'}</Badge>
                    </div>
                    <div className="text-sm text-gray-700 space-y-1">
                        <div><strong>📊 Resultado:</strong> {String(data)}</div>
                        <div><strong>👤 Usuario ID:</strong> {usuarioId3}</div>
                        <div><strong>🔤 Vocal ID:</strong> {vocalId3}</div>
                    </div>
                </div>
            );
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Error desconocido';
            setResp3(
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded">
                    <div className="text-xs font-mono bg-white border rounded px-3 py-2 mb-2">GET: {url}</div>
                    <strong>❌ Error:</strong> {message}
                </div>
            );
        } finally { setLoading3(false); }
    };

    // 5. Reiniciar progreso
    const reiniciarProgreso = async () => {
        if (!confirm('¿Reiniciar todo el progreso del usuario?')) return;
        setLoading4(true);
        const url = endpoints.reiniciar(usuarioId4);
        try {
            await makeRequest<void>(url, 'PUT');
            setResp4(
                <div>
                    <div className="text-xs font-mono bg-gray-50 border rounded px-3 py-2 mb-3">PUT: {url}</div>
                    <div className="text-sm text-gray-700 space-y-2">
                        <div><strong>🔄 ¡Progreso Reiniciado Exitosamente!</strong></div>
                        <div><strong>👤 Usuario ID:</strong> {usuarioId4}</div>
                        <div><strong>📊 Estado:</strong> Todas las letras marcadas como NO_COMPLETADO</div>
                        <div className="flex items-center justify-center mt-2">
                            <Badge>✨ PROGRESO LIMPIO</Badge>
                        </div>
                    </div>
                </div>
            );
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Error desconocido';
            setResp4(
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded">
                    <div className="text-xs font-mono bg-white border rounded px-3 py-2 mb-2">PUT: {url}</div>
                    <strong>❌ Error:</strong> {message}
                </div>
            );
        } finally { setLoading4(false); }
    };

    // 6. Simulador completo
    const simularFlujoCompleto = async () => {
        setLoadingSim(true);
        let html: React.ReactNode = <p>🎬 Iniciando simulación...</p>;
        setRespSim(html);
        const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
        try {
            html = <>{html}<p>📊 1. Obteniendo progreso inicial...</p></>;
            setRespSim(html);
            const progresoInicial = await makeRequest<ProgresoUsuario>(endpoints.progresoUsuario(usuarioIdSim));
            html = <>{html}<p>✅ Progreso inicial: {progresoInicial.totalCompletadas}/{progresoInicial.totalLetras} letras</p></>;
            setRespSim(html);
            await sleep(500);

            html = <>{html}<p>🔤 2. Completando letras (IDs: 1, 2, 3)...</p></>;
            setRespSim(html);
            for (let id = 1; id <= 3; id++) {
                try {
                    // eslint-disable-next-line
                    const resultado = await makeRequest<any>(endpoints.completar(), 'POST', { usuarioId: usuarioIdSim, vocalId: id });
                    html = <>{html}<p>✅ Letra {resultado.vocal} completada</p></>;
                    setRespSim(html);
                    await sleep(400);
                } catch (err) {
                    const msg = err instanceof Error ? err.message : String(err);
                    html = <>{html}<p>⚠️ Error completando vocal ID {id}: {msg}</p></>;
                    setRespSim(html);
                }
            }

            html = <>{html}<p>📈 3. Obteniendo progreso actualizado...</p></>;
            setRespSim(html);
            const progresoFinal = await makeRequest<ProgresoUsuario>(endpoints.progresoUsuario(usuarioIdSim));
            html = (
                <>
                    {html}
                    <div className="mt-3 bg-green-50 border border-green-200 text-green-800 p-3 rounded">
                        <h4 className="font-semibold mb-1">🎉 ¡Simulación Completada!</h4>
                        <p><strong>👤 Usuario:</strong> {progresoFinal.nombreUsuario}</p>
                        <p><strong>📊 Progreso Final:</strong> {progresoFinal.totalCompletadas}/{progresoFinal.totalLetras} letras</p>
                        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden my-2">
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 text-[10px] text-white text-center font-bold flex items-center justify-center" style={{ width: `${progresoFinal.porcentajeProgreso}%` }}>
                                {progresoFinal.porcentajeProgreso}%
                            </div>
                        </div>
                        <p className="mt-2"><strong>✅ Letras Completadas:</strong></p>
                        <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-2 mt-2">
                            {(progresoFinal.letrasCompletadas || []).map((l) => (<Badge key={l} completed>{l}</Badge>))}
                        </div>
                    </div>
                </>
            );
            setRespSim(html);
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Error desconocido';
            setRespSim(
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded">
                    <strong>❌ Error en la simulación:</strong> {message}
                </div>
            );
        } finally { setLoadingSim(false); }
    };

    useEffect(() => {
        const timeout = setTimeout(() => { obtenerProgreso(); }, 600);
        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="min-h-screen">
            <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 w-full">
                {/* Hero */}
                <section className="bg-white/95 backdrop-blur-sm py-8 sm:py-12 mb-8 sm:mb-12 rounded-2xl shadow-2xl border border-white/20 mx-2 sm:mx-0">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <div className="flex items-center justify-center space-x-2 mb-4 sm:mb-6">
                            <span className="text-2xl">📈</span>
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                                Dashboard de Progreso
                            </h1>
                        </div>
                        <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
                            Visualiza y administra el progreso de aprendizaje del alfabeto en lengua de señas.
                        </p>
                    </div>
                </section>

                {/* Grid 2 cols */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <SectionCard title="Obtener Progreso del Usuario" icon="🧾">
                        <Field label="ID del Usuario">
                            <Input type="number" min={1} value={usuarioId1} onChange={(e) => setUsuarioId1(Number(e.target.value))} />
                        </Field>
                        <div className="flex flex-wrap">
                            <Button onClick={obtenerProgreso}>📊 Obtener Progreso Completo</Button>
                            <Button variant="secondary" onClick={obtenerLetrasCompletadas}>📝 Solo Letras Completadas</Button>
                        </div>
                        <div className="mt-4">
                            <div className="font-semibold mb-2">Resultado:</div>
                            {loading1 ? <div className="text-center text-sm text-gray-500">⏳ Cargando...</div> : resp1}
                        </div>
                    </SectionCard>

                    <SectionCard title="Completar Letra" icon="✅" accent="from-emerald-400 to-teal-500">
                        <Field label="ID del Usuario">
                            <Input type="number" min={1} value={usuarioId2} onChange={(e) => setUsuarioId2(Number(e.target.value))} />
                        </Field>
                        <Field label="ID de la Vocal">
                            <Input type="number" min={1} value={vocalId} onChange={(e) => setVocalId(Number(e.target.value))} />
                        </Field>
                        <Button variant="success" onClick={completarLetra}>✅ Completar Letra</Button>
                        <div className="mt-4">
                            <div className="font-semibold mb-2">Resultado:</div>
                            {loading2 ? <div className="text-center text-sm text-gray-500">⏳ Cargando...</div> : resp2}
                        </div>
                    </SectionCard>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <SectionCard title="Verificar Letra Específica" icon="🔍" accent="from-slate-400 to-slate-500">
                        <Field label="ID del Usuario">
                            <Input type="number" min={1} value={usuarioId3} onChange={(e) => setUsuarioId3(Number(e.target.value))} />
                        </Field>
                        <Field label="ID de la Vocal">
                            <Input type="number" min={1} value={vocalId3} onChange={(e) => setVocalId3(Number(e.target.value))} />
                        </Field>
                        <Button variant="secondary" onClick={verificarLetra}>🔍 Verificar Letra</Button>
                        <div className="mt-4">
                            <div className="font-semibold mb-2">Resultado:</div>
                            {loading3 ? <div className="text-center text-sm text-gray-500">⏳ Cargando...</div> : resp3}
                        </div>
                    </SectionCard>

                    <SectionCard title="Reiniciar Progreso" icon="🔄" accent="from-rose-400 to-pink-500">
                        <Field label="ID del Usuario">
                            <Input type="number" min={1} value={usuarioId4} onChange={(e) => setUsuarioId4(Number(e.target.value))} />
                        </Field>
                        <Button variant="danger" onClick={reiniciarProgreso}>🔄 Reiniciar Progreso</Button>
                        <div className="mt-4">
                            <div className="font-semibold mb-2">Resultado:</div>
                            {loading4 ? <div className="text-center text-sm text-gray-500">⏳ Cargando...</div> : resp4}
                        </div>
                    </SectionCard>
                </div>

                {/* Simulador */}
                <div className="mb-10">
                    <SectionCard title="🎮 Simulador Completo" icon="🚀" accent="from-fuchsia-400 to-orange-400">
                        <p className="text-sm text-gray-600 mb-4">Simula el flujo completo: obtiene progreso inicial → completa algunas letras → muestra progreso actualizado.</p>
                        <Field label="ID del Usuario para Simulación">
                            <Input type="number" min={1} value={usuarioIdSim} onChange={(e) => setUsuarioIdSim(Number(e.target.value))} />
                        </Field>
                        <Button onClick={simularFlujoCompleto}>
                            🚀 Ejecutar Simulación Completa
                        </Button>
                        <div className="mt-4">
                            <div className="font-semibold mb-2">Simulación en Progreso:</div>
                            {loadingSim ? <div className="text-center text-sm text-gray-500">⏳ Cargando...</div> : respSim}
                        </div>
                    </SectionCard>
                </div>
            </main>
        </div>
    );
};

export default DashboardPage;