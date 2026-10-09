import { DownOutlined, FilePdfOutlined, UpOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useLayoutEffect, useRef, useState } from "react";
import { toFileUrl } from "../service/product.service";

interface Props {
  description?: string | null;
  pdfUrl?: string | null;
}

// Chiều cao tối đa của mô tả khi thu gọn (px)
const COLLAPSED_HEIGHT = 168;

export default function ProductDescription({ description, pdfUrl }: Props) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const text = description?.trim() ?? "";
  const pdfLink = pdfUrl ? toFileUrl(pdfUrl) : null;

  useLayoutEffect(() => {
    const element = contentRef.current;
    if (!element) return;
    const measure = () => setOverflowing(element.scrollHeight > COLLAPSED_HEIGHT + 8);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [text]);

  if (!text && !pdfLink) return null;

  // Nút "Xem thêm" hiện khi mô tả dài hoặc có PDF để xem trước
  const canToggle = overflowing || Boolean(pdfLink);
  const collapsed = canToggle && !expanded;

  return (
    <section className="mt-8 rounded-2xl bg-white p-5 shadow-[0_12px_45px_rgba(112,65,65,0.08)] sm:p-8 lg:p-12">
      <h2 className="!mb-6 !text-2xl !font-normal !text-[#3b2929]">Mô tả sản phẩm</h2>

      {text && (
        <div className="relative">
          <div
            ref={contentRef}
            className="overflow-hidden whitespace-pre-line leading-7 text-[#765f5f] transition-[max-height] duration-300"
            style={{ maxHeight: collapsed && overflowing ? COLLAPSED_HEIGHT : undefined }}
          >
            {text}
          </div>
          {collapsed && overflowing && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />
          )}
        </div>
      )}

      {pdfLink && (
        <div className="mt-6">
          <a
            href={pdfLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-[#f1e2e0] px-4 py-2 text-sm !text-[#c9696b] hover:bg-[#fffafa]"
          >
            <FilePdfOutlined /> Xem tài liệu mô tả (PDF)
          </a>
          {expanded && (
            <iframe
              src={pdfLink}
              title="Tài liệu mô tả sản phẩm"
              className="mt-4 h-[70vh] w-full rounded-xl border border-[#f1e2e0]"
            />
          )}
        </div>
      )}

      {canToggle && (
        <div className="mt-4 flex justify-center">
          <Button
            type="link"
            className="!text-[#c9696b]"
            icon={expanded ? <UpOutlined /> : <DownOutlined />}
            iconPosition="end"
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? "Thu gọn" : "Xem thêm"}
          </Button>
        </div>
      )}
    </section>
  );
}
