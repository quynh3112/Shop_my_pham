import { useEffect, useState } from "react";

// Số sản phẩm mỗi hàng theo độ rộng màn hình (khớp breakpoint Tailwind md / lg)
const getItemsPerView = () => {
  if (typeof window === "undefined") return 4;
  if (window.matchMedia("(min-width: 1024px)").matches) return 4;
  if (window.matchMedia("(min-width: 768px)").matches) return 3;
  return 2;
};

export default function useItemsPerView() {
  const [itemsPerView, setItemsPerView] = useState(getItemsPerView);

  useEffect(() => {
    const update = () => setItemsPerView(getItemsPerView());
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return itemsPerView;
}
