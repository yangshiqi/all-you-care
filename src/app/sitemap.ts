import { MetadataRoute } from 'next'
import { getAllAiContents } from '@/lib/api'
import { getAllTags } from '@/lib/api'
import { SUPPORTED_LANGUAGES } from '@/lib/i18n-utils'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snapallx.com'

  // 静态页面 - 为每种语言生成
  const staticPages: MetadataRoute.Sitemap = []
  
  for (const lang of SUPPORTED_LANGUAGES) {
    staticPages.push(
      {
        url: `${baseUrl}/${lang}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0,
      },
      {
        url: `${baseUrl}/${lang}/issues`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
      },
      {
        url: `${baseUrl}/${lang}/tags`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      },
      {
        url: `${baseUrl}/${lang}/subscribe/success`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.5,
      },
      {
        url: `${baseUrl}/${lang}/subscribe/snow`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.5,
      }
    )
  }

  // 获取所有 issues - 为每种语言生成
  const issuesPages: MetadataRoute.Sitemap = []
  try {
    const issues = await getAllAiContents()
    for (const lang of SUPPORTED_LANGUAGES) {
      for (const issue of issues) {
        issuesPages.push({
          url: `${baseUrl}/${lang}/issues/${issue.journal_id || issue.id}`,
          lastModified: new Date(issue.created_at),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        })
      }
    }
  } catch (error) {
    console.error('Error fetching issues for sitemap:', error)
  }

  // 获取所有标签页面 - 为每种语言生成
  const tagPages: MetadataRoute.Sitemap = []
  try {
    // 为每种语言分别获取对应的标签
    for (const lang of SUPPORTED_LANGUAGES) {
      const tags = await getAllTags(lang)
      for (const tag of tags) {
        tagPages.push({
          url: `${baseUrl}/${lang}/tags/${encodeURIComponent(tag.name)}`,
          lastModified: new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.6,
        })
      }
    }
  } catch (error) {
    console.error('Error fetching tags for sitemap:', error)
  }

  return [...staticPages, ...issuesPages, ...tagPages]
}

