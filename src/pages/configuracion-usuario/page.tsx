import { useState, useEffect } from 'react';
import { User, Settings, Edit2, Trash2, RotateCcw, Save, X, AlertTriangle, CheckCircle, LogOut } from 'lucide-react';

interface UserData {
  name: string;
  usuario: string;
  role: string;
  rol: string;
  id: number;
}

export default function UserSettings() {
  const [user, setUser] = useState<UserData | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);

  // Estados para modales de confirmación
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  // Estados para mensajes de éxito/error
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setNewName(parsedUser.name || parsedUser.usuario);
      } catch (error) {
        console.error('Error al parsear datos del usuario:', error);
      }
    }
  }, []);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleUpdateName = async () => {
    if (!user || !newName.trim()) {
      showMessage('error', 'El nombre no puede estar vacío');
      return;
    }

    if (newName === user.name || newName === user.usuario) {
      setEditingName(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/usuarios/${user.id}/nombre?nuevoNombre=${encodeURIComponent(newName.trim())}`, {
        method: 'PUT',
      });

      if (response.ok) {
        const updatedUser = await response.json();

        // Actualizar usuario en localStorage
        const updatedUserData = {
          ...user,
          name: updatedUser.nombre,
          usuario: updatedUser.nombre
        };

        localStorage.setItem('user', JSON.stringify(updatedUserData));
        setUser(updatedUserData);
        setEditingName(false);
        showMessage('success', 'Nombre actualizado correctamente');
      } else {
        const errorData = await response.json();
        showMessage('error', errorData.nombre || 'Error al actualizar el nombre');
      }
    } catch (error) {
      console.error('Error:', error);
      showMessage('error', 'Error de conexión al actualizar el nombre');
    } finally {
      setLoading(false);
    }
  };

  const handleResetProgress = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/progreso/reiniciar/${user.id}`, {
        method: 'PUT',
      });

      if (response.ok) {
        // Limpiar datos de progreso en localStorage
        localStorage.removeItem('userProgress');
        localStorage.removeItem('progresoLetras');

        setShowResetModal(false);
        showMessage('success', 'Progreso reiniciado correctamente');
      } else {
        showMessage('error', 'Error al reiniciar el progreso');
      }
    } catch (error) {
      console.error('Error:', error);
      showMessage('error', 'Error de conexión al reiniciar el progreso');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch(`/usuarios/${user.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Limpiar todo el localStorage
        localStorage.removeItem('user');
        localStorage.removeItem('userProgress');
        localStorage.removeItem('progresoLetras');

        showMessage('success', 'Cuenta eliminada correctamente. Redirigiendo...');

        // Redirigir después de 2 segundos
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        showMessage('error', 'Error al eliminar la cuenta');
        setShowDeleteModal(false);
      }
    } catch (error) {
      console.error('Error:', error);
      showMessage('error', 'Error de conexión al eliminar la cuenta');
      setShowDeleteModal(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('userProgress');
    localStorage.removeItem('progresoLetras');
    window.location.href = '/';
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
      <div className="min-h-screen  p-8 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No has iniciado sesión</h2>
          <p className="text-gray-600">Por favor, inicia sesión para ver la configuración</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen  p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Mensaje de éxito/error */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl shadow-lg flex items-center gap-3 animate-fade-in ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-6 h-6 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
            )}
            <p className="font-medium">{message.text}</p>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full p-4">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900">Configuración</h1>
              <p className="text-gray-600">Gestiona tu cuenta y preferencias</p>
            </div>
          </div>
        </div>

        {/* Información del usuario */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-800">Información Personal</h2>
          </div>

          {/* Nombre de usuario */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de Usuario
              </label>
              {editingName ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    placeholder="Ingresa tu nuevo nombre"
                    disabled={loading}
                  />
                  <button
                    onClick={handleUpdateName}
                    disabled={loading}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-xl font-medium transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingName(false);
                      setNewName(user.name || user.usuario);
                    }}
                    disabled={loading}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 rounded-xl font-medium transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-xl">
                  <span className="text-lg font-semibold text-gray-900">
                    {user.name || user.usuario}
                  </span>
                  <button
                    onClick={() => setEditingName(true)}
                    className="text-indigo-600 hover:text-indigo-700 flex items-center gap-2 font-medium transition"
                  >
                    <Edit2 className="w-5 h-5" />
                    Editar
                  </button>
                </div>
              )}
            </div>

            {/* ID de usuario */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID de Usuario
              </label>
              <div className="bg-gray-50 px-4 py-3 rounded-xl">
                <span className="text-lg font-mono text-gray-700">#{user.id}</span>
              </div>
            </div>

            {/* Rol */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rol
              </label>
              <div className="bg-gray-50 px-4 py-3 rounded-xl">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                  user.rol === 'ADMIN' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {user.rol || user.role}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Acciones peligrosas */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <h2 className="text-2xl font-bold text-gray-800">Zona de Peligro</h2>
          </div>

          <div className="space-y-4">
            {/* Reiniciar progreso */}
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl border border-yellow-200">
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1">Reiniciar Progreso</h3>
                <p className="text-sm text-gray-600">
                  Esto eliminará todo tu progreso de aprendizaje. Esta acción no se puede deshacer.
                </p>
              </div>
              <button
                onClick={() => setShowResetModal(true)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-xl font-semibold transition flex items-center gap-2 ml-4"
              >
                <RotateCcw className="w-5 h-5" />
                Reiniciar
              </button>
            </div>

            {/* Cerrar sesión */}
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1">Cerrar Sesión</h3>
                <p className="text-sm text-gray-600">
                  Cierra tu sesión actual. Podrás volver a iniciar sesión cuando quieras.
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold transition flex items-center gap-2 ml-4"
              >
                <LogOut className="w-5 h-5" />
                Salir
              </button>
            </div>

            {/* Eliminar cuenta */}
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-200">
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1">Eliminar Cuenta</h3>
                <p className="text-sm text-gray-600">
                  Elimina permanentemente tu cuenta y todos tus datos. Esta acción no se puede deshacer.
                </p>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold transition flex items-center gap-2 ml-4"
              >
                <Trash2 className="w-5 h-5" />
                Eliminar
              </button>
            </div>
          </div>
        </div>

        {/* Modal de confirmación - Reiniciar progreso */}
        {showResetModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-yellow-100 rounded-full p-3">
                  <RotateCcw className="w-6 h-6 text-yellow-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">¿Reiniciar Progreso?</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Estás a punto de eliminar todo tu progreso de aprendizaje. Tendrás que empezar desde cero.
                ¿Estás seguro de que deseas continuar?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetModal(false)}
                  disabled={loading}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-xl font-semibold transition disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleResetProgress}
                  disabled={loading}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <RotateCcw className="w-5 h-5" />
                      Sí, reiniciar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmación - Eliminar cuenta */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-red-100 rounded-full p-3">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">¿Eliminar Cuenta?</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Esta acción es <strong>permanente e irreversible</strong>. Se eliminarán todos tus datos,
                progreso y configuraciones. ¿Estás completamente seguro?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={loading}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-xl font-semibold transition disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Trash2 className="w-5 h-5" />
                      Sí, eliminar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}