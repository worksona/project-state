import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import Mermaid from "./mermaid";

export default function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={{
        code({ className, children, ...props }) {
          const lang = /language-(\w+)/.exec(className || "")?.[1];
          const value = String(children).replace(/\n$/, "");
          if (lang === "mermaid") {
            return <Mermaid code={value} />;
          }
          if (!lang) {
            return <code className={className} {...props}>{children}</code>;
          }
          return (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
