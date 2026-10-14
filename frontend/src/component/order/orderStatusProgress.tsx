import {
  CarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileDoneOutlined,
  GiftOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import { Steps, type StepsProps } from "antd";
import type { ReactNode } from "react";
import type { OrderDetail, OrderStatusValue } from "../../types/order";
import { formatDateTime } from "../../utils/order";

// Luồng bình thường của một đơn, giống thứ tự chuyển trạng thái ở backend
const FLOW: { status: OrderStatusValue; title: string; hint: string; icon: ReactNode }[] = [
  { status: "PENDING", title: "Đặt hàng", hint: "Chờ shop xác nhận", icon: <FileDoneOutlined /> },
  { status: "CONFIRMED", title: "Đã xác nhận", hint: "Shop đã nhận đơn", icon: <CheckCircleOutlined /> },
  { status: "PROCESSING", title: "Đang chuẩn bị hàng", hint: "Đang đóng gói", icon: <InboxOutlined /> },
  { status: "SHIPPING", title: "Đang giao", hint: "Đơn đang trên đường đến bạn", icon: <CarOutlined /> },
  { status: "DELIVERED", title: "Đã giao", hint: "Giao hàng thành công", icon: <GiftOutlined /> },
];

const ACTOR_LABEL: Record<string, string> = { CUSTOMER: "bạn", ADMIN: "shop", SYSTEM: "hệ thống" };

interface Props {
  order: Pick<OrderDetail, "status" | "createdAt" | "statusHistory">;
  /** Bản gọn cho thẻ đơn trong danh sách: chấm nhỏ, không có thời gian */
  compact?: boolean;
}

/** Tiến trình trạng thái đơn hàng, thời gian lấy từ lịch sử đơn */
export default function OrderStatusProgress({ order, compact = false }: Props) {
  const history = order.statusHistory ?? [];
  const timeOf = (status: OrderStatusValue) => {
    const entry = [...history].reverse().find((h) => h.toStatus === status);
    if (entry) return entry.occurredAt ?? entry.recordedAt;
    return status === "PENDING" ? order.createdAt : undefined;
  };

  const cancelled = order.status === "CANCELLED";
  const cancelEntry = cancelled ? [...history].reverse().find((h) => h.toStatus === "CANCELLED") : undefined;
  // Đơn huỷ: dừng ở bước đã đi tới trước khi huỷ (không có lịch sử thì coi như huỷ lúc chờ xác nhận)
  const reachedIndex = cancelled
    ? Math.max(0, FLOW.findIndex((f) => f.status === (cancelEntry?.fromStatus ?? "PENDING")))
    : FLOW.findIndex((f) => f.status === order.status);

  type StepItem = NonNullable<StepsProps["items"]>[number];
  const steps: StepItem[] = (cancelled ? FLOW.slice(0, reachedIndex + 1) : FLOW).map((step, index) => {
    const time = timeOf(step.status);
    const done = index < reachedIndex || (index === reachedIndex && (cancelled || step.status === "DELIVERED"));
    const current = !cancelled && index === reachedIndex && step.status !== "DELIVERED";
    return {
      title: step.title,
      icon: compact ? undefined : step.icon,
      status: done ? "finish" : current ? "process" : "wait",
      content: compact ? undefined : (
        <div className="text-xs">
          {time && index <= reachedIndex ? formatDateTime(time) : current || index > reachedIndex ? step.hint : ""}
          {current && time && <div className="text-[#987979]">{step.hint}</div>}
        </div>
      ),
    };
  });

  if (cancelled) {
    const time = cancelEntry ? cancelEntry.occurredAt ?? cancelEntry.recordedAt : undefined;
    steps.push({
      title: "Đã huỷ",
      icon: compact ? undefined : <CloseCircleOutlined />,
      status: "error",
      content: compact ? undefined : (
        <div className="text-xs">
          {time && formatDateTime(time)}
          {cancelEntry && <div className="text-[#987979]">Huỷ bởi {ACTOR_LABEL[cancelEntry.actorType] ?? "shop"}</div>}
          {cancelEntry?.reason && <div className="text-[#987979]">{cancelEntry.reason}</div>}
        </div>
      ),
    });
  }

  return (
    <Steps
      size="small"
      type={compact ? "dot" : "default"}
      titlePlacement={compact ? "vertical" : undefined}
      responsive
      items={steps}
      className={compact ? "order-progress-compact" : undefined}
    />
  );
}
