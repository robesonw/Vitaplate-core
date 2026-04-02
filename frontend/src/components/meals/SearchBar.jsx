import React from 'react';
import { motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function SearchBar({ value, onChange, placeholder = "Search for ingredients..." }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
        <Search className="w-5 h-5" />
      </div>
      
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-12 pr-10 py-6 text-base bg-white border-slate-200 rounded-xl focus:border-emerald-400 focus:ring-emerald-400"
      />
      
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </motion.div>
  );
}