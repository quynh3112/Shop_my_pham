import { Alert, Button, Form, Input, InputNumber, message, Popconfirm, Select, Space, Spin, Table, Tag } from "antd"
import useProduct from "../hooks/useProduct"
import Dialog from "../component/dialog"
import { useEffect, useState } from "react"
import CreateProduct from "../component/createproduct"
import useCategory from "../hooks/useCategory"
import type { ProductCreate } from "../types/product"
import type { Category } from "../types/category"
import { DeleteOutlined, EditOutlined, Loading3QuartersOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons"

export default function MnProduct(){
    const [form]=Form.useForm()
    const {products, error, loading, fetchProducts, submitProduct, editProduct, deleteProduct}=useProduct()
    const [open,setOpen]=useState<boolean>(false)
    const [editingProduct, setEditingProduct] = useState<(typeof products)[number] | null>(null)
    const [search, setSearch] = useState("")
    const [categoryId, setCategoryId] = useState<number | undefined>()
    const [status, setStatus] = useState<boolean | undefined>()
    const [minPrice, setMinPrice] = useState<number | undefined>()
    const [maxPrice, setMaxPrice] = useState<number | undefined>()
    const handleClose=()=>{
        setOpen(false)
      setEditingProduct(null)
        form.resetFields()
    }
    const {fetchCategory,categories}=useCategory()
    useEffect(()=>{
        fetchCategory()
      fetchProducts({ page: 1, limit: 100 })
    },[])
    const handleProduct=async(values:ProductCreate)=>{
        if (editingProduct?.id !== undefined) {
          await editProduct(editingProduct.id, values)
          message.success("Đã cập nhật sản phẩm")
        } else {
          await submitProduct({ ...values, isActive: values.isActive ?? true })
          message.success("Đã thêm sản phẩm")
        }
        handleClose()
    }
    const handleEdit = (product: (typeof products)[number]) => {
      setEditingProduct(product)
      form.setFieldsValue({
        name: product.name,
        description: product.description,
        price: product.price,
        categoryId: product.categoryId,
        isActive: product.isActive ?? true,
        variants: product.variants ?? [],
      })
      setOpen(true)
    }
    const handleDelete = async (productId?: number) => {
      if (productId === undefined) return
      await deleteProduct(productId)
      message.success("Đã xóa sản phẩm")
    }
   if (loading)
    return (
      <div className="flex justify-center py-8">
        <Spin
          indicator={<Loading3QuartersOutlined spin />}
          tip="Đang tải dữ liệu..."
        />
      </div>
    );
  if (error)
    return (
      <Alert
        type="error"
        message="Lỗi tải dữ liệu"
        description={error}
        showIcon
      />
    );
function handleCategoryChange(categoryId: number) {
  const selected = categories.find((c) => c.id === categoryId);
  if (!selected) return;

  if (selected.children && selected.children.length > 0) {
    message.warning(
      `"${selected.name}" còn ${selected.children.length} danh mục con. Cân nhắc chọn danh mục con cụ thể hơn để khách dễ lọc sản phẩm.`,
    );
  }
}

    const flattenCategories = (items: Category[]): Category[] =>
      items.flatMap((category) => [category, ...flattenCategories(category.children ?? [])])
    const categoryOptions = flattenCategories(categories).map((category) => ({
      value: category.id,
      label: category.name,
    }))
    const filteredProducts = products.filter((product) => {
      const productPrice = product.price ?? 0
      const searchableText = `${product.name} ${product.description ?? ""}`.toLowerCase()
      return searchableText.includes(search.toLowerCase()) &&
        (categoryId === undefined || product.categoryId === categoryId) &&
        (status === undefined || product.isActive === status) &&
        (minPrice === undefined || productPrice >= minPrice) &&
        (maxPrice === undefined || productPrice <= maxPrice)
    })
    const getStock = (product: (typeof products)[number]) =>
      product.stock ?? (product.variants ?? []).reduce((total, variant) => total + variant.initialStock, 0)
    const columns = [
      {
        title: "Sản phẩm",
        dataIndex: "name",
        key: "name",
        render: (name: string, product: (typeof products)[number]) => (
          <Space direction="vertical" size={0}>
            <strong>{name}</strong>
            <span>{product.description || "Chưa có mô tả"}</span>
          </Space>
        ),
      },
      {
        title: "Giá",
        dataIndex: "price",
        key: "price",
        sorter: (first: (typeof products)[number], second: (typeof products)[number]) =>
          (first.price ?? 0) - (second.price ?? 0),
        render: (price?: number) => `${(price ?? 0).toLocaleString("vi-VN")} đ`,
      },
      {
        title: "Tồn kho",
        key: "stock",
        sorter: (first: (typeof products)[number], second: (typeof products)[number]) =>
          getStock(first) - getStock(second),
        render: (_: unknown, product: (typeof products)[number]) => getStock(product),
      },
     
      {
        title: "Trạng thái",
        dataIndex: "isActive",
        key: "isActive",
        render: (isActive?: boolean) => (
          <Tag color={isActive ? "green" : "red"}>{isActive ? "Đang bán" : "Đã ẩn"}</Tag>
        ),
      },
      {
        title: "Thao tác",
        key: "actions",
        render: (_value: unknown, product: (typeof products)[number]) => (
          <Space>
            <Button
              type="text"
              icon={<EditOutlined />}
              aria-label={`Sửa ${product.name}`}
              onClick={() => handleEdit(product)}
            />
            <Popconfirm
              title="Xóa sản phẩm này?"
              description="Thao tác này không thể hoàn tác."
              okText="Xóa"
              cancelText="Hủy"
              onConfirm={() => handleDelete(product.id)}
            >
              <Button
                danger
                type="text"
                icon={<DeleteOutlined />}
                aria-label={`Xóa ${product.name}`}
              />
            </Popconfirm>
          </Space>
        ),
      },
    ]


    return(
        <div>
            <Button type="primary" icon={<PlusOutlined />} onClick={()=>{ setEditingProduct(null); form.resetFields(); setOpen(true) }}>Thêm sản phẩm</Button>
            <Dialog title={editingProduct ? "Sửa sản phẩm" : "Thêm sản phẩm"} open={open} onCancel={handleClose} onClose={handleClose} onSubmit={() => form.submit()} >
                <CreateProduct form={form} categories={categories} handleSubmit={handleProduct} handleCategoryChange={handleCategoryChange}/>

            </Dialog>
            <Space wrap style={{ margin: "24px 0 16px" }}>
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder="Tìm theo tên hoặc mô tả"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                style={{ width: 260 }}
              />
              <Select allowClear placeholder="Lọc danh mục" options={categoryOptions} value={categoryId} onChange={setCategoryId} style={{ width: 190 }} />
              <Select
                allowClear
                placeholder="Lọc trạng thái"
                options={[{ value: true, label: "Đang bán" }, { value: false, label: "Đã ẩn" }]}
                value={status}
                onChange={setStatus}
                style={{ width: 150 }}
              />
              <InputNumber placeholder="Giá từ" min={0} value={minPrice} onChange={(value) => setMinPrice(value ?? undefined)} />
              <InputNumber placeholder="Giá đến" min={0} value={maxPrice} onChange={(value) => setMaxPrice(value ?? undefined)} />
            </Space>
            <Table
              rowKey={(product) => product.id ?? product.name}
              columns={columns}
              dataSource={filteredProducts}
              loading={loading}
              pagination={{ pageSize: 10, showSizeChanger: true }}
              locale={{ emptyText: "Không tìm thấy sản phẩm" }}
            />
        </div>
    )

}