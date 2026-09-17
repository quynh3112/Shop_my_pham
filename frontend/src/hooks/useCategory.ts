import { useState } from "react";
import type { CategoryGroup } from "../types/category";
import { listCategory } from "../service/category.service";

export default function useCategory(){
    const [loading, setLoading]=useState<boolean>(false)
    const [error,setError]=useState<string>('')
    const [categories,setCategories]=useState<CategoryGroup[]>([])
    const fetchCategory=async()=>{
        try{
            setLoading(true)
            const res=await listCategory()
            setCategories(res)
        }
        catch(err:any){
            setError(err.message||"Lỗi:"+err)
        }
        finally{
            setLoading(false)
        }
    }
    return  {loading,error,fetchCategory,categories}

}