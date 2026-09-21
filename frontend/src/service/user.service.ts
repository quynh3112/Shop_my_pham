import { api } from "../config/api";
import type { Login, User } from "../types/user";
const endpoint='/auth'
export const login=async (data:Login)=>{
    const res= await api.post(`${endpoint}/login`,data)
    return res.data

}
export const profile=async()=>{
    const token=localStorage.getItem("token")
    const res= await api.get(`${endpoint}/profile`,{
        headers:{
            Authorization:`Bearer ${token}`
        }
    })
    return res.data
}
export const logout=async():Promise<void>=>{
    const token=localStorage.getItem("token")
    await api.post(`${endpoint}/logout`,
        {
             headers:{
            Authorization:`Bearer ${token}`
        }
        }
    )
    
}
export const register=async (data:User)=>{
    const res=await api.post('/user/register',data)
    return res.data;
}