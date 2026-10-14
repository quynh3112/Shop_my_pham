import type { ReactNode } from "react";

interface Props {
  label: string;
  hint?: string;
  children: ReactNode;
}

/** Một mục trong bộ lọc: tiêu đề + nội dung */
export default function FilterSection({ label, hint, children }: Props) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-gray-700">
        {label}
        {hint && <span className="ml-1 text-xs font-normal text-gray-400">{hint}</span>}
      </p>
      {children}
    </div>
  );
}
