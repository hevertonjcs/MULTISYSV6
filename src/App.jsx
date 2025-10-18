import React, { useState, useEffect, useCallback } from 'react';
import { Toaster } from '@/components/ui/toaster';
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

/* ✅ Hook dinâmico com fallback automático e seguro */
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

        // ⚠️ Fallback se não houver dados
        if (error || !data) {
          console.warn('⚠️ Nenhuma configuração encontrada no Supabase. Usando fallback local.');
          aplicarMeta(dinamiqueConfig);
          return;
        }

        console.log('✅ Configurações dinâmicas carregadas do Supabase:', data);
        setDinamiqueConfig(data);
        aplicarMeta(data);
      } catch (err) {
        console.error('❌ Erro ao carregar configurações dinâmicas:', err);
        aplicarMeta(dinamiqueConfig); // fallback automático
      }
    };

    // 🔧 Atualiza dinamicamente meta tags e favicon
    const aplicarMeta = (config) => {
      document.title = config.titulo || 'Sistema';

      // Meta Description
      let metaDesc = document.querySelector("meta[name='description']");
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', config.descricao || 'Sistema Multinegociações');

      // Favicon
      let favicon = document.querySelector("link[rel='icon']");
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.setAttribute('rel', 'icon');
        document.head.appendChild(favicon);
      }
      favicon.setAttribute('type', 'image/png');
      favicon.setAttribute('href', config.favicon_url || 'https://i.ibb.co/MDBrt4hb/favicon.png');
    };

    carregarDinamique();
  }, []);

  return dinamiqueConfig;
};

