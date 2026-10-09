import { api } from "../config/api";
import type { ProductCreate, ProductQuery, ProductUpdate } from "../types/product";
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
    const res=await api.get(endpoint, { params: query })

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
