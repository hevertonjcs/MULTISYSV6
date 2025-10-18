import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/supabaseClient';

/**
 * Hook centralizado para gerenciar canais do Supabase:
 * - Evita vazamentos e listeners duplicados
 * - Garante que apenas um canal de presença e um de chat existam
 * - Limpa corretamente ao deslogar
 */
export const useSupabaseChannels = (userInfo, setHasUnreadMessages) => {
  const [presenceChannel, setPresenceChannel] = useState(null);
  const [chatChannel, setChatChannel] = useState(null);

  // refs ajudam a evitar re-subscribe duplicado
  const cleanupRef = useRef({ presence: null, chat: null });

  useEffect(() => {
    if (!userInfo) return;

    // ✅ Limpa canais antigos antes de recriar
    if (cleanupRef.current.presence) {
      try {
        supabase.removeChannel(cleanupRef.current.presence);
        cleanupRef.current.presence = null;
      } catch {}
    }
    if (cleanupRef.current.chat) {
      try {
        supabase.removeChannel(cleanupRef.current.chat);
        cleanupRef.current.chat = null;
      } catch {}
    }

    // 🔹 Cria canal de presença
    const presence = supabase.channel('online-users', {
      config: {
        presence: { key: userInfo.vendedor || userInfo.nome_usuario || 'Desconhecido' },
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
    cleanupRef.current.presence = presence;

    // 🔹 Cria canal de chat
    let chat = null;
    if (userInfo.tipo_acesso === 'admin' || userInfo.permissoes?.pode_ver_chat_supervisores) {
      chat = supabase
        .channel('public:chat_messages:app')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'chat_messages' },
          (payload) => {
            if (payload.new.sender_name !== (userInfo.vendedor || userInfo.nome_usuario)) {
              setHasUnreadMessages((prev) => !prev); // força atualização sem empilhar eventos
            }
          }
        )
        .subscribe();

      setChatChannel(chat);
      cleanupRef.current.chat = chat;
    }

    console.log('📡 Canais do Supabase inicializados com sucesso!');

    // 🧹 Cleanup seguro
    return () => {
      console.log('🧹 Limpando canais do Supabase...');
      try {
        if (presence) supabase.removeChannel(presence);
        if (chat) supabase.removeChannel(chat);
      } catch (err) {
        console.warn('⚠️ Erro ao limpar canais:', err);
      }
    };
  }, [userInfo]);

  return { presenceChannel, chatChannel };
};
