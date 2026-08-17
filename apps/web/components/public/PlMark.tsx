interface PlMarkProps {
  children: string;
  onDark?: boolean;
}

export function PlMark({ children, onDark = false }: PlMarkProps) {
  return <em className={`pl-mark${onDark ? " pl-mark--dark" : ""}`}>{children}</em>;
}
