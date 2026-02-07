// app/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Power, PowerOff, RefreshCw, Users } from 'lucide-react';

interface Subscriber {
  chatId: string;
  nombre: string | null;
  activo: boolean;
  createdAt: string;
}

export default function AdminPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

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

  const handleDelete = async (chatId: string) => {
    if (!confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.')) {
      return;
    }

    setProcessing(chatId);
    try {
      const response = await fetch(`/api/subscribers/delete?chatId=${chatId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadSubscribers();
        alert('Usuario eliminado exitosamente');
      } else {
        alert('Error al eliminar usuario');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión');
    } finally {
      setProcessing(null);
    }
  };

  const handleToggle = async (chatId: string, currentStatus: boolean) => {
    setProcessing(chatId);
    try {
      const response = await fetch('/api/subscribers/toggle', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, activo: !currentStatus })
      });

      if (response.ok) {
        await loadSubscribers();
      } else {
        alert('Error al actualizar usuario');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión');
    } finally {
      setProcessing(null);
    }
  };

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
          <Button
            onClick={loadSubscribers}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Recargar
          </Button>
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
                        onClick={() => handleToggle(sub.chatId, sub.activo)}
                        disabled={processing === sub.chatId}
                        className={`${
                          sub.activo
                            ? 'bg-yellow-900/30 border-yellow-700 text-yellow-300 hover:bg-yellow-900/50'
                            : 'bg-green-900/30 border-green-700 text-green-300 hover:bg-green-900/50'
                        }`}
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
                        onClick={() => handleDelete(sub.chatId)}
                        disabled={processing === sub.chatId}
                        className="bg-red-900/30 border-red-700 text-red-300 hover:bg-red-900/50"
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
    </main>
  );
}
