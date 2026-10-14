import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, SubnodeOutlined } from "@ant-design/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Form, Input, InputNumber, Modal, Popconfirm, Space, Table, Tag, Tooltip, TreeSelect, message } from "antd";
import type { TableColumnsType } from "antd";
import { useMemo, useState } from "react";
import { creat, deleteCategory, listCategory, updateCategory } from "../service/category.service";
import type { Category, CategoryInput } from "../types/category";
import { getApiErrorMessage } from "../utils/error";

type TreeOption = { title: string; value: number; disabled?: boolean; children?: TreeOption[] };

// Antd Table coi mảng children rỗng là "có con" -> bỏ đi để không hiện nút mở rộng thừa
const toTableRows = (nodes: Category[]): Category[] =>
  nodes.map((n) => ({ ...n, children: n.children?.length ? toTableRows(n.children) : undefined }));

const collectIds = (node: Category): number[] => [node.id, ...(node.children ?? []).flatMap(collectIds)];

// Ô chọn danh mục cha: khoá chính danh mục đang sửa và các danh mục con của nó (tránh vòng lặp)
const toTreeOptions = (nodes: Category[], blocked: Set<number>): TreeOption[] =>
  nodes.map((n) => ({
    title: n.name,
    value: n.id,
    disabled: blocked.has(n.id),
    children: n.children?.length ? toTreeOptions(n.children, blocked) : undefined,
  }));

const findNode = (nodes: Category[], id: number): Category | undefined => {
  for (const n of nodes) {
    if (n.id === id) return n;
    const found = findNode(n.children ?? [], id);
    if (found) return found;
  }
  return undefined;
};

