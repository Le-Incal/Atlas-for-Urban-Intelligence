import React from 'react'

export class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Atlas ErrorBoundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white p-8 text-center">
          <h2 className="text-lg font-medium text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-sm text-gray-500 mb-4 max-w-md">
            The Atlas view failed to load. This can happen on some browsers or devices.
          </p>
          <pre className="text-left text-xs text-gray-400 bg-gray-100 p-4 rounded overflow-auto max-h-40 mb-4">
            {this.state.error?.message ?? 'Unknown error'}
          </pre>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
