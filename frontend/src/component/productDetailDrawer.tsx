import { DeleteOutlined, EditOutlined, FilePdfOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { Alert, Button, Descriptions, Drawer, Empty, Image, Popconfirm, Rate, Skeleton, Space, Table, Tag } from "antd";
import { getProducById, getProductImageUrls, toFileUrl } from "../service/product.service";
import type { ProductItem, ProductVariantItem } from "../types/product";
import { getApiErrorMessage } from "../utils/error";
import { formatPrice } from "../utils/format";
import { STOCK_LEVEL, stockLevel } from "../utils/inventory";
import { formatDateTime } from "../utils/order";

const LOW_STOCK = 5;

interface Props {
  /** id sản phẩm đang xem, undefined thì đóng */
  productId?: number;
  onClose: () => void;
  onEdit: (product: ProductItem) => void;
  onDelete: (productId: number) => void | Promise<void>;
}

/** Xem nhanh chi tiết sản phẩm cho admin, trượt ra từ bên phải */
export default function ProductDetailDrawer({ productId, onClose, onEdit, onDelete }: Props) {
  const detailQuery = useQuery({
    queryKey: ["product", productId, "admin"],
    queryFn: () => getProducById(productId!) as Promise<ProductItem>,
    enabled: productId !== undefined,
  });
  const product = detailQuery.data;
  const images = product ? getProductImageUrls(product) : [];
  const variants = product?.variants ?? [];

  const footer = product && productId !== undefined && (
    <div className="flex justify-end gap-2">
      <Popconfirm
        title="Xóa sản phẩm này?"
        description="Thao tác này không thể hoàn tác."
        okText="Xóa"
        cancelText="Hủy"
        onConfirm={() => onDelete(productId)}
      >
        <Button danger icon={<DeleteOutlined />}>
          Xóa
        </Button>
      </Popconfirm>
      <Button type="primary" icon={<EditOutlined />} onClick={() => onEdit(product)}>
        Sửa sản phẩm
      </Button>
    </div>
  );

  return (
    <Drawer
      open={productId !== undefined}
      onClose={onClose}
      width={620}
      title="Chi tiết sản phẩm"
      footer={footer}
      destroyOnHidden
    >
      {detailQuery.isLoading ? (
        <Skeleton active paragraph={{ rows: 10 }} />
      ) : detailQuery.error ? (
        <Alert
          type="error"
          showIcon
          message="Không tải được sản phẩm"
          description={getApiErrorMessage(detailQuery.error, "Vui lòng thử lại.")}
        />
      ) : (
        product && (
          <div className="flex flex-col gap-6">
            {images.length > 0 ? (
              <Image.PreviewGroup>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((url, index) => (
                    <Image
                      key={url}
                      src={url}
                      width={index === 0 ? 160 : 96}
                      height={index === 0 ? 160 : 96}
                      className="rounded-lg object-cover"
                    />
                  ))}
                </div>
              </Image.PreviewGroup>
            ) : (
              <Empty description="Chưa có ảnh" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold">{product.name}</h2>
                <Tag color={product.isActive ? "green" : "default"}>{product.isActive ? "Đang bán" : "Đã ẩn"}</Tag>
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                <Rate disabled allowHalf value={product.averageRating ?? 0} className="!text-sm" />
                <span>
                  {product.reviewCount ? `${product.averageRating?.toFixed(1)} · ${product.reviewCount} đánh giá` : "Chưa có đánh giá"}
                </span>
              </div>
            </div>

            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Giá">
                <span className="font-semibold text-[#e16463]">{formatPrice(product.price)}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Danh mục">{product.category?.name ?? "Chưa phân loại"}</Descriptions.Item>
              <Descriptions.Item label="Tổng tồn kho">{product.stock ?? 0}</Descriptions.Item>
              <Descriptions.Item label="Tài liệu PDF">
                {product.descriptionPdfUrl ? (
                  <a href={toFileUrl(product.descriptionPdfUrl)} target="_blank" rel="noopener noreferrer">
                    <FilePdfOutlined /> Xem PDF
                  </a>
                ) : (
                  "—"
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">{formatDateTime(product.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="Cập nhật">{formatDateTime(product.updatedAt)}</Descriptions.Item>
            </Descriptions>

            <div>
              <h3 className="mb-2 font-medium">Biến thể ({variants.length})</h3>
              <Table<ProductVariantItem>
                size="small"
                rowKey={(variant) => variant.id ?? `${variant.name}-${variant.size}`}
                pagination={false}
                dataSource={variants}
                columns={[
                  { title: "Tên / màu", dataIndex: "name", key: "name" },
                  { title: "Size", dataIndex: "size", key: "size", render: (size?: string) => size || "—" },
                  {
                    title: "Tồn kho",
                    key: "stock",
                    align: "right",
                    render: (_, variant) => {
                      const stock = variant.stock ?? 0;
                      const level = STOCK_LEVEL[stockLevel(stock, LOW_STOCK)];
                      return (
                        <Space size={6}>
                          <b>{stock}</b>
                          <Tag color={level.color} className="!m-0">
                            {level.label}
                          </Tag>
                        </Space>
                      );
                    },
                  },
                ]}
              />
            </div>

            <div>
              <h3 className="mb-2 font-medium">Mô tả</h3>
              <p className="whitespace-pre-line text-sm leading-6 text-gray-600">
                {product.description?.trim() || "Chưa có mô tả."}
              </p>
            </div>
          </div>
        )
      )}
    </Drawer>
  );
}
