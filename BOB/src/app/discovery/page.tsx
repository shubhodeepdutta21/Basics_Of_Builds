"use client";

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useInventory } from '@/lib/InventoryContext';
import { MOCK_PROJECTS, MOCK_COMPONENTS } from '@/lib/mockData';
import { CheckCircle2, CircleDashed, Clock, Sparkles } from 'lucide-react';

export default function DiscoveryPage() {
  const { inventory, getQuantity } = useInventory();

  const recommendedProjects = useMemo(() => {
    return MOCK_PROJECTS.map(project => {
      let matchedItems = 0;
      let totalRequired = 0;
      const missingParts: { name: string, needed: number, has: number }[] = [];

      project.requirements.forEach(req => {
        if (!req.isOptional) {
          totalRequired += 1;
          const userQty = getQuantity(req.componentId);
          if (userQty >= req.requiredQuantity) {
            matchedItems += 1;
          } else {
            const compDef = MOCK_COMPONENTS.find(c => c.id === req.componentId);
            missingParts.push({
              name: compDef?.name || 'Unknown',
              needed: req.requiredQuantity,
              has: userQty
            });
          }
        }
      });

      const matchPercentage = totalRequired === 0 ? 100 : Math.round((matchedItems / totalRequired) * 100);

      return {
        ...project,
        matchPercentage,
        missingParts
      };
    }).sort((a, b) => b.matchPercentage - a.matchPercentage); // Sort by highest match first
  }, [getQuantity]);

  return (
    <main className="min-h-screen flex flex-col pt-6 px-4 md:px-8 max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Project Discovery</h1>
          <p className="text-slate-400">Based on your inventory, here is what you can build today.</p>
        </div>
        <Link href="/inventory" className="px-4 py-2 text-sm font-medium border border-white/20 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
          Update Inventory
        </Link>
      </div>

      {inventory.length === 0 && (
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-6 text-center mb-8">
          <Sparkles className="w-8 h-8 text-indigo-400 mx-auto mb-3" />
          <h2 className="text-xl font-medium text-white mb-2">You haven&apos;t added any components yet!</h2>
          <p className="text-slate-400 mb-4">Go tell us what hardware you have, and we&apos;ll find matching projects.</p>
          <Link href="/inventory" className="inline-block px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors">
            Go to Inventory
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
        {recommendedProjects.map(project => (
          <Link 
            href={`/projects/${project.id}`} 
            key={project.id}
            className="group flex flex-col bg-slate-900 border border-white/10 rounded-2xl overflow-hidden hover:border-indigo-500/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.1)] transition-all duration-300"
          >
            <div className="h-48 bg-slate-800 relative p-6 flex flex-col justify-end overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent z-10" />
              {/* Fake gradient background for thumbnail */}
              <div className="absolute inset-0 opacity-20 group-hover:scale-105 group-hover:opacity-30 transition-all duration-500 bg-gradient-to-tr from-indigo-500 to-fuchsia-600" />
              
              <div className="relative z-20">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-white/10 text-white backdrop-blur-md border border-white/10">
                    {project.difficultyLevel}
                  </span>
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-white/10 text-slate-300 backdrop-blur-md border border-white/10">
                    <Clock className="w-3 h-3" /> {project.estimatedTime}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white group-hover:text-indigo-300 transition-colors">{project.title}</h2>
              </div>
            </div>

            <div className="p-6 flex flex-col flex-grow">
              <p className="text-slate-400 text-sm mb-6 flex-grow">{project.description}</p>
              
              <div className="mt-auto">
                <div className="flex items-end justify-between mb-2">
                  <span className="text-sm font-medium text-slate-300">Match Readiness</span>
                  <span className={`text-lg font-bold ${project.matchPercentage === 100 ? 'text-green-400' : 'text-indigo-400'}`}>
                    {project.matchPercentage}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 mb-4 overflow-hidden">
                  <div 
                    className={`h-2 rounded-full transition-all duration-1000 ${project.matchPercentage === 100 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-indigo-500'}`}
                    style={{ width: `${project.matchPercentage}%` }}
                  />
                </div>

                {project.matchPercentage === 100 ? (
                  <div className="flex items-center gap-2 text-sm text-green-400 font-medium bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                    <CheckCircle2 className="w-5 h-5" /> You have all required parts!
                  </div>
                ) : (
                  <div className="bg-slate-800/50 p-3 rounded-lg border border-white/5">
                    <p className="text-xs text-slate-400 font-medium mb-2 flex items-center gap-1">
                      <CircleDashed className="w-3 h-3" /> Missing {project.missingParts.length} parts required:
                    </p>
                    <ul className="space-y-1">
                      {project.missingParts.slice(0, 3).map((part, i) => (
                        <li key={i} className="text-xs text-rose-400/90 flex justify-between">
                          <span>{part.name}</span>
                          <span>{part.has} / {part.needed}</span>
                        </li>
                      ))}
                      {project.missingParts.length > 3 && (
                        <li className="text-xs text-slate-500 pt-1">+ {project.missingParts.length - 3} more</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
