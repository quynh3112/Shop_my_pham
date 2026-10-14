import { ArrowRightOutlined, DownOutlined } from "@ant-design/icons";
import { Popover } from "antd";
import { useState } from "react";
import { Link } from "react-router-dom";
import useActiveBanners from "../../hooks/useActiveBanners";
import NewsCard from "./newsCard";

const MENU_LIMIT = 4;

interface Props {
  active?: boolean;
  className: string;
}

/** Mục "Tin tức" trên nav: rê chuột hiện các tin mới nhất từ banner */
export default function NewsMenu({ active, className }: Props) {
  const { banners } = useActiveBanners();
  const [open, setOpen] = useState(false);
  const latest = banners.slice(0, MENU_LIMIT);

  const label = (
    <Link to="/news" className={className} aria-current={active ? "page" : undefined}>
      Tin tức
      {latest.length > 0 && <DownOutlined className="text-[10px]" />}
    </Link>
  );

  if (latest.length === 0) return label;

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger={["hover"]}
      placement="bottom"
      arrow={false}
      content={
        <div className="w-[360px] p-1">
          <div className="flex flex-col gap-1">
            {latest.map((banner) => (
              <NewsCard key={banner.id} banner={banner} variant="compact" onNavigate={() => setOpen(false)} />
            ))}
          </div>
          <Link
            to="/news"
            onClick={() => setOpen(false)}
            className="mt-2 flex items-center justify-center gap-1 border-t border-[#f3d4d7] pt-3 text-sm font-medium !text-[#e16463] hover:underline"
          >
            Xem tất cả tin tức <ArrowRightOutlined className="text-xs" />
          </Link>
        </div>
      }
    >
      {label}
    </Popover>
  );
}
