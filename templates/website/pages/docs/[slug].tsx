import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import DocLayout from '../../components/DocLayout';

interface Props {
  source: MDXRemoteSerializeResult;
  frontmatter: {
    title: string;
    description?: string;
    visibility: 'team' | 'consortium' | 'public';
    last_modified?: string;
  };
}

export async function getStaticPaths() {
  const docsDir = path.join(process.cwd(), 'content', 'docs');
  const files = fs.existsSync(docsDir)
    ? fs.readdirSync(docsDir).filter(f => f.endsWith('.mdx') || f.endsWith('.md'))
    : [];
  return {
    paths: files.map(f => ({
      params: { slug: f.replace(/\.mdx?$/, '') }
    })),
    fallback: false
  };
}

export async function getStaticProps({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const docsDir = path.join(process.cwd(), 'content', 'docs');
  const candidates = [
    path.join(docsDir, `${slug}.mdx`),
    path.join(docsDir, `${slug}.md`)
  ];
  const filePath = candidates.find(p => fs.existsSync(p));
  if (!filePath) {
    return { notFound: true };
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);
  const mdxSource = await serialize(content);

  return {
    props: {
      source: mdxSource,
      frontmatter: {
        title: data.title ?? slug,
        description: data.description ?? null,
        visibility: data.visibility ?? 'consortium',
        last_modified: data.last_modified ?? null
      }
    }
  };
}

export default function DocPage({ source, frontmatter }: Props) {
  return (
    <DocLayout
      title={frontmatter.title}
      description={frontmatter.description}
      visibility={frontmatter.visibility}
      lastModified={frontmatter.last_modified}
      consortiumName={process.env.NEXT_PUBLIC_CONSORTIUM}
    >
      <MDXRemote {...source} />
    </DocLayout>
  );
}
