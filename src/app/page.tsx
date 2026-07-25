"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const PART_DEMO_RESULTS = [
  '🤖 Obstacle-avoiding robot — 94% match',
  '🌡 Smart thermostat — 88% match',
  '🔊 Ultrasonic theremin — 82% match',
  '💡 Ambient LED matrix — 100% match',
  '📡 Distance alarm — 91% match',
];

export default function Home() {
  const [resultIdx, setResultIdx] = useState(0);
  const [activeChipIndices, setActiveChipIndices] = useState<number[]>([0, 1, 2, 4]);

  // Animate demo part chips and matching result
  useEffect(() => {
    const interval = setInterval(() => {
      // Pick random chips to highlight
      const count = 3 + Math.floor(Math.random() * 3);
      const newIndices: number[] = [];
      while (newIndices.length < count) {
        const r = Math.floor(Math.random() * 8);
        if (!newIndices.includes(r)) newIndices.push(r);
      }
      setActiveChipIndices(newIndices);
      setResultIdx((prev) => (prev + 1) % PART_DEMO_RESULTS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const demoParts = [
    'Arduino Uno',
    'HC-SR04 Sensor',
    '9V Battery',
    'Servo Motor',
    'Breadboard',
    'LED ×12',
    'Resistors',
    'Old Fan',
  ];

  return (
    <main className="min-h-screen flex flex-col bg-[#0d0d0d] text-[#f0ede6] font-grotesk overflow-x-hidden">
      
      {/* ── HERO SECTION ── */}
      <section className="relative min-h-[calc(100vh-60px)] flex flex-col items-center justify-center text-center px-6 py-16 overflow-hidden">
        {/* Background Grid */}
        <div className="hero-bg" />

        {/* Decorative Spinning Gears */}
        <div className="gear-wrap g1 pointer-events-none hidden md:block">
          <svg className="gear" width="320" height="320" viewBox="0 0 100 100">
            <path fill="#ffffff" d="M43.3,10.2l-3.1,8.1c-1.7,0.4-3.3,1-4.8,1.8l-7.8-4.1L21,22.7l4.1,7.8c-0.8,1.5-1.4,3.1-1.8,4.8l-8.1,3.1v9.2l8.1,3.1c0.4,1.7,1,3.3,1.8,4.8L21,63.3l6.6,6.6l7.8-4.1c1.5,0.8,3.1,1.4,4.8,1.8l3.1,8.1h9.2l3.1-8.1c1.7-0.4,3.3-1,4.8-1.8l7.8,4.1l6.6-6.6l-4.1-7.8c0.8-1.5,1.4-3.1,1.8-4.8l8.1-3.1v-9.2l-8.1-3.1c-0.4-1.7-1-3.3-1.8-4.8l4.1-7.8L67,16l-7.8,4.1c-1.5-0.8-3.1-1.4-4.8-1.8L51.3,10.2H43.3z M47.8,36.1c6.4,0,11.6,5.2,11.6,11.6s-5.2,11.6-11.6,11.6s-11.6-5.2-11.6-11.6S41.4,36.1,47.8,36.1z"/>
          </svg>
        </div>
        <div className="gear-wrap g2 pointer-events-none hidden md:block">
          <svg className="gear rev" width="240" height="240" viewBox="0 0 100 100">
            <path fill="#ffffff" d="M43.3,10.2l-3.1,8.1c-1.7,0.4-3.3,1-4.8,1.8l-7.8-4.1L21,22.7l4.1,7.8c-0.8,1.5-1.4,3.1-1.8,4.8l-8.1,3.1v9.2l8.1,3.1c0.4,1.7,1,3.3,1.8,4.8L21,63.3l6.6,6.6l7.8-4.1c1.5,0.8,3.1,1.4,4.8,1.8l3.1,8.1h9.2l3.1-8.1c1.7-0.4,3.3-1,4.8-1.8l7.8,4.1l6.6-6.6l-4.1-7.8c0.8-1.5,1.4-3.1,1.8-4.8l8.1-3.1v-9.2l-8.1-3.1c-0.4-1.7-1-3.3-1.8-4.8l4.1-7.8L67,16l-7.8,4.1c-1.5-0.8-3.1-1.4-4.8-1.8L51.3,10.2H43.3z"/>
          </svg>
        </div>

        <p className="font-mono text-xs tracking-[3px] text-[#e06b35] uppercase mb-6 relative z-10">
          Zero waste. Pure creation.
        </p>

        <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold tracking-tight leading-[0.95] mb-6 relative z-10 max-w-5xl">
          Turn <span className="scratch">trash</span><br />
          into <span className="text-[#e8c547]">projects</span>
        </h1>

        <p className="text-lg sm:text-xl text-[#888888] max-w-xl leading-relaxed mb-10 relative z-10">
          Log the scrap parts collecting dust in your garage. BOB finds what you can actually build — no shopping required.
        </p>

        <div className="flex flex-wrap gap-4 justify-center relative z-10">
          <Link
            href="/inventory"
            className="px-8 py-3.5 bg-[#e8c547] hover:bg-[#c4a332] text-[#0d0d0d] font-bold rounded-lg tracking-wide transition-all shadow-[0_0_20px_rgba(232,197,71,0.3)] hover:-translate-y-0.5"
          >
            Scan My Parts
          </Link>
          <a
            href="#how-it-works"
            className="px-8 py-3.5 bg-transparent border border-[#3a3a3a] hover:border-[#e8c547] text-[#f0ede6] hover:text-[#e8c547] rounded-lg tracking-wide transition-all hover:-translate-y-0.5"
          >
            See How It Works
          </a>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section className="border-y border-[#2a2a2a] bg-[#161616] grid grid-cols-1 md:grid-cols-3">
        <div className="p-8 border-b md:border-b-0 md:border-r border-[#2a2a2a] text-center hover:bg-[#1f1f1f] transition-colors">
          <div className="font-mono text-4xl font-bold text-[#e8c547] mb-1">14,800+</div>
          <div className="text-xs text-[#888888] tracking-widest uppercase font-mono">Parts Catalogued</div>
        </div>
        <div className="p-8 border-b md:border-b-0 md:border-r border-[#2a2a2a] text-center hover:bg-[#1f1f1f] transition-colors">
          <div className="font-mono text-4xl font-bold text-[#e8c547] mb-1">3,200+</div>
          <div className="text-xs text-[#888888] tracking-widest uppercase font-mono">Projects Built</div>
        </div>
        <div className="p-8 text-center hover:bg-[#1f1f1f] transition-colors">
          <div className="font-mono text-4xl font-bold text-[#e8c547] mb-1">980+</div>
          <div className="text-xs text-[#888888] tracking-widest uppercase font-mono">Makers Active</div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-20 px-6 max-w-6xl mx-auto w-full">
        <p className="font-mono text-xs tracking-[3px] text-[#e06b35] uppercase mb-3">The Process</p>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-12">From parts to project in minutes</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[1.5px] bg-[#2a2a2a] rounded-xl overflow-hidden border border-[#2a2a2a]">
          {[
            { num: '01', icon: '📦', title: 'Log your parts', desc: 'Add motors, sensors, boards, tubes, cables — anything in your workshop. Describe it or snap a photo.' },
            { num: '02', icon: '🧠', title: 'BOB analyses', desc: 'Our AI engine cross-references your inventory against thousands of verified hardware build recipes.' },
            { num: '03', icon: '⚡', title: 'Get matched projects', desc: 'See exactly what you can build today, what needs one more part, and what components to swap.' },
            { num: '04', icon: '🛠', title: 'Build with guides', desc: 'Follow step-by-step instructions from the community. Get live AI troubleshooting assistance.' },
          ].map((step, idx) => (
            <div key={idx} className="group bg-[#161616] p-8 hover:bg-[#1f1f1f] transition-all relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-transparent group-hover:bg-[#e8c547] transition-all" />
              <div className="font-mono text-5xl font-bold text-[#3a3a3a] group-hover:text-[#e8c547] transition-colors mb-4 leading-none">
                {step.num}
              </div>
              <div className="text-2xl mb-3">{step.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-[#888888] leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURE HIGHLIGHT ── */}
      <section className="py-16 px-6 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <p className="font-mono text-xs tracking-[3px] text-[#e06b35] uppercase mb-3">Smart Matching</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">BOB sees what you can&apos;t</h2>
          <p className="text-[#888888] leading-relaxed mb-8">
            Most makers look at a pile of scrap and see junk. BOB looks at the same pile and sees a weather station, an obstacle-avoiding robot, or a synthesizer. The parts you already own are worth more than you think.
          </p>
          <Link
            href="/inventory"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#e8c547] hover:bg-[#c4a332] text-[#0d0d0d] font-bold rounded-lg transition-all"
          >
            Start Scanning →
          </Link>
        </div>

        <div className="bg-[#161616] border border-[#2a2a2a] rounded-2xl p-8 flex flex-col items-center justify-center relative overflow-hidden aspect-[4/3]">
          <div className="w-full text-center">
            <div className="flex flex-wrap gap-2 justify-center mb-6">
              {demoParts.map((part, i) => {
                const isSelected = activeChipIndices.includes(i);
                return (
                  <span
                    key={part}
                    className={`font-mono text-xs px-3 py-1.5 rounded-md border transition-all duration-300 ${
                      isSelected
                        ? 'border-[#5dbf87] text-[#5dbf87] bg-[#5dbf87]/10'
                        : 'border-[#3a3a3a] text-[#888888] bg-[#1f1f1f]'
                    }`}
                  >
                    {part} {isSelected ? '✓' : ''}
                  </span>
                );
              })}
            </div>

            <div className="text-[#3a3a3a] text-xl mb-4 animate-bounce">↓</div>

            <div className="bg-gradient-to-r from-[#e8c547]/15 to-[#c4a332]/10 border border-[#c4a332] rounded-lg p-4 font-mono text-sm text-[#e8c547] transition-all duration-300">
              {PART_DEMO_RESULTS[resultIdx]}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="bg-[#161616] border-y border-[#2a2a2a] py-20 px-6">
        <div className="max-w-6xl mx-auto w-full">
          <p className="font-mono text-xs tracking-[3px] text-[#e06b35] uppercase mb-3">Community</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-12">Makers who stopped buying new</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-[1px] bg-[#2a2a2a] rounded-xl overflow-hidden border border-[#2a2a2a]">
            {[
              { quote: '"I had three dead drones and a box of random servos. BOB turned that into a full home automation rig. Didn\'t buy a single component."', author: 'Jona K.', meta: 'Hardware tinkerer · Berlin', avatar: 'JK' },
              { quote: '"As a teacher, I use BOB to show students that creativity beats budget every time. Class builds something new from e-waste every week."', author: 'Riya M.', meta: 'STEM educator · Bangalore', avatar: 'RM' },
              { quote: '"The community recipes are insane. Someone built a CNC router from a dead 3D printer and an old scanner — then BOB matched me with the same parts."', author: 'Tariq S.', meta: 'Garage machinist · Dubai', avatar: 'TS' },
            ].map((t, idx) => (
              <div key={idx} className="bg-[#161616] p-8 hover:bg-[#1f1f1f] transition-colors flex flex-col justify-between">
                <p className="text-sm text-[#f0ede6] leading-relaxed mb-6 italic">{t.quote}</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#1f1f1f] border border-[#3a3a3a] flex items-center justify-center font-mono text-xs text-[#e8c547] font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{t.author}</div>
                    <div className="text-xs text-[#888888]">{t.meta}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-24 px-6 text-center border-b border-[#2a2a2a] bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(42,42,42,0.2)_10px,rgba(42,42,42,0.2)_11px)]">
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4">
          Your next <span className="text-[#e8c547]">build</span> is already in your garage.
        </h2>
        <p className="text-[#888888] mb-8 max-w-md mx-auto text-base">
          Join 980+ makers finding value in what they already have.
        </p>
        <Link
          href="/login"
          className="inline-block px-8 py-3.5 bg-[#e8c547] hover:bg-[#c4a332] text-[#0d0d0d] font-bold rounded-lg transition-all shadow-[0_0_20px_rgba(232,197,71,0.3)]"
        >
          Create Free Account
        </Link>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#161616] border-t border-[#2a2a2a] py-8 px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="font-mono text-lg font-bold text-[#e8c547]">BOB</div>
        <div className="flex gap-6 font-mono text-xs text-[#888888]">
          <Link href="/inventory" className="hover:text-[#f0ede6] transition-colors">Inventory</Link>
          <Link href="/discovery" className="hover:text-[#f0ede6] transition-colors">Discover</Link>
          <Link href="/community" className="hover:text-[#f0ede6] transition-colors">Community</Link>
          <Link href="/login" className="hover:text-[#f0ede6] transition-colors">Sign In</Link>
        </div>
        <div className="font-mono text-xs text-[#888888]">
          © 2026 BOB · Build Out of Broken
        </div>
      </footer>

    </main>
  );
}