import { DeleteOutlined, EditOutlined, KeyOutlined, LockOutlined, PlusOutlined, SearchOutlined, UnlockOutlined } from "@ant-design/icons";
import { Alert, Avatar, Button, Input, Popconfirm, Space, Table, Tag, Tooltip, message } from "antd";
import type { TableColumnsType } from "antd";
import { useState } from "react";
import ResetPasswordModal from "../component/staff/resetPasswordModal";
import StaffFormModal from "../component/staff/staffFormModal";
import useStaff from "../hooks/useStaff";
import { toFileUrl } from "../service/product.service";
import type { Staff, StaffCreate } from "../types/staff";
import { getApiErrorMessage } from "../utils/error";
import { formatDateTime } from "../utils/order";
import { PERMISSION_LABEL, PERMISSION_OPTIONS } from "../utils/permissions";

export default function MnStaff() {
  const [messageApi, contextHolder] = message.useMessage();
  const { staff, loading, fetching, error, createStaff, updateStaff, resetPassword, deleteStaff, saving, resetting } =
    useStaff();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [passwordFor, setPasswordFor] = useState<Staff | null>(null);

  const run = async (action: () => Promise<unknown>, success: string, fallback: string) => {
    try {
      await action();
      messageApi.success(success);
      return true;
    } catch (actionError) {
      messageApi.error(getApiErrorMessage(actionError, fallback));
      return false;
    }
  };

  const handleSubmit = async (values: StaffCreate) => {
    const ok = editing
      ? await run(
          () =>
            updateStaff({
              id: editing.id,
              data: { fullName: values.fullName, phone: values.phone, permissions: values.permissions ?? [] },
            }),
          "Đã cập nhật nhân viên.",
          "Không thể cập nhật nhân viên.",
        )
      : await run(
          () => createStaff({ ...values, permissions: values.permissions ?? [] }),
          "Đã tạo tài khoản nhân viên.",
          "Không thể tạo nhân viên.",
        );
    if (ok) setFormOpen(false);
  };

  const keyword = search.trim().toLowerCase();
  const filtered = keyword
    ? staff.filter((s) => `${s.fullName} ${s.email} ${s.phone}`.toLowerCase().includes(keyword))
    : staff;

  const columns: TableColumnsType<Staff> = [
    {
      title: "Nhân viên",
      key: "staff",
      render: (_, s) => (
        <div className="flex items-center gap-3">
          <Avatar src={s.avatarUrl ? toFileUrl(s.avatarUrl) : undefined}>{s.fullName.charAt(0)}</Avatar>
          <div className="min-w-0">
            <p className="font-medium">{s.fullName}</p>
            <p className="text-xs text-gray-500">
              {s.email} · {s.phone}
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Quyền",
      dataIndex: "permissions",
      key: "permissions",
      filters: PERMISSION_OPTIONS.map((option) => ({ text: option.label, value: option.value })),
      onFilter: (value, s) => s.permissions.includes(value as Staff["permissions"][number]),
      render: (permissions: Staff["permissions"]) =>
        permissions.length ? (
          <div className="flex flex-wrap gap-1">
            {permissions.map((permission) => (
              <Tag key={permission} className="!m-0">
                {PERMISSION_LABEL[permission] ?? permission}
              </Tag>
            ))}
          </div>
        ) : (
          <span className="text-xs text-gray-400">Chưa cấp quyền</span>
        ),
    },
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      width: 120,
      filters: [
        { text: "Đang hoạt động", value: true },
        { text: "Đã khoá", value: false },
      ],
      onFilter: (value, s) => s.isActive === value,
      render: (isActive: boolean) => <Tag color={isActive ? "green" : "red"}>{isActive ? "Hoạt động" : "Đã khoá"}</Tag>,
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 160,
      responsive: ["lg"],
      render: (value: string) => <span className="text-xs text-gray-500">{formatDateTime(value)}</span>,
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 180,
      align: "center",
      render: (_, s) => (
        <Space size={2}>
          <Tooltip title="Sửa thông tin / quyền">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => {
                setEditing(s);
                setFormOpen(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Đặt lại mật khẩu">
            <Button type="text" icon={<KeyOutlined />} onClick={() => setPasswordFor(s)} />
          </Tooltip>
          <Popconfirm
            title={s.isActive ? "Khoá tài khoản này?" : "Mở khoá tài khoản này?"}
            description={s.isActive ? "Nhân viên sẽ bị đăng xuất và không vào được khu quản lý." : undefined}
            okText={s.isActive ? "Khoá" : "Mở khoá"}
            cancelText="Huỷ"
            onConfirm={() =>
              run(
                () => updateStaff({ id: s.id, data: { isActive: !s.isActive } }),
                s.isActive ? "Đã khoá tài khoản." : "Đã mở khoá tài khoản.",
                "Không thể cập nhật trạng thái.",
              )
            }
          >
            <Tooltip title={s.isActive ? "Khoá" : "Mở khoá"}>
              <Button type="text" icon={s.isActive ? <LockOutlined /> : <UnlockOutlined />} />
            </Tooltip>
          </Popconfirm>
          <Popconfirm
            title="Xoá nhân viên này?"
            description="Lịch sử thao tác vẫn được giữ nhưng không còn tên người thực hiện. Nên khoá thay vì xoá."
            okText="Xoá"
            cancelText="Huỷ"
            okButtonProps={{ danger: true }}
            onConfirm={() => run(() => deleteStaff(s.id), "Đã xoá nhân viên.", "Không thể xoá nhân viên.")}
          >
            <Tooltip title="Xoá">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {contextHolder}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Quản lý nhân viên</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          Thêm nhân viên
        </Button>
      </div>

      <Input
        allowClear
        prefix={<SearchOutlined />}
        placeholder="Tìm theo tên, email, SĐT"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="!mb-4 !w-72"
      />

      {error && <Alert type="error" showIcon message="Không tải được danh sách nhân viên" description={error} className="!mb-4" />}

      <Table
        rowKey="id"
        columns={columns}
        dataSource={filtered}
        loading={loading || fetching}
        scroll={{ x: 800 }}
        pagination={{ pageSize: 10, showSizeChanger: false }}
        locale={{ emptyText: "Chưa có nhân viên nào" }}
      />

      <StaffFormModal
        open={formOpen}
        staff={editing}
        saving={saving}
        onCancel={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />
      <ResetPasswordModal
        staffName={passwordFor?.fullName ?? null}
        saving={resetting}
        onCancel={() => setPasswordFor(null)}
        onSubmit={async (password) => {
          if (!passwordFor) return;
          const ok = await run(
            () => resetPassword({ id: passwordFor.id, password }),
            "Đã đặt lại mật khẩu.",
            "Không thể đặt lại mật khẩu.",
          );
          if (ok) setPasswordFor(null);
        }}
      />
    </div>
  );
}
