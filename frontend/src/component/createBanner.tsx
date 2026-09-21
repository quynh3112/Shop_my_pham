import { Form, Input, InputNumber, Switch, Upload, message, type FormInstance } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import type { CreateBanner as BannerFormValues } from "../types/banner";

interface Props{
    form:FormInstance
    handleSubmit:(values: BannerFormValues)=>void

}
export default function CreateBanner({form,handleSubmit}:Props){


    return (
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item name="name" label="Tên banner" rules={[{ required: true, message: "Vui lòng nhập tên banner" }]}>
                <Input placeholder="Nhập tên banner" />
            </Form.Item>
            <Form.Item name="altText" label="Mô tả ảnh" rules={[{ required: true, message: "Vui lòng nhập mô tả ảnh" }]}>
                <Input placeholder="Ví dụ: Banner khuyến mãi tháng 9" />
            </Form.Item>
            <Form.Item label="Hình ảnh">
                <Upload
                    action="https://660d2bd96ddfa2943b33731c.mockapi.io/api/upload"
                    listType="picture-circle"
                    maxCount={1}
                    onChange={({ file }) => {
                        if (file.status === "done") {
                            const response = file.response as { url?: string; data?: { url?: string }; file?: { url?: string } };
                            const imageUrl = response?.url ?? response?.data?.url ?? response?.file?.url;

                            if (imageUrl) {
                                form.setFieldValue("imageUrl", imageUrl);
                            } else {
                                message.error("API upload không trả về URL ảnh");
                            }
                        }
                    }}
                >
                    <button type="button" className="border-0 bg-transparent">
                        <PlusOutlined />
                        <div className="mt-2">Tải ảnh</div>
                    </button>
                </Upload>
            </Form.Item>
            <Form.Item name="imageUrl" hidden rules={[{ required: true, message: "Vui lòng tải ảnh lên" }]}>
                <Input />
            </Form.Item>
                        <Form.Item name="linkUrl" label="Đường dẫn khi nhấn">
                            <Input placeholder="https://..." />
                        </Form.Item>
                        <Form.Item name="placement" label="Vị trí hiển thị">
                            <Input placeholder="Ví dụ: Trang chủ" />
                        </Form.Item>
                        <Form.Item name="sortOrder" label="Thứ tự" initialValue={0}>
                            <InputNumber min={0} className="w-full" />
                        </Form.Item>
                        <Form.Item name="isActive" label="Trạng thái" valuePropName="checked" initialValue>
                            <Switch checkedChildren="Hiện" unCheckedChildren="Ẩn" />
                        </Form.Item>

        </Form>

    )

}