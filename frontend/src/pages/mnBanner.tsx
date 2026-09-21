import { DeleteOutlined, EditOutlined, HolderOutlined, PlusOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Form, Image, Popconfirm, Spin, Switch, Tag, message } from "antd";
import { useState } from "react";
import CreateBanner from "../component/createBanner";
import Dialog from "../component/dialog";
import useBanner from "../hooks/useBanner";
import type { Banner, CreateBanner as BannerPayload } from "../types/banner";

export default function MnBanner() {
  const [form] = Form.useForm<BannerPayload>();
  const { banners, loading, error, createBanner, updateBanner, updateStatus, deleteBanner, isMutating } = useBanner();
  const [open, setOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [draggedId, setDraggedId] = useState<number | null>(null);

  const closeDialog = () => {
    setOpen(false);
    setEditingBanner(null);
    form.resetFields();
  };

  const handleSubmit = async (values: BannerPayload) => {
    try {
      if (editingBanner) {
        await updateBanner({ id: editingBanner.id, payload: values });
        message.success("Đã cập nhật banner");
      } else {
        await createBanner(values);
        message.success("Đã thêm banner");
      }
      closeDialog();
    } catch {
      message.error("Không thể lưu banner");
    }
  };

  const toggleBanner = async (banner: Banner, isActive: boolean) => {
    try {
      await updateStatus({ id: banner.id, isActive });
      message.success(isActive ? "Đã bật banner" : "Đã tắt banner");
    } catch {
      message.error("Không thể cập nhật trạng thái banner");
    }
  };

  const removeBanner = async (id: number) => {
    try {
      await deleteBanner(id);
      message.success("Đã xóa banner");
    } catch {
      message.error("Không thể xóa banner");
    }
  };

  const dropBanner = async (targetId: number) => {
    if (draggedId === null || draggedId === targetId) return;
    const draggedIndex = banners.findIndex((banner) => banner.id === draggedId);
    const targetIndex = banners.findIndex((banner) => banner.id === targetId);
    if (draggedIndex < 0 || targetIndex < 0) return;

    const reordered = [...banners];
    const [dragged] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, dragged);
    setDraggedId(null);

    try {
      await Promise.all(reordered.map((banner, index) =>
        updateBanner({ id: banner.id, payload: { sortOrder: index + 1 } }),
      ));
      message.success("Đã cập nhật thứ tự banner");
    } catch {
      message.error("Không thể cập nhật thứ tự banner");
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Spin tip="Đang tải banner..." /></div>;
  if (error) return <Alert type="error" showIcon message="Không thể tải danh sách banner" description={error} />;

  return (
    <Card title="Quản lý banner" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>Thêm banner</Button>}>
      <div className="space-y-3">
        {banners.map((banner) => (
          <div
            key={banner.id}
            draggable
            onDragStart={() => setDraggedId(banner.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => void dropBanner(banner.id)}
            className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition hover:border-[#E16463]"
          >
            <HolderOutlined className="cursor-grab text-lg text-gray-400" />
            <Image width={150} height={72} className="rounded object-cover" src={banner.imageUrl} alt={banner.altText} />
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{banner.name}</div>
              <div className="truncate text-sm text-gray-500">{banner.altText}</div>
              <Tag className="mt-2">Vị trí: {banner.placement || "Chưa chọn"}</Tag>
            </div>
            <div className="flex items-center gap-3">
              <Switch loading={isMutating} checked={banner.isActive} onChange={(checked) => void toggleBanner(banner, checked)} checkedChildren="Hiện" unCheckedChildren="Ẩn" />
              <Button type="text" icon={<EditOutlined />} aria-label={`Sửa ${banner.name}`} onClick={() => { setEditingBanner(banner); form.setFieldsValue(banner); setOpen(true); }} />
              <Popconfirm title="Xóa banner này?" onConfirm={() => void removeBanner(banner.id)} okText="Xóa" cancelText="Hủy">
                <Button danger type="text" icon={<DeleteOutlined />} aria-label={`Xóa ${banner.name}`} />
              </Popconfirm>
            </div>
          </div>
        ))}
        {!banners.length && <div className="py-10 text-center text-gray-500">Chưa có banner</div>}
      </div>
      <Dialog title={editingBanner ? "Sửa banner" : "Thêm banner"} open={open} onCancel={closeDialog} onClose={closeDialog} onSubmit={() => form.submit()}>
        <CreateBanner form={form} handleSubmit={handleSubmit} />
      </Dialog>
    </Card>
  );
}
