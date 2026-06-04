"use client";

import { useTranslation } from "react-i18next";
import { TranslatedText } from "./TranslatedText";
import { LiveLog } from "./LiveLog";
import { SubscribeBox } from "./SubscribeBox";

export const Hero = () => {
  const { t } = useTranslation();

  return (
    <section className="py-16 md:py-24 paper-texture">
      <div className="container mx-auto px-4">
        {/*
          2 列 × 2 行网格：第 1 行是标题卡 / 描述，第 2 行是订阅框 / 引擎终端。
          订阅框（左下）撑出第 2 行的高度，引擎（右下）用 absolute 填满同一格，
          所以两张卡片顶部、底部、高度完全对齐。DOM 顺序保持移动端的堆叠次序。
        */}
        <div className="grid gap-8 md:grid-cols-2 md:gap-x-16 md:gap-y-8 max-w-6xl mx-auto">
          {/* 标题卡（左上） */}
          <div className="md:col-start-1 md:row-start-1 vintage-border bg-card p-8 md:p-12 relative">
            <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-foreground"></div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-foreground"></div>
            <h1 className="text-4xl md:text-6xl font-bold leading-none text-foreground">
              <TranslatedText>{t('hero.title')}</TranslatedText>
            </h1>
          </div>

          {/* 订阅框（左下）—— 决定第 2 行高度 */}
          <SubscribeBox className="md:col-start-1 md:row-start-2" />

          {/* 描述（右上）—— 垂直居中，与左侧标题视觉中心对齐 */}
          <div className="md:col-start-2 md:row-start-1 flex flex-col justify-center text-xl md:text-2xl leading-relaxed">
            <TranslatedText>{t('hero.description')}</TranslatedText>
          </div>

          {/* 引擎终端（右下）—— absolute 填满，与订阅框等高对齐 */}
          <div className="md:col-start-2 md:row-start-2 relative min-h-[350px] md:min-h-0">
            <div className="md:absolute md:inset-0">
              <LiveLog />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
