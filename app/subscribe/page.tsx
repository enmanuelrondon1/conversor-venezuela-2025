// app/subscribe/page.tsx

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function SubscribePage() {
  const [chatId, setChatId] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubscribe = async () => {
    if (!chatId) {
      setStatus('error');
      setMessage('Por favor ingresa tu Chat ID');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, username })
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('¡Suscripción exitosa! Revisa tu Telegram.');
        setChatId('');
        setUsername('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Error al suscribirse');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            📱 Suscríbete
          </h1>
          <p className="text-slate-300">Recibe notificaciones de tasas en Telegram</p>
        </div>

        {/* Instrucciones */}
        <Card className="bg-slate-800/80 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">📋 Cómo obtener tu Chat ID</CardTitle>
            <CardDescription className="text-slate-300">Sigue estos pasos:</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-slate-300">
            <div className="space-y-2">
              <p className="font-semibold text-white">Paso 1: Abre el bot en Telegram</p>
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => window.open('https://t.me/userinfobot', '_blank')}
              >
                🤖 Abrir @userinfobot
              </Button>
            </div>

            <div className="space-y-2">
              <p className="font-semibold text-white">Paso 2: Envía /start</p>
              <p className="text-sm">El bot te responderá con tu información, incluyendo tu Chat ID</p>
            </div>

            <div className="space-y-2">
              <p className="font-semibold text-white">Paso 3: Copia tu Chat ID</p>
              <p className="text-sm">Es un número como: 1234567890</p>
            </div>

            <div className="space-y-2">
              <p className="font-semibold text-white">Paso 4: Pégalo abajo</p>
            </div>
          </CardContent>
        </Card>

        {/* Formulario */}
        <Card className="bg-slate-800/80 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">✍️ Completa tu suscripción</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Chat ID *</label>
              <Input
                type="text"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                placeholder="1234567890"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-300">Usuario de Telegram (opcional)</label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="@tuusuario"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <Button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
            >
              {loading ? 'Procesando...' : '✅ Suscribirme'}
            </Button>

            {/* Mensajes de estado */}
            {status === 'success' && (
              <div className="flex items-center gap-2 p-3 bg-green-900/50 border border-green-700 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                <p className="text-sm text-green-300">{message}</p>
              </div>
            )}

            {status === 'error' && (
              <div className="flex items-center gap-2 p-3 bg-red-900/50 border border-red-700 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <p className="text-sm text-red-300">{message}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info adicional */}
        <Card className="bg-slate-800/80 border-slate-700">
          <CardContent className="pt-6">
            <div className="space-y-3 text-slate-300 text-sm">
              <p className="font-semibold text-white">📊 ¿Qué notificaciones recibirás?</p>
              <ul className="space-y-2 ml-4">
                <li>🔔 Alertas cuando el dólar cambie más del 1%</li>
                <li>🌅 Resumen diario a las 8:00 AM</li>
                <li>📈 Comparación oficial vs paralelo</li>
              </ul>
              
              <p className="font-semibold text-white mt-4">🔒 Privacidad</p>
              <p>Solo almacenamos tu Chat ID para enviarte notificaciones. No compartimos tu información.</p>
            </div>
          </CardContent>
        </Card>

        {/* Botón volver */}
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => window.location.href = '/'}
            className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
          >
            ← Volver al Conversor
          </Button>
        </div>
      </div>
    </main>
  );
}