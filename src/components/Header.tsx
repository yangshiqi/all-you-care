import { Link } from "react-router-dom";
import { Search } from "lucide-react";

export const Header = () => {
  return (
    <header className="border-b border-border bg-background">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="bg-primary text-primary-foreground px-3 py-1 text-sm font-medium">
            AINews
          </Link>
          <nav className="hidden md:flex items-center gap-4 text-sm">
            <Link to="/subscribe" className="hover:underline">subscribe</Link>
            <span className="text-muted-foreground">/</span>
            <Link to="/issues" className="hover:underline">issues</Link>
            <span className="text-muted-foreground">/</span>
            <Link to="/tags" className="hover:underline">tags</Link>
            <span className="text-muted-foreground">/</span>
          </nav>
        </div>
        <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <Search className="w-4 h-4" />
          <span className="hidden md:inline">Search (Cmd+K)</span>
        </button>
      </div>
    </header>
  );
};
