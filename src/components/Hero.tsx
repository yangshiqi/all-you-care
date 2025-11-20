"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { TranslatedText } from "./TranslatedText";

interface LogEntry {
  id: number;
  time: string;
  message: string;
  status: string;
  type: "status-ok" | "status-noise" | "status-comp" | "status-new" | "status-log";
}

export const Hero = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logIdRef = useRef(0);
  const { t, i18n } = useTranslation();

  const handleSubmit = () => {
    // Brevo 表单直接提交，只需要设置 loading 状态
    setIsSubmitting(true);
    // 表单会自动提交到 Brevo，不需要阻止默认行为
  };

  // 初始化日志和定时器
  useEffect(() => {
    // 获取翻译数据 - 直接通过键名获取
    const getPlatforms = () => [
      t('hero.logPlatforms.reddit'),
      t('hero.logPlatforms.twitter'),
      t('hero.logPlatforms.discord'),
      t('hero.logPlatforms.github'),
      t('hero.logPlatforms.hackernews'),
      t('hero.logPlatforms.arxiv'),
      t('hero.logPlatforms.openai'),
      t('hero.logPlatforms.google'),
      t('hero.logPlatforms.meta'),
      t('hero.logPlatforms.nvidia'),
      t('hero.logPlatforms.microsoft'),
      t('hero.logPlatforms.localLlama'),
      t('hero.logPlatforms.infoq'),
      t('hero.logPlatforms.techcrunch'),
    ];
    
    const getPeople = () => [
      t('hero.logPeople.karpathy'),
      t('hero.logPeople.altman'),
      t('hero.logPeople.lecun'),
      t('hero.logPeople.hinton'),
      t('hero.logPeople.bengio'),
      t('hero.logPeople.ng'),
    ];
    
    const getClickbaitPhrases = () => [
      t('hero.logClickbaitPhrases.gameChanger'),
      t('hero.logClickbaitPhrases.revolutionary'),
      t('hero.logClickbaitPhrases.breakthrough'),
      t('hero.logClickbaitPhrases.mindBlowing'),
      t('hero.logClickbaitPhrases.youWontBelieve'),
    ];
    
    const getSources = () => [
      t('hero.logSources.discord'),
      t('hero.logSources.reddit'),
      t('hero.logSources.twitter'),
      t('hero.logSources.github'),
      t('hero.logSources.arxiv'),
    ];
    
    const platforms = getPlatforms();
    const people = getPeople();
    const clickbaitPhrases = getClickbaitPhrases();
    const sources = getSources();

    // 生成随机数字
    const randomCount = (min: number, max: number) => {
      const num = Math.floor(Math.random() * (max - min + 1)) + min;
      if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
      return num.toString();
    };

    // 生成随机百分比（用于压缩/处理进度）
    const randomPercentage = () => {
      const percentages = [85, 87, 90, 92, 94, 96, 98, 99];
      return `[${percentages[Math.floor(Math.random() * percentages.length)]}%]`;
    };

    // 生成随机日志消息
    const generateLogMessage = (): { msg: string; status: string; type: LogEntry['type'] } => {
      const messageTypes = [
        // 抓取类型
        {
          template: t('hero.logMessages.scraping'),
          replace: { platform: platforms[Math.floor(Math.random() * platforms.length)] },
          status: "[OK]",
          type: "status-ok" as const
        },
        {
          template: t('hero.logMessages.scrapingPerson'),
          replace: { person: people[Math.floor(Math.random() * people.length)] },
          status: "[OK]",
          type: "status-ok" as const
        },
        // 删除/过滤类型
        {
          template: t('hero.logMessages.removingClickbait'),
          replace: { phrase: clickbaitPhrases[Math.floor(Math.random() * clickbaitPhrases.length)] },
          status: "[DEL]",
          type: "status-noise" as const
        },
        {
          template: t('hero.logMessages.filteringNoise'),
          replace: { count: randomCount(50, 500) },
          status: "[DEL]",
          type: "status-noise" as const
        },
        {
          template: t('hero.logMessages.removingDuplicates'),
          replace: { count: randomCount(10, 200) },
          status: "[DEL]",
          type: "status-noise" as const
        },
        // 汇总/处理类型
        {
          template: t('hero.logMessages.summarizing'),
          replace: { 
            count: randomCount(100, 2000),
            source: sources[Math.floor(Math.random() * sources.length)]
          },
          status: "[CMP]",
          type: "status-comp" as const
        },
        {
          template: t('hero.logMessages.compressing'),
          replace: { platform: platforms[Math.floor(Math.random() * platforms.length)] },
          status: randomPercentage(),
          type: "status-comp" as const
        },
        {
          template: t('hero.logMessages.processing'),
          replace: { platform: platforms[Math.floor(Math.random() * platforms.length)] },
          status: randomPercentage(),
          type: "status-comp" as const
        },
        // 验证/分析类型
        {
          template: t('hero.logMessages.verifyingCitations'),
          replace: { count: randomCount(5, 50) },
          status: "[OK]",
          type: "status-ok" as const
        },
        {
          template: t('hero.logMessages.parsing'),
          replace: { source: sources[Math.floor(Math.random() * sources.length)] },
          status: "[OK]",
          type: "status-ok" as const
        },
        {
          template: t('hero.logMessages.analyzing'),
          replace: { count: randomCount(50, 1000) },
          status: "[OK]",
          type: "status-ok" as const
        },
        {
          template: t('hero.logMessages.validating'),
          replace: { count: randomCount(5, 30) },
          status: "[OK]",
          type: "status-ok" as const
        },
        // 检测/新内容类型
        {
          template: t('hero.logMessages.detectingTrending'),
          replace: { count: randomCount(1, 10) },
          status: "[NEW]",
          type: "status-new" as const
        },
        {
          template: t('hero.logMessages.detectingSOTA'),
          replace: {},
          status: "[LOG]",
          type: "status-log" as const
        },
        // 提取/分类类型
        {
          template: t('hero.logMessages.extractingInsights'),
          replace: { count: randomCount(10, 100) },
          status: "[OK]",
          type: "status-ok" as const
        },
        {
          template: t('hero.logMessages.categorizingContent'),
          replace: { count: randomCount(20, 500) },
          status: "[CMP]",
          type: "status-comp" as const
        },
        {
          template: t('hero.logMessages.ranking'),
          replace: { count: randomCount(10, 50) },
          status: "[CMP]",
          type: "status-comp" as const
        },
        {
          template: t('hero.logMessages.deduplicating'),
          replace: { count: randomCount(15, 150) },
          status: "[DEL]",
          type: "status-noise" as const
        },
        {
          template: t('hero.logMessages.tagging'),
          replace: { count: randomCount(30, 300) },
          status: "[OK]",
          type: "status-ok" as const
        },
        {
          template: t('hero.logMessages.aggregating'),
          replace: { count: randomCount(5, 20) },
          status: "[CMP]",
          type: "status-comp" as const
        },
      ];

      const selectedType = messageTypes[Math.floor(Math.random() * messageTypes.length)];
      let message = selectedType.template;
      
      // 替换占位符
      Object.entries(selectedType.replace).forEach(([key, value]) => {
        message = message.replace(`{${key}}`, value);
      });

      return {
        msg: message,
        status: selectedType.status,
        type: selectedType.type
      };
    };

    // 添加日志条目的函数
    const addLog = () => {
      const logData = generateLogMessage();
      const now = new Date();
      const timeString = now.getHours().toString().padStart(2, '0') + ":" + 
                         now.getMinutes().toString().padStart(2, '0') + ":" + 
                         now.getSeconds().toString().padStart(2, '0');

      const newLog: LogEntry = {
        id: logIdRef.current++,
        time: timeString,
        message: logData.msg,
        status: logData.status,
        type: logData.type,
      };

      setLogs((prevLogs) => {
        const updated = [...prevLogs, newLog];
        // 保持最多6条日志
        return updated.slice(-6);
      });
    };

    // 立即添加几条初始日志
    const initialTimeouts: NodeJS.Timeout[] = [];
    for (let i = 0; i < 3; i++) {
      const timeout = setTimeout(addLog, i * 500);
      initialTimeouts.push(timeout);
    }

    // 生成5-10秒之间的随机间隔（毫秒）
    const getRandomInterval = () => {
      return Math.floor(Math.random() * 5000) + 5000; // 5000-10000毫秒，即5-10秒
    };

    // 存储所有活跃的定时器
    const activeTimeouts: NodeJS.Timeout[] = [];

    // 递归函数：添加日志后安排下一次（使用随机间隔）
    const scheduleNextLog = () => {
      const interval = getRandomInterval();
      const timeout = setTimeout(() => {
        addLog();
        scheduleNextLog(); // 安排下一次
      }, interval);
      activeTimeouts.push(timeout);
    };

    // 在初始日志添加完成后，开始安排第一次随机间隔的日志
    const startTimeout = setTimeout(() => {
      addLog();
      scheduleNextLog();
    }, 3000); // 等待初始日志添加完成（3条 * 500ms = 1500ms，再加一些缓冲）
    activeTimeouts.push(startTimeout);

    return () => {
      // 清理所有定时器
      activeTimeouts.forEach(timeout => clearTimeout(timeout));
      initialTimeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [t]);

  return (
    <section className="py-16 md:py-24 paper-texture">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-start max-w-6xl mx-auto">
          {/* Left column - Title and form */}
          <div>
            <div className="vintage-border bg-card p-8 md:p-12 mb-8 relative">
              <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-primary"></div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-primary"></div>
              <h1 className="text-5xl md:text-7xl font-bold leading-none text-primary">
                <TranslatedText>{t('hero.title')}</TranslatedText>
              </h1>
            </div>
            <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wider">
              <TranslatedText>{t('hero.byLine')}</TranslatedText>
            </p>
            <p className="text-2xl mb-8 leading-relaxed">
              <TranslatedText>{t('hero.subtitle')}</TranslatedText>
            </p>

            <form 
              id="sib-form" 
              method="POST" 
              action="https://b55b2c6e.sibforms.com/serve/MUIFAHuOyh65aKbiM6NPvJkuuVI5o9cGpU496vUXU8PMUZoJiWW2iiuy4XMywAqh5O-Hch3-mCwotaiAm_Bg0ptFkErJkUaBTzgCoQErH_gOBc0FseUDMipJGu72IdGtic5YZRsvZpxUpK_sjPOyecrcJi8IeXqVx-YKU-vJVkOByx9l83FqdPl_0NZlTbS-2hS_QW7EuiItjtuRpA=="
              onSubmit={handleSubmit}
              className="space-y-4 bg-card vintage-border p-8 md:p-10 relative shadow-2xl border-4 border-primary animate-pulse-subtle"
            >
              {/* 增强的装饰性边框角 */}
              <div className="absolute -top-3 -left-3 w-12 h-12 border-t-4 border-l-4 border-primary bg-card"></div>
              <div className="absolute -bottom-7 -right-3 w-12 h-12 border-b-4 border-r-4 border-primary bg-card"></div>
              <div className="absolute -top-3 -right-3 w-8 h-8 border-t-4 border-r-4 border-primary/50"></div>
              <div className="absolute -bottom-7 -left-3 w-8 h-8 border-b-4 border-l-4 border-primary/50"></div>

              
              <div className="form__entry entry_block">
                <div className="entry__field">
                  <Input
                    className="input bg-background border-4 border-primary focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-200 text-lg py-6 px-4 font-semibold"
                    type="email"
                    id="EMAIL"
                    name="EMAIL"
                    autoComplete="email"
                    placeholder={t('hero.emailPlaceholder')}
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    data-required="true"
                    required
                    suppressHydrationWarning
                  />
                </div>
                <label className="entry__error entry__error--primary" style={{fontSize: '16px', textAlign: 'left', fontFamily: 'Helvetica, sans-serif', color: '#661d1d', backgroundColor: '#ffeded', borderRadius: '3px', borderColor: '#ff4949'}}>
                </label>
              </div>
              
              <div className="sib-form-block" style={{textAlign: 'left'}}>
                <Button 
                  className="sib-form-block__button sib-form-block__button-with-loader w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-wider py-7 text-xl shadow-2xl hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border-4 border-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.03] active:scale-[0.97] hover:border-primary/80"
                  form="sib-form" 
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <TranslatedText>{t('hero.submitting')}</TranslatedText>
                  ) : (
                    <TranslatedText>{t('hero.ctaButton')}</TranslatedText>
                  )}
                </Button>
              </div>
              
              <input type="text" name="email_address_check" defaultValue="" className="input--hidden" style={{display: 'none'}} readOnly />
              <input type="hidden" name="locale" value={i18n.language === 'zh_CN' ? 'zh' : 'en'} />
              <input type="hidden" name="html_type" value="simple" />
            </form>

            <p className="text-xs text-muted-foreground mt-4 monospace">
              <TranslatedText>
                {t('hero.privacyText')}
              </TranslatedText>
            </p>
          </div>

          {/* Right column - Description and live log */}
          <div className="space-y-8">
            <div className="text-xl leading-relaxed">
                <TranslatedText>{t('hero.description')}</TranslatedText>
            </div>

            {/* Live Ingestion Log */}
            <div className="bg-card vintage-border p-0 overflow-hidden">
              <div className="bg-primary text-primary-foreground px-6 py-3 border-b-2 border-primary">
                <h2 className="text-lg font-bold uppercase tracking-wider monospace">
                  <TranslatedText>{t('hero.liveLogTitle')}</TranslatedText>
                </h2>
              </div>
              <div 
                id="log-container" 
                className="space-y-2 min-h-[200px] monospace text-sm p-6"
              >
                {logs.map((log) => (
                  <div 
                    key={log.id} 
                    className="log-item flex items-center gap-3 py-1 animate-in fade-in slide-in-from-bottom-2 duration-300"
                  >
                    <span className="text-muted-foreground text-xs font-mono flex-shrink-0">
                      {log.time}
                    </span>
                    <span className="text-foreground flex-1">
                      {log.message}
                    </span>
                    <span 
                      className={`log-status flex-shrink-0 font-mono ${
                        log.type === 'status-ok' ? 'text-green-600 dark:text-green-400' :
                        log.type === 'status-noise' ? 'text-red-500 dark:text-red-400' :
                        log.type === 'status-comp' ? 'text-blue-600 dark:text-blue-400' :
                        log.type === 'status-new' ? 'text-purple-600 dark:text-purple-400' :
                        'text-green-600 dark:text-green-400'
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
