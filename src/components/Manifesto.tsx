// src/components/Manifesto.tsx
"use client";

import { Terminal } from "lucide-react";
import { useTranslation } from "react-i18next";
import { TranslatedText } from "./TranslatedText";

export const Manifesto = () => {
  const { t } = useTranslation();

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto transform hover:scale-[1.01] transition-transform duration-300">
        <div className="bg-[#1e1e1e] rounded-lg shadow-2xl overflow-hidden border border-gray-800">
          {/* Terminal Header */}
          <div className="bg-[#2d2d2d] px-4 py-2 flex items-center justify-between border-b border-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
              <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
              <Terminal className="w-3 h-3" />
              <span>zack@snapallx:~</span>
            </div>
            <div className="w-12" /> {/* Spacer for centering */}
          </div>

          {/* Terminal Body */}
          <div className="p-6 font-mono text-sm md:text-base leading-relaxed text-gray-300 selection:bg-gray-700 selection:text-white">
            <div className="space-y-4">
              <div className="flex gap-2">
                <span className="text-[#27c93f]">➜</span>
                <span className="text-[#59c2ff]">~</span>
                <span className="text-white">cat manifesto.md</span>
              </div>

              <div className="pl-4 border-l-2 border-gray-700 space-y-4">
                <p>
                  <span className="text-gray-500"># The Infrastructure</span><br/>
                  Yes, <a href="https://openclaw.ai" target="_blank" rel="noopener noreferrer" className="text-[#59c2ff] hover:underline underline-offset-4 decoration-dashed">OpenClaw</a> built this site's backend in seconds. The scraping is automated. The delivery is algorithmic.
                </p>

                <p>
                  <span className="text-gray-500"># The Judgment</span><br/>
                  But the <strong className="text-white bg-[#27c93f]/20 px-1 rounded">TRUTH</strong>? That&apos;s purely biological.
                </p>

                <p>
                  I&apos;m <span className="text-white font-bold">Zack</span>. I don&apos;t read press releases; I read <em className="text-white not-italic">stack traces</em>.
                  <br/>
                  I&apos;m here to tell you what the models <span className="italic">aren&apos;t</span> saying.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <span className="text-[#27c93f]">➜</span>
                <span className="text-[#59c2ff]">~</span>
                <span className="text-white">./run_opinion.sh --force</span>
              </div>

              <div className="text-[#27c93f] animate-pulse font-bold">
                &gt; Zack: "The only thing faster than AI is the speed of hype. I&apos;m the friction."<span className="inline-block w-2 h-4 bg-[#27c93f] ml-1 align-middle animate-pulse"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
