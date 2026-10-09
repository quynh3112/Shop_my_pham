import { useState } from "react";
<<<<<<< HEAD
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
=======
import { message } from "antd";
import type { AuthResponse, Login, Register, ResetPassword, VerifyOtp } from "../types/user";
import {
    forgotPassword,
    login,
    register,
    resendRegisterOtp,
    resetPassword,
    verifyRegisterOtp,
    verifyResetOtp,
} from "../service/user.service";

// Lấy message lỗi backend trả về (ValidationPipe trả về dạng mảng)
const getErrorMessage=(err:any,fallback:string)=>{
    const msg=err?.response?.data?.message
    if(Array.isArray(msg)) return msg[0] as string
    return typeof msg==="string"?msg:fallback
>>>>>>> 40b063339a7d7d95efab10c3f168ef753504ab24
}

export default function useAuth(){
    const [loading,setLoading]=useState<boolean>(false)
<<<<<<< HEAD
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
=======

    // Gọi API, lỗi thì hiện thông báo và trả về null
    const run=async<T>(request:()=>Promise<T>,fallback:string):Promise<T|null>=>{
        try{
            setLoading(true)
            return await request()
        }
        catch(err:any){
            message.error(getErrorMessage(err,fallback))
            return null
        }
        finally{
            setLoading(false)
        }
    }

    const saveSession=(res:AuthResponse|null)=>{
        if(res){
            localStorage.setItem('token',res.accessToken)
            localStorage.setItem("user", JSON.stringify(res.user))
        }
        return res
    }

    // Đúng mật khẩu thì lưu token luôn
    const handleLogin=async(data:Login)=>
        saveSession(await run(()=>login(data),"Đăng nhập thất bại!"))

    // Đăng ký: gửi OTP về email -> nhập OTP đúng thì đăng nhập luôn
    const handleRegister=(data:Register)=>run(()=>register(data),"Đăng ký thất bại!")
    const handleResendRegisterOtp=(email:string)=>run(()=>resendRegisterOtp(email),"Không gửi được mã OTP!")
    const handleVerifyRegisterOtp=async(data:VerifyOtp)=>
        saveSession(await run(()=>verifyRegisterOtp(data),"Xác thực OTP thất bại!"))
>>>>>>> 40b063339a7d7d95efab10c3f168ef753504ab24

    const handleForgotPassword=(email:string)=>run(()=>forgotPassword(email),"Không gửi được mã OTP!")
    const handleVerifyResetOtp=(data:VerifyOtp)=>run(()=>verifyResetOtp(data),"Mã OTP không đúng!")
    const handleResetPassword=(data:ResetPassword)=>run(()=>resetPassword(data),"Đổi mật khẩu thất bại!")

    return {
        loading,
        handleLogin,
        handleRegister,
        handleResendRegisterOtp,
        handleVerifyRegisterOtp,
        handleForgotPassword,
        handleVerifyResetOtp,
        handleResetPassword,
    }
<<<<<<< HEAD
    return {loading,error,handleLogin,handleRegister}
=======
>>>>>>> 40b063339a7d7d95efab10c3f168ef753504ab24
}
