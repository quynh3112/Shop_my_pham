export interface Category {
    id: number
    name: string
    slug?: string
    sortOrder: number
    productCount: number
    parentId?: number
    children?: Category[]
}

export interface CategoryGroup extends Category {
    children: Category[]
}