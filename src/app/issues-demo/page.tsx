import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Issues Demo - AINews",
  description: "Demo page showing all available issues for testing.",
};

const availableIssues = [
  {
    slug: "2024-12-19",
    title: "AI breakthroughs in multimodal learning",
    date: "Dec 19, 2024",
    summary: "Major advances in vision-language models and their applications"
  },
  {
    slug: "2024-12-18", 
    title: "not much happened today",
    date: "Dec 18, 2024",
    summary: "A quiet day in AI news"
  },
  {
    slug: "2024-12-17",
    title: "New open source models released", 
    date: "Dec 17, 2024",
    summary: "Several organizations released new open source AI models"
  },
  {
    slug: "2024-12-16",
    title: "AI safety research updates",
    date: "Dec 16, 2024", 
    summary: "Latest research on AI alignment and safety measures"
  }
];

export default function IssuesDemoPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-primary mb-8">
          AINews Issues Demo
        </h1>
        
        <p className="text-lg text-foreground mb-8">
          Click on any issue below to view the full content with SSR:
        </p>

        <div className="grid gap-6">
          {availableIssues.map((issue) => (
            <div key={issue.slug} className="bg-card vintage-border p-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-primary mb-2">
                    <Link 
                      href={`/issues/${issue.slug}`}
                      className="hover:text-primary/80 transition-colors"
                    >
                      {issue.title}
                    </Link>
                  </h2>
                  <p className="text-sm text-muted-foreground uppercase tracking-wider monospace">
                    {issue.date}
                  </p>
                </div>
              </div>
              
              <p className="text-foreground mb-4 leading-relaxed">
                {issue.summary}
              </p>
              
              <div className="flex gap-4">
                <Link
                  href={`/issues/${issue.slug}`}
                  className="inline-block bg-primary text-primary-foreground px-6 py-2 font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors"
                >
                  Read Full Issue
                </Link>
                <span className="text-sm text-muted-foreground self-center">
                  URL: /issues/{issue.slug}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 bg-muted rounded-lg">
          <h3 className="text-xl font-bold text-primary mb-4">How to Access Issues</h3>
          <div className="space-y-2 text-foreground">
            <p><strong>Direct URLs:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              {availableIssues.map((issue) => (
                <li key={issue.slug}>
                  <code className="bg-background px-2 py-1 rounded text-sm">
                    http://localhost:3000/issues/{issue.slug}
                  </code>
                </li>
              ))}
            </ul>
            <p className="mt-4"><strong>From Homepage:</strong> Click on any issue title in the "Recent Issues" section</p>
            <p><strong>From Issues List:</strong> Visit <code className="bg-background px-2 py-1 rounded text-sm">/issues</code> to see all issues</p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-block bg-secondary text-secondary-foreground px-6 py-2 font-bold uppercase tracking-wider hover:bg-secondary/90 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
