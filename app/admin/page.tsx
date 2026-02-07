// app/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Power, PowerOff, RefreshCw, Users, Lock, Eye, EyeOff } from 'lucide-react';

interface Subscriber {
  chatId: string;
  nombre: string | null;
  activo: boolean;
  createdAt: string;
}

type ActionType = 'delete' | 'toggle';

export default function AdminPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  
  // Estados de autenticación
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Estado para confirmación de acciones
  const [actionConfirm, setActionConfirm] = useState<{
    chatId: string;
    password: string;
    type: ActionType;
    currentStatus?: boolean;
  } | null>(null);

  const loadSubscribers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/subscribers/list');
      const data = await response.json();
      
      if (data.success) {
        setSubscribers(data.subscribers || []);
        setStats(data.stats || { total: 0, active: 0, inactive: 0 });
      }
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscribers();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
    try {
      const response = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (data.valid) {
        setIsAuthenticated(true);
        setPassword('');
      } else {
        setAuthError('Contraseña incorrecta');
      }
    } catch (error) {
      setAuthError('Error de conexión');
      console.error('Error:', error);
    }
  };

  const handleDeleteRequest = (chatId: string) => {
    setActionConfirm({ chatId, password: '', type: 'delete' });
  };

  const handleToggleRequest = (chatId: string, currentStatus: boolean) => {
    setActionConfirm({ chatId, password: '', type: 'toggle', currentStatus });
  };

  const handleActionConfirm = async () => {
    if (!actionConfirm) return;

    // Verificar contraseña antes de ejecutar acción
    try {
      const verifyResponse = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: actionConfirm.password })
      });

      const verifyData = await verifyResponse.json();

      if (!verifyData.valid) {
        alert('Contraseña incorrecta');
        return;
      }

      setProcessing(actionConfirm.chatId);

      // Ejecutar la acción correspondiente
      if (actionConfirm.type === 'delete') {
        const response = await fetch(`/api/subscribers/delete?chatId=${actionConfirm.chatId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          await loadSubscribers();
          setActionConfirm(null);
          alert('Usuario eliminado exitosamente');
        } else {
          alert('Error al eliminar usuario');
        }
      } else if (actionConfirm.type === 'toggle') {
        const response = await fetch('/api/subscribers/toggle', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            chatId: actionConfirm.chatId, 
            activo: !actionConfirm.currentStatus 
          })
        });

        if (response.ok) {
          await loadSubscribers();
          setActionConfirm(null);
          const action = actionConfirm.currentStatus ? 'desactivado' : 'activado';
          alert(`Usuario ${action} exitosamente`);
        } else {
          alert('Error al actualizar usuario');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión');
    } finally {
      setProcessing(null);
    }
  };

  // Pantalla de login
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800/80 border-slate-700">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-900/50 rounded-full">
                <Lock className="h-8 w-8 text-blue-400" />
              </div>
            </div>
            <CardTitle className="text-2xl text-white">Panel de Administración</CardTitle>
            <p className="text-slate-400 text-sm mt-2">Ingresa la contraseña para continuar</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Contraseña</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setAuthError('');
                    }}
                    placeholder="Ingresa tu contraseña"
                    className="bg-slate-700 border-slate-600 text-white pr-10"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {authError && (
                <div className="bg-red-900/30 border border-red-700 rounded-lg p-3">
                  <p className="text-red-300 text-sm">{authError}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Ingresar
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
              >
                ← Volver al inicio
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Pantalla principal (ya autenticado)
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white flex items-center gap-2">
              <Users className="h-8 w-8" />
              Panel de Administración
            </h1>
            <p className="text-slate-300 mt-2">Gestiona los usuarios suscritos</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={loadSubscribers}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Recargar
            </Button>
            <Button
              onClick={() => setIsAuthenticated(false)}
              variant="outline"
              className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
            >
              <Lock className="h-4 w-4 mr-2" />
              Cerrar sesión
            </Button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-slate-800/80 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-400">Total Usuarios</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">{stats.total}</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/80 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-400">Activos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-400">{stats.active}</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/80 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-400">Inactivos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-400">{stats.inactive}</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de usuarios */}
        <Card className="bg-slate-800/80 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Usuarios Registrados</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-slate-400 text-center py-8">Cargando...</p>
            ) : subscribers.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No hay usuarios registrados</p>
            ) : (
              <div className="space-y-3">
                {subscribers.map((sub) => (
                  <div
                    key={sub.chatId}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      sub.activo
                        ? 'bg-slate-700/50 border-slate-600'
                        : 'bg-slate-700/20 border-slate-700'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-mono ${sub.activo ? 'text-white' : 'text-slate-500'}`}>
                          {sub.chatId}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            sub.activo
                              ? 'bg-green-900/50 text-green-300'
                              : 'bg-red-900/50 text-red-300'
                          }`}
                        >
                          {sub.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 mt-1">
                        {sub.nombre || 'Sin nombre'} • Registrado: {new Date(sub.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleRequest(sub.chatId, sub.activo)}
                        disabled={processing === sub.chatId}
                        className={`${
                          sub.activo
                            ? 'bg-yellow-900/30 border-yellow-700 text-yellow-300 hover:bg-yellow-900/50'
                            : 'bg-green-900/30 border-green-700 text-green-300 hover:bg-green-900/50'
                        }`}
                        title={sub.activo ? "Desactivar (requiere contraseña)" : "Reactivar (requiere contraseña)"}
                      >
                        {sub.activo ? (
                          <>
                            <PowerOff className="h-4 w-4 mr-1" />
                            Desactivar
                          </>
                        ) : (
                          <>
                            <Power className="h-4 w-4 mr-1" />
                            Activar
                          </>
                        )}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteRequest(sub.chatId)}
                        disabled={processing === sub.chatId}
                        className="bg-red-900/30 border-red-700 text-red-300 hover:bg-red-900/50"
                        title="Eliminar permanentemente (requiere contraseña)"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Botones de navegación */}
        <div className="flex gap-4">
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
          >
            ← Volver al Conversor
          </Button>
          <Button
            onClick={() => window.location.href = '/subscribe'}
            className="bg-green-600 hover:bg-green-700"
          >
            + Agregar Usuario
          </Button>
        </div>
      </div>

      {/* Modal de confirmación */}
      {actionConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className={`w-full max-w-md bg-slate-800 ${
            actionConfirm.type === 'delete' ? 'border-red-700' : 'border-yellow-700'
          }`}>
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                {actionConfirm.type === 'delete' ? (
                  <>
                    <Trash2 className="h-5 w-5 text-red-400" />
                    Confirmar Eliminación
                  </>
                ) : (
                  <>
                    {actionConfirm.currentStatus ? (
                      <PowerOff className="h-5 w-5 text-yellow-400" />
                    ) : (
                      <Power className="h-5 w-5 text-green-400" />
                    )}
                    Confirmar {actionConfirm.currentStatus ? 'Desactivación' : 'Activación'}
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`border rounded-lg p-3 ${
                actionConfirm.type === 'delete' 
                  ? 'bg-red-900/30 border-red-700' 
                  : 'bg-yellow-900/30 border-yellow-700'
              }`}>
                {actionConfirm.type === 'delete' ? (
                  <>
                    <p className="text-red-300 text-sm">
                      ⚠️ Esta acción es <strong>permanente</strong> y no se puede deshacer.
                    </p>
                    <p className="text-red-400 text-xs mt-2">
                      Usuario: <code className="bg-red-950 px-1 rounded">{actionConfirm.chatId}</code>
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-yellow-300 text-sm">
                      {actionConfirm.currentStatus 
                        ? '⚠️ El usuario dejará de recibir notificaciones (se puede reactivar después).'
                        : '✅ El usuario volverá a recibir notificaciones.'}
                    </p>
                    <p className="text-yellow-400 text-xs mt-2">
                      Usuario: <code className="bg-yellow-950 px-1 rounded">{actionConfirm.chatId}</code>
                    </p>
                  </>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm text-slate-300">Ingresa tu contraseña para confirmar:</label>
                <Input
                  type="password"
                  value={actionConfirm.password}
                  onChange={(e) => setActionConfirm({...actionConfirm, password: e.target.value})}
                  placeholder="Contraseña de administrador"
                  className="bg-slate-700 border-slate-600 text-white"
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => setActionConfirm(null)}
                  variant="outline"
                  className="flex-1 bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleActionConfirm}
                  disabled={!actionConfirm.password}
                  className={`flex-1 ${
                    actionConfirm.type === 'delete'
                      ? 'bg-red-600 hover:bg-red-700'
                      : actionConfirm.currentStatus
                        ? 'bg-yellow-600 hover:bg-yellow-700'
                        : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {actionConfirm.type === 'delete' ? (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </>
                  ) : actionConfirm.currentStatus ? (
                    <>
                      <PowerOff className="h-4 w-4 mr-2" />
                      Desactivar
                    </>
                  ) : (
                    <>
                      <Power className="h-4 w-4 mr-2" />
                      Activar
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}
