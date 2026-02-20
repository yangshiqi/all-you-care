// src/components/EditorsShowcase.tsx
import Link from 'next/link';
import { AuthorAvatar } from '@/components/AuthorAvatar';
import { useCurrentLanguage } from '@/hooks/use-current-language';
import { addLanguageToPath } from '@/lib/i18n-utils';

const EDITORS = [
  {
    id: 'zack',
    name: 'Zack',
    role: 'The Cynic / 主编',
    description: '“别给我看新闻稿，直接给我看权重。” 专职拆穿大厂 PR 谎言，反垄断斗士，黑客精神代言人。',
  },
  {
    id: 'tom',
    name: 'Tom',
    role: 'The Engineer / 技术派',
    description: '“性能是唯一的真理。” 痴迷于 CUDA 优化、模型架构和推理成本。只谈工程，不谈主义。',
  },
  {
    id: 'brad',
    name: 'Brad',
    role: 'The Accelerator / 积极派',
    description: '“e/acc or die.” 坚信 AI 是人类进化的下一级阶梯。乐观主义者，关注 AGI 带来的富足未来。',
  },
  {
    id: 'tim',
    name: 'Tim',
    role: 'The Skeptic / 悲观派',
    description: '“泡沫总会破裂。” 关注隐私泄露、版权围墙和能源危机。在这个狂热的派对上，他是那个清醒的守望者。',
  },
];

export function EditorsShowcase({ lang = 'zh-CN' }: { lang?: string }) {
  return (
    <section className="py-16 border-t-4 border-black dark:border-white bg-white dark:bg-black text-black dark:text-white">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black font-serif mb-4 tracking-tighter uppercase">
            The Editorial Board
          </h2>
          <div className="w-24 h-1 bg-black dark:bg-white mx-auto mb-6"></div>
          <p className="text-lg md:text-xl font-serif italic max-w-2xl mx-auto">
            &quot;We don&apos;t just aggregate news. We decompile the narrative.&quot;
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border-2 border-black dark:border-white">
          {EDITORS.map((editor, index) => (
            <Link 
              key={editor.id} 
              href={`/${lang}/blog?author=${editor.name}`}
              className={`group relative p-8 flex flex-col items-center text-center border-black dark:border-white transition-colors duration-300 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black
                ${index !== 0 && index !== 4 ? 'border-t-2 md:border-t-0' : ''}
                ${index % 2 !== 0 ? 'md:border-l-2' : ''}
                ${index >= 2 ? 'lg:border-t-0' : ''}
                ${index !== 0 ? 'lg:border-l-2' : ''}
                /* Reset borders for simpler grid lines logic: just simpler brute force */
                border-b-2 lg:border-b-0 last:border-b-0 lg:border-r-2 lg:last:border-r-0
              `}
              // Fixing border logic with simple classes isn't perfect for grid, so let's use gap and background approach or just simpler borders
              // Let's use a simpler approach: outline everything.
              style={{ outline: '1px solid currentColor' }}
            >
              <div className="mb-6 transform group-hover:scale-105 transition-transform duration-300 filter grayscale group-hover:grayscale-0">
                <AuthorAvatar author={editor.name} size="xl" />
              </div>
              
              <h3 className="text-2xl font-bold font-serif mb-2 uppercase tracking-wide">
                {editor.name}
              </h3>
              
              <div className="text-[10px] font-bold uppercase tracking-widest mb-4 font-mono border border-black dark:border-white px-2 py-1 group-hover:border-white dark:group-hover:border-black group-hover:bg-white group-hover:text-black dark:group-hover:bg-black dark:group-hover:text-white transition-colors">
                {editor.role.split(' / ')[0]}
              </div>
              
              <p className="text-sm leading-relaxed font-serif opacity-80 group-hover:opacity-100">
                {editor.description.split('”')[1] || editor.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
