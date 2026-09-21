export interface CreateBanner {
  name: string;
  imageUrl?: string;
  altText: string;
  linkUrl?: string;
  placement?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface Banner extends CreateBanner {
  id: number;
}

export interface BannerQuery {
    placement?:string
    isActive?:boolean
    page?:number
    limit?: number
}
