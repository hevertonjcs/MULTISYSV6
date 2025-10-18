import { useEffect, useState } from 'react';
import { supabase } from '@/supabaseClient';

/**
 * Hook centralizado para gerenciar os canais do Supabase:
 * - Canal de presença (usuários online)
 * - Canal de mensagens de supervisores
 *
 * Ele garante que:
 *  ✅ Os canais sejam criados apenas uma vez por usuário logado
 *  ✅ Todos sejam limpos corretamente ao deslogar ou mudar de tela
 *  ✅ Evita o erro "MaxListenersExceededWarning"
 */
export const useSupabaseChannels = (userInfo, setHasUnreadMessages) => {
  const [presenceChannel, setPresenceChannel] = useState(null);
  const [chatChannel, setChatChannel] = useState(null);

  useEffect(() => {
    if (!userInfo) return;

    // 🔹 Cria canal de presença
    const presence = supabase.channel('online-users', {
      config: {
        presence: {
          key: userInfo.vendedor || userInfo.nome_usuario || 'Desconhecido',
        },
      },
    });

    presence.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await presence.track({
          online_at: new Date().toISOString(),
          user_name: userInfo.vendedor || userInfo.nome_usuario,
          equipe: userInfo.equipe || 'Não informado',
        });
      }
    });

    setPresenceChannel(presence);

    // 🔹 Cria canal de chat (somente para admins e supervisores com permissão)
    let chat = null;
    if (userInfo.tipo_acesso === 'admin' || userInfo.permissoes?.pode_ver_chat_supervisores) {
      chat = supabase
        .channel('public:chat_messages:app')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'chat_messages' },
          (payload) => {
            if (payload.new.sender_name !== (userInfo.vendedor || userInfo.nome_usuario)) {
              setHasUnreadMessages(true);
            }
          }
        )
        .subscribe();

      setChatChannel(chat);
    }

    console.log('📡 Canais do Supabase inicializados com sucesso!');

    // 🧹 Cleanup: remove os canais ao desmontar
    return () => {
      console.log('🧹 Limpando canais do Supabase...');
      if (presence) supabase.removeChannel(presence);
      if (chat) supabase.removeChannel(chat);
    };
  }, [userInfo]);

  return { presenceChannel, chatChannel };
};
