"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { TranslatedText } from "./TranslatedText";

export const Header = () => {
  const { t } = useTranslation();

  return (
    <header className="border-b-4 border-primary bg-card shadow-sm">
      <div className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link 
            href="/" 
            className="flex items-center gap-1 group hover:opacity-80 transition-opacity"
          >
            <svg 
              width="40" 
              height="40" 
              viewBox="0 0 513 513" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="text-primary transition-transform group-hover:scale-105"
            >
              <path 
                d="M249.447 103.576C265.587 123.024 286.099 156.556 275.339 215.236C265.584 268.435 218.9 271.88 206.567 316.866C196.931 352.015 202.557 384.684 223.445 414.872C225.906 410.656 231.441 404.675 241.289 394.698L260.806 375.075V324.799L256.089 323.015C251.535 321.393 240.48 336.449 236.247 336.476C232.014 336.503 222.21 331.927 230.717 323.177L231.24 322.638C240.232 313.316 271.719 279.06 325.7 219.87L326.188 190.84L326.246 187.761C326.706 164.023 327.112 161.401 329.766 159.377C333.832 156.458 337.248 156.458 341.802 159.701L342.001 159.836C345.191 162.014 345.377 163.743 345.38 180.426L345.38 199.922L359.042 186.623C366.524 179.325 373.842 173.324 375.306 173.324C376.77 173.324 379.86 175.108 382.137 177.379C387.83 183.055 386.366 186.299 371.728 201.219L359.205 213.869L378.996 213.87C393.832 213.891 396.212 214.281 399.052 217.113C403.443 221.491 403.118 226.032 398.076 229.925L397.834 230.106C393.904 233.019 391.073 233.331 366.686 233.331H339.688L304.394 268.523L306.996 273.713L309.761 278.741H357.416L377.908 258.468L378.637 257.753C390.494 246.139 399.901 238.196 401.654 238.196C407.021 238.196 412.063 242.899 412.063 247.602C412.063 251.008 409.136 255.062 399.865 264.144L398.874 265.135C392.658 271.364 387.667 276.657 387.667 277.119C387.667 277.767 395.962 278.254 405.883 278.578L407.607 278.6C420.853 278.793 424.575 279.459 426.164 281.435L426.213 281.498C428.816 284.741 428.978 289.282 426.701 293.499C425.139 296.146 423.277 296.551 408.297 296.578L405.454 296.581C395.625 296.61 387.667 297.091 387.667 297.878C387.667 298.526 393.197 304.527 399.865 311.176L400.414 311.715C409.252 320.42 412.063 324.381 412.063 327.718C412.063 332.422 407.021 337.125 401.654 337.125C399.865 337.125 390.107 328.691 377.908 316.69L357.253 296.256L333.182 296.742L309.273 297.229L306.834 301.932L304.394 306.797L339.688 341.99L372.186 341.991C393.931 342.009 394.604 342.269 398.239 346.045L398.517 346.314C402.967 350.678 403.209 352.957 399.703 357.884C397.448 361.255 395.991 361.448 378.919 361.451L359.367 361.452L372.704 375.075C380.023 382.535 386.041 389.671 386.041 390.968C386.041 395.022 379.535 401.996 375.957 401.996C374.005 401.996 367.011 396.644 359.042 388.698L345.38 375.399L345.379 395.159C345.36 410.384 344.843 413.232 342.452 415.457C338.386 419.187 333.019 418.863 329.116 414.97C326.188 412.051 325.863 409.619 325.863 383.67V355.775L290.57 320.583L285.365 323.177L280.323 325.934V374.426L300.653 394.86L301.324 395.54C312.236 406.624 320.984 416.621 320.984 418.052C320.984 422.917 316.104 427.945 311.55 427.945C308.135 427.945 303.906 424.863 294.148 415.295L281.136 402.807L280.323 421.782L280.293 422.432C279.79 433.002 278.677 441.587 277.721 442.541C276.745 443.514 273.33 444.163 270.402 443.838C262.673 443.196 260.842 438.58 260.807 419.604L260.806 402.807L247.709 415.866C241.168 422.356 236.653 426.054 233.127 427.417C237.994 433.123 243.435 438.737 249.447 444.258C220.523 445.612 197.113 441.811 179.217 432.856C134.904 410.476 100.308 366.493 89.5877 318.456L89.2701 316.999C86.1539 303.011 85.8706 273.199 88.4203 258.364C96.7775 211.738 125.674 170.199 165.76 147.451L172.843 143.354L166.469 150.842L165.116 152.425C154.624 164.744 151.828 168.91 147.204 178.676C138.989 195.49 137.997 211.173 143.947 228.551C147.346 238.442 152.304 246.637 157.97 252.006L162.503 256.244L161.511 248.473C160.983 244.066 161.766 215.768 172.781 193.106C185.426 167.089 199.681 147.502 199.681 123.024C199.681 97.7196 189.277 79.7221 168.467 69.0317C200.346 65.4217 227.339 76.9364 249.447 103.576Z" 
                fill="currentColor"
              />
            </svg>
            <span className="font-bold text-2xl tracking-wide text-primary">
              AllYouCare.ai
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            {/*<Link 
              href="/subscribe" 
              className="hover:text-primary font-medium uppercase tracking-wider transition-colors"
            >
              <TranslatedText>{t('nav.subscribe')}</TranslatedText>
            </Link>*/}
            <span className="text-primary">❖</span>
            <Link 
              href="/issues" 
              className="hover:text-primary font-medium uppercase tracking-wider transition-colors"
            >
              <TranslatedText>{t('nav.issues')}</TranslatedText>
            </Link>
            <span className="text-primary">❖</span>
            <Link 
              href="/tags" 
              className="hover:text-primary font-medium uppercase tracking-wider transition-colors"
            >
              <TranslatedText>{t('nav.tags')}</TranslatedText>
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors border-2 border-border px-3 py-1 hover:border-primary">
            <Search className="w-4 h-4" />
            <TranslatedText className="hidden md:inline uppercase tracking-wider font-medium">
              {t('nav.search')}
            </TranslatedText>
          </button>
        </div>
      </div>
    </header>
  );
};
