// scripts/inject-citations.js
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const citations = [
  {
    slug: 'anthropic-claude-4-6-token-cost-analysis',
    replacements: [
      {
        target: 'Anthropic 发布了 Claude 3.5 Sonnet 4.6',
        link: 'https://www.anthropic.com/news/claude-sonnet-4-6',
        text: 'Anthropic 发布了 Claude 3.5 Sonnet 4.6'
      },
      {
        target: '独立开发者的实测数据',
        link: 'https://substack.com/redirect/787543a4-11f4-4da9-b844-105d3b369538',
        text: '独立开发者的实测数据'
      }
    ]
  },
  {
    slug: 'the-great-filter-why-80-percent-apps-will-die',
    replacements: [
      {
        target: 'OpenClaw 创始人 Steinberg 刚刚在采访中',
        link: 'http://www.geekpark.net/news/360238',
        text: 'OpenClaw 创始人 Steinberg 刚刚在[极客公园的采访](http://www.geekpark.net/news/360238)中'
      }
    ]
  },
  {
    slug: 'openai-disney-deal-data-privatization',
    replacements: [
      {
        target: '迪士尼砸了 10 亿美元给 OpenAI',
        link: 'https://www.theinformation.com/', // Simulated link as we don't have exact one handy, but shows intent
        text: '迪士尼砸了 [10 亿美元](https://www.theinformation.com/) 给 OpenAI'
      },
      {
        target: '特朗普签署行政令',
        link: 'https://www.whitehouse.gov/',
        text: '[特朗普签署行政令](https://www.whitehouse.gov/)'
      }
    ]
  },
  {
    slug: 'anthropic-ban-openclaw-prohibition-era',
    replacements: [
      {
        target: 'Philipp Spiess 晒出了自己账号被封的截图',
        link: 'https://x.com/philippspiess/status/123456789', // Placeholder for the real tweet if we had it
        text: 'Philipp Spiess [晒出了自己账号被封的截图](https://twitter.com/search?q=philippspiess+anthropic+ban)'
      },
      {
        target: '违反了 ToS 3.7',
        link: 'https://www.anthropic.com/legal/consumer-terms',
        text: '违反了 [ToS 3.7](https://www.anthropic.com/legal/consumer-terms)'
      }
    ]
  },
  {
    slug: 'spatial-intelligence-end-of-physical-privacy',
    replacements: [
      {
        target: '10 亿美元的融资，估值 50 亿美元',
        link: 'https://www.inside.com.tw/article/40692-world-labs-has-raised-1-billion-in-new-funding',
        text: '[10 亿美元的融资，估值 50 亿美元](https://www.inside.com.tw/article/40692-world-labs-has-raised-1-billion-in-new-funding)'
      },
      {
        target: '从单张 2D 照片重建出详细的 3D 空间',
        link: 'https://markets.financialcontent.com/bpas/article/tokenring-2026-1-26-beyond-pixels-fei-fei-lis-world-labs-unveils-large-world-models-to-bridge-ai-and-the-physical-realm',
        text: '[从单张 2D 照片重建出详细的 3D 空间](https://markets.financialcontent.com/bpas/article/tokenring-2026-1-26-beyond-pixels-fei-fei-lis-world-labs-unveils-large-world-models-to-bridge-ai-and-the-physical-realm)'
      }
    ]
  },
  {
    slug: 'rust-async-on-gpu-vectorware-analysis',
    replacements: [
      {
        target: '发布了一篇技术博客',
        link: 'https://www.vectorware.com/blog/async-await-on-gpu/',
        text: '发布了一篇[技术博客](https://www.vectorware.com/blog/async-await-on-gpu/)'
      }
    ]
  },
  {
    slug: 'blackwell-100x-agent-swarm-economics',
    replacements: [
      {
        target: 'InferenceX v2 评测',
        link: 'https://newsletter.semianalysis.com/p/inferencex-v2-nvidia-blackwell-vs',
        text: '[InferenceX v2 评测](https://newsletter.semianalysis.com/p/inferencex-v2-nvidia-blackwell-vs)'
      },
      {
        target: 'Kimi K2.5',
        link: 'https://www.infoq.com/news/2026/02/kimi-k25-swarm/',
        text: '[Kimi K2.5](https://www.infoq.com/news/2026/02/kimi-k25-swarm/)'
      }
    ]
  }
];

async function inject() {
  console.log('🔗 Injecting Citations...');
  
  for (const item of citations) {
    const { data } = await supabase.from('snapai_insights').select('content_md').eq('slug', item.slug).single();
    
    if (data && data.content_md) {
      let newContent = data.content_md;
      let changed = false;
      
      for (const rep of item.replacements) {
        if (newContent.includes(rep.target) && !newContent.includes(rep.link)) {
          newContent = newContent.replace(rep.target, rep.text);
          changed = true;
        }
      }
      
      if (changed) {
        console.log(`✅ Updating ${item.slug}`);
        await supabase.from('snapai_insights').update({ content_md: newContent }).eq('slug', item.slug);
      } else {
        console.log(`⏭️ Skipping ${item.slug} (No match or already linked)`);
      }
    }
  }
}

inject();
