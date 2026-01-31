import React from 'react'
import { motion } from 'framer-motion'
import useGraphStore from '../stores/graphStore'

function LandingPage() {
  const setCurrentView = useGraphStore((state) => state.setCurrentView)

  const handleEnter = () => {
    setCurrentView('atlas')
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-white px-6">
      <motion.div 
        className="max-w-2xl text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        {/* Title */}
        <motion.p 
          className="text-sm font-mono text-gray-400 tracking-widest uppercase mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          From Parcel to Planet · v2.1
        </motion.p>
        
        <motion.h1 
          className="text-4xl md:text-5xl lg:text-6xl font-light text-gray-900 mb-6 tracking-tight"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          Atlas for Urban Intelligence
        </motion.h1>

        {/* Description */}
        <motion.p 
          className="text-lg md:text-xl text-gray-500 font-light leading-relaxed mb-12 max-w-xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          An interactive exploration of the epistemic architecture that binds 
          physical matter to digital intelligence, regulatory constraint to 
          social memory, and human intent to synthetic agency.
        </motion.p>

        {/* Enter Button */}
        <motion.button
          onClick={handleEnter}
          className="group relative px-8 py-4 bg-gray-900 text-white font-medium rounded-full 
                     hover:bg-gray-800 transition-all duration-300 ease-out
                     focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="flex items-center gap-3">
            Enter the Atlas
            <svg 
              className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M14 5l7 7m0 0l-7 7m7-7H3" 
              />
            </svg>
          </span>
        </motion.button>

        {/* Layer Preview */}
        <motion.div 
          className="mt-16 flex items-center justify-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          {[
            { color: '#8B8682', label: 'L0' },
            { color: '#9DACB3', label: 'L1' },
            { color: '#C1ED93', label: 'L2' },
            { color: '#68D3F0', label: 'L3' },
            { color: '#BF7BE6', label: 'L4' },
            { color: '#6ECBB1', label: 'L5' },
            { color: '#D49174', label: 'L6' },
          ].map((layer, i) => (
            <motion.div
              key={layer.label}
              className="flex flex-col items-center gap-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 + (i * 0.1), duration: 0.4 }}
            >
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: layer.color }}
              />
              <span className="text-[10px] font-mono text-gray-400">
                {layer.label}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* Subtle hint */}
        <motion.p 
          className="mt-8 text-xs text-gray-300 font-mono"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
        >
          55 nodes · 72 edges · 7 layers
        </motion.p>
      </motion.div>
    </div>
  )
}

export default LandingPage
