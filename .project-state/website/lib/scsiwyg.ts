const BASE_URL = 'https://www.scsiwyg.com/api/project-state';

export interface BlogPost {
  slug: string;
  title: string;
  publishedAt: string;
  tags: string[];
  excerpt: string;
  body?: string;
  html?: string;
  authorName?: string;
  coverImage?: string;
}

export interface WikiPage {
  slug: string;
  title: string;
  body?: string;
  html?: string;
  confidence?: string;
  sources?: string[];
  seeAlso?: string[];
}

async function safeFetch<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url, { next: { revalidate: 300 } } as any);
    if (!res.ok) return fallback;
    const json = await res.json();
    // scsiwyg API wraps responses in { ok: true, data: { ... } }
    if (json && json.ok && json.data) return json.data as T;
    return json as T;
  } catch {
    return fallback;
  }
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  const data = await safeFetch<any>(`${BASE_URL}/posts`, null);
  let posts: BlogPost[] = [];
  if (!data) return [];
  if (Array.isArray(data)) posts = data;
  else if (data.posts && Array.isArray(data.posts)) posts = data.posts;

  // List endpoint omits coverImage — fetch each post to get it
  const enriched = await Promise.all(
    posts.map(async (p) => {
      const full = await getBlogPost(p.slug);
      return full ? { ...p, coverImage: full.coverImage } : p;
    })
  );
  return enriched;
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  const data = await safeFetch<any>(`${BASE_URL}/posts/${slug}`, null);
  if (!data) return null;
  // Single post: data is the post object directly (after unwrapping .data)
  if (data.slug) return data as BlogPost;
  return null;
}

export async function getWikiPages(): Promise<WikiPage[]> {
  const data = await safeFetch<any>(`${BASE_URL}/pages`, null);
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.pages && Array.isArray(data.pages)) return data.pages;
  return [];
}

export async function getWikiPage(slug: string): Promise<WikiPage | null> {
  const data = await safeFetch<any>(`${BASE_URL}/pages/${slug}`, null);
  if (!data) return null;
  if (data.slug) return data as WikiPage;
  return null;
}
