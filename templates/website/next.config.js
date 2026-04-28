const withMDX = require('@next/mdx')({
  extension: /\.mdx?$/,
  options: { remarkPlugins: [], rehypePlugins: [] }
});

module.exports = withMDX({
  pageExtensions: ['tsx', 'ts', 'jsx', 'js', 'mdx', 'md'],
  reactStrictMode: true,
  // Static export for hosts like GitHub Pages and Cloudflare Pages
  // (vercel and netlify support both static and SSR; static is simpler)
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
  async redirects() {
    // Populated by project-website-publisher.regenerate from documents/index.yaml
    // entries with redirect_from. This is overwritten on each regenerate.
    return [];
  }
});
