// src/components/LiveLog.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { TranslatedText } from "./TranslatedText";
import { Terminal } from "lucide-react";

interface LogEntry {
  id: number;
  time: string;
  message: string;
  status: string;
  type: "status-ok" | "status-noise" | "status-comp" | "status-new" | "status-log";
}

export const LiveLog = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logIdRef = useRef(0);
  const { t } = useTranslation();

  useEffect(() => {
    const getPlatforms = () => {
      const platformsObj = t('hero.logPlatforms', { returnObjects: true }) as Record<string, string>;
      return Object.values(platformsObj);
    };
    const platforms = getPlatforms();
    
    const addLog = () => {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { hour12: false });
        const newLog: LogEntry = {
            id: logIdRef.current++,
            time: timeString,
            message: `Scanning ${platforms[Math.floor(Math.random() * platforms.length)]}...`,
            status: "[OK]",
            type: "status-ok"
        };
        setLogs(prev => [...prev, newLog].slice(-13));
    };
    
    const interval = setInterval(addLog, 2000);
    addLog(); 
    return () => clearInterval(interval);
  }, [t]);

  return (
    <div className="bg-card rounded-lg shadow-sm border border-border flex flex-col flex-1 h-full min-h-[350px] md:min-h-0 overflow-hidden">
      {/* Header */}
      <div className="bg-muted/50 px-4 py-2 flex items-center justify-between border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-400/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
          <div className="w-3 h-3 rounded-full bg-green-400/80" />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <Terminal className="w-3 h-3" />
          <span>snapallx-engine</span>
        </div>
        <div className="w-12" /> {/* Spacer */}
      </div>

      {/* Body */}
      <div className="p-4 font-mono text-sm leading-relaxed flex-1 overflow-y-auto bg-background text-foreground">
        <div className="space-y-1">
          <div className="flex gap-2 mb-4">
            <span className="text-green-600 dark:text-green-400">➜</span>
            <span className="text-blue-600 dark:text-blue-400">~</span>
            <span className="text-foreground">tail -f /var/log/snapallx.log</span>
          </div>

          {logs.map((log) => (
            <div 
              key={log.id} 
              className="flex items-start gap-3 animate-in fade-in slide-in-from-left-2 duration-300"
            >
              <span className="text-muted-foreground text-xs shrink-0 pt-0.5 select-none opacity-70">
                {log.time}
              </span>
              <div className="flex-1 flex justify-between gap-4">
                <span className="text-foreground/90">
                  {log.message}
                </span>
                <span 
                  className={`font-bold shrink-0 text-xs ${
                    log.type === 'status-ok' ? 'text-green-600 dark:text-green-400' :
                    log.type === 'status-noise' ? 'text-red-500 dark:text-red-400' :
                    log.type === 'status-comp' ? 'text-blue-600 dark:text-blue-400' :
                    'text-green-600 dark:text-green-400'
                  }`}
                >
                  {log.status}
                </span>
              </div>
            </div>
          ))}
          
          <div className="flex gap-2 mt-2">
            <span className="text-green-600 dark:text-green-400">➜</span>
            <span className="text-blue-600 dark:text-blue-400">~</span>
            <span className="animate-pulse bg-foreground/50 w-2 h-4 block"></span>
          </div>
        </div>
      </div>
    </div>
  );
};
