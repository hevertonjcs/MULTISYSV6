import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/supabaseClient';
import { motion } from 'framer-motion';
import { LogIn, User, Key } from 'lucide-react';

const LoginPage = ({ onLogin }) => {
  const [nome_usuario, setUsername] = useState('');
  const [senha, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (supabase) {
        // 🔹 Login via Supabase RPC (verifica usuário e senha)
        const { data, error } = await supabase.rpc('login_case_insensitive', {
          p_nome_usuario: nome_usuario,
          p_senha: senha
        });

        if (error) throw new Error(`Erro no RPC: ${error.message}`);

        if (data && data.length > 0) {
          const user = data[0];
          let permissoesUsuario = {};

          // ✅ Converter "permissoes" de string JSON para objeto JS
          try {
            if (typeof user.permissoes === 'string') {
              permissoesUsuario = JSON.parse(user.permissoes);
            } else if (typeof user.permissoes === 'object' && user.permissoes !== null) {
              permissoesUsuario = user.permissoes;
            } else {
              permissoesUsuario = {};
            }
          } catch (err) {
            console.warn('Falha ao parsear permissoes do usuário:', err);
            permissoesUsuario = {};
          }

          // ✅ Garante que todas as permissões esperadas existam
          const permissoesPadrao = {
            pode_ver_cadastros: false,
            pode_ver_insights: false,
            pode_gerenciar_usuarios: false,
            pode_ver_log_atividades: false,
            pode_usar_funcao_resgate: false,
            pode_ver_todos_cadastros: false,
            pode_ver_usuarios_ativos: false,
            pode_ver_chat_supervisores: false,
            ...permissoesUsuario,
          };

          // ✅ Monta o objeto final de usuário
          const userInfo = {
            id: user.id,
            nome_usuario: user.nome_usuario,
            tipo_acesso: user.tipo_acesso,
            equipe: user.equipe,
            permissoes: permissoesPadrao,
          };

          console.log('🔍 Permissões carregadas do Supabase:', userInfo.permissoes);

          toast({
            title: 'Login bem-sucedido!',
            description: `Bem-vindo(a) de volta, ${user.nome_usuario}!`,
          });

          // 🔹 Envia o usuário autenticado para o App
          onLogin(userInfo);
        } else {
          throw new Error('Usuário ou senha inválidos.');
        }
      } else {
        // 🔧 Fallback local (modo offline para testes)
        if (nome_usuario.toLowerCase() === 'admin' && senha.toLowerCase() === 'admin') {
          onLogin({
            nome_usuario: 'Admin Local',
            tipo_acesso: 'admin',
            equipe: 'SUPERVISOR',
            permissoes: {
              pode_ver_cadastros: true,
              pode_ver_insights: true,
              pode_ver_todos_cadastros: true,
              pode_gerenciar_usuarios: true,
            },
          });
        } else if (nome_usuario.toLowerCase() === 'vendedor' && senha.toLowerCase() === 'vendedor') {
          onLogin({
            nome_usuario: 'Vendedor Local',
            tipo_acesso: 'vendedor',
            equipe: 'EQUIPE_A',
            permissoes: {
              pode_ver_cadastros: true,
              pode_ver_insights: false,
              pode_ver_todos_cadastros: false,
            },
          });
        } else {
          throw new Error('Usuário ou senha inválidos (modo local).');
        }
      }
    } catch (error) {
      console.error('Erro de login:', error);
      toast({
        title: 'Erro de Login',
        description: error.message || 'Falha ao autenticar. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted/40 p-4">
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md p-8 space-y-6 bg-card rounded-2xl shadow-2xl border border-border/20"
      >
        <div className="text-center">
          <h1 className="text-3xl font-bold text-card-foreground">Bem-vindo(a) de volta!</h1>
          <p className="text-muted-foreground mt-2">Faça login para continuar</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username">Usuário</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="username"
                type="text"
                placeholder="Seu nome de usuário"
                value={nome_usuario}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Sua senha"
                value={senha}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-10"
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-background"></div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <LogIn className="w-5 h-5" />
                <span>Entrar</span>
              </div>
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default LoginPage;
