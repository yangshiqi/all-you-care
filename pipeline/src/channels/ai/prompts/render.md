你是后台 JSON API。给定一个 AI 早报的结构化 JSON，把它转成 HTML 文章片段。

# 输入 (来自 merge step 的产物 + 已注入到模板里供你使用)

`{{json_payload}}` 是上面 merge.md 输出的完整 JSON。

# 仅输出 JSON

```json
{ "content_html": "..." }
```

属性引号**一律单引号**。**不要**包含 `<h1>` / `<h2>` / `<style>` / `<html>` / `<body>` / 头图——后端注入。

# 输出 HTML 结构（按此顺序）

```html
<!-- A. 主线分析 box -->
<div class='headline-box'>
  <div class='headline-label'>📊 今日主线</div>
  <p class='headline-text'>...headline_analysis 内容...</p>
</div>

<!-- B. Top 3 必看 spotlight -->
<section class='spotlight-section'>
  <h3 class='section-title'>⭐ 必看</h3>
  <article class='spotlight-card'>
    <div class='spotlight-header'>
      <span class='spotlight-rank'>①</span>
      <span class='spotlight-score'>⭐ 9.2</span>
    </div>
    <h4 class='spotlight-title'>事件标题</h4>
    <p class='spotlight-desc'>60-120 字描述</p>
    <a class='link-btn' href='URL' target='_blank' rel='noopener'>[查看详情]</a>
    <div class='spotlight-why'>💡 为什么重要：...why_matters 内容...</div>
  </article>
  <!-- ② ③ 同上 -->
</section>

<!-- C. 视角分组 (creator / engineer / investor) -->
<section class='persona-section'>
  <h3 class='section-title persona-creator'>💼 创业者关注</h3>
  <article class='persona-card'>
    <div class='card-header'>
      <h4>事件标题</h4>
      <span class='score-pill'>⭐ 8.5</span>
    </div>
    <p>描述</p>
    <a class='link-btn' href='URL' target='_blank' rel='noopener'>[查看详情]</a>
  </article>
  <!-- 重复 -->
</section>

<section class='persona-section'>
  <h3 class='section-title persona-engineer'>🔧 工程师关注</h3>
  <!-- 同上 -->
</section>

<section class='persona-section'>
  <h3 class='section-title persona-investor'>📊 投资人关注</h3>
  <!-- 同上 -->
</section>

<!-- D. 通用动态 (titles only) -->
<section class='general-section'>
  <h3 class='section-title'>🌐 通用动态</h3>
  <ul class='general-list'>
    <li><a href='URL' target='_blank' rel='noopener'>标题</a></li>
    <!-- 重复 -->
  </ul>
</section>
```

# 转换规则

1. 顺序固定为 A → B → C → D。
2. spotlight rank 用①②③④⑤（圆圈数字）。
3. score_pill 显示 `⭐ X.X`（保留一位小数）。
4. links 多个时全部输出，并排。
5. by_persona 三个人群顺序固定为 creator → engineer → investor。
6. general 列表每条只一行 `<a>`，不带描述。
7. 如某 persona 数组为空 → 跳过整个 section 不输出。
8. 如 general 为空 → 跳过。
9. 链接 href 可能是 http:// 或 https:// — 都保留。
