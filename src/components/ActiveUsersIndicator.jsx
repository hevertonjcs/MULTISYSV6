import React, { useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * 🟢 ActiveUsersIndicator — Versão otimizada e sincronizada com o canal centralizado do App
 *
 * - Se receber `presenceChannel` como prop, usa ele (não cria outro)
 * - Se não receber (modo fallback), cria um novo canal local
 * - Mostra usuários online em tempo real
 */
const ActiveUsersIndicator = ({ presenceChannel }) => {
  const [activeUsers, setActiveUsers] = useState([]);
  const [localChannel, setLocalChannel] = useState(null);

  useEffect(() => {
    // 🧠 Define qual canal será usado
    const channel = presenceChannel
      ? presenceChannel
      : supabase.channel('online-users', {
          config: {
            presence: { key: 'anon' },
          },
        });

    if (!presenceChannel) {
      // 🔧 Se for canal local (fallback), inscreve para sincronizar
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('📡 Canal de presença local ativo (fallback)');
        }
      });
      setLocalChannel(channel);
    }

    // 🧩 Atualiza lista de usuários ativos
    const updateUsers = () => {
      try {
        const state = channel.presenceState();
        const users = Object.keys(state)
          .map((key) => state[key][0]) // pega o primeiro registro de cada chave
          .filter(Boolean);
        setActiveUsers(users);
      } catch (err) {
        console.error('Erro ao atualizar lista de usuários ativos:', err);
      }
    };

    // 🔄 Escuta eventos de presença
    channel
      .on('presence', { event: 'sync' }, updateUsers)
      .on('presence', { event: 'join' }, () => setTimeout(updateUsers, 100))
      .on('presence', { event: 'leave' }, updateUsers);

    // 🚀 Atualiza na inicialização
    updateUsers();

    // 🧹 Limpeza segura
    return () => {
      console.log('🧹 Limpando listener de ActiveUsersIndicator...');
      if (!presenceChannel && localChannel) {
        supabase.removeChannel(localChannel);
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
                  key={user.user_name || `user-${index}`}
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
                      {user.user_name || 'Usuário Desconhecido'}
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
