import { MetadataRoute } from 'next'
import { getAllAiContentIds } from '@/lib/api'
import { getAllTags } from '@/lib/api'
import { SUPPORTED_LANGUAGES } from '@/lib/i18n-utils'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snapallx.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = BASE_URL;
  const staticPages: MetadataRoute.Sitemap = []
  const tagPages: MetadataRoute.Sitemap = []
  const issuesPages: MetadataRoute.Sitemap = []

  for (const lang of SUPPORTED_LANGUAGES) {
    // 1. Static Pages
    staticPages.push(
      { url: `${baseUrl}/${lang}`, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
      { url: `${baseUrl}/${lang}/issues`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
      { url: `${baseUrl}/${lang}/tags`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 }
    )

    // Blog disabled — entries hidden from sitemap until snapai_insights migration lands.

    // 3. Tags
    try {
      const tags = await getAllTags(lang)
      for (const tag of tags) {
        tagPages.push({
          url: `${baseUrl}/${lang}/tags/${encodeURIComponent(tag.name)}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.6,
        })
      }
    } catch (e) { console.error('Sitemap Tag Error', e) }
    
    // 4. Issues — only delivered ones, so half-published drafts (pre-deliver
    // window, or stale undelivered carry-overs) don't get advertised to crawlers.
    // The `/[lang]/issues/[slug]` route still serves them for direct visits.
    try {
      const allIssues = await getAllAiContentIds(lang, { deliveredOnly: true })
      for (const issue of allIssues) {
         issuesPages.push({
          url: `${baseUrl}/${lang}/issues/${issue.journal_id || issue.id}`,
          lastModified: new Date(issue.created_at),
          changeFrequency: 'weekly',
          priority: 0.7,
        })
      }
    } catch (e) { console.error('Sitemap Issues Error', e) }
  }

  return [...staticPages, ...tagPages, ...issuesPages]
}
