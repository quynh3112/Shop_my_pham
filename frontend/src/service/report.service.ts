import { api } from "../config/api";
import type {
  MonthlyRevenue,
  ProductSalesQuery,
  ProductSalesReport,
  ReportOverview,
  YearlyRevenue,
} from "../types/report";

const endpoint = "report";

const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

export const getProductSales = async (query: ProductSalesQuery): Promise<ProductSalesReport> => {
  const res = await api.get(`${endpoint}/products`, { headers: authHeader(), params: query });
  return res.data;
};

export const getOverview = async (query: ProductSalesQuery): Promise<ReportOverview> => {
  const res = await api.get(`${endpoint}/overview`, { headers: authHeader(), params: query });
  return res.data;
};

// Doanh thu chỉ tính đơn đã giao (backend cố định), không cần gửi phạm vi
export const getMonthlyRevenue = async (year: number): Promise<MonthlyRevenue> => {
  const res = await api.get(`${endpoint}/revenue/monthly`, { headers: authHeader(), params: { year } });
  return res.data;
};

export const getYearlyRevenue = async (): Promise<YearlyRevenue> => {
  const res = await api.get(`${endpoint}/revenue/yearly`, { headers: authHeader() });
  return res.data;
};

// File Excel đầy đủ: tổng quan, theo tháng (năm đang chọn), theo năm, sản phẩm
export const exportFullReport = (query: ProductSalesQuery & { year?: number }) => downloadExcel("export", query);

export const exportProductSales = (query: ProductSalesQuery) => downloadExcel("products/export", query);

// Tải file Excel về máy, tên file lấy theo header server trả về
const downloadExcel = async (path: string, query: object) => {
  const res = await api.get(`${endpoint}/${path}`, {
    headers: authHeader(),
    params: query,
    responseType: "blob",
  });
  const disposition: string = res.headers["content-disposition"] ?? "";
  const fileName = /filename="?([^"]+)"?/.exec(disposition)?.[1] ?? "bao-cao-doanh-thu.xlsx";
  const url = URL.createObjectURL(res.data as Blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};
