const withMDX = require('@next/mdx')({
  extension: /\.mdx?$/,
  options: { remarkPlugins: [], rehypePlugins: [] }
});

module.exports = withMDX({
  pageExtensions: ['tsx', 'ts', 'jsx', 'js', 'mdx', 'md'],
  reactStrictMode: true,
  images: { unoptimized: true },
  trailingSlash: true
});
