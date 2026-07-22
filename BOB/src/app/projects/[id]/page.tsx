"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useInventory } from '@/lib/InventoryContext';
import { MOCK_PROJECTS, MOCK_COMPONENTS } from '@/lib/mockData';
import { ArrowLeft, Check, X, Clock, Layers, Flame } from 'lucide-react';

export default function ProjectPage() {
  const { id } = useParams();
  const router = useRouter();
  const { getQuantity } = useInventory();

  // Next.js 15 params type bypass for simplicity
  const projectId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : '';
  const project = MOCK_PROJECTS.find(p => p.id === projectId);

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
        <h1 className="text-3xl font-bold text-white mb-4">Project Not Found</h1>
        <p className="text-slate-400 mb-8">This project may have been removed or does not exist.</p>
        <button onClick={() => router.back()} className="px-6 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col pt-6 px-4 md:px-8 max-w-4xl mx-auto w-full pb-24">
      {/* Header */}
      <div className="mb-8">
        <Link href="/discovery" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-indigo-400 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Discovery
        </Link>
        <h1 className="text-4xl font-bold text-white mb-4">{project.title}</h1>
        <p className="text-xl text-slate-300 mb-6">{project.description}</p>
        
        <div className="flex gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-200">
            <Flame className="w-4 h-4 text-orange-400" /> {project.difficultyLevel}
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-200">
            <Clock className="w-4 h-4 text-blue-400" /> {project.estimatedTime}
          </div>
        </div>
      </div>

      <hr className="border-white/10 mb-8" />

      {/* Bill of Materials (BOM) */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Layers className="w-6 h-6 text-indigo-400" /> Bill of Materials
        </h2>
        
        <div className="bg-slate-900 border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-800/50 text-slate-300 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 font-medium">Component</th>
                <th className="px-6 py-4 font-medium">Required</th>
                <th className="px-6 py-4 font-medium">You Have</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {project.requirements.map((req, idx) => {
                const comp = MOCK_COMPONENTS.find(c => c.id === req.componentId);
                const userQty = getQuantity(req.componentId);
                const isSufficient = userQty >= req.requiredQuantity;

                return (
                  <tr key={idx} className={isSufficient ? 'bg-white/[0.02]' : 'bg-rose-950/20'}>
                    <td className="px-6 py-4 font-medium text-slate-200">
                      {comp?.name || 'Unknown Item'}
                      {req.isOptional && <span className="ml-2 text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">Optional</span>}
                    </td>
                    <td className="px-6 py-4 text-slate-300">{req.requiredQuantity}</td>
                    <td className="px-6 py-4">
                      <span className={userQty > 0 ? "text-indigo-300 font-medium" : "text-slate-500"}>
                        {userQty}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {isSufficient ? (
                        <span className="flex items-center gap-1.5 text-green-400 font-medium">
                          <Check className="w-4 h-4" /> Ready
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-rose-400 font-medium">
                          <X className="w-4 h-4" /> Missing {req.requiredQuantity - userQty}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Mock Build Guide */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-6">Build Instructions</h2>
        <div className="space-y-6">
          {[
            "Gather all components required from the Bill of Materials.",
            "Connect the power supply strictly keeping polarity in mind to avoid frying components.",
            "Flash the firmware using the provided source code link (mock code).",
            "Assemble the frame and test the basic functionally.",
          ].map((instruction, index) => (
            <div key={index} className="flex gap-4 bg-white/5 border border-white/10 p-6 rounded-xl">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold">
                {index + 1}
              </div>
              <p className="text-slate-300 pt-1 leading-relaxed">
                {instruction}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
