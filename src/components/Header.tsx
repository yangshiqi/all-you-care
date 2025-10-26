import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./LanguageSwitcher";

export const Header = () => {
  const { t } = useTranslation();

  return (
    <header className="border-b-4 border-primary bg-card shadow-sm">
      <div className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="vintage-border bg-primary text-primary-foreground px-6 py-2 font-bold text-lg uppercase tracking-wider hover:bg-primary/90 transition-colors">
            AINews
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link to="/subscribe" className="hover:text-primary font-medium uppercase tracking-wider transition-colors">{t('nav.subscribe')}</Link>
            <span className="text-primary">❖</span>
            <Link to="/issues" className="hover:text-primary font-medium uppercase tracking-wider transition-colors">{t('nav.issues')}</Link>
            <span className="text-primary">❖</span>
            <Link to="/tags" className="hover:text-primary font-medium uppercase tracking-wider transition-colors">{t('nav.tags')}</Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors border-2 border-border px-3 py-1 hover:border-primary">
            <Search className="w-4 h-4" />
            <span className="hidden md:inline uppercase tracking-wider font-medium">{t('nav.search')}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
