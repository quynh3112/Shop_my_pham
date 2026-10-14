import { api } from "../config/api";
import type { ProductCreate, ProductItem, ProductQuery, ProductUpdate } from "../types/product";
const endpoint = "/product";
export const createProduct=async(product:ProductCreate)=>{
    const token=localStorage.getItem('token')
    const res=await api.post(`${endpoint}`,product,{
        headers:{
            Authorization:`Bearer ${token}`
        }
    })
    return res.data
}
export const getProducts=async(query?: ProductQuery)=>{
    // Mảng gửi dạng "oily,dry" để backend đọc được bất kể cách parse query string
    const params = query && Object.fromEntries(
        Object.entries(query).map(([key, value]) => [key, Array.isArray(value) ? value.join(",") : value]),
    )
    // Đã đăng nhập thì gửi kèm token để "Dành cho bạn" dùng sở thích của khách (API vẫn công khai)
    const token=localStorage.getItem('token')
    const res=await api.get(endpoint, { params, headers: token ? { Authorization:`Bearer ${token}` } : undefined })

    return res.data
}
export const removeProduct=async(id:number)=>{
    const token=localStorage.getItem('token')
    const res=await api.delete(`${endpoint}/${id}`,{
        headers:{
            Authorization:`Bearer ${token}` 
        }
    })
    return res.data
}
// Sản phẩm bán chạy (backend bù bằng sản phẩm mới nếu chưa đủ)
export const getBestSellers=async(limit=12):Promise<ProductItem[]>=>{
    const res=await api.get(`${endpoint}/best-sellers`,{params:{limit}})
    return res.data
}
export const getProducById=async(id:number)=>{
    const res=await api.get(`${endpoint}/${id}`)
    return res.data
}
export const updateProduct=async(id:number,product:ProductUpdate)=>{
    const token=localStorage.getItem('token')
    const res=await api.patch(`${endpoint}/${id}`,product,{
        headers:{
            Authorization:`Bearer ${token}`
        }
    })
    return res.data
}
export const uploadDescriptionPdf=async(id:number,file:File)=>{
    const token=localStorage.getItem('token')
    const formData=new FormData()
    formData.append('file',file)
    const res=await api.post(`${endpoint}/${id}/description-pdf`,formData,{
        headers:{
            Authorization:`Bearer ${token}`
        }
    })
    return res.data
}
export const removeDescriptionPdf=async(id:number)=>{
    const token=localStorage.getItem('token')
    const res=await api.delete(`${endpoint}/${id}/description-pdf`,{
        headers:{
            Authorization:`Bearer ${token}`
        }
    })
    return res.data
}
export const toFileUrl=(path:string)=>
    /^https?:\/\//.test(path) ? path : `${api.defaults.baseURL}${path}`

// Tải nhiều ảnh cho sản phẩm (JPG/PNG/WEBP/GIF, tối đa 5MB mỗi ảnh)
export const uploadProductImages=async(id:number,files:File[])=>{
    const token=localStorage.getItem('token')
    const formData=new FormData()
    files.forEach((file)=>formData.append('images',file))
    const res=await api.post(`${endpoint}/${id}/images`,formData,{
        headers:{
            Authorization:`Bearer ${token}`
        }
    })
    return res.data
}
export const removeProductImage=async(imageId:number)=>{
    const token=localStorage.getItem('token')
    const res=await api.delete(`${endpoint}/images/${imageId}`,{
        headers:{
            Authorization:`Bearer ${token}`
        }
    })
    return res.data
}
// URL đầy đủ của các ảnh sản phẩm theo thứ tự hiển thị
export const getProductImageUrls=(product:ProductItem)=>
    [...(product.images ?? []).map((image)=>typeof image==="string"?image:image.url), product.image]
        .filter((url):url is string=>typeof url==="string" && url.length>0)
        .map(toFileUrl)
export const getProductCover=(product:ProductItem)=>getProductImageUrls(product)[0]
