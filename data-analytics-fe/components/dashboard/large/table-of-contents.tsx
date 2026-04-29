"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TableOfContentsProps {
  content: string;
}

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const regex = /^(#{1,3})\s+(.+)$/gm;
    const items: TocItem[] = [];
    let match;

    while ((match = regex.exec(content)) !== null) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
      items.push({ id, text, level });
    }

    setHeadings(items);
  }, [content]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "0px 0px -80% 0px" }
    );

    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <aside
      className="hidden xl:block w-72 p-8 border-l md:px-6 md:py-10 backdrop-blur-sm h-full overflow-y-auto"
      style={{
        borderColor: "var(--surface-border)",
        background: "var(--surface-inset)",
      }}
    >
      <div className="sticky">
        <h4 className="font-bold uppercase tracking-widest mb-6" style={{ color: "var(--text-muted)" }}>
          Contents
        </h4>
        <nav
          className="flex flex-col gap-4 border-l relative"
          style={{ borderColor: "var(--surface-border)" }}
        >
          {headings.map((heading) => (
            <a
              key={heading.id}
              href={`#${heading.id}`}
              className={cn(
                "text-sm transition-colors block border-l-2 -ml-[2px]",
                activeId === heading.id
                  ? "border-primary text-primary font-medium"
                  : "border-transparent hover:text-primary"
              )}
              style={{
                color: activeId !== heading.id ? "var(--text-secondary)" : undefined,
                paddingLeft: heading.level === 3 ? "2rem" : "1rem",
              }}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(heading.id)?.scrollIntoView({ behavior: "smooth" });
                setActiveId(heading.id);
              }}
            >
              {heading.text}
            </a>
          ))}
        </nav>
      </div>
    </aside>
  );
}
