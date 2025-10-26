import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { RecentIssues } from "@/components/RecentIssues";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <RecentIssues />
      </main>
    </div>
  );
};

export default Index;
