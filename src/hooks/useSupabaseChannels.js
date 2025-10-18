import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/supabaseClient';

/**
 * ✅ Versão aprimorada do hook useSupabaseChannels:
 * - Evita listeners duplicados e memory leaks
 * - Usa refs para garantir cleanup único
 * - Remove TODOS os canais anteriores antes de registrar novos
 * - Evita warnings “MaxListenersExceededWarning”
 */
export const useSupabaseChannels = (userInfo, setHasUnreadMessages) => {
  const [presenceChannel, setPresenceChannel] = useState(null);
  const [chatChannel, setChatChannel] = useState(null);
  const cleanupRef = useRef({ presence: null, chat: null });

  useEffect(() => {
    // 🧩 Se não houver usuário, encerra todos os canais abertos
    if (!userInfo) {
      console.log('🧹 Nenhum usuário logado — limpando todos os canais Supabase.');
      try {
        supabase.getChannels().forEach((ch) => supabase.removeChannel(ch));
      } catch (err) {
        console.warn('⚠️ Erro ao limpar canais órfãos:', err);
      }
      setPresenceChannel(null);
      setChatChannel(null);
      cleanupRef.current = { presence: null, chat: null };
      return;
    }

    // 🧹 Limpa qualquer canal antigo antes de criar um novo
    console.log('🧹 Limpando canais antigos antes de criar novos...');
    try {
      supabase.getChannels().forEach((ch) => supabase.removeChannel(ch));
    } catch (err) {
      console.warn('⚠️ Falha ao limpar canais antigos:', err);
    }

    // 🔹 Canal de presença
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
        console.log('👥 Usuário marcado como online:', userInfo.vendedor);
      }
    });

    setPresenceChannel(presence);
    cleanupRef.current.presence = presence;

    // 🔹 Canal de chat (somente para admin/supervisor)
    let chat = null;
    if (userInfo.tipo_acesso === 'admin' || userInfo.permissoes?.pode_ver_chat_supervisores) {
      chat = supabase
        .channel('public:chat_messages:app')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'chat_messages' },
          (payload) => {
            if (payload.new.sender_name !== (userInfo.vendedor || userInfo.nome_usuario)) {
              // ✅ Atualiza flag sem empilhar listeners
              setHasUnreadMessages((prev) => !prev);
            }
          }
        )
        .subscribe();
      setChatChannel(chat);
      cleanupRef.current.chat = chat;
    }

    console.log('📡 Canais do Supabase inicializados com sucesso!');

    // 🧹 Cleanup completo
    return () => {
      console.log('🧹 Limpando canais Supabase no cleanup...');
      try {
        if (presence) {
          presence.unsubscribe();
          supabase.removeChannel(presence);
        }
        if (chat) {
          chat.unsubscribe();
          supabase.removeChannel(chat);
        }
        cleanupRef.current = { presence: null, chat: null };
      } catch (err) {
        console.warn('⚠️ Erro ao limpar canais:', err);
      }
    };
  }, [userInfo]);

  return { presenceChannel, chatChannel };
};
