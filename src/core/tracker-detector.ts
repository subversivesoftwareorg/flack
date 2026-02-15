import type { TrackerDefinition, TrackerMatch } from '@/types';
import { trackers } from '@/trackers';

export class TrackerDetector {
  private domainIndex: Map<string, TrackerDefinition[]> = new Map();

  constructor(enabledTrackerIds?: string[]) {
    this.buildDomainIndex(enabledTrackerIds);
  }

  private buildDomainIndex(enabledTrackerIds?: string[]): void {
    this.domainIndex.clear();

    const activeTrackers = enabledTrackerIds
      ? trackers.filter((t) => enabledTrackerIds.includes(t.id))
      : trackers;

    for (const tracker of activeTrackers) {
      for (const pattern of tracker.patterns) {
        for (const domain of pattern.domains) {
          const rootDomain = this.extractRootDomain(domain);
          const existing = this.domainIndex.get(rootDomain) || [];
          if (!existing.includes(tracker)) {
            existing.push(tracker);
          }
          this.domainIndex.set(rootDomain, existing);
        }
      }
    }
  }

  updateEnabledTrackers(enabledTrackerIds: string[]): void {
    this.buildDomainIndex(enabledTrackerIds);
  }

  private extractRootDomain(hostname: string): string {
    // Remove wildcard prefix
    const cleaned = hostname.replace(/^\*\./, '');

    // Extract root domain (e.g., google-analytics.com from www.google-analytics.com)
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return parts.slice(-2).join('.');
    }
    return cleaned;
  }

  detect(url: string, method: string): TrackerMatch | null {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return null;
    }

    const rootDomain = this.extractRootDomain(parsedUrl.hostname);
    const candidates = this.domainIndex.get(rootDomain);

    if (!candidates) {
      return null;
    }

    for (const tracker of candidates) {
      for (const pattern of tracker.patterns) {
        if (this.matchesPattern(parsedUrl, method, pattern)) {
          return {
            tracker,
            originalUrl: url,
            parsedData: tracker.parseOriginal(url, method),
            timestamp: Date.now(),
          };
        }
      }
    }

    return null;
  }

  private matchesPattern(
    url: URL,
    method: string,
    pattern: { domains: string[]; pathPatterns: RegExp[]; methods?: string[] }
  ): boolean {
    // Check domain match
    const hostname = url.hostname;
    const domainMatches = pattern.domains.some((domain) => {
      if (domain.startsWith('*.')) {
        const suffix = domain.slice(2);
        return hostname.endsWith(suffix) || hostname === suffix;
      }
      return hostname === domain || hostname.endsWith('.' + domain);
    });

    if (!domainMatches) {
      return false;
    }

    // Check method match
    if (pattern.methods && !pattern.methods.includes(method.toUpperCase())) {
      return false;
    }

    // Check path match
    const pathname = url.pathname;
    return pattern.pathPatterns.some((regex) => regex.test(pathname));
  }
}
