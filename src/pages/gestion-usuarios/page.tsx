import { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { useAuthLogic } from '../../hooks/useAuthLogic';

// Tipos TypeScript
interface Usuario {
    id: number;
    nombre: string;
    rol: 'ADMIN' | 'USUARIO';
}


const UserManagement = () => {
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuthLogic();

    const API_BASE = '/usuarios';

    useEffect(() => {
        cargarUsuarios();
    }, []);

    const cargarUsuarios = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE}/embeddings`);

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            setUsuarios(data);

        } catch (err) {
            console.error('Error al cargar usuarios:', err);
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            setError(`Error al cargar usuarios: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const cambiarRol = async (usuarioId: number, nuevoRol: string): Promise<boolean> => {
        if (!confirm(`¿Estás seguro de cambiar el rol a ${nuevoRol}?`)) {
            return false;
        }

        try {
            const response = await fetch(`${API_BASE}/${usuarioId}/rol?nuevoRol=${nuevoRol}`, {
                method: 'PUT'
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const resultado = await response.json();

            if (resultado.nombre && !resultado.nombre.startsWith('ERROR:')) {
                cargarUsuarios();
                alert(`✅ Rol cambiado exitosamente a ${nuevoRol}`);
                return true;
            } else {
                throw new Error(resultado.nombre || 'Error desconocido');
            }

        } catch (err) {
            console.error('Error al cambiar rol:', err);
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            alert(`❌ Error al cambiar rol: ${errorMessage}`);
            return false;
        }
    };

    const eliminarUsuario = async (usuarioId: number, nombreUsuario: string): Promise<void> => {
        if (!confirm(`¿Estás seguro de eliminar al usuario "${nombreUsuario}"?\n\nEsta acción no se puede deshacer.`)) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/${usuarioId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const resultado = await response.json();

            if (resultado.status === 'ok') {
                alert(`✅ Usuario "${nombreUsuario}" eliminado exitosamente`);
                cargarUsuarios();
            } else {
                throw new Error(resultado.mensaje || 'Error desconocido');
            }

        } catch (err) {
            console.error('Error al eliminar usuario:', err);
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            alert(`❌ Error al eliminar usuario: ${errorMessage}`);
        }
    };

    const actualizarNombre = async (usuarioId: number, nuevoNombre: string, nombreOriginal: string): Promise<boolean> => {
        if (nuevoNombre === nombreOriginal) {
            return true;
        }

        if (nuevoNombre.trim() === '') {
            alert('❌ El nombre no puede estar vacío');
            return false;
        }

        try {
            const response = await fetch(`${API_BASE}/${usuarioId}/nombre?nuevoNombre=${encodeURIComponent(nuevoNombre)}`, {
                method: 'PUT'
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const resultado = await response.json();

            if (resultado.nombre && !resultado.nombre.startsWith('ERROR:')) {
                cargarUsuarios();
                return true;
            } else {
                throw new Error(resultado.nombre || 'Error desconocido');
            }

        } catch (err) {
            console.error('Error al actualizar nombre:', err);
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            alert(`❌ Error al actualizar nombre: ${errorMessage}`);
            return false;
        }
    };

    const UserRowModern = ({ usuario, index }: { usuario: Usuario; index: number }) => {
        const [nombre, setNombre] = useState(usuario.nombre);
        const [rol, setRol] = useState(usuario.rol);
        const [nombreOriginal] = useState(usuario.nombre);
        const [isEditing, setIsEditing] = useState(false);

        const handleNombreBlur = async () => {
            const success = await actualizarNombre(usuario.id, nombre, nombreOriginal);
            if (!success) {
                setNombre(nombreOriginal);
            }
            setIsEditing(false);
        };

        const handleNombreKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
                (e.target as HTMLInputElement).blur();
            }
            if (e.key === 'Escape') {
                setNombre(nombreOriginal);
                setIsEditing(false);
            }
        };

        const handleRolChange = async (nuevoRol: string) => {
            const success = await cambiarRol(usuario.id, nuevoRol);
            if (!success) {
                setRol(rol);
            } else {
                setRol(nuevoRol as 'ADMIN' | 'USUARIO');
            }
        };

        const isEvenRow = index % 2 === 0;

        return (
            <div className={`px-6 py-4 border-b border-gray-100 transition-all duration-200 hover:bg-gray-50 ${
                isEvenRow ? 'bg-white' : 'bg-gray-50'
            }`}>
                <div className="grid grid-cols-4 items-center gap-4">
                    <div className="text-gray-700 font-medium text-sm">
                        #{usuario.id}
                    </div>
                    <div className="flex items-center">
                        {isEditing ? (
                            <input
                                type="text"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                onBlur={handleNombreBlur}
                                onKeyDown={handleNombreKeyPress}
                                className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-1 text-gray-800 font-medium text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                autoFocus
                            />
                        ) : (
                            <span 
                                onClick={() => setIsEditing(true)}
                                className="text-gray-800 font-medium text-sm cursor-pointer hover:text-blue-600 transition-colors duration-200 px-2 py-1 rounded hover:bg-blue-50"
                                title="Haz clic para editar"
                            >
                                {nombre}
                            </span>
                        )}
                    </div>
                    <div>
                        <select
                            value={rol}
                            onChange={(e) => handleRolChange(e.target.value)}
                            className="bg-white border border-gray-200 rounded-lg px-3 py-1 text-gray-700 font-medium text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        >
                            <option value="USUARIO">Usuario</option>
                            <option value="ADMIN">Administrador</option>
                        </select>
                    </div>
                    <div className="flex justify-end">
                        <button
                            onClick={() => eliminarUsuario(usuario.id, usuario.nombre)}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
                        >
                            Eliminar
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Calcular estadísticas de usuarios
    const calcularEstadisticasUsuarios = () => {
        const totalUsuarios = usuarios.length;
        const totalAdmins = usuarios.filter(u => u.rol === 'ADMIN').length;
        const totalUsuariosRegulares = usuarios.filter(u => u.rol === 'USUARIO').length;
        const porcentajeAdmins = totalUsuarios > 0 ? Math.round((totalAdmins / totalUsuarios) * 100) : 0;

        return { totalUsuarios, totalAdmins, totalUsuariosRegulares, porcentajeAdmins };
    };

    const stats = calcularEstadisticasUsuarios();

    if (loading) {
        return (
            <div className="min-h-screen p-8 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-xl text-white font-medium">Cargando Datos...</p>
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
                        Gestión de Usuarios
                    </h1>
                    <p className="text-base text-gray-600 text-center mt-1">
                        Administración y control de usuarios del sistema
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-500 border border-red-400 text-red-200 p-4 rounded-xl mb-5">
                        {error}
                    </div>
                )}

                {/* Stats Overview - Contenedores Estándar */}
                <div className="grid grid-cols-4 gap-4 mb-5">
                    <div className="bg-gray-200 bg-opacity-70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-4 text-center">
                        <div className="text-2xl font-bold text-gray-800 mb-1">{stats.totalUsuarios}</div>
                        <div className="text-sm text-gray-600 font-medium">Total Usuarios</div>
                    </div>
                    <div className="bg-gray-200 bg-opacity-70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-4 text-center">
                        <div className="text-2xl font-bold text-gray-800 mb-1">{stats.totalAdmins}</div>
                        <div className="text-sm text-gray-600 font-medium">Administradores</div>
                    </div>
                    <div className="bg-gray-200 bg-opacity-70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-4 text-center">
                        <div className="text-2xl font-bold text-gray-800 mb-1">{stats.totalUsuariosRegulares}</div>
                        <div className="text-sm text-gray-600 font-medium">Usuarios Regulares</div>
                    </div>
                    <div className="bg-gray-200 bg-opacity-70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-4 text-center">
                        <div className="text-2xl font-bold text-gray-800 mb-1">{stats.porcentajeAdmins}%</div>
                        <div className="text-sm text-gray-600 font-medium">% Administradores</div>
                    </div>
                </div>

                {/* Management Grid - Layout Modular */}
                <div className="grid grid-cols-2 gap-5 mb-5">
                    {/* Módulo: Información del Usuario Actual */}
                    <div className="bg-gray-200 bg-opacity-70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">
                            Usuario Actual
                        </h3>
                        <div className="flex items-center justify-center gap-4 py-4">
                            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                                <User size={32} className="text-white" />
                            </div>
                            <div className="text-center">
                                <h2 className="text-gray-800 text-xl font-bold">{user?.usuario || 'Usuario'}</h2>
                                <p className="text-gray-600 font-medium">{user?.rol || 'Invitado'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Módulo: Tarjeta de Resumen */}
                    <div className="bg-gray-200 bg-opacity-70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">
                            Resumen del Sistema
                        </h3>
                        <div className="space-y-4">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-blue-600 mb-1">{stats.totalUsuarios}</div>
                                <div className="text-sm text-gray-600 font-medium">Total de Usuarios</div>
                            </div>
                            <div className="border-t border-gray-300 pt-3">
                                <div className="text-center">
                                    <div className="text-xl font-semibold text-gray-700 mb-1">{stats.totalAdmins}</div>
                                    <div className="text-xs text-gray-500">Administradores Activos Hoy</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Módulo: Tabla de Usuarios Registrados - Fila Completa */}
                <div className="bg-gray-200 bg-opacity-70 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
                        Usuarios Registrados
                    </h3>
                    
                    {usuarios.length === 0 ? (
                        <div className="bg-white bg-opacity-50 rounded-xl p-8 text-center">
                            <User size={48} className="mx-auto mb-4 text-gray-400" />
                            <p className="text-gray-600 text-lg font-medium">No hay usuarios registrados</p>
                            <p className="text-gray-500 text-sm mt-1">Los usuarios aparecerán aquí una vez registrados</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl overflow-hidden shadow-lg">
                            {/* Header de la tabla */}
                            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                                <div className="grid grid-cols-4 gap-4">
                                    <div className="text-white font-semibold text-sm uppercase tracking-wide">ID</div>
                                    <div className="text-white font-semibold text-sm uppercase tracking-wide">Nombre</div>
                                    <div className="text-white font-semibold text-sm uppercase tracking-wide">Rol</div>
                                    <div className="text-white font-semibold text-sm uppercase tracking-wide text-right">Acciones</div>
                                </div>
                            </div>
                            
                            {/* Cuerpo de la tabla */}
                            <div className="max-h-80 overflow-y-auto">
                                {usuarios.map((usuario, index) => (
                                    <UserRowModern key={usuario.id} usuario={usuario} index={index} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default UserManagement;