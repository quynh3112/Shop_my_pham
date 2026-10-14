import { api } from "../config/api";
import type { AuthResponse, Login, OtpSent, Register, ResetPassword, VerifyOtp } from "../types/user";
const endpoint='/auth'

// Chuẩn hoá trước khi gửi: bỏ khoảng trắng thừa, email viết thường, SĐT chỉ giữ chữ số.
// Đăng ký / gửi lại OTP / xác thực OTP phải dùng cùng một email nên đều đi qua hàm này.
const normalizeEmail=(email:string)=>email.trim().toLowerCase()
const normalizePhone=(phone:string)=>phone.replace(/\D/g,'')
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
    const payload:Register={
        fullName:data.fullName.trim(),
        email:normalizeEmail(data.email),
        phone:normalizePhone(data.phone),
        password:data.password,
    }
    const res=await api.post(`${endpoint}/register`,payload)
    return res.data;
}
export const resendRegisterOtp=async (email:string):Promise<OtpSent>=>{
    const res=await api.post(`${endpoint}/register/resend-otp`,{email:normalizeEmail(email)})
    return res.data
}
// Đăng ký bước 2: OTP đúng thì tài khoản được kích hoạt và đăng nhập luôn
export const verifyRegisterOtp=async (data:VerifyOtp):Promise<AuthResponse>=>{
    const res=await api.post(`${endpoint}/register/verify-otp`,{
        email:normalizeEmail(data.email),
        otp:data.otp.trim(),
    })
    return res.data
}
// ----- Thông tin cá nhân -----
export interface Profile{
    id:number
    email:string
    fullName:string
    phone:string|null
    avatarUrl:string|null
    role:string
    permissions:string[]
    isActive:boolean
}
export interface UpdateProfile{
    fullName?:string
    phone?:string
}
const authHeaders=()=>({
    Authorization:`Bearer ${localStorage.getItem("token")}`
})
// Dùng /user/me (đọc từ DB: có quyền nhân viên + trạng thái khoá).
// KHÔNG dùng /auth/profile: API đó chỉ trả lại nội dung token, thiếu permissions / isActive.
export const getMyProfile=async():Promise<Profile>=>{
    const res=await api.get('/user/me',{headers:authHeaders()})
    return res.data
}
export const updateMyProfile=async(data:UpdateProfile):Promise<Profile>=>{
    const res=await api.patch('/user/me',{
        fullName:data.fullName?.trim(),
        phone:data.phone!==undefined?normalizePhone(data.phone):undefined,
    },{headers:authHeaders()})
    return res.data
}
export const uploadMyAvatar=async(file:File):Promise<Profile>=>{
    const formData=new FormData()
    formData.append('file',file)
    const res=await api.post('/user/me/avatar',formData,{headers:authHeaders()})
    return res.data
}
export const changeMyPassword=async(data:{currentPassword:string;newPassword:string})=>{
    const res=await api.patch('/user/me/password',data,{headers:authHeaders()})
    return res.data
}
