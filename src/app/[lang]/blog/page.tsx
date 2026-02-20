// src/app/[lang]/blog/page.tsx
import { Metadata } from 'next'
import { getPublishedInsights } from '@/lib/api'
import Link from 'next/link'
import { Calendar, Tag, Terminal, Filter, X } from 'lucide-react'
import { AuthorAvatar } from '@/components/AuthorAvatar'

// Force dynamic rendering to always get the latest insights
export const dynamic = 'force-dynamic'

interface Props {
  params: {
    lang: string
  }
  searchParams?: {
    author?: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  return {
    title: 'SnapAI Insights - The Signal in the Noise',
    description: 'Deep dives, technical analysis, and unfiltered opinions on AI. No fluff, just signal.',
    openGraph: {
      title: 'SnapAI Insights - The Signal in the Noise',
      description: 'Deep dives, technical analysis, and unfiltered opinions on AI.',
      type: 'website',
      images: ['/x_welcome.jpg'],
    },
  }
}

export default async function BlogPage({ params, searchParams }: Props) {
  const { lang } = await params
  const { author } = await searchParams || {}
  const insights = await getPublishedInsights(lang, author)

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      {/* Header Section */}
      <div className="mb-12 border-b-4 border-black pb-8 dark:border-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Terminal className="w-8 h-8" />
              <h1 className="text-4xl font-bold tracking-tight uppercase font-mono">SnapAI /blog</h1>
            </div>
            <p className="text-xl text-muted-foreground font-serif italic">
              &quot;We decompile the hype so you don&apos;t have to.&quot;
            </p>
          </div>

          {/* Active Filter Display */}
          {author && (
            <div className="flex items-center gap-3 bg-gray-100 dark:bg-zinc-800 px-4 py-2 rounded-lg animate-in fade-in slide-in-from-right-4">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Filter:</span>
                <span className="font-bold font-serif">{author}</span>
              </div>
              <Link 
                href={`/${lang}/blog`}
                className="ml-2 p-1 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-full transition-colors"
                title="Clear filter"
              >
                <X className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Insights List */}
      <div className="grid gap-8">
        {insights.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-xl text-gray-500">
              {author 
                ? `No insights found for editor "${author}". They might be on a coffee break.`
                : "No insights published yet. The editor is probably compiling kernels."
              }
            </p>
            {author && (
              <Link href={`/${lang}/blog`} className="text-primary hover:underline mt-4 inline-block">
                Clear filters
              </Link>
            )}
          </div>
        ) : (
          insights.map((insight) => (
            <article 
              key={insight.id} 
              className="group relative flex flex-col gap-4 border-2 border-transparent hover:border-black dark:hover:border-white p-6 rounded-xl transition-all duration-300 hover:bg-gray-50 dark:hover:bg-zinc-900"
            >
              {/* Meta Row: Author + Date + Tags */}
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-4 mb-2">
                <div className="flex items-center gap-4">
                  <AuthorAvatar author={insight.author} size="sm" showName={true} />
                  <div className="h-4 w-px bg-gray-200 dark:bg-zinc-700 mx-2 hidden sm:block" />
                  <span className="flex items-center gap-1 text-xs text-muted-foreground font-mono hidden sm:flex">
                    <Calendar className="w-3 h-3" />
                    {new Date(insight.published_at || insight.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                <span className="bg-black text-white px-2 py-0.5 text-[10px] font-bold uppercase rounded-full dark:bg-white dark:text-black">
                  INSIGHT
                </span>
              </div>

              <h2 className="text-2xl font-bold font-serif group-hover:underline decoration-4 underline-offset-4 decoration-primary mt-2">
                <Link href={`/${lang}/blog/${insight.slug}`}>
                  {insight.title}
                </Link>
              </h2>

              <p className="text-muted-foreground line-clamp-2 leading-relaxed">
                {insight.excerpt}
              </p>
              
              {/* Footer: Tags + Read More */}
              <div className="mt-4 flex items-center justify-between">
                 <div className="flex flex-wrap gap-2">
                    {insight.tags && insight.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-xs text-muted-foreground bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded">#{tag}</span>
                    ))}
                 </div>
                 <div className="flex items-center text-primary font-bold text-sm group-hover:translate-x-1 transition-transform uppercase tracking-wider">
                  Read Analysis <span className="ml-1">→</span>
                 </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  )
}
