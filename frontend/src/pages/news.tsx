import { Empty, Spin } from "antd";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import NewsCard from "../component/news/newsCard";
import useActiveBanners from "../hooks/useActiveBanners";

export default function News() {
  const { banners, loading, error } = useActiveBanners();
  const { hash } = useLocation();

  // Mở từ menu (/news#news-3) thì cuộn tới đúng tin
  useEffect(() => {
    if (!hash || loading) return;
    document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
  }, [hash, loading]);

  return (
    <main className="min-h-[60vh] bg-[#fffafa] px-6 py-12 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-[#bd8585]">Lunelle</p>
          <h1 className="mt-2 font-['Cormorant_Garamond'] text-5xl font-semibold text-[#2d2020]">
            Tin tức &amp; ưu đãi
          </h1>
        </header>

        {loading ? (
          <div className="flex justify-center py-16">
            <Spin size="large" />
          </div>
        ) : error ? (
          <p className="text-center text-[#c64f52]">Không tải được tin tức: {error}</p>
        ) : banners.length === 0 ? (
          <Empty description="Chưa có tin tức nào." />
        ) : (
          <div className="grid gap-x-8 gap-y-12 md:grid-cols-2">
            {banners.map((banner) => (
              <NewsCard key={banner.id} banner={banner} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
