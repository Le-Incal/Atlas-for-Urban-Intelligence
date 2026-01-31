import React from 'react'
import { motion } from 'framer-motion'
import useGraphStore from '../stores/graphStore'

function ViewToggle() {
  const currentView = useGraphStore((state) => state.currentView)
  const setCurrentView = useGraphStore((state) => state.setCurrentView)

  const isIndex = currentView === 'index'

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="relative flex items-center bg-white/90 backdrop-blur border border-gray-200 rounded-full shadow-sm p-1">
        {/* Sliding highlight */}
        <motion.div
          className="absolute top-1 bottom-1 w-[calc(50%-2px)] bg-gray-900 rounded-full"
          initial={false}
          animate={{
            x: isIndex ? 2 : 'calc(100% + 2px)',
          }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
          }}
        />

        {/* Index button */}
        <button
          onClick={() => setCurrentView('index')}
          className={`relative z-10 px-5 py-1.5 text-xs font-medium transition-colors duration-200
                     ${isIndex ? 'text-white' : 'text-gray-600 hover:text-gray-900'}`}
        >
          Index
        </button>

        {/* Atlas button */}
        <button
          onClick={() => setCurrentView('atlas')}
          className={`relative z-10 px-5 py-1.5 text-xs font-medium transition-colors duration-200
                     ${!isIndex ? 'text-white' : 'text-gray-600 hover:text-gray-900'}`}
        >
          Atlas
        </button>
      </div>
    </div>
  )
}

export default ViewToggle
