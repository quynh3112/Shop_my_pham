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