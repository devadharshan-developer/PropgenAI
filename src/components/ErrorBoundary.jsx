import React from 'react';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full max-w-xl mx-auto my-16 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-red-200 dark:border-red-900/50 shadow-2xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center mb-4">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Something went wrong rendering the proposal
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-mono bg-slate-100 dark:bg-slate-800/80 p-3 rounded-xl overflow-x-auto text-left">
            {this.state.error?.message || 'Unknown render error'}
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={this.handleReset}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                if (this.props.onReturnHome) {
                  this.props.onReturnHome();
                } else {
                  window.location.href = '/';
                }
              }}
              className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-2 transition"
            >
              <Home className="w-4 h-4" />
              <span>Back to Builder</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
