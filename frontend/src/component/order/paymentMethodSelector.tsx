import { CheckCircleFilled, DollarOutlined, WalletOutlined } from "@ant-design/icons";
import type { ReactNode } from "react";
import type { PaymentMethod } from "../../types/order";
import { PAYMENT_METHOD_LABEL } from "../../utils/order";

interface Option {
  value: PaymentMethod;
  icon: ReactNode;
  hint: string;
  disabled?: boolean;
}

// MoMo đang chạy chế độ giả lập (MOMO_MODE=sandbox ở backend): không trừ tiền thật
const OPTIONS: Option[] = [
  { value: "COD", icon: <DollarOutlined />, hint: "Trả tiền mặt khi nhận được hàng" },
  { value: "MOMO", icon: <WalletOutlined />, hint: "Thử nghiệm — không trừ tiền thật" },
];

interface Props {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
}

export default function PaymentMethodSelector({ value, onChange }: Props) {
  return (
    <div role="radiogroup" aria-label="Phương thức thanh toán" className="grid gap-3 sm:grid-cols-2">
      {OPTIONS.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
              selected
                ? "border-[#e16463] bg-[#fff4f2] shadow-[0_0_0_3px_rgba(225,100,99,0.12)]"
                : "border-[#f0dcdc] bg-white hover:border-[#e88f98]"
            }`}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fbeef0] text-lg text-[#e16463]">
              {option.icon}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-[#2d2020]">{PAYMENT_METHOD_LABEL[option.value]}</span>
              <span className="block text-xs text-[#987979]">{option.hint}</span>
            </span>
            {selected && <CheckCircleFilled className="text-[#e16463]" />}
          </button>
        );
      })}
    </div>
  );
}
