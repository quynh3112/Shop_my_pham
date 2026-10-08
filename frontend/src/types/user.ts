export interface User{
    id?:number
    email:string
    passwordHash:string
    fullName:string
    phone:string
    avatarUrl?:string
    role:string
    creatAt:Date
    updateAt:Date
}
export interface Login{
    email:string
    password:string
}
export interface Register{
    fullName:string
    email:string
    phone:string
    password:string
}
export interface OtpSent{
    email:string        // email đã che, vd: ab***@gmail.com
    expiresIn:number    // giây
    resendAfter:number  // giây
}
export interface VerifyOtp{
    email:string        // email hoặc SĐT
    otp:string
}
export interface ResetPassword extends VerifyOtp{
    newPassword:string
}
export interface AuthResponse{
    user:User
    accessToken:string
    refreshToken:string
}
