import React from 'react';
import { Button } from '@/components/ui/button';
import {
  LogOut,
  Search,
  BarChart2,
  PlusCircle,
  Users,
  MessageSquare,
  LifeBuoy,
} from 'lucide-react';
import WelcomeHeader from '@/components/WelcomeHeader';
import ActiveUsersIndicator from '@/components/ActiveUsersIndicator';
import ActivityLogFeed from '@/components/ActivityLogFeed';

/**
 * ✅ AdminDashboard atualizado:
 * - Recebe o `presenceChannel` direto do App.jsx.
 * - Passa o canal para o `ActiveUsersIndicator` (mostra usuários online em tempo real).
 * - Mantém todas as permissões e comportamentos originais.
 */
const AdminDashboard = ({
  userInfo,
  onLogout,
  onShowSearch,
  onShowInsights,
  onNavigateToForm,
  onShowUserManagement,
  onShowSupervisorChat,
  onShowRescueModal,
  hasUnreadMessages,
  presenceChannel, // 🆕 Canal de presença vindo do App.jsx
}) => {
  const permissions = userInfo?.permissoes || {};

  // 🔐 Permissões derivadas do Supabase
  const canViewCadastros = permissions.pode_ver_cadastros;
  const canViewInsights = permissions.pode_ver_insights;
  const canManageUsers = permissions.pode_gerenciar_usuarios;
  const canViewChat = permissions.pode_ver_chat_supervisores;
  const canViewActiveUsers = permissions.pode_ver_usuarios_ativos;
  const canViewActivityLog = permissions.pode_ver_log_atividades;
  const canUseRescueFunction = permissions.pode_usar_funcao_resgate;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/40 text-foreground p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* ---------------- HEADER ---------------- */}
        <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <WelcomeHeader userInfo={userInfo} />
          <div className="flex items-center gap-2">
            <Button onClick={onLogout} variant="destructive" size="sm">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </header>

        {/* ---------------- MAIN CONTENT ---------------- */}
        <main>
          {/* 🔘 Botões principais do dashboard */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Sempre visível */}
            <DashboardButton
              icon={<PlusCircle />}
              label="Novo Cadastro"
              onClick={onNavigateToForm}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            />

            {/* Condicionais com base nas permissões */}
            {canViewCadastros && (
              <DashboardButton icon={<Search />} label="Pesquisar Cadastros" onClick={onShowSearch} />
            )}

            {canViewInsights && (
              <DashboardButton icon={<BarChart2 />} label="Ver Insights" onClick={onShowInsights} />
            )}

            {canManageUsers && (
              <DashboardButton
                icon={<Users />}
                label="Gerenciar Usuários"
                onClick={onShowUserManagement}
              />
            )}

            {canViewChat && (
              <DashboardButton
                icon={<MessageSquare />}
                label="Chat Supervisores"
                onClick={onShowSupervisorChat}
                hasNotification={hasUnreadMessages}
              />
            )}

            {canUseRescueFunction && (
              <DashboardButton
                icon={<LifeBuoy />}
                label="Função Resgate"
                onClick={onShowRescueModal}
                className="bg-amber-500 text-amber-foreground hover:bg-amber-500/90"
              />
            )}
          </section>

          {/* ---------------- SESSÕES INFERIORES ---------------- */}
          {(canViewActiveUsers || canViewActivityLog) && (
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 🟢 Indicador de usuários online */}
              {canViewActiveUsers && (
                <div className="lg:col-span-1">
                  <ActiveUsersIndicator presenceChannel={presenceChannel} />
                </div>
              )}

              {/* 📜 Histórico de atividades */}
              {canViewActivityLog && (
                <div className={canViewActiveUsers ? 'lg:col-span-2' : 'lg:col-span-3'}>
                  <ActivityLogFeed userInfo={userInfo} />
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

/**
 * 🔘 Componente padrão para botões do dashboard
 * Mantém estilo visual consistente e suporte a notificações.
 */
const DashboardButton = ({ icon, label, onClick, className = '', hasNotification = false }) => (
  <Button
    onClick={onClick}
    className={`w-full h-24 text-lg font-semibold flex flex-col items-center justify-center gap-2 transition-transform transform hover:scale-105 relative ${className}`}
    variant={className ? 'default' : 'outline'}
  >
    {hasNotification && (
      <span className="absolute top-2 right-2 flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
      </span>
    )}
    {icon}
    <span>{label}</span>
  </Button>
);

export default AdminDashboard;
