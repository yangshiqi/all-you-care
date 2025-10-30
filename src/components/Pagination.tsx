"use client";

import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { TranslatedText } from "./TranslatedText";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  baseUrl?: string;
}

export const Pagination = ({ 
  currentPage, 
  totalPages, 
  totalCount, 
  pageSize,
  baseUrl = "/issues"
}: PaginationProps) => {
  const { t } = useTranslation();
  
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  // 生成页码数组
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // 如果总页数少于等于5页，显示所有页码
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 总是显示第1页
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('...');
      }
      
      // 显示当前页附近的页码
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== totalPages) {
          pages.push(i);
        }
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      
      // 总是显示最后一页
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col items-center space-y-4 mt-8">
      {/* 结果统计 */}
      <div className="text-sm text-muted-foreground">
        <TranslatedText>
          {t('issuesList.pagination.showing', { 
            start: startItem, 
            end: endItem, 
            total: totalCount 
          })}
        </TranslatedText>
      </div>

      {/* 分页控件 */}
      <div className="flex items-center space-x-2">
        {/* 上一页按钮 */}
        <Button
          asChild
          variant="outline"
          size="sm"
          disabled={currentPage === 1}
          className="vintage-border"
        >
          <Link 
            href={currentPage > 1 ? `${baseUrl}?page=${currentPage - 1}` : '#'}
            className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            <TranslatedText>{t('issuesList.pagination.previous')}</TranslatedText>
          </Link>
        </Button>

        {/* 页码按钮 */}
        <div className="flex items-center space-x-1">
          {pageNumbers.map((page, index) => (
            <div key={index}>
              {page === '...' ? (
                <span className="px-3 py-2 text-muted-foreground">...</span>
              ) : (
                <Button
                  asChild
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  className={`vintage-border ${
                    currentPage === page 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-secondary'
                  }`}
                >
                  <Link href={`${baseUrl}?page=${page}`}>
                    {page}
                  </Link>
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* 下一页按钮 */}
        <Button
          asChild
          variant="outline"
          size="sm"
          disabled={currentPage === totalPages}
          className="vintage-border"
        >
          <Link 
            href={currentPage < totalPages ? `${baseUrl}?page=${currentPage + 1}` : '#'}
            className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
          >
            <TranslatedText>{t('issuesList.pagination.next')}</TranslatedText>
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </div>

      {/* 页面信息 */}
      <div className="text-sm text-muted-foreground">
        <TranslatedText>
          {t('issuesList.pagination.page', { 
            page: currentPage, 
            totalPages: totalPages 
          })}
        </TranslatedText>
      </div>
    </div>
  );
};