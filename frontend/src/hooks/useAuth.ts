import { useState } from "react";
import type { Login, User } from "../types/user";
import { login, register } from "../service/user.service";

export default function useAuth(){
    const [loading,setLoading]=useState<boolean>(false)
    const [error,setError]=useState<string>('')
    
    const handleLogin=async(data:Login)=>{
        try{
            setLoading(true)
            const res=await login(data)
           
            localStorage.setItem('token',res.accessToken)
             localStorage.setItem("user", JSON.stringify(res.user))
        }
        catch(err:any){
            setError(err.mesage|| "Đăng nhập thất bại!")
        }
        finally{
            setLoading(false)
        }

    }
    const handleRegister=async (data:User)=>{
        try{
            setLoading(true)
           await register(data)


        }
        catch(err:any){
            setError(err.message||"Đăng ký thất bại!")
        }
        finally{
            setLoading(false)
        }

    }
    return {loading,error,handleLogin,handleRegister}
}