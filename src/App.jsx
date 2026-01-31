import React from 'react'
import useGraphStore from './stores/graphStore'
import LandingPage from './components/LandingPage'
import AtlasScene from './components/AtlasScene'

function App() {
  const currentView = useGraphStore((state) => state.currentView)

  return (
    <div className="w-full h-full bg-white">
      {currentView === 'landing' ? (
        <LandingPage />
      ) : (
        <AtlasScene />
      )}
    </div>
  )
}

export default App
