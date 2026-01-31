import React from 'react'
import { motion } from 'framer-motion'
import useGraphStore from '../stores/graphStore'

function ViewToggle() {
  const currentView = useGraphStore((state) => state.currentView)
  const setCurrentView = useGraphStore((state) => state.setCurrentView)

  const isAtlas = currentView === 'atlas'

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="relative flex items-center bg-white/90 backdrop-blur border border-gray-200 rounded-full shadow-sm p-1.5">
        {/* Sliding highlight */}
        <motion.div
          className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-gray-100 rounded-full shadow-sm"
          initial={false}
          animate={{
            x: isAtlas ? 6 : 'calc(100% + 6px)',
          }}
          transition={{
            type: 'spring',
            stiffness: 180,
            damping: 22,
            mass: 1,
          }}
        />

        {/* Atlas button */}
        <button
          onClick={() => setCurrentView('atlas')}
          className={`relative z-10 px-5 py-1.5 text-xs font-medium transition-colors duration-200
                     ${isAtlas ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Atlas
        </button>

        {/* Index button */}
        <button
          onClick={() => setCurrentView('index')}
          className={`relative z-10 px-5 py-1.5 text-xs font-medium transition-colors duration-200
                     ${!isAtlas ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
        >
          Index
        </button>
      </div>
    </div>
  )
}

export default ViewToggle
