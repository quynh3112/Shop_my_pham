import { useEffect } from "react";
import { Popover } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import useCategory from "../hooks/useCategory";
import type { Category } from "../types/category";

const categoryPath = (categoryId: number) => `/products?categoryId=${categoryId}`;

interface Props {
  /** Class dùng chung cho các mục nav (để đồng bộ với Trang chủ, Tin tức...) */
  itemClassName: string;
  /** Danh mục đang xem (từ ?categoryId=), để tô đậm mục tương ứng */
  activeCategoryId?: number;
}

const containsCategory = (category: Category, id?: number): boolean =>
  id !== undefined &&
  (category.id === id || (category.children ?? []).some((child) => containsCategory(child, id)));

function CategoryDropdown({ parent }: { parent: Category }) {
  const groups = parent.children ?? [];
  return (
    <div className="w-[min(860px,90vw)] p-3">
      <div className="grid grid-cols-2 gap-x-8 gap-y-6 md:grid-cols-4">
        {groups.map((group) => (
          <div key={group.id}>
            <Link
              to={categoryPath(group.id)}
              className="mb-3 block text-sm font-semibold uppercase tracking-[0.12em] !text-[#e16463] hover:underline"
            >
              {group.name}
            </Link>
            <ul className="space-y-2">
              {(group.children ?? []).map((child) => (
                <li key={child.id}>
                  <Link
                    to={categoryPath(child.id)}
                    className="text-sm !text-[#6b5b5e] transition-colors hover:!text-[#e16463]"
                  >
                    {child.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <Link
        to={categoryPath(parent.id)}
        className="mt-5 block border-t border-[#f3d4d7] pt-3 text-center text-sm font-medium !text-[#e16463] hover:underline"
      >
        Xem tất cả {parent.name}
      </Link>
    </div>
  );
}

/** Các danh mục cấp 1 trên nav, rê chuột hiện danh mục con */
export default function CategoryMenu({ itemClassName, activeCategoryId }: Props) {
  const { error, categories, fetchCategory } = useCategory();

  useEffect(() => {
    fetchCategory();
  }, []);

  // Lỗi tải danh mục thì chỉ ẩn phần danh mục, nav vẫn dùng được
  if (error) return null;

  return (
    <>
      {categories.map((parent) => {
        const active = containsCategory(parent, activeCategoryId);
        const item = (
          <Link
            to={categoryPath(parent.id)}
            className={itemClassName}
            aria-current={active ? "page" : undefined}
          >
            {parent.name}
            {parent.children?.length > 0 && <DownOutlined className="text-[10px]" />}
          </Link>
        );

        return parent.children?.length > 0 ? (
          <Popover
            key={parent.id}
            trigger={["hover"]}
            placement="bottom"
            arrow={false}
            content={<CategoryDropdown parent={parent} />}
          >
            {item}
          </Popover>
        ) : (
          <span key={parent.id}>{item}</span>
        );
      })}
    </>
  );
}
