import { AppstoreOutlined } from "@ant-design/icons";
import { Tree, type TreeDataNode } from "antd";
import { useEffect, useMemo, useState } from "react";
import type { Category } from "../../../types/category";
import { findCategoryPath } from "../../../utils/category";

interface Props {
  categories: Category[];
  value?: number;
  onChange: (categoryId: number | undefined) => void;
}

const toTreeData = (categories: Category[]): TreeDataNode[] =>
  categories.map((category) => ({
    key: category.id,
    title: (
      <span className="flex items-center justify-between gap-2">
        <span className="truncate">{category.name}</span>
        {category.productCount > 0 && <span className="text-xs text-gray-400">{category.productCount}</span>}
      </span>
    ),
    children: category.children?.length ? toTreeData(category.children) : undefined,
  }));

/**
 * Chọn danh mục dạng cây hiển thị sẵn (không phải dropdown):
 * bấm mũi tên để mở nhánh con, bấm tên để chọn; bấm lại danh mục đang chọn để bỏ chọn.
 */
export default function CategoryTreeFilter({ categories, value, onChange }: Props) {
  const treeData = useMemo(() => toTreeData(categories), [categories]);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);

  // Mở sẵn nhánh chứa danh mục đang chọn (vd. vào từ menu với ?categoryId=)
  useEffect(() => {
    if (value === undefined) return;
    const parents = findCategoryPath(categories, value).slice(0, -1);
    setExpandedKeys((current) => [...new Set([...current, ...parents])]);
  }, [value, categories]);

  return (
    <div className="border border-[#f3d5d7] p-2">
      <button
        type="button"
        onClick={() => onChange(undefined)}
        className={`mb-1 flex w-full items-center gap-2 px-2 py-1 text-left text-sm transition ${
          value === undefined ? "bg-[#fbeef0] font-medium text-[#d9797d]" : "text-gray-600 hover:bg-gray-50"
        }`}
      >
        <AppstoreOutlined /> Tất cả sản phẩm
      </button>
      <Tree
        blockNode
        treeData={treeData}
        selectedKeys={value !== undefined ? [value] : []}
        expandedKeys={expandedKeys}
        onExpand={setExpandedKeys}
        onSelect={(_, { node }) => onChange(node.key === value ? undefined : Number(node.key))}
        className="[&_.ant-tree-node-content-wrapper]:!rounded-none [&_.ant-tree-node-selected]:!bg-[#fbeef0] [&_.ant-tree-node-selected]:!text-[#d9797d]"
      />
    </div>
  );
}
