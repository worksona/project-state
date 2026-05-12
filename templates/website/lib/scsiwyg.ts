import { SCSIWYG_API, SCSIWYG_USER } from "./paths";

export type ScsiwygPost = {
  slug: string;
  title: string;
  excerpt?: string;
  body?: string;
  tags?: string[];
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  visibility?: string;
  coverImage?: string | null;
};

export type ScsiwygWikiNode = {
  slug: string;
  title: string;
  parentSlug?: string | null;
  order?: number;
  children?: ScsiwygWikiNode[];
};

const REVALIDATE = 300;

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { next: { revalidate: REVALIDATE } });
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.data ?? json) as T;
  } catch {
    return null;
  }
}

export async function listPosts(): Promise<ScsiwygPost[]> {
  const data = await fetchJson<any>(
    `${SCSIWYG_API}/api/${SCSIWYG_USER}?type=post`,
  );
  const stubs = (data?.posts ?? []) as ScsiwygPost[];
  const filtered = stubs.filter(
    (p) => !p.visibility || p.visibility === "public",
  );
  // List API omits coverImage and contentType; hydrate each in parallel.
  const hydrated = await Promise.all(
    filtered.map(async (p) => {
      const full = await getPost(p.slug);
      return full ? { ...p, ...full } : p;
    }),
  );
  // Filter out wiki pages that leak into the post list (server bug — page
  // contentType is "page" not "post").
  return hydrated.filter(
    (p: any) => !p.contentType || p.contentType === "post",
  );
}

export async function getPost(slug: string): Promise<ScsiwygPost | null> {
  const data = await fetchJson<any>(
    `${SCSIWYG_API}/api/${SCSIWYG_USER}/posts/${encodeURIComponent(slug)}`,
  );
  return (data?.post ?? data) as ScsiwygPost | null;
}

export async function getWikiTree(): Promise<ScsiwygWikiNode[]> {
  const data = await fetchJson<any>(
    `${SCSIWYG_API}/api/${SCSIWYG_USER}/pages/tree`,
  );
  return (data?.tree ?? []) as ScsiwygWikiNode[];
}

export async function getWikiPage(slug: string): Promise<ScsiwygPost | null> {
  const data = await fetchJson<any>(
    `${SCSIWYG_API}/api/${SCSIWYG_USER}/pages/${encodeURIComponent(slug)}`,
  );
  return (data?.page ?? data) as ScsiwygPost | null;
}

export function flattenTree(
  tree: ScsiwygWikiNode[],
  out: ScsiwygWikiNode[] = [],
): ScsiwygWikiNode[] {
  for (const node of tree) {
    out.push(node);
    if (node.children?.length) flattenTree(node.children, out);
  }
  return out;
}
