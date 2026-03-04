import React, { useState, useEffect, useCallback } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';

import LoginPage from '@/pages/LoginPage';
import FormPage from '@/pages/FormPage';
import AdminDashboard from '@/pages/AdminDashboard';

import SearchModal from '@/components/SearchModal';
import InsightsModal from '@/components/insights/InsightsModal';
import UserManagementModal from '@/components/UserManagementModal';
import SupervisorChatModal from '@/components/SupervisorChatModal';
import RescueModal from '@/components/RescueModal';

import { testConnection, supabase } from '@/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { initialFormData } from '@/constants';

import { useDataMigrator } from '@/hooks/useDataMigrator';
import { useSupabaseChannels } from '@/hooks/useSupabaseChannels';

/* ============================= */
/* 🌐 META DINÂMICA (ORIGINAL) */
/* ============================= */

const useDynamicMeta = () => {
  const [dinamiqueConfig, setDinamiqueConfig] = useState({
    titulo: 'Sistema Multinegociações',
    descricao: 'Sistema de cadastro Multinegociações V2',
    favicon_url: 'https://i.ibb.co/MDBrt4hb/favicon.png',
    nome_projeto: 'Multinegociações',
  });

  useEffect(() => {
    const carregarDinamique = async () => {
      try {
        const { data, error } = await supabase
          .from('dinamique')
          .select('*')
          .limit(1)
          .single();

        if (error || !data) {
          aplicarMeta(dinamiqueConfig);
          return;
        }

        setDinamiqueConfig(data);
        aplicarMeta(data);
      } catch (err) {
        aplicarMeta(dinamiqueConfig);
      }
    };

    const aplicarMeta = (config) => {
      document.title = config.titulo || 'Sistema';

      let metaDesc = document.querySelector("meta[name='description']");
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute(
        'content',
        config.descricao || 'Sistema Multinegociações'
      );

      let favicon = document.querySelector("link[rel='icon']");
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.setAttribute('rel', 'icon');
        document.head.appendChild(favicon);
      }
      favicon.setAttribute('type', 'image/png');
      favicon.setAttribute(
        'href',
        config.favicon_url || 'https://i.ibb.co/MDBrt4hb/favicon.png'
      );
    };

    carregarDinamique();
  }, []);

  return dinamiqueConfig;
};

/* ============================= */
/* 🚀 APP */
/* ============================= */

