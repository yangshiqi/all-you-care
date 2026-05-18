import { fetchOpmlFeeds } from '../src/lib/opml.js';
import { createLogger } from '../src/lib/log.js';

const log = createLogger({ channel: 'ai', step: 'opml-smoke' });
const url = 'https://gist.githubusercontent.com/emschwartz/e6d2bf860ccc367fe37ff953ba6de66b/raw/426957f043dc0054f95aae6c19de1d0b4ecc2bb2/hn-popular-blogs-2025.opml';

const urls = await fetchOpmlFeeds(url, log);
console.log(`OPML feeds: ${urls.length}`);
console.log('first 5:', urls.slice(0, 5));
console.log('last 3:', urls.slice(-3));
