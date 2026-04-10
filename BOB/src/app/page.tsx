import React from 'react';
import Link from 'next/link';
import { Cpu, Search, Blocks, Battery, Flame, ArrowRight } from 'lucide-react';


export default function Home() {
  return (
    <main className="flex-grow flex flex-col relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-indigo-500/20 to-transparent -z-10 pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute top-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Cpu className="w-8 h-8 text-indigo-400" />
          <span className="text-xxl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">
            BOB
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/discovery" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
            Discover Projects
          </Link>
          <Link href="/inventory" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
            My Inventory
          </Link>
          <Link href="/discovery" className="px-4 py-2 text-sm font-medium bg-white/10 hover:bg-white/20 text-white rounded-full transition-all border border-white/10">
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div>
        <div>
          <div className="flex-grow flex flex-col items-center justify-center px-4 py-20 text-center z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-8">
              <Flame className="w-3 h-3" />
              <span>Discover 200+ Community DIY Projects</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6">
              Turn your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-400">spare parts</span><br />
              into brilliant projects.
            </h1>

            <p className="max-w-2xl text-lg md:text-xl text-slate-400 mb-10">
              Have an Arduino, a few resistors, and a spare laptop? We&apos;ll tell you exactly what you can build.
              Stop watching tutorials you don&apos;t have parts for.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link href="/inventory" className="group relative px-6 py-3 rounded-full bg-indigo-500 text-white font-medium hover:bg-indigo-600 transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                <span className="flex items-center gap-2">
                  Check Your Inventory <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
              <Link href="/discovery" className="px-6 py-3 rounded-full bg-white/5 border border-white/10 text-slate-300 font-medium hover:bg-white/10 transition-all flex items-center gap-2">
                <Search className="w-4 h-4" /> Browse Projects
              </Link>
            </div>

            {/* Floating Icons */}
            <div className="mt-20 w-full max-w-4xl relative">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent z-10" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 opacity-50">
                {[
                  { icon: Cpu, label: "Microcontrollers", color: "text-green-400" },
                  { icon: Blocks, label: "Sensors & Modules", color: "text-blue-400" },
                  { icon: Battery, label: "Power Supplies", color: "text-yellow-400" },
                  { icon: Flame, label: "Soldering & Tools", color: "text-orange-400" },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center justify-center p-6 border border-white/5 rounded-2xl bg-white/[0.02] backdrop-blur-sm">
                    <item.icon className={`w-10 h-10 mb-4 ${item.color}`} />
                    <span className="text-sm font-medium text-slate-400">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
