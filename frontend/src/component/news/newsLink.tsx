import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Banner } from "../../types/banner";
import { isExternalLink, isInternalLink } from "../../utils/link";

interface Props {
  banner: Banner;
  className?: string;
  children: ReactNode;
  onNavigate?: () => void;
}

/**
 * Mở link của banner: link nội bộ đi bằng router, link ngoài mở tab mới,
 * không có link thì về trang Tin tức.
 */
export default function NewsLink({ banner, className, children, onNavigate }: Props) {
  if (isExternalLink(banner.linkUrl)) {
    return (
      <a
        href={banner.linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onClick={onNavigate}
      >
        {children}
      </a>
    );
  }
  const to = isInternalLink(banner.linkUrl) ? banner.linkUrl : `/news#news-${banner.id}`;
  return (
    <Link to={to} className={className} onClick={onNavigate}>
      {children}
    </Link>
  );
}
