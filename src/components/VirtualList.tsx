import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

interface Props<T> {
  items: T[];
  itemKey: (item: T) => number;
  rowHeight: number;
  id?: string;
  className?: string;
  header?: ReactNode;
  render: (item: T) => ReactNode;
}

export default function VirtualList<T>({ items, itemKey, rowHeight, id, className, header, render }: Props<T>) {
  const ref = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setHeight(el.clientHeight));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const top = scrollTop - (body.current?.offsetTop ?? 0);
  const first = Math.max(0, Math.floor(top / rowHeight) - 5);
  const last = Math.min(items.length, Math.ceil((top + height) / rowHeight) + 5);

  return (
    <div ref={ref} id={id} className={className} onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}>
      {header}
      <div ref={body} style={{ height: items.length * rowHeight, position: 'relative' }}>
        {items.slice(first, last).map((item, i) => (
          <div
            key={itemKey(item)}
            style={{ position: 'absolute', top: (first + i) * rowHeight, left: 0, right: 0, height: rowHeight }}
          >
            {render(item)}
          </div>
        ))}
      </div>
    </div>
  );
}
