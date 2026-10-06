import { api } from "../config/api"
import type { AddCartItemBody, CartView } from "../types/cart"

const endpoint='cart'
export const addCart=async(data:AddCartItemBody)=>{
    const token=localStorage.getItem('token')
    const res=await api.post(`${endpoint}/items`,data,{
        headers:{
            Authorization:`Bearer ${token}`
        }
    
    })
    return res.data

}
export const getCart=async():Promise<CartView>=>{
const token=localStorage.getItem('token')
const res= await api.get(`${endpoint}`,{
    headers:{
        Authorization:`Bearer ${token}`
    }
})
return res.data
}
export const updateCart=async(itemId:number,quantity:number):Promise<CartView>=>{
const token=localStorage.getItem('token')
const res= await api.patch(`${endpoint}/${itemId}`, { quantity },{
    headers:{
        Authorization:`Bearer ${token}`
    }
})
return res.data
}
export const removeItem=async(itemId:number)=>{
    const token=localStorage.getItem('token')
const res= await api.delete(`${endpoint}/${itemId}`,{
    headers:{
        Authorization:`Bearer ${token}`
    }
})
return res.data
}
export const clearCart=async()=>{
    
  const token=localStorage.getItem('token')
const res= await api.delete(`${endpoint}`,{
    headers:{
        Authorization:`Bearer ${token}`
    }
})
return res.data
}