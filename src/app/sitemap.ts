import { MetadataRoute } from 'next'
import { getAllAiContents } from '@/lib/api'
import { getAllTags } from '@/lib/api'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.snapallx.com'

  // 静态页面
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/issues`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/tags`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ]

  // 获取所有 issues
  let issuesPages: MetadataRoute.Sitemap = []
  try {
    const issues = await getAllAiContents()
    issuesPages = issues.map((issue) => ({
      url: `${baseUrl}/issues/${issue.id}`,
      lastModified: new Date(issue.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  } catch (error) {
    console.error('Error fetching issues for sitemap:', error)
  }

  // 获取所有标签页面
  let tagPages: MetadataRoute.Sitemap = []
  try {
    const tags = await getAllTags()
    tagPages = tags.map((tag) => ({
      url: `${baseUrl}/tags/${encodeURIComponent(tag.name)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))
  } catch (error) {
    console.error('Error fetching tags for sitemap:', error)
  }

  return [...staticPages, ...issuesPages, ...tagPages]
}