const App = () => {
  /* 🧠 Tema Simples (localStorage) */
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) setTheme(savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  /* --------------------------- */
  /* Estados Globais Originais */
  /* --------------------------- */

  const [currentScreen, setCurrentScreen] = useState('login');
  const [userInfo, setUserInfo] = useState(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [showUserManagementModal, setShowUserManagementModal] =
    useState(false);
  const [showSupervisorChatModal, setShowSupervisorChatModal] =
    useState(false);
  const [showRescueModal, setShowRescueModal] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [logoConfig, setLogoConfig] = useState({
    enabled: false,
    url: '',
    height: 30,
  });
  const [editingCadastro, setEditingCadastro] = useState(null);

  const { toast } = useToast();

  useDynamicMeta();
  useDataMigrator(userInfo);

  const { presenceChannel, chatChannel } = useSupabaseChannels(
    userInfo,
    setHasUnreadMessages
  );

  /* 🔌 Teste conexão */
  useEffect(() => {
    const checkSupabaseConnection = async () => {
      if (supabase) {
        const connected = await testConnection();
        if (connected) {
          toast({
            title: 'Supabase Conectado!',
            description: 'Conexão estabelecida com sucesso.',
          });
        }
      }
    };
    checkSupabaseConnection();
  }, [toast]);

  /* 🔐 LOGIN (ORIGINAL COMPLETO) */
  const handleLogin = (loginData) => {
    const defaultPermissions = {
      pode_ver_todos_cadastros: false,
      pode_ver_cadastros: true,
      pode_ver_insights: false,
      pode_gerenciar_usuarios: false,
      pode_ver_chat_supervisores: false,
      pode_ver_usuarios_ativos: false,
      pode_ver_log_atividades: false,
      pode_usar_funcao_resgate: false,
    };

    let parsedPermissoes = null;

    try {
      if (typeof loginData.permissoes === 'string') {
        const cleaned = loginData.permissoes
          .replace(/^"|"$/g, '')
          .replace(/\\"/g, '"');
        parsedPermissoes = JSON.parse(cleaned);
      } else if (
        typeof loginData.permissoes === 'object' &&
        loginData.permissoes !== null
      ) {
        parsedPermissoes = loginData.permissoes;
      }
    } catch (error) {
      parsedPermissoes = null;
    }

    let permissions = parsedPermissoes || defaultPermissions;

    if (loginData.tipo_acesso === 'admin') {
      permissions = Object.fromEntries(
        Object.keys(defaultPermissions).map((key) => [key, true])
      );
    } else if (loginData.tipo_acesso === 'supervisor') {
      permissions.pode_ver_todos_cadastros = true;
      permissions.pode_ver_chat_supervisores = true;
    }

    setUserInfo({ ...loginData, permissoes: permissions });
    setCurrentScreen('admin_dashboard');
    setEditingCadastro(null);
  };

  /* 🚪 LOGOUT SEGURO */
  const handleLogout = async () => {
    try {
      if (presenceChannel)
        await supabase.removeChannel(presenceChannel);
      if (chatChannel)
        await supabase.removeChannel(chatChannel);

      localStorage.clear();

      setHasUnreadMessages(false);
      setEditingCadastro(null);
      setShowInsightsModal(false);
      setShowSearchModal(false);
      setShowRescueModal(false);
      setShowUserManagementModal(false);
      setShowSupervisorChatModal(false);

      setUserInfo(null);
      setCurrentScreen('login');
    } catch (error) {
      toast({
        title: 'Erro ao sair',
        description: 'Recarregue a página se necessário.',
        variant: 'destructive',
      });
    }
  };

  /* 🖥️ RENDER TELAS */
  const renderScreen = () => {
    switch (currentScreen) {
      case 'login':
        return <LoginPage onLogin={handleLogin} />;

      case 'form':
        return (
          <FormPage
            userInfo={userInfo}
            onLogout={handleLogout}
            logoConfig={logoConfig}
            initialDataForEdit={editingCadastro}
          />
        );

      case 'admin_dashboard':
        if (!userInfo) return <LoginPage onLogin={handleLogin} />;
        return (
          <AdminDashboard
            userInfo={userInfo}
            onLogout={handleLogout}
            onShowSearch={() => setShowSearchModal(true)}
            onShowInsights={() => setShowInsightsModal(true)}
            onShowUserManagement={() =>
              setShowUserManagementModal(true)
            }
            onShowSupervisorChat={() =>
              setShowSupervisorChatModal(true)
            }
            onShowRescueModal={() => setShowRescueModal(true)}
            hasUnreadMessages={hasUnreadMessages}
            presenceChannel={presenceChannel}
          />
        );

      default:
        return <LoginPage onLogin={handleLogin} />;
    }
  };

  /* 🌐 RENDER PRINCIPAL */
  return (
    <main
      className={`min-h-screen relative transition-colors duration-300 ${
        theme === 'dark'
          ? 'bg-zinc-950 text-white'
          : 'bg-white text-black'
      }`}
    >
      {/* 🌙 BOTÃO DE TEMA FIXO (FORA DO DASHBOARD) */}
      <div className="fixed top-4 right-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          className="shadow-md"
        >
          {theme === 'dark' ? (
            <Sun size={18} />
          ) : (
            <Moon size={18} />
          )}
        </Button>
      </div>

      {renderScreen()}

      {/* MODAIS */}
      <SearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        logoConfig={logoConfig}
        onEditCadastro={(data) => setEditingCadastro(data)}
        userInfo={userInfo}
      />

      <RescueModal
        isOpen={showRescueModal}
        onClose={() => setShowRescueModal(false)}
        userInfo={userInfo}
      />

      <InsightsModal
        isOpen={showInsightsModal}
        onClose={() => setShowInsightsModal(false)}
      />

      <UserManagementModal
        isOpen={showUserManagementModal}
        onClose={() => setShowUserManagementModal(false)}
        currentUser={userInfo}
      />

      <SupervisorChatModal
        isOpen={showSupervisorChatModal}
        onClose={() => setShowSupervisorChatModal(false)}
        userInfo={userInfo}
      />

      <Toaster />
    </main>
  );
};

export default App;
