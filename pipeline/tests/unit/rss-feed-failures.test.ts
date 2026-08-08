import { describe, it, expect } from 'vitest';
import { FEED_FAIL_ALERT_RATIO, feedOutageFailures } from '../../src/steps/fetchRss.js';

describe('feedOutageFailures', () => {
  it('ignores the chronic dead-feed baseline', () => {
    // ~13 of 117 feeds in the OPML blob are permanently dead. That must not
    // make the step report a failure, or every quiet hour goes red.
    expect(feedOutageFailures(117, 13)).toBe(0);
  });

  it('reports every failure once the outage threshold is crossed', () => {
    const feeds = 100;
    const failed = Math.ceil(feeds * FEED_FAIL_ALERT_RATIO);
    expect(feedOutageFailures(feeds, failed)).toBe(failed);
  });

  it('reports a total network outage', () => {
    expect(feedOutageFailures(117, 117)).toBe(117);
  });

  it('stays quiet just under the threshold', () => {
    expect(feedOutageFailures(100, 49)).toBe(0);
  });

  it('handles an empty feed list', () => {
    expect(feedOutageFailures(0, 0)).toBe(0);
  });
});
