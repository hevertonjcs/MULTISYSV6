import React from 'react';

/**
 * ✅ ErrorBoundary
 * - Evita tela branca em erros inesperados.
 * - Mostra uma mensagem elegante de fallback.
 * - Permite recarregar a página com um clique.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('🔴 ErrorBoundary capturou um erro:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-foreground">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-bold mb-2">⚠️ Ocorreu um erro inesperado</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Tente recarregar a página ou entrar novamente.
            </p>
            <button
              className="px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
            >
              Recarregar
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
