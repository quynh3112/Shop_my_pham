import type { Category } from "../types/category";

/** Slug danh mục gốc Skincare: chỉ nhánh này mới lọc theo loại da / vấn đề da */
export const SKINCARE_SLUG = "skincare";

/** Trải phẳng cây danh mục (cha trước, con sau) */
export const flattenCategories = (items: Category[]): Category[] =>
  items.flatMap((item) => [item, ...flattenCategories(item.children ?? [])]);

/** Đường dẫn id từ gốc tới danh mục (vd. [2, 24, 29]), không thấy thì [] */
export const findCategoryPath = (categories: Category[], id: number): number[] => {
  for (const category of categories) {
    if (category.id === id) return [category.id];
    const childPath = findCategoryPath(category.children ?? [], id);
    if (childPath.length) return [category.id, ...childPath];
  }
  return [];
};

/** Danh mục gốc (cấp 1) chứa danh mục id */
export const findRootCategory = (categories: Category[], id?: number) => {
  if (id === undefined) return undefined;
  const [rootId] = findCategoryPath(categories, id);
  return categories.find((category) => category.id === rootId);
};

/** Danh mục id có thuộc nhánh Skincare (kể cả chính Skincare) không */
export const isSkincareCategory = (categories: Category[], id?: number) =>
  findRootCategory(categories, id)?.slug === SKINCARE_SLUG;
