import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Leaf, Apple, Sparkles } from 'lucide-react';

const dietOptions = [
  {
    id: 'liver-centric',
    name: 'Liver-Centric',
    description: 'Focus on liver health with organ meats and detox-friendly foods',
    icon: Heart,
    gradient: 'from-rose-500 to-pink-600',
    bgGradient: 'from-rose-50 to-pink-50'
  },
  {
    id: 'low-sugar',
    name: 'Low-Sugar',
    description: 'Protein-rich, low-carb meals for blood sugar management',
    icon: Apple,
    gradient: 'from-amber-500 to-orange-600',
    bgGradient: 'from-amber-50 to-orange-50'
  },
  {
    id: 'vegetarian',
    name: 'Vegetarian',
    description: 'Plant-based nutrition with complete proteins',
    icon: Leaf,
    gradient: 'from-emerald-500 to-green-600',
    bgGradient: 'from-emerald-50 to-green-50'
  },
  {
    id: 'custom',
    name: 'AI Custom',
    description: 'Generate a personalized plan with AI based on your preferences',
    icon: Sparkles,
    gradient: 'from-violet-500 to-purple-600',
    bgGradient: 'from-violet-50 to-purple-50'
  }
];

export default function DietSelector({ selectedDiet, onSelect }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {dietOptions.map((diet, index) => {
        const Icon = diet.icon;
        const isSelected = selectedDiet === diet.id;
        
        return (
          <motion.button
            key={diet.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onSelect(diet.id)}
            className={`
              relative p-6 rounded-2xl text-left transition-all duration-300
              ${isSelected 
                ? `bg-gradient-to-br ${diet.bgGradient} ring-2 ring-offset-2 ring-${diet.gradient.split('-')[1]}-500 shadow-lg` 
                : 'bg-white hover:shadow-lg border border-slate-100'
              }
            `}
          >
            <div className={`
              w-12 h-12 rounded-xl flex items-center justify-center mb-4
              bg-gradient-to-br ${diet.gradient}
            `}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            
            <h3 className="font-semibold text-slate-800 mb-1">{diet.name}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{diet.description}</p>
            
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-4 right-4 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm"
              >
                <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${diet.gradient}`} />
              </motion.div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}