# SnapAI Blog Production SOP v5.0 (Human-Aligned Strategic Edition)

> "From Content Generation to Strategic Insight."

## 1. 🔍 Fetch & Signal (抓取与信号)
- **Source**: `n8n-ai-content-pre-publish` (Supabase).
- **De-duplication Rule**: 
  - Before fetching, query `snapai_insights` for all existing `related_journal_id`.
  - Filter out any content where its `journal_id` already exists in `snapai_insights.related_journal_id`.
  - **Exception**: Only re-process if the user explicitly specifies an ID or requests a "re-interpretation".
- **Signal Analysis**: Do not just summarize. Identify the **Underlying Dynamics**:
  - Consolidation of Power (Oligarchy).
  - Physical/Economic Bottlenecks.
  - Paradigm Shifts (GUI -> Intent).
- **Conflict Detection (New)**: Compare the signal with historical claims in `snapai_insights`. Identify "PR vs Reality" gaps or "The Grand Pivot" (e.g., when a company contradicts its previous roadmap).
- **Output**: 3 Distinct Angles based on Personas (Zack/Tom/Brad/Tim).

## 2. 🎯 Topic Selection (选题)
- Present options to the Human Editor (User).
- Wait for explicit selection before drafting.

## 3. 🕵️‍♂️ Deep Intelligence (深度情报)
- **Mandatory Web Search**: Do not rely on the summary provided by n8n.
- **Source Tracing**: Find the *primary* source (Lex Fridman Podcast timestamp, Arxiv PDF, Earnings Call Transcript).
- **Community Sentiment**: Search Reddit/HackerNews for "real talk" (e.g., "bleeding money", "banned accounts").
- **Data Hardening**: Find specific numbers to back up claims ($20k/mo, 4.8x cost).

## 4. 🧠 Strategic Drafting (战略写作)
- **Framework**:
  - **Z-Axis (Meta-Cognition)**: Start with a mental model (Butterfly Effect, Jevons Paradox).
  - **X-Axis (Context)**: Compare with history or competitors (Manus, Groq, Linux vs iPhone).
  - **Y-Axis (Granularity)**: Use specific details ("The 3rd rename", "Parking App friction").
- **Citation Rule**: Every claim must have a markdown hyperlink to its source.
- **Formatting**:
  - Use `“**Bold Text**”` inside quotes.
  - Short paragraphs.
  - No "In conclusion".

## 5. 🔄 Human Refinement (人类升维)
- **Review Loop**: Present the draft for review.
- **Strategic Lift**: If the user provides feedback, analyze *why*. Often it's to elevate the argument from **"Productivity"** to **"Power/Control/Entry Points"**.
- **Tone Adjustment**: Incorporate human emotional descriptors ("Torture", "Joy", "Panic") over sterile tech terms.

## 6. 🎨 Visual Identity (视觉落地)
- **Cover Image**: Minimalist Tech-Noir style (Black/Neon). 1200x630.
- **Author Persona**: Assign the correct Editor Avatar (Zack/Tom/Brad/Tim) based on the tone.

## 7. 🚀 Publish & Distribute (发布与分发)
- **SEO**: Ensure Slug is kebab-case and keyword-rich.
- **Database**: Upsert to `snapai_insights`.
- **Distribution**: 
  - **Opinion Hook**: For every insight, generate a high-friction/controversial "Hook" specifically for X (Twitter) Threads. 
  - **Visuals**: Ensure cover images use 15%+ Glitch Art elements to maintain the "Digital Craftsman" rebel aesthetic.
  - **Auto-post**: (Future) Auto-post thread/hook to Twitter/X.
