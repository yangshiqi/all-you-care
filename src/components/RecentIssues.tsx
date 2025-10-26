import { useState } from "react";
import { Input } from "./ui/input";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

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

  const filteredIssues = mockIssues.filter((issue) =>
    issue.title.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <section className="py-16 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <h2 className="text-2xl font-bold">Last 30 days in AI</h2>
            <div className="flex items-center gap-4">
              <label htmlFor="filter" className="text-sm text-muted-foreground">
                Filter titles:
              </label>
              <Input
                id="filter"
                type="text"
                placeholder=".*(?!not much).*$"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="max-w-xs"
              />
            </div>
            <Link to="/issues" className="text-sm hover:underline whitespace-nowrap">
              See all issues
            </Link>
          </div>

          <div className="space-y-2">
            {filteredIssues.map((issue, index) => (
              <Link
                key={index}
                to={`/issues/${issue.slug}`}
                className="flex items-center gap-4 p-4 bg-background hover:bg-muted/50 transition-colors rounded-lg group"
              >
                <div className="w-2 h-2 rounded-full bg-muted-foreground flex-shrink-0" />
                <div className="text-sm text-muted-foreground w-16 flex-shrink-0">
                  {issue.date}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{issue.title}</h3>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
