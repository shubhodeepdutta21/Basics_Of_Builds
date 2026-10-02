"use client";

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useInventory } from '@/lib/InventoryContext';
import { MOCK_COMPONENTS } from '@/lib/mockData';
import { supabase } from '@/lib/db';
import { Cpu, Plus, Minus, ArrowRight, Trash2, Search, Sparkles, Check, PackageCheck } from 'lucide-react';

export default function InventoryPage() {
  const { inventory, addToInventory, removeFromInventory, getQuantity, clearInventory } = useInventory();

  const [baseComponents, setBaseComponents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Custom component form state for "+ Add Part"
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState('Microcontrollers');
  const [customDesc, setCustomDesc] = useState('');

  useEffect(() => {
    const fetchComponents = async () => {
      try {
        const { data, error } = await supabase.from('components').select('*');
        if (error || !data || data.length === 0) {
          setBaseComponents(MOCK_COMPONENTS);
        } else {
          setBaseComponents(data);
        }
      } catch (err) {
        setBaseComponents(MOCK_COMPONENTS);
      }
    };

    fetchComponents();
  }, []);

  const handleAddCustomPart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    addToInventory(`custom_${Date.now()}`, 1,{
      name: customName.trim(),
      category: customCategory,
      description: customDesc.trim() || 'User added workshop hardware component.',
    });

    setCustomName('');
    setCustomDesc('');
    setShowAddModal(false);
  };

  const customComponents= useMemo(
    () => 
      inventory
        .filter(item => item.componentId.startsWith('custom_'))
        .map(item => ({
          id: item.componentId,
          name: item.name || 'Custom part',
          category: item.category || 'Basics',
          description: item.description || 'User added workshop hardware component.',
        })),
    [inventory]
  );

  const components= useMemo(
    () => [...customComponents, ...baseComponents],
    [customComponents, baseComponents]
  );
  
  const categories = ['all', 'Microcontrollers', 'Sensors', 'Displays', 'Actuators', 'Basics', 'Materials'];

  const filteredComponents = useMemo(() => {
    return components.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || item.category.toLowerCase() === selectedCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [components, searchQuery, selectedCategory]);

  return (
    <main className="min-h-screen flex flex-col bg-[#0d0d0d] text-[#f0ede6] font-grotesk pt-6 px-4 md:px-8 max-w-6xl mx-auto w-full pb-20">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 pb-6 border-b border-[#2a2a2a] gap-4">
        <div>
          <p className="font-mono text-xs tracking-[3px] text-[#e06b35] uppercase mb-1">Your Workshop</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Parts Inventory</h1>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 text-sm font-bold bg-[#e8c547] hover:bg-[#c4a332] text-[#0d0d0d] rounded-lg transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(232,197,71,0.2)]"
          >
            <Plus className="w-4 h-4" /> Add Custom Part
          </button>
          <button
            onClick={clearInventory}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors border border-[#2a2a2a] hover:border-rose-900/50"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear All
          </button>
          <Link
            href="/discovery"
            className="flex items-center gap-2 px-4 py-2 bg-[#161616] border border-[#3a3a3a] hover:border-[#e8c547] text-[#f0ede6] hover:text-[#e8c547] rounded-lg transition-colors font-medium text-sm"
          >
            Discover Projects <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* ── SEARCH & CATEGORY FILTER BAR ── */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center mb-8 pb-6 border-b border-[#2a2a2a]">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#888888] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search parts by name or description..."
            className="w-full bg-[#161616] border border-[#3a3a3a] text-[#f0ede6] text-sm pl-10 pr-4 py-2.5 rounded-lg outline-none focus:border-[#e8c547] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-mono transition-all whitespace-nowrap border ${
                  isSelected
                    ? 'border-[#e8c547] text-[#e8c547] bg-[#e8c547]/10'
                    : 'border-[#2a2a2a] text-[#888888] bg-[#1f1f1f] hover:border-[#3a3a3a] hover:text-[#f0ede6]'
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── INVENTORY GRID ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-12">
        {filteredComponents.map((component) => {
          const qty = getQuantity(String(component.id));
          const isSelected = qty > 0;

          return (
            <div
              key={component.id}
              className={`relative p-5 rounded-xl border transition-all duration-200 flex flex-col h-full bg-[#161616] ${
                isSelected
                  ? 'border-[#e8c547] bg-[#161616] shadow-[0_0_15px_rgba(232,197,71,0.1)]'
                  : 'border-[#2a2a2a] hover:border-[#3a3a3a] hover:bg-[#1f1f1f]'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-[#1f1f1f] border border-[#3a3a3a] flex items-center justify-center text-lg">
                  <Cpu className="w-5 h-5 text-[#e8c547]" />
                </div>
                <span
                  className={`font-mono text-[10px] uppercase px-2 py-0.5 rounded border tracking-wider ${
                    isSelected
                      ? 'bg-[#4a9b6f]/15 text-[#5dbf87] border-[#4a9b6f]/30'
                      : 'bg-[#1f1f1f] text-[#888888] border-[#3a3a3a]'
                  }`}
                >
                  {isSelected ? `In Stock (${qty})` : 'Not Owned'}
                </span>
              </div>

              <div className="flex-grow">
                <h3 className="font-semibold text-[#f0ede6] text-base mb-1">{component.name}</h3>
                <p className="text-xs text-[#888888] line-clamp-2 leading-relaxed mb-4">{component.description}</p>
              </div>

              <div className="pt-4 border-t border-[#2a2a2a] flex items-center justify-between mt-auto">
                <span className="font-mono text-xs text-[#888888]">{component.category}</span>

                {isSelected ? (
                  <div className="flex items-center gap-2 bg-[#0d0d0d] rounded-lg p-1 border border-[#3a3a3a]">
                    <button
                      onClick={() => qty === 1 ? removeFromInventory(String(component.id)) : addToInventory(String(component.id), -1)}
                      className="p-1 text-[#888888] hover:text-[#f0ede6] hover:bg-[#1f1f1f] rounded transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-5 text-center font-mono text-xs font-bold text-[#e8c547]">{qty}</span>
                    <button
                      onClick={() => addToInventory(String(component.id), 1)}
                      className="p-1 text-[#888888] hover:text-[#f0ede6] hover:bg-[#1f1f1f] rounded transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => addToInventory(String(component.id), 1)}
                    className="px-3 py-1.5 text-xs font-mono bg-[#1f1f1f] hover:bg-[#e8c547] hover:text-[#0d0d0d] text-[#f0ede6] rounded-lg transition-colors font-medium border border-[#3a3a3a]"
                  >
                    + Add
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── AI SUGGEST PANEL ── */}
      <div className="bg-[#161616] border border-[#e8c547]/40 rounded-2xl overflow-hidden mb-12">
        <div className="bg-[#e8c547]/10 border-b border-[#2a2a2a] px-6 py-4 flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#e8c547] animate-pulse" />
          <h2 className="text-sm font-semibold text-[#e8c547]">BOB Suggests — Based on your inventory</h2>
        </div>

        <div className="p-6">
          <p className="text-xs text-[#888888] mb-3">Parts available for matching:</p>
          <div className="flex flex-wrap gap-2 mb-6">
            {inventory.length > 0 ? (
              inventory.map((item) => {
                const comp = components.find(c => String(c.id) === String(item.componentId));
                return (
                  <span key={item.componentId} className="font-mono text-xs px-3 py-1.5 rounded-md border border-[#5dbf87]/30 text-[#5dbf87] bg-[#4a9b6f]/10">
                    {item.name ||comp?.name || `Part #${item.componentId}`} ✓ ({item.quantity})
                  </span>
                );
              })
            ) : (
              <span className="text-xs text-[#888888] italic">No parts selected yet. Add parts above to see AI suggestions.</span>
            )}
          </div>

          <div className="text-center text-[#888888] text-xs font-mono mb-4">↓ Click below to discover projects for your parts ↓</div>

          <div className="flex justify-center">
            <Link
              href="/discovery"
              className="px-6 py-3 bg-[#e8c547] hover:bg-[#c4a332] text-[#0d0d0d] font-bold rounded-lg transition-all flex items-center gap-2 text-sm shadow-[0_0_15px_rgba(232,197,71,0.2)]"
            >
              <Sparkles className="w-4 h-4" /> Discover Matched Projects
            </Link>
          </div>
        </div>
      </div>

      {/* ── ADD CUSTOM PART MODAL ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-[#0d0d0d]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold mb-1">Add Custom Hardware Part</h2>
            <p className="text-xs text-[#888888] mb-6">Add a unique or custom component to your workshop inventory.</p>

            <form onSubmit={handleAddCustomPart} className="space-y-4">
              <div>
                <label className="block font-mono text-xs text-[#888888] uppercase mb-1">Component Name</label>
                <input
                  type="text"
                  required
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. NEMA 17 Stepper Motor"
                  className="w-full bg-[#0d0d0d] border border-[#3a3a3a] text-[#f0ede6] text-sm px-3.5 py-2.5 rounded-lg outline-none focus:border-[#e8c547]"
                />
              </div>

              <div>
                <label className="block font-mono text-xs text-[#888888] uppercase mb-1">Category</label>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full bg-[#0d0d0d] border border-[#3a3a3a] text-[#f0ede6] text-sm px-3.5 py-2.5 rounded-lg outline-none focus:border-[#e8c547]"
                >
                  <option value="Microcontrollers">Microcontrollers</option>
                  <option value="Sensors">Sensors</option>
                  <option value="Displays">Displays</option>
                  <option value="Actuators">Actuators</option>
                  <option value="Basics">Basics</option>
                  <option value="Materials">Materials</option>
                </select>
              </div>

              <div>
                <label className="block font-mono text-xs text-[#888888] uppercase mb-1">Description (Optional)</label>
                <textarea
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  placeholder="e.g. 1.8 degree step angle, 12V 1.5A motor"
                  rows={3}
                  className="w-full bg-[#0d0d0d] border border-[#3a3a3a] text-[#f0ede6] text-sm px-3.5 py-2.5 rounded-lg outline-none focus:border-[#e8c547] resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 text-xs font-mono border border-[#3a3a3a] text-[#888888] hover:text-[#f0ede6] rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-mono font-bold bg-[#e8c547] hover:bg-[#c4a332] text-[#0d0d0d] rounded-lg transition-colors"
                >
                  Add to Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}
