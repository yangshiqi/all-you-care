// src/app/[lang]/blog/[slug]/page.tsx
import { Metadata } from 'next'
import { getInsightBySlug, getInsightByJournalId, getPublishedInsights } from '@/lib/api'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Terminal, ArrowLeft, Tag } from 'lucide-react'
import { remark } from 'remark'
import html from 'remark-html'
import remarkGfm from 'remark-gfm'

import { AuthorAvatar } from '@/components/AuthorAvatar'

interface Props {
  params: {
    slug: string
    lang: string
  }
}
// ... imports ...

// ... generateStaticParams ...

// ... generateMetadata ...

export default async function InsightDetailPage({ params }: Props) {
  const { slug, lang } = await params
  const insight = await getInsightBySlug(slug, lang)

  if (!insight) {
    notFound()
  }

  // Convert Markdown to HTML
  const processedContent = await remark()
    .use(html)
    .use(remarkGfm)
    .process(insight.content_md)
  const contentHtml = processedContent.toString()

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      {/* Header */}
      <div className="mb-12 border-b pb-8 border-gray-200 dark:border-gray-800">
        <Link href={`/${lang}/blog`} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8 group text-sm font-medium tracking-wide uppercase">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Insights
        </Link>
        
        {/* Author & Meta */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
           <AuthorAvatar author={insight.author} size="lg" showName={true} />
           
           <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground font-mono">
            <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-zinc-800 px-3 py-1 rounded-full">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(insight.published_at || insight.created_at).toLocaleDateString()}
            </span>
            <span className="bg-black text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider dark:bg-white dark:text-black shadow-sm">
              SnapAI Analysis
            </span>
          </div>
        </div>
        
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black font-serif leading-[1.1] mb-6 tracking-tight">
          {insight.title}
        </h1>
        
        {insight.excerpt && (
          <p className="text-xl md:text-2xl text-muted-foreground font-serif italic leading-relaxed border-l-4 border-primary pl-6 py-2 bg-gradient-to-r from-gray-50 to-transparent dark:from-zinc-900/50 rounded-r-xl">
            {insight.excerpt}
          </p>
        )}
      </div>

      {/* Cover Image */}
      {insight.cover_image && (
        <div className="mb-12 rounded-xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800">
          <img 
            src={insight.cover_image} 
            alt={insight.title} 
            className="w-full h-auto object-cover max-h-[500px]"
          />
        </div>
      )}

      {/* Article Content */}
      <article className="prose prose-xl dark:prose-invert max-w-none font-serif 
        [&_h1]:!hidden
        prose-headings:font-bold prose-headings:tracking-tight prose-headings:scroll-mt-20
        prose-h2:!text-3xl prose-h2:!mt-10 prose-h2:!mb-4 prose-h2:!border-b-2 prose-h2:!border-primary/20 prose-h2:!pb-2 prose-h2:inline-block
        prose-h3:!text-2xl prose-h3:!mt-8 prose-h3:!mb-3
        prose-p:!leading-[1.8] prose-p:!mb-6 prose-p:!text-lg md:prose-p:!text-xl prose-p:!tracking-wide prose-p:!text-gray-800 dark:prose-p:!text-gray-200
        prose-li:!text-lg md:prose-li:!text-xl prose-li:!leading-[1.8] prose-li:!mb-2
        prose-a:!text-primary prose-a:font-semibold prose-a:!underline hover:prose-a:!decoration-4 prose-a:!decoration-2 prose-a:!underline-offset-4
        prose-blockquote:!border-l-4 prose-blockquote:!border-primary prose-blockquote:!bg-gray-50 dark:prose-blockquote:!bg-zinc-900/50 prose-blockquote:!px-8 prose-blockquote:!py-6 prose-blockquote:!rounded-r-xl prose-blockquote:!my-10 prose-blockquote:!not-italic prose-blockquote:font-medium prose-blockquote:!text-xl prose-blockquote:!leading-[1.8] prose-blockquote:!text-gray-900 dark:prose-blockquote:!text-white prose-blockquote:shadow-sm [&_blockquote_p]:before:!content-none [&_blockquote_p]:after:!content-none
        prose-code:!text-primary prose-code:!bg-gray-100 dark:prose-code:!bg-zinc-800 prose-code:!px-1.5 prose-code:!py-0.5 prose-code:!rounded prose-code:before:!content-none prose-code:after:!content-none prose-code:!font-mono prose-code:!text-[0.9em]
        prose-pre:!bg-gray-900 prose-pre:!text-gray-100 prose-pre:!rounded-xl prose-pre:!border prose-pre:!border-gray-800 prose-pre:!shadow-lg prose-pre:!my-8
        prose-li:marker:!text-primary prose-li:marker:font-bold
        prose-img:!rounded-xl prose-img:!shadow-xl prose-img:!border prose-img:!border-gray-200 dark:prose-img:!border-gray-800 prose-img:!my-12
      ">
        <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
      </article>

      {/* Footer Tags */}
      {insight.tags && insight.tags.length > 0 && (
        <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800">
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 font-mono">Topics</h3>
          <div className="flex flex-wrap gap-2">
            {insight.tags.map(tag => (
              <span key={tag} className="inline-flex items-center gap-1.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-default">
                <Tag className="w-3.5 h-3.5 text-primary" />
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Related Journal Link */}
      {insight.related_journal_id && (
        <div className="mt-12 p-8 bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-zinc-900 rounded-2xl border border-blue-100 dark:border-blue-800 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-foreground">
                <Terminal className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Source Context
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
                This analysis is based on raw data from our daily intelligence feed. See the original signals that triggered this insight.
              </p>
            </div>
            <Link 
              href={`/${lang}/issues/${insight.related_journal_id}`}
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all hover:scale-105 font-bold text-sm shadow-md hover:shadow-lg shrink-0 whitespace-nowrap"
            >
              View Source Data →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
