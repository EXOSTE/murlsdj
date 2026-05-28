import { Component, type ReactNode } from "react";
import { Link } from "react-router-dom";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-creme flex flex-col items-center justify-center px-4 text-center">
        <div className="absolute top-0 left-0 right-0 h-1 bg-jaune" />
        <p className="text-bleu text-xs tracking-widest uppercase mb-3">Mur LSDJ</p>
        <h1 className="font-serif text-3xl text-encre mb-3">Une erreur inattendue</h1>
        <p className="text-slate-500 text-sm mb-6 max-w-sm">
          Quelque chose s'est mal passé. Rechargez la page ou revenez à l'accueil.
        </p>
        {this.state.error && (
          <pre className="text-xs text-slate-400 bg-white border border-slate-100 rounded-xl px-4 py-3 mb-6 max-w-sm overflow-auto text-left">
            {this.state.error.message}
          </pre>
        )}
        <div className="flex gap-3">
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="text-sm text-bleu border border-bleu/30 rounded-full px-4 py-2 hover:bg-bleu/5 transition-colors"
          >
            Réessayer
          </button>
          <Link
            to="/"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="text-sm bg-bleu text-white rounded-full px-4 py-2 hover:bg-bleu/90 transition-colors"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }
}
