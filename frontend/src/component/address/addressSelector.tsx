import { CheckCircleFilled, EditOutlined, EnvironmentOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Empty, Skeleton, Tag, message } from "antd";
import { useEffect, useState } from "react";
import useAddress from "../../hooks/useAddress";
import type { Address, AddressInput } from "../../types/address";
import { getApiErrorMessage } from "../../utils/error";
import { formatAddress } from "../../utils/order";
import AddressFormModal from "./addressFormModal";

interface Props {
  value?: number;
  onChange: (addressId: number) => void;
}

/** Chọn địa chỉ giao hàng có sẵn, hoặc thêm / sửa địa chỉ ngay tại chỗ */
export default function AddressSelector({ value, onChange }: Props) {
  const { addresses, loading, createAddress, updateAddress, isMutating } = useAddress();
  const [messageApi, contextHolder] = message.useMessage();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);

  // Chưa chọn (hoặc địa chỉ đã chọn bị xoá) thì tự chọn địa chỉ mặc định
  useEffect(() => {
    if (addresses.length === 0 || addresses.some((address) => address.id === value)) return;
    const preferred = addresses.find((address) => address.isDefault) ?? addresses[0];
    onChange(preferred.id);
  }, [addresses, value]);

  const openForm = (address: Address | null) => {
    setEditing(address);
    setFormOpen(true);
  };

  const handleSubmit = async (input: AddressInput) => {
    try {
      if (editing) {
        await updateAddress({ id: editing.id, input });
        messageApi.success("Đã cập nhật địa chỉ.");
      } else {
        const created = await createAddress(input);
        onChange(created.id);
        messageApi.success("Đã thêm địa chỉ mới.");
      }
      setFormOpen(false);
    } catch (error) {
      messageApi.error(getApiErrorMessage(error, "Không thể lưu địa chỉ."));
    }
  };

  return (
    <div>
      {contextHolder}
      {loading ? (
        <Skeleton active paragraph={{ rows: 3 }} />
      ) : addresses.length === 0 ? (
        <Empty
          image={<EnvironmentOutlined className="text-5xl text-[#e88f98]" />}
          description="Bạn chưa có địa chỉ giao hàng nào."
        />
      ) : (
        <div role="radiogroup" aria-label="Địa chỉ giao hàng" className="grid gap-3">
          {addresses.map((address) => {
            const selected = address.id === value;
            return (
              <div
                key={address.id}
                role="radio"
                aria-checked={selected}
                tabIndex={0}
                onClick={() => onChange(address.id)}
                onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && onChange(address.id)}
                className={`group relative flex cursor-pointer gap-3 rounded-2xl border p-4 transition ${
                  selected
                    ? "border-[#e16463] bg-[#fff4f2] shadow-[0_0_0_3px_rgba(225,100,99,0.12)]"
                    : "border-[#f0dcdc] bg-white hover:border-[#e88f98]"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-base ${
                    selected ? "border-transparent text-[#e16463]" : "border-[#d8c3c3]"
                  }`}
                >
                  {selected && <CheckCircleFilled />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-[#2d2020]">{address.fullname}</span>
                    <span className="text-sm text-[#987979]">{address.phone}</span>
                    {address.isDefault && (
                      <Tag color="#e16463" className="!m-0 !rounded-full">
                        Mặc định
                      </Tag>
                    )}
                  </div>
                  <p className="mt-1 text-sm leading-6 text-[#765f5f]">{formatAddress(address)}</p>
                </div>
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  aria-label="Sửa địa chỉ"
                  className="!text-[#987979] hover:!text-[#e16463]"
                  onClick={(event) => {
                    event.stopPropagation();
                    openForm(address);
                  }}
                />
              </div>
            );
          })}
        </div>
      )}

      <Button
        type="dashed"
        block
        icon={<PlusOutlined />}
        className="!mt-3 !h-11 !rounded-2xl !border-[#e8caca] !text-[#b05a5b] hover:!border-[#e16463] hover:!text-[#e16463]"
        onClick={() => openForm(null)}
      >
        Thêm địa chỉ mới
      </Button>

      <AddressFormModal
        open={formOpen}
        address={editing}
        saving={isMutating}
        onCancel={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
