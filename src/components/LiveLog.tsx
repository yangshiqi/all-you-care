// src/components/LiveLog.tsx
"use client";

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

export const LiveLog = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logIdRef = useRef(0);
  const { t } = useTranslation();

  useEffect(() => {
    // Basic log generation logic (simplified for component splitting)
    const getPlatforms = () => ['Reddit', 'Twitter', 'Discord', 'GitHub'];
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
        setLogs(prev => [...prev, newLog].slice(-8));
    };
    
    const interval = setInterval(addLog, 2000);
    addLog(); 
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white dark:bg-black border-2 border-black dark:border-white p-0 overflow-hidden flex flex-col flex-1 rounded-none shadow-none text-black dark:text-white">
      <div className="bg-transparent px-6 py-3 border-b-2 border-black dark:border-white">
        <h2 className="text-lg font-bold uppercase tracking-wider monospace text-black dark:text-white">
          <TranslatedText>{t('hero.liveLogTitle')}</TranslatedText>
        </h2>
      </div>
      <div className="space-y-2 flex-1 min-h-[300px] monospace text-sm p-3 bg-white dark:bg-black">
        {logs.map((log) => (
          <div 
            key={log.id} 
            className="log-item flex items-center gap-3 py-1 animate-in fade-in slide-in-from-bottom-2 duration-300"
          >
            <span className="text-gray-500 dark:text-gray-400 text-xs font-mono flex-shrink-0">
              {log.time}
            </span>
            <span className="flex-1 font-mono text-black dark:text-white">
              {log.message}
            </span>
            <span className="text-green-600 dark:text-green-400 font-mono flex-shrink-0">
              {log.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