export default function MnCategory() {
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm<CategoryInput>();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [pageSize, setPageSize] = useState(10);

  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: listCategory });
  const tree = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
  const rows = useMemo(() => toTableRows(tree), [tree]);

  const blocked = useMemo(() => new Set(editing ? collectIds(findNode(tree, editing.id) ?? editing) : []), [editing, tree]);
  const parentOptions = useMemo(() => toTreeOptions(tree, blocked), [tree, blocked]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["categories"] });

  const saveMutation = useMutation({
    mutationFn: (values: CategoryInput) => {
      const payload = { ...values, name: values.name.trim(), parentId: values.parentId ?? null };
      return editing ? updateCategory(editing.id, payload) : creat(payload);
    },
    onSuccess: () => {
      messageApi.success(editing ? "Đã cập nhật danh mục" : "Đã thêm danh mục");
      setOpen(false);
      refresh();
    },
    onError: (err) => messageApi.error(getApiErrorMessage(err, "Không lưu được danh mục.")),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      messageApi.success("Đã xoá danh mục");
      refresh();
    },
    onError: (err) => messageApi.error(getApiErrorMessage(err, "Không xoá được danh mục.")),
  });

  const openForm = (category: Category | null, parentId?: number | null) => {
    setEditing(category);
    form.resetFields();
    form.setFieldsValue(
      category
        ? { name: category.name, parentId: category.parentId ?? null, sortOrder: category.sortOrder }
        : { name: "", parentId: parentId ?? null, sortOrder: 0 },
    );
    setOpen(true);
  };

  const columns: TableColumnsType<Category> = [
    {
      title: "Tên danh mục",
      dataIndex: "name",
      render: (name: string, c) => (
        <span className={c.parentId ? "" : "font-semibold"}>
          {name}
          {!!c.children?.length && <span className="ml-2 text-xs text-gray-400">({c.children.length} danh mục con)</span>}
        </span>
      ),
    },
    { title: "Đường dẫn (slug)", dataIndex: "slug", width: 220, render: (v?: string) => <span className="font-mono text-xs text-gray-500">{v}</span> },
    {
      title: "Sản phẩm",
      dataIndex: "productCount",
      width: 100,
      align: "right",
      render: (v: number) => (v ? <Tag color="blue">{v}</Tag> : <span className="text-gray-400">0</span>),
    },
    { title: "Thứ tự", dataIndex: "sortOrder", width: 80, align: "right" },
    {
      title: "Thao tác",
      key: "actions",
      width: 150,
      render: (_, c) => (
        <Space size={0}>
          <Tooltip title="Thêm danh mục con">
            <Button type="text" icon={<SubnodeOutlined />} onClick={() => openForm(null, c.id)} />
          </Tooltip>
          <Tooltip title="Sửa">
            <Button type="text" icon={<EditOutlined />} onClick={() => openForm(c)} />
          </Tooltip>
          <Popconfirm
            title={`Xoá danh mục "${c.name}"?`}
            description={
              c.productCount
                ? "Danh mục còn sản phẩm nên sẽ không xoá được."
                : c.children?.length
                  ? "Các danh mục con sẽ được chuyển lên danh mục cha."
                  : "Thao tác này không thể hoàn tác."
            }
            okText="Xoá"
            okButtonProps={{ danger: true }}
            cancelText="Huỷ"
            onConfirm={() => deleteMutation.mutate(c.id)}
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
    <div className="flex flex-col gap-4">
      {contextHolder}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-xl font-semibold">Quản lý danh mục</h2>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={refresh} loading={categoriesQuery.isFetching && !categoriesQuery.isLoading} />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openForm(null)}>
            Thêm danh mục
          </Button>
        </Space>
      </div>

      {categoriesQuery.error && (
        <Alert type="error" showIcon message={getApiErrorMessage(categoriesQuery.error, "Không tải được danh mục.")} />
      )}

      <Table<Category>
        rowKey="id"
        columns={columns}
        dataSource={rows}
        loading={categoriesQuery.isLoading}
        // Phân trang theo danh mục gốc, danh mục con luôn đi cùng trang với danh mục cha
        pagination={{
          pageSize,
          showSizeChanger: true,
          pageSizeOptions: [5, 10, 20, 50],
          onShowSizeChange: (_, size) => setPageSize(size),
          showTotal: (total, [start, end]) => `${start}-${end} / ${total} danh mục gốc`,
          hideOnSinglePage: false,
          placement: ["bottomEnd"],
        }}
        expandable={{ defaultExpandAllRows: true }}
        // Mở rộng tất cả khi dữ liệu tải xong lần đầu
        key={rows.length ? "loaded" : "empty"}
        locale={{ emptyText: "Chưa có danh mục nào" }}
        scroll={{ x: 700 }}
      />
      <div className="text-xs text-gray-400">
        Số sản phẩm là sản phẩm gắn trực tiếp vào danh mục. Khi khách lọc theo danh mục cha, sản phẩm của các danh mục con cũng được hiện.
      </div>

      <Modal
        open={open}
        title={editing ? `Sửa danh mục "${editing.name}"` : "Thêm danh mục"}
        okText={editing ? "Lưu" : "Thêm"}
        cancelText="Huỷ"
        confirmLoading={saveMutation.isPending}
        onOk={() => form.submit()}
        onCancel={() => setOpen(false)}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={(values) => saveMutation.mutate(values)}>
          <Form.Item
            name="name"
            label="Tên danh mục"
            rules={[
              { required: true, whitespace: true, message: "Nhập tên danh mục" },
              { max: 100, message: "Tối đa 100 ký tự" },
            ]}
          >
            <Input placeholder="VD: Son môi" autoFocus />
          </Form.Item>
          <Form.Item name="parentId" label="Danh mục cha" extra="Bỏ trống để làm danh mục gốc.">
            <TreeSelect
              allowClear
              showSearch
              treeDefaultExpandAll
              treeNodeFilterProp="title"
              placeholder="Không có (danh mục gốc)"
              treeData={parentOptions}
            />
          </Form.Item>
          <Form.Item name="sortOrder" label="Thứ tự hiển thị" extra="Số nhỏ hiển thị trước.">
            <InputNumber min={0} className="!w-full" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
