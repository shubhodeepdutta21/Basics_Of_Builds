"use client";

import React from 'react';
import Link from 'next/link';
import { useInventory } from '@/lib/InventoryContext';
import { MOCK_COMPONENTS } from '@/lib/mockData';
import { Cpu, Plus, Minus, ArrowRight, Trash2 } from 'lucide-react';

export default function InventoryPage() {
  const { addToInventory, removeFromInventory, getQuantity, clearInventory } = useInventory();

  // Group components by category
  const groupedComponents = MOCK_COMPONENTS.reduce((acc, current) => {
    (acc[current.category] = acc[current.category] || []).push(current);
    return acc;
  }, {} as Record<string, typeof MOCK_COMPONENTS>);

  return (
    <main className="min-h-screen flex flex-col pt-6 px-4 md:px-8 max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">My Inventory</h1>
          <p className="text-slate-400">Select the components and hardware you currently own.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={clearInventory}
            className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-950/30 rounded-lg transition-colors border border-transparent hover:border-red-900/50"
          >
            <Trash2 className="w-4 h-4" /> Clear All
          </button>
          <Link href="/discovery" className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors font-medium text-sm">
            Discover Projects <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="grid gap-12 pb-20">
        {Object.entries(groupedComponents).map(([category, items]) => (
          <section key={category}>
            <h2 className="text-xl font-semibold text-indigo-300 mb-4 flex items-center gap-2">
              <Cpu className="w-5 h-5" /> {category}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map(component => {
                const qty = getQuantity(component.id);
                const isSelected = qty > 0;

                return (
                  <div 
                    key={component.id} 
                    className={`relative p-4 rounded-xl border transition-all duration-200 flex flex-col h-full ${
                      isSelected 
                        ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.15)]' 
                        : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex-grow">
                      <h3 className="font-medium text-slate-200 text-lg mb-1">{component.name}</h3>
                      <p className="text-sm text-slate-500 line-clamp-2 mb-4">{component.description}</p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                      <span className="text-sm font-medium text-slate-400">Qty:</span>
                      
                      {isSelected ? (
                        <div className="flex items-center gap-3 bg-slate-900 rounded-lg p-1 border border-white/10">
                          <button 
                            onClick={() => qty === 1 ? removeFromInventory(component.id) : addToInventory(component.id, -1)}
                            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-6 text-center font-medium text-slate-200">{qty}</span>
                          <button 
                            onClick={() => addToInventory(component.id, 1)}
                            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => addToInventory(component.id, 1)}
                          className="px-3 py-1.5 text-sm bg-white/10 hover:bg-indigo-500 hover:text-white text-slate-300 rounded-lg transition-colors font-medium w-full flex justify-center"
                        >
                          Add to Inventory
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
