const vndFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

/** 120000 -> "120.000 ₫" */
export const formatPrice = (value?: number | null) => vndFormatter.format(Number(value ?? 0));
