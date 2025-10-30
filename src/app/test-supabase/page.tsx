"use client";

import { useState } from "react";
import { getIssueSummaries, getAllAiContents } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/card";

export default function TestSupabasePage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testConnection = async () => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const summaries = await getIssueSummaries(3);
      const allContents = await getAllAiContents();
      
      setData({
        summaries,
        allContents: allContents.slice(0, 2), // 只显示前2条完整数据
        totalCount: allContents.length
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Supabase 连接测试</h1>
      
      <div className="mb-6">
        <Button 
          onClick={testConnection} 
          disabled={loading}
          className="mb-4"
        >
          {loading ? "测试中..." : "测试 Supabase 连接"}
        </Button>
      </div>

      {error && (
        <Card className="mb-6 border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">连接错误</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error}</p>
            <p className="text-sm text-muted-foreground mt-2">
              请检查环境变量配置和 Supabase 设置
            </p>
          </CardContent>
        </Card>
      )}

      {data && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>连接成功！</CardTitle>
            </CardHeader>
            <CardContent>
              <p>总数据量: {data.totalCount} 条记录</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>期刊摘要 (前3条)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.summaries.map((issue: any) => (
                  <div key={issue.id} className="border p-4 rounded">
                    <h3 className="font-bold">{issue.title}</h3>
                    <p className="text-sm text-muted-foreground">{issue.date}</p>
                    <p className="mt-2">{issue.summary}</p>
                    <div className="flex gap-2 mt-2">
                      {issue.tags.map((tag: string) => (
                        <span key={tag} className="px-2 py-1 bg-secondary text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>完整数据示例 (前2条)</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded text-sm overflow-auto">
                {JSON.stringify(data.allContents, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
