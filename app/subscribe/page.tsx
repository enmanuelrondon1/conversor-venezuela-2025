// app/subscribe/page.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, AlertCircle, UserPlus, Send } from 'lucide-react';

export default function SubscribePage() {
  const [chatId, setChatId] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'already_subscribed'>('idle');
  const [message, setMessage] = useState('');

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

    if (!/^\d+$/.test(chatId.trim())) {
      setStatus('error');
      setMessage('El Chat ID debe ser un número');
      return;
    }

    setCheckingSubscription(true);
    const alreadySubscribed = await checkIfSubscribed(chatId.trim());
    setCheckingSubscription(false);

    if (alreadySubscribed) {
      setStatus('already_subscribed');
      setMessage('Este Chat ID ya está suscrito');
      return;
    }

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

        {/* PASO 1: Iniciar conversación con el bot - DESTACADO */}
        <Card className="bg-gradient-to-br from-blue-900/90 to-blue-800/80 border-blue-600 border-2 shadow-lg shadow-blue-900/50">
          <CardHeader>
            <CardTitle className="text-white text-xl flex items-center gap-2">
              <Send className="h-6 w-6" />
              🚨 PASO 1: Inicia conversación con el bot
            </CardTitle>
            <CardDescription className="text-blue-200 font-semibold">
              ⚠️ MUY IMPORTANTE - Hazlo primero o no recibirás notificaciones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-950/50 border border-blue-700 rounded-lg p-4">
              <p className="text-white font-semibold mb-3">
                1️⃣ Abre el bot de notificaciones:
              </p>
              <Button
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg h-14"
                onClick={() => window.open('https://t.me/conversor_venezuela_bot', '_blank')}
              >
                🤖 Abrir @conversor_venezuela_bot
              </Button>
            </div>

            <div className="bg-blue-950/50 border border-blue-700 rounded-lg p-4">
              <p className="text-white font-semibold mb-2">
                2️⃣ Envía el comando <code className="bg-blue-800 px-2 py-1 rounded">/start</code>
              </p>
              <p className="text-sm text-blue-200">
                El bot te responderá confirmando que está activo
              </p>
            </div>

            <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3">
              <p className="text-yellow-200 text-sm">
                ⚠️ Si no haces este paso primero, tu suscripción se guardará pero NO recibirás ninguna notificación
              </p>
            </div>
          </CardContent>
        </Card>

        {/* PASO 2: Obtener Chat ID */}
        <Card className="bg-slate-800/80 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">📋 PASO 2: Obtén tu Chat ID</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-slate-300">
            <div className="space-y-2">
              <p className="font-semibold text-white">1. Abre @userinfobot en Telegram</p>
              <Button
                className="w-full bg-slate-700 hover:bg-slate-600"
                onClick={() => window.open('https://t.me/userinfobot', '_blank')}
              >
                🔍 Abrir @userinfobot
              </Button>
            </div>

            <div className="space-y-2">
              <p className="font-semibold text-white">2. Envía /start</p>
              <p className="text-sm">El bot te responderá con tu información</p>
            </div>

            <div className="space-y-2">
              <p className="font-semibold text-white">3. Copia tu Chat ID</p>
              <p className="text-sm">Es un número como: 1234567890</p>
            </div>
          </CardContent>
        </Card>

        {/* PASO 3: Formulario */}
        <Card className="bg-slate-800/80 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">✍️ PASO 3: Completa tu suscripción</CardTitle>
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

            {status === 'success' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-4 bg-green-900/50 border border-green-700 rounded-lg">
                  <CheckCircle2 className="h-6 w-6 text-green-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-green-300">{message}</p>
                    <p className="text-xs text-green-400 mt-1">
                      Si enviaste /start al bot, deberías haber recibido un mensaje de bienvenida
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
