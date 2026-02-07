// app/subscribe/page.tsx

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, AlertCircle, UserPlus } from 'lucide-react';

export default function SubscribePage() {
  const [chatId, setChatId] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'already_subscribed'>('idle');
  const [message, setMessage] = useState('');

  // Verificar si ya está suscrito ANTES de intentar suscribir
  const checkIfSubscribed = async (id: string) => {
    if (!id) return false;
    
    setCheckingSubscription(true);
    try {
      const response = await fetch(`/api/subscribe/check?chatId=${id}`);
      const data = await response.json();
      return data.subscribed === true;
    } catch (error) {
      console.error('Error checking subscription:', error);
      return false;
    } finally {
      setCheckingSubscription(false);
    }
  };

  const handleSubscribe = async () => {
    if (!chatId.trim()) {
      setStatus('error');
      setMessage('Por favor ingresa tu Chat ID');
      return;
    }

    // Validar que sea un número
    if (!/^\d+$/.test(chatId.trim())) {
      setStatus('error');
      setMessage('El Chat ID debe ser un número');
      return;
    }

    // Verificar si ya está suscrito primero
    setCheckingSubscription(true);
    const alreadySubscribed = await checkIfSubscribed(chatId.trim());
    setCheckingSubscription(false);

    if (alreadySubscribed) {
      setStatus('already_subscribed');
      setMessage('Este Chat ID ya está suscrito');
      return;
    }

    // Proceder con la suscripción
    setLoading(true);
    setStatus('idle');
    
    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          chatId: chatId.trim(), 
          username: username.trim() || undefined 
        })
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('¡Suscripción exitosa! Revisa tu Telegram.');
      } else {
        setStatus('error');
        setMessage(data.error || 'Error al suscribirse. Intenta nuevamente.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Error de conexión. Verifica tu internet e intenta de nuevo.');
      console.error('Subscription error:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setChatId('');
    setUsername('');
    setStatus('idle');
    setMessage('');
  };

  const isProcessing = loading || checkingSubscription;

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
                onChange={(e) => {
                  setChatId(e.target.value);
                  if (status !== 'idle') setStatus('idle');
                }}
                placeholder="1234567890"
                className="bg-slate-700 border-slate-600 text-white"
                disabled={isProcessing}
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
                disabled={isProcessing}
              />
            </div>

            {status === 'idle' && (
              <Button
                onClick={handleSubscribe}
                disabled={isProcessing}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
              >
                {checkingSubscription && '🔍 Verificando...'}
                {loading && '📤 Suscribiendo...'}
                {!isProcessing && '✅ Suscribirme'}
              </Button>
            )}

            {/* Mensaje de éxito */}
            {status === 'success' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-4 bg-green-900/50 border border-green-700 rounded-lg">
                  <CheckCircle2 className="h-6 w-6 text-green-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-green-300">{message}</p>
                    <p className="text-xs text-green-400 mt-1">
                      Recibirás alertas cuando el dólar cambie y un resumen diario a las 8 AM
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={resetForm}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Suscribir otro
                  </Button>
                  <Button
                    onClick={() => window.location.href = '/'}
                    variant="outline"
                    className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                  >
                    Volver al Conversor
                  </Button>
                </div>
              </div>
            )}

            {/* Mensaje de ya suscrito */}
            {status === 'already_subscribed' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-4 bg-yellow-900/50 border border-yellow-700 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-yellow-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-yellow-300">{message}</p>
                    <p className="text-xs text-yellow-400 mt-1">
                      Este usuario ya está recibiendo notificaciones
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={resetForm}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Suscribir otro
                  </Button>
                  <Button
                    onClick={() => window.location.href = '/'}
                    variant="outline"
                    className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                  >
                    Volver al Conversor
                  </Button>
                </div>
              </div>
            )}

            {/* Mensaje de error */}
            {status === 'error' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-4 bg-red-900/50 border border-red-700 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <p className="text-sm text-red-300">{message}</p>
                </div>
                <Button
                  onClick={() => setStatus('idle')}
                  variant="outline"
                  className="w-full bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                >
                  Intentar de nuevo
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info adicional */}
        <Card className="bg-slate-800/80 border-slate-700">
          <CardContent className="pt-6">
            <div className="space-y-3 text-slate-300 text-sm">
              <p className="font-semibold text-white">📊 ¿Qué notificaciones recibirás?</p>
              <ul className="space-y-2 ml-4 list-disc">
                <li>🔔 Alertas cuando el dólar cambie más del 1%</li>
                <li>🌅 Resumen diario a las 8:00 AM</li>
                <li>📈 Comparación oficial vs paralelo</li>
              </ul>
              
              <p className="font-semibold text-white mt-4">🔒 Privacidad</p>
              <p>Solo almacenamos tu Chat ID para enviarte notificaciones. No compartimos tu información.</p>
            </div>
          </CardContent>
        </Card>

        {/* Botón volver - solo si no hay mensajes */}
        {status === 'idle' && (
          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
            >
              ← Volver al Conversor
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}