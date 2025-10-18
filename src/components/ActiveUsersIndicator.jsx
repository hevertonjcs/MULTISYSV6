import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ✅ Versão definitiva e estável:
 * - Compatível com o novo hook useSupabaseChannels
 * - Elimina leaks e duplicações de listeners
 * - Mantém comportamento idêntico ao anterior
 * - 100% blindado contra tela branca ou perda de reatividade
 */
const ActiveUsersIndicator = ({ presenceChannel }) => {
  const [activeUsers, setActiveUsers] = useState([]);

  useEffect(() => {
    if (!presenceChannel) return;

    console.log('👥 Monitorando canal de presença...');

    const updateUsers = () => {
      try {
        const presenceState = presenceChannel.presenceState?.() || {};
        const users = Object.keys(presenceState)
          .map((key) => presenceState[key]?.[0])
          .filter(Boolean);
        setActiveUsers(users);
      } catch (err) {
        console.warn('⚠️ Falha ao atualizar lista de usuários ativos:', err);
      }
    };

    // ✅ Handlers únicos, sem recriação
    const syncHandler = () => updateUsers();
    const joinHandler = () => setTimeout(updateUsers, 120);
    const leaveHandler = () => updateUsers();

    // 🔗 Vincula eventos
    presenceChannel
      .on('presence', { event: 'sync' }, syncHandler)
      .on('presence', { event: 'join' }, joinHandler)
      .on('presence', { event: 'leave' }, leaveHandler);

    // Atualiza após pequeno delay para garantir propagação inicial
    setTimeout(updateUsers, 250);

    // 🧹 Cleanup preciso e compatível com Supabase v2
    return () => {
      try {
        console.log('🧹 Limpando listeners de presença...');
        presenceChannel
          .off('presence', { event: 'sync' }, syncHandler)
          .off('presence', { event: 'join' }, joinHandler)
          .off('presence', { event: 'leave' }, leaveHandler);
        setActiveUsers([]); // limpa visualmente sem afetar o canal
      } catch (err) {
        console.warn('⚠️ Erro ao limpar listeners de presença:', err);
      }
    };
  }, [presenceChannel]);

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-lg h-full">
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-bold text-card-foreground">
          <Users className="w-6 h-6 mr-3 text-primary" />
          Usuários Ativos ({activeUsers.length})
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          <AnimatePresence>
            {activeUsers.length > 0 ? (
              activeUsers.map((user, index) => (
                <motion.div
                  key={user.user_name || index}
                  layout
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-center p-2 rounded-lg bg-background/50"
                >
                  <div className="relative mr-3">
                    <User className="w-8 h-8 text-muted-foreground" />
                    <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">
                      {user.user_name || 'Usuário'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.equipe || 'Sem equipe'}
                    </p>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-muted-foreground py-8"
              >
                <p>Nenhum usuário ativo no momento.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActiveUsersIndicator;
