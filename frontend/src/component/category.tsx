import { useEffect } from "react";
import { Popover, Spin } from "antd";
import { DownOutlined } from "@ant-design/icons";
import useCategory from "../hooks/useCategory";

export default function CategoryMenu() {
  const { loading, error, categories, fetchCategory } = useCategory();

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
    <div className="flex gap-8  px-8">
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
                            <h3 className="mb-4 text-lg font-bold text-[#E16463]">{cate.name}</h3>
                           <div className="space-y-3">
                            {cate.children?.map((child)=>(
                                <div  key={child.id}
                            className="cursor-pointer text-gray-600 hover:text-pink-600"
                            onClick={() =>
                              console.log(child.slug)
                            }>
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
        <div className="flex cursor-pointer items-center gap-1 py-5 font-medium hover:text-pink-600">
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