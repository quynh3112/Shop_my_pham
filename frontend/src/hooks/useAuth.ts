import { useState } from "react";
import { isAxiosError } from "axios";
import type { Login, User } from "../types/user";
import { login, register } from "../service/user.service";
import { notifyAuthChanged } from "../utils/auth";

const getErrorMessage = (err: unknown, fallback: string) => {
    if (isAxiosError(err)) {
        const serverMessage = err.response?.data?.message
        if (Array.isArray(serverMessage)) return serverMessage.join(", ")
        if (typeof serverMessage === "string") return serverMessage
    }
    return fallback
}

export default function useAuth(){
    const [loading,setLoading]=useState<boolean>(false)
    const [error,setError]=useState<string>('')

    // Trả về true nếu đăng nhập thành công
    const handleLogin=async(data:Login)=>{
        try{
            setLoading(true)
            setError('')
            const res=await login(data)

            localStorage.setItem('token',res.accessToken)
            localStorage.setItem("user", JSON.stringify(res.user))
            notifyAuthChanged()
            return true
        }
        catch(err){
            setError(getErrorMessage(err, "Đăng nhập thất bại!"))
            return false
        }
        finally{
            setLoading(false)
        }

    }
    const handleRegister=async (data:User)=>{
        try{
            setLoading(true)
            setError('')
            await register(data)
            return true
        }
        catch(err){
            setError(getErrorMessage(err, "Đăng ký thất bại!"))
            return false
        }
        finally{
            setLoading(false)
        }

    }
    return {loading,error,handleLogin,handleRegister}
}
