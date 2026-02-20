// src/app/[lang]/blog/layout.tsx
import { Metadata } from 'next'
import { Header } from '@/components/Header'

export const metadata: Metadata = {
  title: 'SnapAI Insights - Decompile the Hype',
  description: 'Unfiltered, technical, and opinionated analysis of the AI landscape.',
}

interface BlogLayoutProps {
  children: React.ReactNode
  params: Promise<{
    lang: string
  }>
}

export default async function BlogLayout({ children, params }: BlogLayoutProps) {
  const { lang } = await params
  
  return (
    <div className="bg-background min-h-screen font-serif text-foreground flex flex-col">
      <Header initialLang={lang} />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
