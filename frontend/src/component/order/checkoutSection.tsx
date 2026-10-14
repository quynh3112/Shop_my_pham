import type { ReactNode } from "react";

interface Props {
  step?: number;
  title: string;
  extra?: ReactNode;
  children: ReactNode;
}

/** Khung một bước trong trang đặt hàng / chi tiết đơn */
export default function CheckoutSection({ step, title, extra, children }: Props) {
  return (
    <section className="rounded-3xl border border-[#f0dcdc] bg-white p-5 sm:p-7">
      <header className="mb-5 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-3 text-lg font-semibold text-[#2d2020]">
          {step !== undefined && (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e16463] text-sm text-white">
              {step}
            </span>
          )}
          {title}
        </h2>
        {extra}
      </header>
      {children}
    </section>
  );
}
