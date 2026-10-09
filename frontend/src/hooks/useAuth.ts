import { useState } from "react";
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
import { notifyAuthChanged } from "../utils/auth";

// Lấy message lỗi backend trả về (ValidationPipe trả về dạng mảng)
const getErrorMessage=(err:any,fallback:string)=>{
    const msg=err?.response?.data?.message
    if(Array.isArray(msg)) return msg[0] as string
    return typeof msg==="string"?msg:fallback
}

export default function useAuth(){
    const [loading,setLoading]=useState<boolean>(false)

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
            // Báo cho Header, giỏ hàng... cập nhật lại theo người dùng mới
            notifyAuthChanged()
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
}
