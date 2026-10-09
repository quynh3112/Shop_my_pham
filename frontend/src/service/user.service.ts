import { api } from "../config/api";
import type { AuthResponse, Login, OtpSent, Register, ResetPassword, VerifyOtp } from "../types/user";
const endpoint='/auth'
// Đúng email/SĐT + mật khẩu là nhận token luôn (không cần OTP)
export const login=async (data:Login):Promise<AuthResponse>=>{
    const res= await api.post(`${endpoint}/login`,data)
    return res.data

}
export const forgotPassword=async (email:string):Promise<OtpSent>=>{
    const res= await api.post(`${endpoint}/forgot-password`,{email})
    return res.data
}
export const verifyResetOtp=async (data:VerifyOtp)=>{
    const res= await api.post(`${endpoint}/forgot-password/verify-otp`,data)
    return res.data
}
export const resetPassword=async (data:ResetPassword)=>{
    const res= await api.post(`${endpoint}/reset-password`,data)
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
// Đăng ký bước 1: tạo tài khoản chưa xác thực, backend gửi OTP về email
export const register=async (data:Register):Promise<OtpSent>=>{
    const res=await api.post(`${endpoint}/register`,data)
    return res.data;
}
export const resendRegisterOtp=async (email:string):Promise<OtpSent>=>{
    const res=await api.post(`${endpoint}/register/resend-otp`,{email})
    return res.data
}
// Đăng ký bước 2: OTP đúng thì tài khoản được kích hoạt và đăng nhập luôn
export const verifyRegisterOtp=async (data:VerifyOtp):Promise<AuthResponse>=>{
    const res=await api.post(`${endpoint}/register/verify-otp`,data)
    return res.data
}