import { useEffect } from "react";
import { Popover, Spin } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import useCategory from "../hooks/useCategory";

export default function CategoryMenu() {
  const { loading, error, categories, fetchCategory } = useCategory();
  const navigate = useNavigate();
  const openCategory = (categoryId: number) => navigate(`/products?categoryId=${categoryId}`);

  useEffect(() => {
    fetchCategory();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-5 text-center text-red-500">
        Không thể tải danh mục
      </div>
    );
  }

  return (
    <div className="flex w-full justify-center gap-8 px-8">
        {categories.map((parent)=>(
    <Popover
    key={parent.id}
    trigger={['hover']}
    placement="bottom"
    arrow={false}
    content={
        parent.children?.length>0 && (
            <div className="w-[900px] p-4">
                <div className="grid grid-cols-4 gap-8">
                    {parent.children.map((cate)=>(
                        <div key={cate.id}>
                            <h3
                              className="mb-4 cursor-pointer text-lg font-bold text-[#E16463] hover:underline"
                              onClick={() => openCategory(cate.id)}
                            >
                              {cate.name}
                            </h3>
                           <div className="space-y-3">
                            {cate.children?.map((child)=>(
                                <div  key={child.id}
                            className="cursor-pointer text-gray-600 hover:text-pink-600"
                            onClick={() => openCategory(child.id)}>
                                    {child.name}
                                </div>
                            ))}
                           </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }
    >
        <div
          className="flex cursor-pointer items-center gap-1 py-5 font-medium hover:text-pink-600"
          onClick={() => openCategory(parent.id)}
        >
            {parent.name}

            {parent.children?.length > 0 && (
              <DownOutlined className="text-xs" />
            )}
          </div>
    </Popover>
  ))}
    </div>
  
  )
 
}