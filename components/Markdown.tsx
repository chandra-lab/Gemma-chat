"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

const components: Components = {
  p: ({ node, ...props }) => <p className="my-2 leading-relaxed first:mt-0 last:mb-0" {...props} />,
  ul: ({ node, ...props }) => <ul className="my-2 list-disc space-y-1 pl-6" {...props} />,
  ol: ({ node, ...props }) => <ol className="my-2 list-decimal space-y-1 pl-6" {...props} />,
  li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
  h1: ({ node, ...props }) => <h1 className="mb-2 mt-4 text-xl font-semibold first:mt-0" {...props} />,
  h2: ({ node, ...props }) => <h2 className="mb-2 mt-4 text-lg font-semibold first:mt-0" {...props} />,
  h3: ({ node, ...props }) => <h3 className="mb-1 mt-3 text-base font-semibold first:mt-0" {...props} />,
  a: ({ node, ...props }) => (
    <a className="text-indigo-600 underline underline-offset-2 hover:opacity-80 dark:text-indigo-400" target="_blank" rel="noreferrer" {...props} />
  ),
  blockquote: ({ node, ...props }) => (
    <blockquote className="my-2 border-l-4 border-neutral-300 pl-3 italic text-neutral-600 dark:border-neutral-600 dark:text-neutral-400" {...props} />
  ),
  hr: () => <hr className="my-4 border-neutral-200 dark:border-neutral-700" />,
  table: ({ node, ...props }) => (
    <div className="my-3 overflow-x-auto">
      <table className="w-full border-collapse text-sm" {...props} />
    </div>
  ),
  th: ({ node, ...props }) => <th className="border border-neutral-300 px-2 py-1 text-left font-semibold dark:border-neutral-600" {...props} />,
  td: ({ node, ...props }) => <td className="border border-neutral-300 px-2 py-1 dark:border-neutral-600" {...props} />,
  pre: ({ node, ...props }) => <pre className="my-3 overflow-x-auto rounded-lg text-sm" {...props} />,
  code: ({ node, className, children, ...rest }) => {
    const isBlock = !!className && (className.includes("hljs") || className.includes("language-"));
    if (isBlock) {
      return (
        <code className={className} {...rest}>
          {children}
        </code>
      );
    }
    return (
      <code className="rounded bg-black/10 px-1.5 py-0.5 text-[0.85em] dark:bg-white/15" {...rest}>
        {children}
      </code>
    );
  },
};

export function Markdown({ children }: { children: string }) {
  return (
    <div className="text-[15px]">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
