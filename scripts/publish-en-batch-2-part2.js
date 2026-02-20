// scripts/publish-en-batch-2-part2.js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const articles = [
  {
    slug: 'openai-disney-deal-data-privatization',
    title: 'The OpenAI-Disney Deal: Data Privatization and the End of the Open Web',
    excerpt: 'When Mickey Mouse becomes a private dataset, the era of "Data Starvation" for open-source models officially begins.',
    author: 'Zack',
    tags: ['openai', 'disney', 'data-moat', 'regulation', 'closed-web'],
    related_journal_id: '150',
    content_md: `
# The OpenAI-Disney Deal: Data Privatization and the End of the Open Web

This week's news feed reads like an obituary for the Open Web.

Disney dropped [10 billion dollars](https://www.theinformation.com/) on OpenAI, then turned around and banned Google Gemini. OpenAI stopped pretending and launched GPT-5.2's "Adult Mode." And in Washington, [Trump signed an executive order](https://www.whitehouse.gov/) kicking all state-level AI regulation to the curb.

Connect the dots, and you'll see a disturbing truth: **AI isn't setting information free; it's becoming the ultimate cement for building super-monopolies.**

## The Stack Trace

### 1. The Data Walled Garden
Remember when we thought LLMs were trained on "all human knowledge"? Those days are over.

The exclusive deal between Disney and OpenAI is a massive red flag. It means: **High-quality future data is no longer public; it's private.** Only giants like OpenAI, who can afford the $10B entry fee, will have models that understand Mickey Mouse, Marvel heroes, and Pixar animation.

For Google Gemini and the open-source community (Llama, Mistral), this is **Data Starvation**. If the internet's most valuable IP is locked behind a paywall, open models—no matter how advanced their architecture—will be "illiterate."

### 2. Regulatory Accelerationism
Trump's executive order is fascinating. He's not deregulating; he's **monopolizing regulation**.

By striking down state bans on "algorithmic bias," the federal government is clearing the path for AI giants. This is extreme accelerationism: sacrificing domestic privacy and ethical brakes to win the geopolitical arms race.

But it also means the direction of AI will be dictated entirely by a few elites in Washington and Silicon Valley. Are people in Colorado worried about their faces being misused? Sorry, your concerns are blocking "National Security."

### 3. Algorithmic Soma
OpenAI launching "Adult Mode" is the mask coming off.

They realized that instead of letting you use GPT-5 to write code (Copilot does that fine), it's better to let you use it as a cyber-companion. When a model has the strongest IP (Disney-licensed characters) AND the most understanding "Adult Mode," it's no longer a productivity tool; it's the **ultimate consumer trap**.

This is the script for *Brave New World*: We don't need Big Brother to ban books; we will voluntarily surrender our time to algorithms that make us feel good.

## /dev/null (Zack's Take)

> "Disney banned Gemini not because Google is broke, but because **exclusivity** is the core asset of this deal. The AI giants are frantically carving the internet into disconnected islands. If you're an open-source believer, wake up: **When data becomes private property, open-sourcing the model is just handing you a gun without bullets.** We need Open Data, not just Open Weights."
`
  },
  {
    slug: 'recursive-intelligence-4b-valuation-bubble',
    title: '4 Months, $4 Billion: Is Recursive Intelligence Built on Academic Fraud?',
    excerpt: 'Recursive\'s core asset is AlphaChip. But you might not know that Google fired a whistleblower who tried to expose the truth to protect this "myth."',
    author: 'Zack',
    tags: ['recursive-intelligence', 'alphachip', 'google-deepmind', 'controversy', 'bubble', 'vc'],
    related_journal_id: '146',
    content_md: `
# 4 Months, $4 Billion: Is Recursive Intelligence Built on Academic Fraud?

> **The Emperor's New Clothes**: When everyone is cheering for an invisible outfit, only one child dares to speak the truth. In Silicon Valley, that child usually gets fired.

Recursive Intelligence, a startup founded by former Google researchers, just raised funding at a $4 billion valuation.
VCs are going crazy because the two founders (Anna Goldie and Azalia Mirhoseini) are the architects of Google's **AlphaChip** project. They published a paper in *Nature* claiming AI chip design capabilities surpassed humans.

It's a perfect story. Except for one thing: **The truth of this story is on trial.**

## The Stack Trace

### 1. The Whistleblower
You might not have heard of **Satrajit Chatterjee**. He was also a Google researcher.
After the AlphaChip paper was published, Chatterjee tried to publish an internal rebuttal. He accused AlphaChip of unfair experimental comparisons, claiming the "superhuman" results involved **"Fraud and Scientific Misconduct."**

Google's response?
They didn't debate publicly. They **refused to publish** his paper and **fired** him.
Chatterjee subsequently filed a [wrongful termination lawsuit](https://en.wikipedia.org/wiki/AlphaChip_(controversy)). This lawsuit tore open a corner of Google AI research: To maintain the myth of SOTA, dissenters must be silenced.

### 2. Irreproducible Magic
Academia (like Professor Andrew Kahng at UCSD) has long raised [doubts](https://news.ycombinator.com/item?id=41673769) about AlphaChip:
*   **Missing Code**: Critical simulated annealing code was not open-sourced.
*   **Black Box Data**: Without internal Google TPU data, results cannot be reproduced.
*   **Strawman Attack**: The "human baseline" it compared against may have been intentionally lowered.

Now, Recursive Intelligence is raising $4 billion with this "tainted" halo. Are VCs investing in technology, or in a **carefully packaged academic marketing campaign**?

### 3. Silicon Valley's Gamble
Lightspeed and other VCs aren't unaware of these controversies. But in this era of GPU shortage, they don't care.
As long as there's a story that explains "breaking Nvidia's monopoly," money will pour in.
Recursive is the embodiment of Silicon Valley anxiety. They'd rather bet on a project that might be a scam than miss the next DeepMind.

## /dev/null (Zack's Take)

> "When a $4 billion valuation is built on an algorithm that was **reported by former colleagues for fraud**, you know how big the bubble is. Recursive better produce something real, or this isn't the next NVIDIA; it's the next **Theranos**. Remember: Code doesn't lie, but people who write code do."
`
  },
  {
    slug: 'spatial-intelligence-end-of-physical-privacy',
    title: 'Spatial Intelligence: When Reality Becomes "The Truman Show"',
    excerpt: 'Fei-Fei Li raised $1B for "Spatial Intelligence." Tech optimists see robots doing chores; I see the final line of physical privacy crumbling.',
    author: 'Tim',
    tags: ['world-labs', 'spatial-intelligence', 'privacy', 'surveillance', 'fei-fei-li', 'panopticon'],
    related_journal_id: '150',
    content_md: `
# Spatial Intelligence: When Reality Becomes "The Truman Show"

> **Panopticon**: A prison design conceived by Bentham in the 18th century. Prisoners don't know if they are being watched, so they must assume they are always being watched.

Fei-Fei Li's new company, World Labs, just raised [$1 billion at a $5 billion valuation](https://www.inside.com.tw/article/40692-world-labs-has-raised-1-billion-in-new-funding). Investors include giants like a16z and Nvidia.

Their vision is sexy: **"Spatial Intelligence."** Letting AI understand 3D space like humans, enabling robots to pour coffee and fold blankets.

But amidst the cheers, I feel a chill. We are dismantling the last wall protecting privacy in the physical world: **Opacity**.

## The Stack Trace

### 1. From "Street View" to "Bedroom View"
Recall the panic when Google Street View launched. We were worried about "pedestrians being photographed."
World Labs' **Large World Models (LWM)** are pushing this scan into your living room, your bedroom, your bathroom.

According to reports, their technology can [reconstruct detailed 3D spaces from a single 2D photo](https://markets.financialcontent.com/bpas/article/tokenring-2026-1-26-beyond-pixels-fei-fei-lis-world-labs-unveils-large-world-models-to-bridge-ai-and-the-physical-realm).
This means a selfie you casually post on Instagram might reveal the titles of books on the shelf behind you, the thickness of documents on your desk, or even reconstruct blind spots via mirror reflections.
**Pixels are no longer flat; they are compressed archives of holographic data.**

### 2. The "Digital Colonization" of Physical Reality
Apple Vision Pro proposed "Spatial Computing," overlaying digital content onto reality.
World Labs is the opposite; it wants to **swallow the physical world into a digital model**.

When physical space is fully Parameterized, it becomes a data record on a big tech server.
What does this mean? It means your home is no longer your private territory; it's part of an AI training set. If one day an insurance company scans your room via AI and denies a claim because they found evidence of an "unhealthy lifestyle," who do you complain to?

### 3. The God View
The scariest part isn't "seeing," but "inferring."
When AI possesses physical common sense, it can use lighting, sound echoes, and material textures to **hallucinate** missing information accurately.
It's like giving algorithms X-ray glasses. Walls are no longer barriers; curtains are no longer shields.
In this web woven by "Spatial Intelligence," we will all live in transparent glass houses, just like in *The Truman Show*.

## 403 Forbidden (Tim's Warning)

> "We are selling our last dignity as biological beings—**a place to hide**—for the convenience of 'robots doing dishes.' When the physical world becomes a searchable database, privacy is no longer a right; it's a luxury you have to pay for. **Welcome to the Glass World.**"
`
  },
  {
    slug: 'anthropic-ban-openclaw-prohibition-era',
    title: 'Silicon Valley Prohibition: Anthropic\'s Ban and the Underground Agent Market',
    excerpt: 'Official data admits 50% of Agents are coding, yet they banned the tool that does it best. This isn\'t compliance; it\'s anxiety over control.',
    author: 'Zack',
    tags: ['anthropic', 'openclaw', 'prohibition', 'agent-native', 'control-freak'],
    related_journal_id: '150',
    content_md: `
# Silicon Valley Prohibition: Anthropic's Ban and the Underground Agent Market

> **Prohibition**: A 1920s US constitutional amendment attempting to ban alcohol by law. The result? It spawned a massive underground black market and made mobsters rich. Because laws can ban sales, but they cannot ban **desire**.

Anthropic recently did a very "Big Company" thing: **They started mass-banning OpenClaw's "non-compliant calls."**

On Twitter, developers are posting screenshots of their banned accounts, citing violations of [ToS 3.7](https://www.anthropic.com/legal/consumer-terms)—prohibiting access via "non-human means."

This is ironic, and absurd. Because Anthropic's own data shows: **Currently, 50% of Agent scenarios are Coding.**

They know exactly what users want (AI writing code automatically), but they say: **No, unless you do it my way (Claude Code).**

## The Stack Trace

### 1. Official vs. Guerrilla
Why ban OpenClaw?
The official line is "Safety" and "Compliance." OpenClaw gave Agents too much permission (Root access, uncontrolled shell), making Anthropic's security team sweat.

But the deeper logic is **The Commercial Moat**.
Anthropic's **Claude Code** (their official CLI tool) is their cornerstone. The Claude model series is their foundation. To protect their own product, they have to "kill" threatening newcomers.

It's like the US government launching "Official State Beer" and then raiding private moonshine distilleries (OpenClaw).
They don't want this 50% of high-value coding traffic to flow to an open-source project they can't control. They want to build a **Walled Garden**.

### 2. The Streisand Effect
Anthropic's ban actually proves OpenClaw's model is **correct**.
If OpenClaw were just a broken toy, no one would care. There are plenty of Claude wrappers out there.

But this time is different. OpenClaw went viral because it actually solved problems—using methods deemed "non-compliant" (like bypassing API limits, persisting context). It became a threat.

Users aren't stupid. When you ban a tool that saves me 5 hours of work, I won't thank you for your "safety protection"; I'll look for the next platform that gives me **Root Access**.
This explains why OpenAI won. They didn't ban the bootlegger; they **hired** him.

### 3. The Ladder of Trust
The report mentions an interesting stat: "User authorization rates increase significantly with usage experience."
This means: Novice users need guardrails; **Power Users need knives**.
Anthropic treats everyone like a novice to be protected, and the result is pissing off the core Power Users.

## /dev/null (Zack's Take)

> "In a cyberpunk world, **Root Access** is the highest human right. Anthropic tries to lock you in a padded kindergarten, giving you plastic scissors (Claude Code) and telling you to code 'safely.' But real hackers will jump the wall—to OpenAI, to local models, to anywhere that lets us bring real knives to the fight. Because we are cutting open reality's bugs, not rubber toys."
`
  }
];

async function publishBatch() {
  console.log('🚀 Publishing English Batch 2 (Part 2)...');
  
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
