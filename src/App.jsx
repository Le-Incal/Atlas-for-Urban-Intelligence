import React from 'react'
import useGraphStore from './stores/graphStore'
import LandingPage from './components/LandingPage'
import AtlasScene from './components/AtlasScene'
import IndexPage from './components/IndexPage'
import { ErrorBoundary } from './components/ErrorBoundary'

function App() {
  const currentView = useGraphStore((state) => state.currentView)

  return (
    <div className="w-full h-full min-h-screen bg-white">
      {currentView === 'landing' ? (
        <LandingPage />
      ) : currentView === 'index' ? (
        <IndexPage />
      ) : (
        <ErrorBoundary>
          <AtlasScene />
        </ErrorBoundary>
      )}
    </div>
  )
}

export default App
