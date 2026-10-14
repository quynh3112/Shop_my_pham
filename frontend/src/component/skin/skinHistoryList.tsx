import { CameraOutlined, DeleteOutlined, HistoryOutlined } from "@ant-design/icons";
import { Button, Empty, Popconfirm, Skeleton, Tag, message } from "antd";
import { Link } from "react-router-dom";
import { useDeleteSkinAnalysis, useSkinAnalysisHistory } from "../../hooks/useSkinAnalysis";
import { getApiErrorMessage } from "../../utils/error";
import { formatDateTime } from "../../utils/order";
import { SKIN_CONCERN_LABEL, SKIN_TYPE_LABEL } from "../../utils/skin";

interface Props {
  limit?: number;
  activeId?: number;
}

/** Lịch sử các lần phân tích da của tôi */
export default function SkinHistoryList({ limit = 10, activeId }: Props) {
  const { items, loading } = useSkinAnalysisHistory(1, limit);
  const { remove } = useDeleteSkinAnalysis();
  const [messageApi, contextHolder] = message.useMessage();

  const handleDelete = async (id: number) => {
    try {
      await remove(id);
      messageApi.success("Đã xoá kết quả phân tích.");
    } catch (error) {
      messageApi.error(getApiErrorMessage(error, "Không xoá được kết quả."));
    }
  };

  if (loading) return <Skeleton active paragraph={{ rows: 4 }} />;
  if (items.length === 0) {
    return <Empty image={<HistoryOutlined className="text-4xl text-[#e88f98]" />} description="Chưa có lần phân tích nào." />;
  }

  return (
    <ul className="flex flex-col gap-2">
      {contextHolder}
      {items.map((item) => (
        <li
          key={item.id}
          className={`flex items-start gap-2 rounded-2xl border p-3 transition ${
            item.id === activeId ? "border-[#e16463] bg-[#fff4f2]" : "border-[#f0dcdc] bg-white hover:border-[#e88f98]"
          }`}
        >
          <Link to={`/skin-analysis/${item.id}`} className="min-w-0 flex-1 !text-inherit">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-[#2d2020]">{SKIN_TYPE_LABEL[item.skinType]}</span>
              <span className="text-xs text-[#987979]">{formatDateTime(item.createdAt)}</span>
              {item.hasImage && <CameraOutlined className="text-xs text-[#b05a5b]" title="Có lưu ảnh" />}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {item.concerns.length === 0 ? (
                <Tag color="green" className="!m-0">
                  Da ổn định
                </Tag>
              ) : (
                item.concerns.slice(0, 3).map((concern) => (
                  <Tag key={concern} className="!m-0">
                    {SKIN_CONCERN_LABEL[concern]}
                  </Tag>
                ))
              )}
              {item.concerns.length > 3 && <Tag className="!m-0">+{item.concerns.length - 3}</Tag>}
            </div>
          </Link>
          <Popconfirm title={item.hasImage ? "Xoá kết quả và ảnh đã lưu?" : "Xoá kết quả này?"} okText="Xoá" cancelText="Huỷ" onConfirm={() => handleDelete(item.id)}>
            <Button type="text" size="small" icon={<DeleteOutlined />} aria-label="Xoá kết quả" className="!text-[#b47777]" />
          </Popconfirm>
        </li>
      ))}
    </ul>
  );
}
