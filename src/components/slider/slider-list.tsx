import type { SliderCardProps } from "./slider-card";

import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { SliderCard } from "./slider-card";

type SliderListProps = {
  title: string;
  subtitle?: string;
  items: ({ id: string } & SliderCardProps)[];
};

export function SliderList({ title, subtitle, items }: SliderListProps) {
  return (
    <section className="space-y-2">
      <header>
        <h2 className="pl-2 font-heading text-xl text-white drop-shadow-md sm:text-2xl md:text-3xl lg:pl-0">
          {title}
        </h2>

        {subtitle && (
          <p className="pl-2 font-medium text-muted-foreground lg:pl-1">
            {subtitle}
          </p>
        )}
      </header>

      <ScrollArea>
        <ol className="flex space-x-4 pb-4">
          {items?.map(({ id, ...props }) => (
            <li key={id}>
              <SliderCard {...props} />
            </li>
          ))}
        </ol>

        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
}
