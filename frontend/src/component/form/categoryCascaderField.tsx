import { Cascader, Form } from "antd";
import type { Category } from "../../types/category";
import { findCategoryPath } from "../../utils/category";

type CategoryOption = {
  value: number;
  label: string;
  children?: CategoryOption[];
};

const buildCategoryOptions = (categories: Category[]): CategoryOption[] =>
  categories.map((category) => ({
    value: category.id,
    label: category.name,
    children: category.children?.length ? buildCategoryOptions(category.children) : undefined,
  }));


interface Props {
  categories: Category[];
  name?: string;
  label?: string;
  required?: boolean;
  onSelect?: (categoryId: number) => void;
}

/**
 * Form lưu một categoryId, Cascader hiển thị theo đường dẫn cha -> con,
 * nên khi sửa (đã có categoryId) cũng hiện đúng danh mục.
 */
export default function CategoryCascaderField({
  categories,
  name = "categoryId",
  label = "Danh mục",
  required = true,
  onSelect,
}: Props) {
  const form = Form.useFormInstance();
  const categoryId: number | undefined = Form.useWatch(name, form);
  const categoryPath = categoryId === undefined ? [] : findCategoryPath(categories, categoryId);

  return (
    <Form.Item
      name={name}
      label={label}
      rules={required ? [{ required: true, message: "Chọn danh mục" }] : undefined}
      getValueProps={() => ({ value: categoryPath })}
      getValueFromEvent={(path?: number[]) => path?.[path.length - 1]}
    >
      <Cascader
        options={buildCategoryOptions(categories)}
        showSearch
        placeholder="Chọn danh mục"
        changeOnSelect={false}
        displayRender={(labels) => labels.join(" / ")}
        onChange={(value) => {
          const selectedId = (value as number[] | undefined)?.at(-1);
          if (selectedId !== undefined) onSelect?.(selectedId);
        }}
      />
    </Form.Item>
  );
}
