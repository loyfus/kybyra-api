/**
 * Wikidata helpers — discovers an image filename from a Wikidata Q-id and
 * resolves the canonical URL of the image hosted on Wikimedia Commons,
 * along with attribution metadata.
 */

const USER_AGENT = 'Kybyra/0.1 (https://kybyra.app; dev contact)';

type WikidataEntity = {
  entities: Record<
    string,
    {
      claims?: Record<
        string,
        Array<{
          mainsnak?: {
            datavalue?: { value?: unknown };
          };
        }>
      >;
    }
  >;
};

type CommonsImageInfo = {
  query?: {
    pages?: Record<
      string,
      {
        imageinfo?: Array<{
          url?: string;
          descriptionurl?: string;
          extmetadata?: {
            License?: { value?: string };
            LicenseShortName?: { value?: string };
            Artist?: { value?: string };
            Credit?: { value?: string };
          };
        }>;
      }
    >;
  };
};

export type ResolvedImage = {
  filename: string;
  imageUrl: string;
  sourceUrl: string;
  attribution: string;
};

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return (await res.json()) as T;
}

/** Returns the image filename declared by Wikidata's P18 ("image") for the entity. */
export async function getImageFilenameFromWikidata(qid: string): Promise<string | null> {
  const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${encodeURIComponent(
    qid,
  )}&props=claims&format=json&languages=en`;
  const data = await fetchJson<WikidataEntity>(url);
  const entity = data.entities?.[qid];
  const p18 = entity?.claims?.P18;
  const value = p18?.[0]?.mainsnak?.datavalue?.value;
  return typeof value === 'string' ? value : null;
}

/** Strips wiki-style HTML/links from attribution fields. */
function stripHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/** Given a Commons filename, returns the direct download URL + attribution metadata. */
export async function getCommonsImageInfo(filename: string): Promise<ResolvedImage | null> {
  const title = `File:${filename}`;
  const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&titles=${encodeURIComponent(
    title,
  )}&iiprop=url|extmetadata`;
  const data = await fetchJson<CommonsImageInfo>(url);
  const pages = data.query?.pages ?? {};
  const page = Object.values(pages)[0];
  const info = page?.imageinfo?.[0];
  if (!info?.url) return null;

  const meta = info.extmetadata ?? {};
  const license = meta.LicenseShortName?.value ?? meta.License?.value ?? 'Unknown license';
  const artistRaw = meta.Artist?.value ?? meta.Credit?.value ?? 'Unknown';
  const artist = stripHtml(artistRaw);
  const attribution = `${artist} / Wikimedia Commons (${stripHtml(license)})`;

  return {
    filename,
    imageUrl: info.url,
    sourceUrl: info.descriptionurl ?? `https://commons.wikimedia.org/wiki/${title}`,
    attribution,
  };
}

export async function resolveImageForWikidataId(qid: string): Promise<ResolvedImage | null> {
  const filename = await getImageFilenameFromWikidata(qid);
  if (!filename) return null;
  return getCommonsImageInfo(filename);
}

type WikipediaSearch = {
  query?: {
    search?: Array<{ title?: string }>;
  };
};

type WikipediaPageImages = {
  query?: {
    pages?: Record<
      string,
      {
        title?: string;
        fullurl?: string;
        original?: { source?: string };
        thumbnail?: { source?: string };
        pageimage?: string; // file name, e.g. "Tesla Model Y.jpg"
      }
    >;
  };
};

/**
 * Fallback: searches Wikipedia (English) by free-text and uses the page image.
 * Less precise than Wikidata Q-id, but covers many vehicles that don't expose P18.
 */
export async function getImageFromWikipediaSearch(query: string): Promise<ResolvedImage | null> {
  const searchUrl =
    'https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&srlimit=1' +
    `&srsearch=${encodeURIComponent(query)}`;
  const search = await fetchJson<WikipediaSearch>(searchUrl);
  const title = search.query?.search?.[0]?.title;
  if (!title) return null;

  const pageUrl =
    'https://en.wikipedia.org/w/api.php?action=query&prop=pageimages|info&inprop=url' +
    '&piprop=original|name&pithumbsize=1200&format=json' +
    `&titles=${encodeURIComponent(title)}`;
  const page = await fetchJson<WikipediaPageImages>(pageUrl);
  const pages = page.query?.pages ?? {};
  const p = Object.values(pages)[0];
  const url = p?.original?.source;
  if (!url) return null;

  const pageImageName = p.pageimage;
  if (pageImageName) {
    // Try to enrich attribution by querying Commons for the underlying file.
    try {
      const commons = await getCommonsImageInfo(pageImageName);
      if (commons) return commons;
    } catch {
      // fallthrough: use a basic attribution
    }
  }

  const filename = decodeURIComponent(new URL(url).pathname.split('/').pop() ?? 'image.jpg');
  return {
    filename,
    imageUrl: url,
    sourceUrl: p?.fullurl ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
    attribution: `Wikipedia "${title}" / Wikimedia Commons`,
  };
}

export async function resolveImageForCar(opts: {
  wikidataId?: string;
  brand: string;
  model: string;
  variant?: string | null;
}): Promise<ResolvedImage | null> {
  if (opts.wikidataId) {
    try {
      const fromWikidata = await resolveImageForWikidataId(opts.wikidataId);
      if (fromWikidata) return fromWikidata;
    } catch {
      // fall through to Wikipedia search
    }
  }

  const baseQuery = `${opts.brand} ${opts.model}`.trim();
  const queries = [
    `${baseQuery} ${opts.variant ?? ''}`.trim(),
    baseQuery,
    `${opts.brand} ${opts.model} car`.trim(),
  ];
  // Deduplicate while preserving order.
  const seen = new Set<string>();
  for (const q of queries) {
    if (seen.has(q)) continue;
    seen.add(q);
    try {
      const found = await getImageFromWikipediaSearch(q);
      if (found) return found;
    } catch {
      // try next
    }
  }
  return null;
}