/* 🌐 Componente principal */
const App = () => {
  // ---------------------------
  // 🧠 Estados Globais
  // ---------------------------
  const [currentScreen, setCurrentScreen] = useState('login');
  const [userInfo, setUserInfo] = useState(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [showUserManagementModal, setShowUserManagementModal] = useState(false);
  const [showSupervisorChatModal, setShowSupervisorChatModal] = useState(false);
  const [showRescueModal, setShowRescueModal] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [logoConfig, setLogoConfig] = useState({ enabled: false, url: '', height: 30 });
  const [editingCadastro, setEditingCadastro] = useState(null);
  const { toast } = useToast();

  /* ✅ Integra metadados dinâmicos */
  const dinamiqueConfig = useDynamicMeta();

  /* ✅ Migração de dados */
  useDataMigrator(userInfo);

  /* ✅ Unificação de canais do Supabase */
  const { presenceChannel } = useSupabaseChannels(userInfo, setHasUnreadMessages);

  // ---------------------------
  // 🔌 Teste de conexão Supabase
  // ---------------------------
  useEffect(() => {
    const checkSupabaseConnection = async () => {
      if (supabase) {
        const connected = await testConnection();
        if (connected) {
          toast({
            title: 'Supabase Conectado!',
            description: 'Conexão com o banco de dados estabelecida com sucesso.',
          });
        }
      } else {
        toast({
          title: 'Supabase Não Configurado',
          description: 'O app usará localStorage como fallback.',
          variant: 'destructive',
        });
      }
    };
    checkSupabaseConnection();
  }, [toast]);

  // ---------------------------
  // 🔐 Login e permissões
  // ---------------------------
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
        const cleaned = loginData.permissoes.replace(/^"|"$/g, '').replace(/\\"/g, '"');
        parsedPermissoes = JSON.parse(cleaned);
      } else if (typeof loginData.permissoes === 'object' && loginData.permissoes !== null) {
        parsedPermissoes = loginData.permissoes;
      }
    } catch (error) {
      console.error('Erro ao interpretar permissoes do usuário:', error, loginData.permissoes);
      parsedPermissoes = null;
    }

    let permissions = parsedPermissoes || defaultPermissions;

    // Ajustes conforme tipo de acesso
    if (loginData.tipo_acesso === 'admin') {
      permissions = Object.fromEntries(Object.keys(defaultPermissions).map((key) => [key, true]));
    } else if (loginData.tipo_acesso === 'supervisor') {
      permissions.pode_ver_todos_cadastros = true;
      permissions.pode_ver_chat_supervisores = true;
    }

    console.log('Usuário logado com permissões:', permissions);

    setUserInfo({ ...loginData, permissoes: permissions });
    setCurrentScreen('admin_dashboard');
    setEditingCadastro(null);
  };

  // ---------------------------
  // 🚪 Logout com limpeza de canais
  // ---------------------------
  const handleLogout = () => {
    if (presenceChannel) supabase.removeChannel(presenceChannel);
    setUserInfo(null);
    setCurrentScreen('login');
    setEditingCadastro(null);
  };

  // ---------------------------
  // ⚙️ Abertura de modais
  // ---------------------------
  const handleShowSearch = () => setShowSearchModal(true);
  const handleShowInsights = () => setShowInsightsModal(true);
  const handleShowUserManagement = () => setShowUserManagementModal(true);
  const handleShowRescueModal = () => setShowRescueModal(true);
  const handleShowSupervisorChat = () => {
    setShowSupervisorChatModal(true);
    setHasUnreadMessages(false);
    localStorage.setItem('lastSeenChatTimestamp', new Date().toISOString());
  };

  // ---------------------------
  // ✏️ Edição e formulários
  // ---------------------------
  const handleEditCadastroRequest = useCallback(
    (cadastroData) => {
      const mappedData = {};
      for (const key in initialFormData) mappedData[key] = cadastroData[key] || initialFormData[key];
      if (userInfo) {
        mappedData.vendedor = cadastroData.vendedor || userInfo.vendedor;
        mappedData.equipe = cadastroData.equipe || userInfo.equipe;
      }
      setEditingCadastro(mappedData);
      setCurrentScreen('form');
      setShowSearchModal(false);
      toast({
        title: 'Modo de Edição',
        description: `Editando cadastro: ${cadastroData.codigo_cadastro || 'Novo Cadastro'}`,
      });
    },
    [userInfo, toast]
  );

  const handleFormSubmissionSuccess = () => {
    setEditingCadastro(null);
    if (userInfo?.tipo_acesso) setCurrentScreen('admin_dashboard');
  };

  const handleNavigateToForm = () => {
    setEditingCadastro(null);
    setCurrentScreen('form');
  };

  const handleBackToDashboard = () => {
    setEditingCadastro(null);
    setCurrentScreen('admin_dashboard');
  };

  // ---------------------------
  // 🖥️ Renderização de telas
  // ---------------------------
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
            onSubmissionSuccess={handleFormSubmissionSuccess}
            onBackToDashboard={handleBackToDashboard}
          />
        );
      case 'admin_dashboard':
        return (
          <AdminDashboard
            userInfo={userInfo}
            onLogout={handleLogout}
            onShowSearch={handleShowSearch}
            onShowInsights={handleShowInsights}
            onNavigateToForm={handleNavigateToForm}
            onShowUserManagement={handleShowUserManagement}
            onShowSupervisorChat={handleShowSupervisorChat}
            onShowRescueModal={handleShowRescueModal}
            hasUnreadMessages={hasUnreadMessages}
          />
        );
      default:
        return <LoginPage onLogin={handleLogin} />;
    }
  };

  // ---------------------------
  // 🌐 Render principal
  // ---------------------------
  return (
    <main className="min-h-screen bg-background text-foreground relative">
      {renderScreen()}

      {/* Modais principais */}
      <SearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        logoConfig={logoConfig}
        onEditCadastro={handleEditCadastroRequest}
        userInfo={userInfo}
      />

      <RescueModal
        isOpen={showRescueModal}
        onClose={() => setShowRescueModal(false)}
        userInfo={userInfo}
      />

      <InsightsModal isOpen={showInsightsModal} onClose={() => setShowInsightsModal(false)} />

      <UserManagementModal
        isOpen={showUserManagementModal}
        onClose={() => setShowUserManagementModal(false)}
        currentUser={userInfo}
      />

      {/* Chat dos supervisores */}
      {(userInfo?.tipo_acesso === 'admin' || userInfo?.permissoes?.pode_ver_chat_supervisores) && (
        <SupervisorChatModal
          isOpen={showSupervisorChatModal}
          onClose={() => {
            setShowSupervisorChatModal(false);
            setHasUnreadMessages(false);
            localStorage.setItem('lastSeenChatTimestamp', new Date().toISOString());
          }}
          userInfo={userInfo}
        />
      )}

      <Toaster />
    </main>
  );
};

export default App;
