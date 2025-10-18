import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ✅ Componente atualizado:
 * - Recebe `presenceChannel` do App.jsx (não cria um novo)
 * - Reage automaticamente a eventos de presença
 * - Exibe usuários online em tempo real
 * - Evita erros "off is not a function" e vazamentos de listeners
 */
const ActiveUsersIndicator = ({ presenceChannel }) => {
  const [activeUsers, setActiveUsers] = useState([]);

  useEffect(() => {
    if (!presenceChannel) return;

    const updateUsers = () => {
      const presenceState = presenceChannel.presenceState?.() || {};
      const users = Object.keys(presenceState)
        .map((key) => {
          const presences = presenceState[key];
          return presences?.length > 0 ? presences[0] : null;
        })
        .filter((user) => user !== null);

      setActiveUsers(users);
    };

    // 🔔 Escuta os eventos de presença em tempo real
    presenceChannel
      .on('presence', { event: 'sync' }, updateUsers)
      .on('presence', { event: 'join' }, () => setTimeout(updateUsers, 100))
      .on('presence', { event: 'leave' }, updateUsers);

    // Atualiza lista inicial
    setTimeout(updateUsers, 200);

    // 🧹 Cleanup seguro
    return () => {
      try {
        // Usa unsubscribe do Supabase Realtime v2 (mais seguro que .off)
        presenceChannel.unsubscribe?.();
        console.log('🧹 Canal de presença limpo com segurança.');
      } catch (err) {
        console.warn('⚠️ Erro ao limpar canal de presença:', err);
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
                  transition={{ duration: 0.3 }}
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
