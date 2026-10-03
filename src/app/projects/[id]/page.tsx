"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useInventory } from '@/lib/InventoryContext';
import { useCatalog } from '@/lib/CatalogContext';
import { computeMatch } from '@/lib/matching';
import CatalogStatus from '@/app/components/CatalogStatus';
import { ArrowLeft, Check, X, Clock, Layers, Flame } from 'lucide-react';
import ChatBot from '@/app/components/chatbot';

export default function ProjectPage() {
  const { id } = useParams();
  const router = useRouter();
  const { getQuantity } = useInventory();
  const catalog = useCatalog();

  // All hooks are above this line; early returns are safe from here on
  if (catalog.status !== 'ready') return <CatalogStatus />;

  const projectId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : '';
  const project = catalog.projects.find(p => p.id === projectId);

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-60px)] text-center px-4 bg-[#0d0d0d] text-[#f0ede6]">
        <h1 className="text-3xl font-bold mb-4">Project Not Found</h1>
        <p className="text-[#888888] mb-8 font-mono text-sm">This project blueprint may have been removed or does not exist.</p>
        <button
          onClick={() => router.back()}
          className="px-6 py-2.5 bg-[#e8c547] text-[#0d0d0d] font-bold rounded-lg hover:bg-[#c4a332] transition-colors text-sm"
        >
          Go Back
        </button>
      </div>
    );
  }

  const { statuses } = computeMatch(project.requirements, getQuantity, catalog.nameOf);

  const projectContext = {
    id: project.id,
    title: project.title,
    description: project.description,
    difficultyLevel: project.difficultyLevel,
    estimatedTime: project.estimatedTime,
    requirements: statuses.map(s => ({
      name: s.name,
      requiredQuantity: s.requiredQuantity,
      isOptional: s.isOptional,
    })),
    steps: project.steps,
  };

  return (
    <main className="min-h-screen flex flex-col bg-[#0d0d0d] text-[#f0ede6] font-grotesk pt-6 px-4 md:px-8 max-w-4xl mx-auto w-full pb-24 relative">

      {/* ── HEADER ── */}
      <div className="mb-8 border-b border-[#2a2a2a] pb-8">
        <Link
          href="/discovery"
          className="inline-flex items-center gap-2 text-xs font-mono text-[#888888] hover:text-[#e8c547] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Discovery
        </Link>

        <p className="font-mono text-xs tracking-[3px] text-[#e06b35] uppercase mb-2">Build Recipe</p>
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4">{project.title}</h1>
        <p className="text-base sm:text-lg text-[#888888] leading-relaxed mb-6">{project.description}</p>

        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#161616] border border-[#2a2a2a] text-xs font-mono text-[#f0ede6]">
            <Flame className="w-4 h-4 text-[#e06b35]" /> {project.difficultyLevel}
          </div>
          {project.estimatedTime && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#161616] border border-[#2a2a2a] text-xs font-mono text-[#f0ede6]">
              <Clock className="w-4 h-4 text-[#e8c547]" /> {project.estimatedTime}
            </div>
          )}
        </div>
      </div>

      {/* ── BILL OF MATERIALS (BOM) ── */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Layers className="w-5 h-5 text-[#e8c547]" /> Bill of Materials
        </h2>

        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#1f1f1f] text-[#888888] font-mono text-xs uppercase border-b border-[#2a2a2a]">
              <tr>
                <th className="px-6 py-4 font-normal">Component</th>
                <th className="px-6 py-4 font-normal">Required</th>
                <th className="px-6 py-4 font-normal">You Have</th>
                <th className="px-6 py-4 font-normal">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a2a2a]">
              {statuses.map((s, idx) => (
                <tr
                  key={idx}
                  className={s.isSufficient || s.isOptional ? 'bg-[#161616]' : 'bg-[#e06b35]/5'}
                >
                  <td className="px-6 py-4 font-medium text-[#f0ede6]">
                    {s.name}
                    {s.isOptional && (
                      <span className="ml-2 font-mono text-[10px] bg-[#1f1f1f] text-[#888888] px-2 py-0.5 rounded border border-[#3a3a3a]">
                        Optional
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-[#888888]">{s.requiredQuantity}</td>
                  <td className="px-6 py-4 font-mono text-xs">
                    <span className={s.has > 0 ? "text-[#e8c547] font-bold" : "text-[#888888]"}>
                      {s.has}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">
                    {s.isSufficient ? (
                      <span className="flex items-center gap-1.5 text-[#5dbf87] font-semibold">
                        <Check className="w-4 h-4" /> Ready
                      </span>
                    ) : s.isOptional ? (
                      <span className="text-[#888888]">Optional · not owned</span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-[#e06b35] font-semibold">
                        <X className="w-4 h-4" /> Missing {s.missing}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── BUILD GUIDE ── */}
      <section className="mb-12">
        <h2 className="text-xl font-bold mb-6">Build Instructions</h2>
        {project.steps.length === 0 ? (
          <p className="text-sm text-[#888888] font-mono bg-[#161616] border border-[#2a2a2a] rounded-xl p-6">
            No build instructions have been added for this project yet.
          </p>
        ) : (
          <div className="space-y-4">
            {project.steps.map((instruction, index) => (
              <div key={index} className="flex gap-4 bg-[#161616] border border-[#2a2a2a] p-6 rounded-xl">
                <div className="shrink-0 w-8 h-8 rounded-full bg-[#1f1f1f] border border-[#3a3a3a] text-[#e8c547] flex items-center justify-center font-mono font-bold text-sm">
                  {index + 1}
                </div>
                <p className="text-[#f0ede6] text-sm pt-1 leading-relaxed">{instruction}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Embedded ChatBot with full project context */}
      <ChatBot project={projectContext} visible={true} />
    </main>
  );
}