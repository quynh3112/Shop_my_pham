import { api } from "../config/api"
import type { BannerQuery, CreateBanner } from "../types/banner"

const endpoint='banner'
export const bannerActive=async (query?: BannerQuery)=>{
    const res= await api.get(`${endpoint}/active`,{params:query})
    return res.data

}
export const  allBanner=async()=>{
    const token=localStorage.getItem('token')
    const res=await api.get(`${endpoint}/admin`,{
        headers:{
            Authorization:`Bearer ${token}`
        }
    })
    return res.data


}
export const createBanner=async(payload:CreateBanner)=>{
    const token=localStorage.getItem('token')
    const res=await api.post(endpoint,payload,{
        headers:{
            Authorization:`Bearer ${token}`
        }
    })
    return res.data

}
export const updateBanner=async(id:number,payload:Partial<CreateBanner>)=>{
      const token=await localStorage.getItem('token')
    const res=await api.patch(`${endpoint}/${id}`,payload,{
        headers:{
            Authorization:`Bearer ${token}`
        }
    })
    return res.data
}
export const updateStatus=async(id:number, isActive:boolean)=>{
    const token=localStorage.getItem('token')
    const res=await api.patch(`${endpoint}/${id}/active`,{ isActive },{
     headers:{
          Authorization:`Bearer ${token}`
     }
    })
    return res.data

}

export const deleteBanner = async (id: number) => {
    const token = localStorage.getItem("token")
    const res = await api.delete(`${endpoint}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
    })
    return res.data
}


