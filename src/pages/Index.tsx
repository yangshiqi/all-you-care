import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { RecentIssues } from "@/components/RecentIssues";
import { SEOHead } from "@/components/SEOHead";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead />
      <Header />
      <main>
        <Hero />
        <RecentIssues />
      </main>
    </div>
  );
};

export default Index;
