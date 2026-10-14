export interface Category {
    id: number
    name: string
    slug?: string
    sortOrder: number
    productCount: number
    parentId?: number | null
    children?: Category[]
}

export interface CategoryGroup extends Category {
    children: Category[]
}

/** Dữ liệu gửi lên khi thêm / sửa danh mục (slug do backend tự sinh) */
export interface CategoryInput {
    name: string
    parentId?: number | null
    sortOrder?: number
}
