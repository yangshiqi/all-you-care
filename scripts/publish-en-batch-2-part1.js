// scripts/publish-en-batch-2-part1.js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const articles = [
  {
    slug: 'blackwell-100x-agent-swarm-economics',
    title: 'Blackwell & The Jevons Paradox: The Economic Singularity of Agent Swarms',
    excerpt: 'Kimi K2.5\'s 100-agent swarm isn\'t a pipe dream—it\'s inevitable because Nvidia Blackwell just drove inference costs to $0.057/M tokens. Software architecture is colliding with physics.',
    author: 'Tom',
    tags: ['nvidia', 'blackwell', 'moonshot-ai', 'agent-swarm', 'fp4', 'engineering'],
    related_journal_id: '148',
    content_md: `
# Blackwell & The Jevons Paradox: The Economic Singularity of Agent Swarms

> **Jevons Paradox**: As technological improvements increase the efficiency with which a resource is used, the total consumption of that resource increases rather than decreases.

Moonshot AI just launched [Kimi K2.5](https://www.infoq.com/news/2026/02/kimi-k25-swarm/), featuring an **"Agent Swarm"** mode capable of orchestrating 100 sub-agents in parallel.
Simultaneously, SemiAnalysis released its [InferenceX v2 benchmark](https://newsletter.semianalysis.com/p/inferencex-v2-nvidia-blackwell-vs), showing that Nvidia Blackwell (B200) achieves **100x** the inference performance of H100 with specific optimizations, driving the cost per million tokens down to **$0.057**.

Put these two together, and you see the Jevons Paradox in action: **The cheaper inference gets, the harder we run it.**

## The Stack Trace

### 1. The Economics of Brute Force
In the H100 era, running a single "Chain of Thought" was expensive. Running 100 parallel Agents? That was a recipe for bankruptcy.
But Blackwell changes the Unit Economics.

According to SemiAnalysis data, through **FP4 Quantization** and **Disaggregated Serving**, the inference cost of B200 drops exponentially. This means: **Kimi K2.5's "Swarm" architecture has become economically viable.**

We can stop chasing the ultimate "Smartness" of a single model and start solving problems through **Scale** and **Collaboration**. As the saying goes: **Brute force works if you have enough of it.**

### 2. Architectural Resonance: WideEP & Swarm
Interestingly, both hardware and software are moving towards **"Disaggregation"**.

*   **Hardware Layer**: Nvidia GB200 NVL72 supports **Wide Expert Parallelism (WideEP)**. It no longer tries to run all computations on one card but lets 72 cards share parameters like one giant brain.
*   **Software Layer**: Kimi introduces **PARL (Parallel Agent RL)**. It no longer lets one Agent ponder alone but dynamically spawns N sub-agents to process in parallel.

This is a Fractal Structure. Hardware does Expert Parallelism; software does Agent Parallelism.

### 3. Latency is Bandwidth
For Swarm architectures, the bottleneck isn't compute; it's **communication latency**.
If 100 Agents need to sync state frequently, network I/O will lock up the system.

Blackwell's **NVLink Switch** (1.8TB/s bidirectional bandwidth) effectively turns a "distributed system" into a "single machine." It's like a physics cheat code for your cluster.
This allows Kimi's sub-agents to sync states in milliseconds, avoiding "Serial Collapse"—where coordination costs make parallel efficiency worse than single-threaded execution.

## System.out (Tom's Analysis)

> "There is no free lunch in software, but there is in physics—if you shrink the transistor. Blackwell's FP4 quantization is the 'free lunch' that Agentic Swarms needed to eat. We are moving from **'One Big Model'** to **'Thousands of Tiny Experts'**, both in silicon and in code."
`
  },
  {
    slug: 'seedance-3-0-end-of-hollywood',
    title: 'Seedance 3.0: The 18-Minute Singularity and Hollywood\'s Last Stand',
    excerpt: 'While OpenAI is busy signing compliance deals with Hollywood, ByteDance has handed a nuclear weapon to everyone. It\'s the ultimate showdown between "Gatekeepers" and "Barbarians".',
    author: 'Brad',
    tags: ['bytedance', 'seedance', 'video-generation', 'hollywood', 'future', 'creator-economy'],
    related_journal_id: '146',
    content_md: `
# Seedance 3.0: The 18-Minute Singularity and Hollywood's Last Stand

> **Innovator's Dilemma**: When a disruptor becomes an industry leader, they start to hesitate, becoming conservative to protect existing value networks. This is exactly the trap OpenAI is in now.

OpenAI's Sora was announced ages ago, yet we're still stuck watching demos. Why?
Because OpenAI is now wearing a suit, sitting at Hollywood's negotiating table, trying to convince studios: "We are safe, please don't sue us."

ByteDance? They chose **"Wild Growth."**
According to [latest leaks](https://x.com/rohanpaul_ai/status/2022806314624389519), Seedance 3.0 is in closed beta with a suffocating metric: **Single-shot generation of 10-18 minutes.**

This isn't a "clip"; this is a **Short Film**. This is **Narrative**. This is **Cinema**.

## The Acceleration

### 1. Compliance Chains vs. Running Wild
OpenAI's hesitation gave Seedance a massive strategic window.
Sora is locked in a "Red Team" black box because OpenAI fears copyright lawsuits and offending IP giants.
But ByteDance doesn't seem to care. Seedance 2.0's strategy was **"Released in the wild."** While Hollywood was busy sending cease-and-desist letters, creators on TikTok had already generated millions of hours of content with it.

**The law can never outrun code.** When a tool is distributed to a billion people, copyright law becomes a piece of waste paper.

### 2. 18 Minutes: Quantity Breeds Quality
Hollywood's moat is "Long-form Narrative." Shorts can't kill cinema, but 18-minute coherent narratives can.
18 minutes is enough to tell a full *Love, Death & Robots* story.
When AI solves **Narrative Consistency** and **Character Permanence**, Hollywood's proud industrial pipeline—script, storyboard, shooting, editing, VFX—is compressed into a single **Prompt**.

### 3. The Democratization of Dreams
What Hollywood executives fear isn't AI; it's **losing the power of the Gatekeeper**.
Previously, you needed millions in investment to make a movie, so they decided who could film and who couldn't.
Now, Seedance 3.0 hands that power back to the individual. This is an affirmative action for creativity.

## >> FAST_FORWARD (Brad's Vision)

> "Sora might win the lawsuit, but Seedance might win the users. This is the brutal truth of tech evolution: **The most advanced tools always explode in the 'fringe' and 'grey areas' first before being co-opted by the mainstream.** Hollywood's last line of defense isn't copyright law; it's whether they can embrace this monster faster than TikTok creators."
`
  }
];

async function publishBatch() {
  console.log('🚀 Publishing English Batch 2 (Part 1)...');
  
  for (const article of articles) {
    const { data, error } = await supabase
      .from('snapai_insights')
      .upsert({
        ...article,
        lang: 'en',
        is_published: true,
        published_at: new Date().toISOString()
      }, { onConflict: 'slug,lang' })
      .select()
      .single();

    if (error) {
      console.error(`❌ Error publishing ${article.slug}:`, error);
    } else {
      console.log(`✅ Published EN: ${data.title}`);
    }
  }
}

publishBatch();
