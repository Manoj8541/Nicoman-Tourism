import React from 'react';
import { FaExclamationTriangle, FaRedo } from 'react-icons/fa';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 px-4">
          <div className="max-w-md w-full text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-red-100 dark:bg-red-900/30">
              <FaExclamationTriangle className="text-4xl text-red-500" />
            </div>
            
            <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-4">
              Oops! Something Went Wrong
            </h1>
            
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              We're sorry, but something unexpected happened. Don't worry, your data is safe!
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-left">
                <p className="text-sm font-mono text-red-800 dark:text-red-300 break-all">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <button 
              onClick={this.handleReset}
              className="btn-primary inline-flex items-center gap-2"
            >
              <FaRedo /> Go Back Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;