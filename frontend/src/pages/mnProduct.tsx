import { Alert, Button, Form, Image, Input, InputNumber, message, Popconfirm, Rate, Select, Space, Spin, Table, Tag, Tooltip } from "antd"
import type { TableColumnsType } from "antd"
import ProductDetailDrawer from "../component/productDetailDrawer"
import { formatPrice } from "../utils/format"
import useProduct from "../hooks/useProduct"
import Dialog from "../component/dialog"
import { useEffect, useState } from "react"
import CreateProduct from "../component/createproduct"
import useCategory from "../hooks/useCategory"
import type { ProductCreate, ProductImageItem } from "../types/product"
import type { UploadFile } from "antd"
import { getProducById, getProductCover, removeDescriptionPdf, removeProductImage, uploadDescriptionPdf, uploadProductImages } from "../service/product.service"
import { getApiErrorMessage as getActionError } from "../utils/error"
import { toFiles } from "../utils/file"
import type { Category } from "../types/category"
import { DeleteOutlined, EditOutlined, EyeOutlined, Loading3QuartersOutlined, PictureOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons"

export default function MnProduct(){
    const [form]=Form.useForm()
    const {products, error, loading, fetchProducts, submitProduct, editProduct, deleteProduct}=useProduct()
    const [open,setOpen]=useState<boolean>(false)
    const [editingProduct, setEditingProduct] = useState<(typeof products)[number] | null>(null)
    const [saving, setSaving] = useState(false)
    // Sản phẩm đang xem ở Drawer bên phải
    const [viewingId, setViewingId] = useState<number>()
    // Ảnh đã lưu của sản phẩm đang sửa
    const editingImages = (editingProduct?.images ?? []).filter(
      (image): image is ProductImageItem => typeof image !== "string",
    )
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
    const handleProduct=async(formValues:ProductCreate & { descriptionPdf?: UploadFile[]; removeDescriptionPdf?: boolean; newImages?: UploadFile[] })=>{
        const { descriptionPdf, removeDescriptionPdf: shouldRemovePdf, newImages, ...values } = formValues
        const [pdfFile] = toFiles(descriptionPdf)
        const imageFiles = toFiles(newImages)
        if (saving) return
        let productId = editingProduct?.id
        setSaving(true)
        try {
          if (productId !== undefined) {
            await editProduct(productId, values)
            message.success("Đã cập nhật sản phẩm")
          } else {
            const created = await submitProduct({ ...values, isActive: values.isActive ?? true })
            productId = created?.id
            message.success("Đã thêm sản phẩm")
          }
        } catch (error) {
          message.error(getActionError(error, "Không thể lưu sản phẩm."))
          setSaving(false)
          return
        }
        if (productId !== undefined && imageFiles.length) {
          try {
            await uploadProductImages(productId, imageFiles)
          } catch (error) {
            message.error(getActionError(error, "Lưu sản phẩm thành công nhưng không tải được ảnh."))
          }
        }
        if (productId !== undefined && (pdfFile || shouldRemovePdf)) {
          try {
            if (pdfFile) await uploadDescriptionPdf(productId, pdfFile)
            else await removeDescriptionPdf(productId)
            await fetchProducts({ page: 1, limit: 100 })
          } catch (error) {
            message.error(getActionError(error, "Lưu sản phẩm thành công nhưng không cập nhật được file PDF."))
          }
        }
        if (imageFiles.length) await fetchProducts({ page: 1, limit: 100 })
        setSaving(false)
        handleClose()
    }
    const handleEdit = async (listItem: (typeof products)[number]) => {
      if (listItem.id === undefined) return
      // API danh sách không trả biến thể -> lấy chi tiết, nếu không form gửi variants rỗng và backend xoá hết biến thể
      let product: (typeof products)[number]
      try {
        product = await getProducById(listItem.id)
      } catch (error) {
        message.error(getActionError(error, "Không tải được thông tin sản phẩm."))
        return
      }
      setEditingProduct(product)
      form.resetFields()
      form.setFieldsValue({
        name: product.name,
        description: product.description,
        price: product.price,
        categoryId: product.categoryId,
        isActive: product.isActive ?? true,
        skinTypes: product.skinTypes ?? [],
        concerns: product.concerns ?? [],
        variants: product.variants ?? [],
      })
      setOpen(true)
    }
    const handleRemoveImage = async (imageId: number) => {
      if (editingProduct?.id === undefined) return
      try {
        await removeProductImage(imageId)
        setEditingProduct(await getProducById(editingProduct.id))
        await fetchProducts({ page: 1, limit: 100 })
        message.success("Đã xoá ảnh")
      } catch (error) {
        message.error(getActionError(error, "Không xoá được ảnh."))
      }
    }
    const handleDelete = async (productId?: number) => {
      if (productId === undefined) return
      try {
        await deleteProduct(productId)
        if (viewingId === productId) setViewingId(undefined)
        message.success("Đã xóa sản phẩm")
      } catch (error) {
        message.error(getActionError(error, "Không thể xóa sản phẩm."))
      }
    }
  // Không return sớm khi loading: "loading" bật cả lúc đang lưu / tải lại danh sách,
  // return sớm sẽ gỡ Dialog + Form đang sửa ra khỏi trang giữa chừng
  const initialLoading = loading && products.length === 0 && !error
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
    type ProductRow = (typeof products)[number]
    const columns: TableColumnsType<ProductRow> = [
      {
        title: "Ảnh",
        key: "image",
        width: 80,
        render: (_, product) => {
          const cover = getProductCover(product)
          return cover ? (
            <Image src={cover} width={56} height={56} className="rounded-lg object-cover" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#fbf1ef] text-[#d5a4a4]">
              <PictureOutlined />
            </div>
          )
        },
      },
      {
        title: "Tên sản phẩm",
        dataIndex: "name",
        key: "name",
        sorter: (first, second) => first.name.localeCompare(second.name, "vi"),
        render: (name: string, product) => (
          <div>
            <p className="font-medium">{name}</p>
            <p className="text-xs text-gray-500">
              {product.category?.name ?? "Chưa phân loại"}
              {product.isActive === false && <Tag className="!ml-2">Đã ẩn</Tag>}
            </p>
          </div>
        ),
      },
      {
        title: "Giá",
        dataIndex: "price",
        key: "price",
        width: 140,
        align: "right",
        sorter: (first, second) => (first.price ?? 0) - (second.price ?? 0),
        render: (price?: number) => <span className="font-medium">{formatPrice(price)}</span>,
      },
      {
        title: "Đánh giá trung bình",
        key: "rating",
        width: 220,
        sorter: (first, second) => (first.averageRating ?? 0) - (second.averageRating ?? 0),
        render: (_, product) =>
          product.reviewCount ? (
            <Space size={6}>
              <Rate disabled allowHalf value={product.averageRating ?? 0} className="!text-sm" />
              <span className="text-sm">
                {product.averageRating?.toFixed(1)} <span className="text-gray-400">({product.reviewCount})</span>
              </span>
            </Space>
          ) : (
            <span className="text-sm text-gray-400">Chưa có đánh giá</span>
          ),
      },
      {
        title: "Thao tác",
        key: "actions",
        width: 140,
        align: "center",
        render: (_, product) => (
          <Space size={2}>
            <Tooltip title="Xem chi tiết">
              <Button type="text" icon={<EyeOutlined />} aria-label={`Xem ${product.name}`} onClick={() => setViewingId(product.id)} />
            </Tooltip>
            <Tooltip title="Sửa">
              <Button type="text" icon={<EditOutlined />} aria-label={`Sửa ${product.name}`} onClick={() => handleEdit(product)} />
            </Tooltip>
            <Popconfirm
              title="Xóa sản phẩm này?"
              description="Thao tác này không thể hoàn tác."
              okText="Xóa"
              cancelText="Hủy"
              onConfirm={() => handleDelete(product.id)}
            >
              <Tooltip title="Xóa">
                <Button danger type="text" icon={<DeleteOutlined />} aria-label={`Xóa ${product.name}`} />
              </Tooltip>
            </Popconfirm>
          </Space>
        ),
      },
    ]


    return(
        <div>
            <Button type="primary" icon={<PlusOutlined />} onClick={()=>{ setEditingProduct(null); form.resetFields(); setOpen(true) }}>Thêm sản phẩm</Button>
            <Dialog title={editingProduct ? "Sửa sản phẩm" : "Thêm sản phẩm"} open={open} onCancel={handleClose} onClose={handleClose} onSubmit={() => form.submit()} >
                <CreateProduct
                  form={form}
                  categories={categories}
                  handleSubmit={handleProduct}
                  handleCategoryChange={handleCategoryChange}
                  existingPdfUrl={editingProduct?.descriptionPdfUrl}
                  existingImages={editingImages}
                  onRemoveExistingImage={handleRemoveImage}
                />
                {saving && <div className="text-center text-sm text-gray-500"><Spin size="small" /> Đang lưu sản phẩm...</div>}

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
            {error && <Alert type="error" message="Lỗi tải dữ liệu" description={error} showIcon className="!mb-4" />}
            <Table
              rowKey={(product) => product.id ?? product.name}
              columns={columns}
              dataSource={filteredProducts}
              loading={initialLoading ? { indicator: <Loading3QuartersOutlined spin />, tip: "Đang tải dữ liệu..." } : loading}
              pagination={{ pageSize: 10, showSizeChanger: true }}
              locale={{ emptyText: "Không tìm thấy sản phẩm" }}
              scroll={{ x: 800 }}
            />
            <ProductDetailDrawer
              productId={viewingId}
              onClose={() => setViewingId(undefined)}
              onEdit={(product) => void handleEdit(product)}
              onDelete={handleDelete}
            />
        </div>
    )

}