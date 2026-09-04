import type { ElementType, HTMLAttributes } from "react";

import { cn } from "@/lib/cn";

const MAX_WIDTH = {
  narrow: "max-w-md",
  content: "max-w-3xl",
  wide: "max-w-6xl",
} as const;

type ContainerProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  size?: keyof typeof MAX_WIDTH;
};

/** Ancho central consistente para el contenido de página. */
export function Container({
  as: Tag = "main",
  size = "content",
  className,
  ...props
}: ContainerProps) {
  return (
    <Tag
      className={cn(
        "mx-auto flex w-full flex-1 flex-col gap-8 px-6 py-12 sm:py-16",
        MAX_WIDTH[size],
        className,
      )}
      {...props}
    />
  );
}
