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

    const UserRow = ({ usuario }: { usuario: Usuario }) => {
        const [nombre, setNombre] = useState(usuario.nombre);
        const [rol, setRol] = useState(usuario.rol);
        const [nombreOriginal] = useState(usuario.nombre);

        const handleNombreBlur = async () => {
            const success = await actualizarNombre(usuario.id, nombre, nombreOriginal);
            if (!success) {
                setNombre(nombreOriginal);
            }
        };

        const handleNombreKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
                (e.target as HTMLInputElement).blur();
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

        return (
            <div className="bg-gray-200 bg-opacity-70 backdrop-blur-sm rounded-2xl p-6 mb-4 transition-all duration-300 hover:bg-opacity-90">
                <div className="grid grid-cols-4 items-center gap-4">
                    <div className="text-white font-semibold text-lg">
                        {usuario.id}
                    </div>
                    <div>
                        <input
                            type="text"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            onBlur={handleNombreBlur}
                            onKeyDown={handleNombreKeyPress}
                            className="bg-transparent text-gray-800 font-semibold text-lg border-none outline-none w-full focus:bg-white focus:bg-opacity-20 focus:rounded-lg focus:px-2 focus:py-1 transition-all duration-300"
                            title="Haz clic para editar el nombre"
                        />
                    </div>
                    <div>
                        <select
                            value={rol}
                            onChange={(e) => handleRolChange(e.target.value)}
                            className="bg-transparent text-gray-800 font-semibold text-lg border-none outline-none cursor-pointer focus:bg-white focus:bg-opacity-20 focus:rounded-lg focus:px-2 focus:py-1 transition-all duration-300"
                        >
                            <option value="USUARIO">USUARIO</option>
                            <option value="ADMIN">ADMIN</option>
                        </select>
                    </div>
                    <div className="flex justify-end">
                        <button
                            onClick={() => eliminarUsuario(usuario.id, usuario.nombre)}
                            className="bg-red-400 bg-opacity-70 text-white px-6 py-2 rounded-full font-medium transition-all duration-300 hover:bg-red-500 hover:bg-opacity-80 hover:scale-105"
                        >
                            Eliminar
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen  p-8 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-xl text-white font-medium">Cargando Datos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full pt-5">
            <div className="max-w-6xl mx-auto">
                {/* Header con usuario actual y botón agregar */}
                <div className="flex justify-between items-center mb-12">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                            <User size={32} className="text-blue-800" />
                        </div>
                        <div>
                            <h2 className="text-white text-2xl font-bold">{user?.usuario || 'Usuario'}</h2>
                            <p className="text-blue-200">{user?.rol || 'Invitado'}</p>
                        </div>
                    </div>

                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-500 bg-opacity-20 border border-red-400 text-red-200 px-6 py-4 rounded-xl mb-6 backdrop-blur-sm">
                        {error}
                    </div>
                )}

                {/* Header de la tabla */}
                <div className="bg-gradient-to-r from-amber-600 to-amber-700 rounded-2xl p-6 mb-4 shadow-lg">
                    <div className="grid grid-cols-4 gap-4">
                        <div className="text-white font-bold text-xl">ID</div>
                        <div className="text-white font-bold text-xl">Nombre</div>
                        <div className="text-white font-bold text-xl">Rol</div>
                        <div className="text-white font-bold text-xl text-right">Acciones</div>
                    </div>
                </div>

                {/* Lista de usuarios */}
                <div className="space-y-2">
                    {usuarios.length === 0 ? (
                        <div className="bg-gray-200 bg-opacity-70 backdrop-blur-sm rounded-2xl p-12 text-center">
                            <User size={48} className="mx-auto mb-4 text-gray-600 opacity-50" />
                            <p className="text-gray-700 text-xl">No hay usuarios registrados</p>
                        </div>
                    ) : (
                        usuarios.map((usuario) => (
                            <UserRow key={usuario.id} usuario={usuario} />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserManagement;