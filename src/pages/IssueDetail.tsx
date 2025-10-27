import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, ChevronDown, ChevronUp } from "lucide-react";
import { Header } from "@/components/Header";
import { useTranslation } from "react-i18next";
import { SEOHead } from "@/components/SEOHead";
interface TagCategory {
  title: string;
  tags: string[];
}
const IssueDetail = () => {
  const {
    slug
  } = useParams();
  const {
    t
  } = useTranslation();
  const [showTags, setShowTags] = useState(true);
  const [activeSection, setActiveSection] = useState("");

  // Mock data - in real app, fetch based on slug
  const issueData = {
    date: "Oct 22",
    title: "not much happened today",
    summary: "a quiet day.",
    intro: "AI News for 10/21/2025-10/22/2025. We checked 12 subreddits, 544 Twitters and 23 Discords (198 channels, and 7314 messages) for you. Estimated reading time saved (at 200wpm): 528 minutes.",
    tagCategories: [{
      title: "Companies",
      tags: ["langchain", "meta", "microsoft", "openai", "pytorch", "ray", "claude"]
    }, {
      title: "Models",
      tags: ["vllm", "chatgpt-atlas"]
    }, {
      title: "Topics",
      tags: ["agent-frameworks", "reinforcement-learning", "distributed-computing", "inference-correctness", "serving-infrastructure", "browser-agents", "security", "middleware"]
    }, {
      title: "People",
      tags: ["hwchase17", "soumithchintala", "masondrxy", "robertnishihara", "cryps1s", "yuchenj_uw"]
    }],
    sections: [{
      id: "twitter-recap",
      title: "AI Twitter Recap",
      content: `
          <h3>Agent frameworks, orchestration, and RL tooling</h3>
          <p><strong>LangChain & LangGraph 1.0:</strong> Major rewrite focused on reliable, controllable agents. Highlights include a new create_agent template, provider-agnostic standard content blocks, middleware for controllability and context engineering, and durable, human-in-the-loop execution via LangGraph runtime.</p>
          
          <p><strong>PyTorch's new distributed & RL stack:</strong> Meta introduced two building blocks for large-scale agentic systems: Monarch (a distributed programming framework for orchestrating clusters) and TorchForge (a PyTorch-native RL library with high-performance components).</p>
          
          <h3>Inference correctness and serving infra</h3>
          <p><strong>Eliminating retokenization drift:</strong> vLLM's OpenAI-compatible endpoints can now return token IDs directly, preventing subtle string→token mismatches that destabilize RL.</p>
          
          <h3>Browser agents and safety</h3>
          <p><strong>OpenAI's ChatGPT Atlas:</strong> The browser integrates an agent that can act on pages and introduces "Ask ChatGPT" with defense-in-depth safeguards including logged-out mode for actions without credentials.</p>
        `
    }, {
      id: "reddit-recap",
      title: "AI Reddit Recap",
      content: `
          <h3>Qwen Team Contributions to llama.cpp</h3>
          <p>The Qwen team is helping llama.cpp with specific technical updates, such as fixing Vision Transformer (ViT) positional embeddings and correcting the DeepStack implementation.</p>
          
          <p>Comments reflect a sentiment that non-Chinese AI labs have slowed in their output, while Chinese companies like Alibaba are rapidly advancing.</p>
        `
    }, {
      id: "discord-recap",
      title: "AI Discord Recap",
      content: `
          <h3>High-level Discord Discussions</h3>
          <p>Active discussions around new model releases, agent frameworks, and community projects. Focus on practical implementations and real-world use cases.</p>
        `
    }]
  };
  const tableOfContents = issueData.sections.map(section => ({
    id: section.id,
    title: section.title
  }));
  return <>
      <SEOHead />
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b-2 border-dotted border-border">
            <Link to="/issues" className="inline-flex items-center gap-2 text-sm hover:text-primary transition-colors uppercase tracking-wider font-medium">
              <ChevronLeft className="w-4 h-4" />
              {t('issueDetail.backToIssues')}
            </Link>
            <button className="text-sm text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider" onClick={() => document.getElementById('main-content')?.scrollIntoView({
            behavior: 'smooth'
          })}>
              {t('issueDetail.skipToMain')} ↓
            </button>
          </div>

          {/* Header */}
          <div className="mb-12 text-center">
            <div className="inline-block vintage-border bg-card px-8 py-6 mb-4">
              <div className="text-sm text-muted-foreground uppercase tracking-widest monospace mb-2">
                {issueData.date}
              </div>
              <h1 className="text-5xl font-bold text-foreground mb-4">
                {issueData.title}
              </h1>
            </div>
            
            {/* Tags Section */}
            <div className="max-w-4xl mx-auto mt-8">
              <button onClick={() => setShowTags(!showTags)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider mx-auto mb-4">
                {showTags ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {showTags ? t('issueDetail.hideTags') : t('issueDetail.showTags')}
              </button>
              
              {showTags && <div className="vintage-border bg-card p-6 space-y-4 text-left">
                  {issueData.tagCategories.map((category, index) => <div key={index}>
                      <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-2 monospace font-bold">
                        {category.title}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {category.tags.map((tag, tagIndex) => <Link key={tagIndex} to={`/tags/${tag}`} className="px-3 py-1 text-sm bg-secondary border-2 border-border hover:border-primary hover:text-primary transition-all uppercase tracking-wider">
                            {tag}
                          </Link>)}
                      </div>
                    </div>)}
                </div>}
            </div>

            <p className="text-muted-foreground italic mt-6 text-lg">
              {issueData.summary}
            </p>
          </div>

          {/* Intro Quote */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="vintage-border bg-secondary/30 p-6 border-l-8 border-l-primary">
              <p className="text-foreground leading-relaxed">
                {issueData.intro}
              </p>
            </div>
          </div>

          {/* Main Content with Sidebar */}
          <div className="flex flex-col lg:flex-row gap-8 max-w-4xl mx-auto">
            {/* Table of Contents Sidebar */}
            

            {/* Main Content */}
            <article id="main-content" className="flex-1 paper-texture">
              <div className="space-y-12">
                {issueData.sections.map(section => <section key={section.id} id={section.id} className="scroll-mt-4">
                    <div className="vintage-border bg-card p-8">
                      <div className="flex items-center gap-4 mb-6 pb-4 border-b-4 border-primary">
                        <div className="w-2 h-2 bg-primary" />
                        <h2 className="text-3xl font-bold text-primary uppercase tracking-wider">
                          {section.title}
                        </h2>
                        <div className="w-2 h-2 bg-primary" />
                      </div>
                      
                      <div className="prose prose-vintage max-w-none" dangerouslySetInnerHTML={{
                    __html: section.content
                  }} style={{
                    lineHeight: '1.8'
                  }} />
                    </div>
                  </section>)}
              </div>
            </article>
          </div>

          {/* Back to Top */}
          <div className="text-center mt-12 pt-8 border-t-4 border-primary">
            <button onClick={() => window.scrollTo({
            top: 0,
            behavior: 'smooth'
          })} className="vintage-border bg-primary text-primary-foreground px-8 py-3 font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors">
              ↑ {t('issueDetail.backToTop')}
            </button>
          </div>
        </main>
      </div>
    </>;
};
export default IssueDetail;