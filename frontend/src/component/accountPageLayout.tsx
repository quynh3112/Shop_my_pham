import { ConfigProvider } from "antd";
import type { ReactNode } from "react";
import { authTheme } from "../config/theme";

interface Props {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  children: ReactNode;
}

/** Khung chung cho các trang tài khoản khách hàng: đơn hàng, yêu thích... */
export default function AccountPageLayout({ eyebrow = "Tài khoản của tôi", title, description, children }: Props) {
  return (
    <ConfigProvider theme={authTheme}>
      <main className="min-h-[70vh] bg-[#fffafa] px-5 py-10 sm:px-8 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <header className="mb-8">
            <p className="text-xs uppercase tracking-[0.2em] text-[#bd8585]">{eyebrow}</p>
            <h1 className="mt-1 font-['Cormorant_Garamond'] text-4xl font-semibold text-[#2d2020] sm:text-5xl">
              {title}
            </h1>
            {description && <p className="mt-2 text-sm text-[#987979]">{description}</p>}
          </header>
          {children}
        </div>
      </main>
    </ConfigProvider>
  );
}
