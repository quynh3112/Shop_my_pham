import { api } from "../config/api";
import type { Login, User } from "../types/user";
const endpoint='/auth'
export const login=async (data:Login)=>{
    const res= await api.post(`${endpoint}/login`,data)
    return res.data

}
export const register=async (data:User)=>{
    const res=await api.post('/user/register',data)
    return res.data;
}