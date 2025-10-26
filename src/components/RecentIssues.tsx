import { useState } from "react";
import { Input } from "./ui/input";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface Issue {
  date: string;
  title: string;
  slug: string;
}

const mockIssues: Issue[] = [
  { date: "Oct 24", title: "not much happened today", slug: "25-10-24-not-much" },
  { date: "Oct 23", title: "not much happened today", slug: "24-10-23-not-much" },
  { date: "Oct 22", title: "not much happened today", slug: "23-10-22-not-much" },
  { date: "Oct 21", title: "ChatGPT Atlas: OpenAI's AI Browser", slug: "22-10-21-chatgpt-atlas" },
  { date: "Oct 20", title: "Anthropic raises $4B from Amazon", slug: "21-10-20-anthropic-amazon" },
  { date: "Oct 19", title: "Google announces Gemini 2.0", slug: "20-10-19-gemini-2" },
  { date: "Oct 18", title: "Meta releases Llama 3.2", slug: "19-10-18-llama-3-2" },
  { date: "Oct 17", title: "OpenAI DevDay announcements", slug: "18-10-17-devday" },
];

export const RecentIssues = () => {
  const [filter, setFilter] = useState("");
  const { t } = useTranslation();

  const filteredIssues = mockIssues.filter((issue) =>
    issue.title.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <section className="py-16 bg-secondary/50 paper-texture border-t-4 border-b-4 border-primary">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block vintage-border bg-card px-8 py-4 mb-6">
              <h2 className="text-4xl font-bold text-primary">{t('recentIssues.title')}</h2>
            </div>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              <label htmlFor="filter" className="text-sm text-muted-foreground uppercase tracking-wider monospace">
                {t('recentIssues.filterLabel')}
              </label>
              <Input
                id="filter"
                type="text"
                placeholder={t('recentIssues.filterPlaceholder')}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="max-w-xs border-2 border-border bg-background"
              />
              <Link to="/issues" className="text-sm hover:underline whitespace-nowrap font-bold uppercase tracking-wider">
                {t('recentIssues.seeAll')} →
              </Link>
            </div>
          </div>

          <div className="space-y-1 bg-card vintage-border p-4">
            {filteredIssues.map((issue, index) => (
              <Link
                key={index}
                to={`/issues/${issue.slug}`}
                className="flex items-center gap-4 p-3 border-b-2 border-dotted border-border last:border-0 hover:bg-background transition-colors group"
              >
                <div className="text-sm text-muted-foreground w-20 flex-shrink-0 uppercase tracking-wider monospace font-bold">
                  {issue.date}
                </div>
                <div className="w-1 h-1 bg-primary flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">{issue.title}</h3>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
