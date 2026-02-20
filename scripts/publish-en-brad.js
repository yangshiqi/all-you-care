// scripts/publish-en-brad.js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const articleData = {
  title: "How Anthropic Lost OpenClaw to OpenAI: The $100B Mistake",
  slug: "how-anthropic-lost-openclaw-to-openai",
  excerpt: "It's a tale of \"Pride and Prejudice\" in Silicon Valley. Anthropic used legal threats to push away a genius, while OpenAI won the ticket to the Agent Era with an open embrace.",
  content_md: `
# How Anthropic Lost OpenClaw to OpenAI: The $100B Mistake

> **The Butterfly Effect**: In a dynamic system, small initial conditions can lead to vast, long-term consequences. A flap of a wing, a legal threat, a shifted allegiance.

The news of Peter Steinberger joining OpenAI broke the internet instantly. But while everyone was gasping at the headline, a **dark comedy** was unfolding in the background: Peter was originally Anthropic's biggest fanboy. Even OpenClaw's original name was **"ClawdBot"**—a super-agent explicitly built for Claude. (Or, if you're cynical like Anthropic's legal team, a way to ride ClaudeCode's hype train. ;))

So, why did the "Chosen One" of agents—the developer who set the record for fastest-growing GitHub stars—defect to OpenAI?

The reason is almost absurd: **Anthropic sent him a cease-and-desist letter.**

The enemy of my enemy is my friend. I bet Sam Altman knows this game better than anyone.

## The Strategic Suicide

### 1. The Cease-and-Desist vs. The Olive Branch
According to [VentureBeat's deep dive](https://venturebeat.com/technology/openais-acquisition-of-openclaw-signals-the-beginning-of-the-end-of-the), Anthropic claimed "ClawdBot" infringed on their trademark, threatening legal action unless Peter renamed it and cut the domain redirects.
It turns out that Anthropic, the self-proclaimed innovator and leader, suffers from **"Big Company Disease"**: they care more about "brand compliance" than a thriving developer ecosystem.

The result? We all saw the **renaming trilogy** that confused the masses: ClawdBot -> Moltbot -> OpenClaw.
I suspect this is when the seed of "De-Clauding" was planted in Peter's mind. And when he started talking to OpenAI.

Almost immediately, Sam Altman extended an olive branch. OpenAI didn't care about the name. They cared about the **"Unhinged Energy"**—that reckless spirit of innovation.

### 2. OpenAI's "Phantom Limb" and Redemption
OpenAI hasn't exactly nailed Agents. Or rather, all their attempts so far have been lackluster: they launched the Agents API, the Atlas browser, but none gained real market traction.

LangChain CEO Harrison Chase nailed it: OpenAI's official products are too "safe," too "correct." OpenClaw went viral because it gave users **Root Access**. It allowed the model to run wild outside the sandbox.

OpenAI must have realized early on that they needed to inject this **Hacker DNA**. They weren't buying code; they were buying Peter's intuition for breaking rules.

Having missed out on **Manus**, Sam Altman couldn't afford to lose this one. And honestly? I think this acquisition is a bigger steal than Manus.

## The Paradigm Shift

### 3. From "Chat" to "Act"
In his blog post, Peter said his goal is to **"Build an agent that even my mum can use."**
This is exactly what OpenAI needs.

ChatGPT has taught the world how to "chat." Now, it needs to teach users how to "let go."

When OpenClaw's architecture (memory, tools, planning) meets GPT-5's IQ, we will enter the true **Agent Native** era. It's no longer about whose model scores higher on benchmarks; it's about whose model can **get the job done**.

## >> FAST_FORWARD (Brad's Vision)

> "Anthropic won the lawsuit, but lost the war. They protected their trademark but pushed the 'Steve Jobs of Agents' right into their rival's arms. The lesson? **In the early days of a tech explosion, ecosystem prosperity always trumps compliance hygiene.** Embrace the crazy developers, for they hold the keys to the future."
`,
  cover_image: "https://placehold.co/1200x630/000000/eab308?text=LAWYERS+VS+BUILDERS&font=mono",
  tags: ['openclaw', 'openai', 'anthropic', 'strategy', 'peter-steinberger', 'agent-wars'],
  related_journal_id: '150',
  author: 'Brad',
  lang: 'en', // English Version
  is_published: true,
  published_at: new Date().toISOString()
};

async function publish() {
  console.log(`🚀 Publishing EN Article: ${articleData.title}`);
  
  // Upsert with composite key (slug, lang)
  // We need to make sure the constraint allows it.
  const { data, error } = await supabase
    .from('snapai_insights')
    .upsert(articleData, { onConflict: 'slug,lang' })
    .select()
    .single();

  if (error) {
    console.error('❌ Publish failed:', error);
  } else {
    console.log(`✅ Published! Slug: ${data.slug} (${data.lang})`);
  }
}

publish();
