import type { ThemeConfig } from "antd";

export const BRAND = "#e16463";

// Theme riêng cho modal: hồng thương hiệu, input bo tròn và cao hơn mặc định
export const authTheme: ThemeConfig = {
  token: {
    colorPrimary: BRAND,
    colorPrimaryHover: "#c95050",
    colorPrimaryActive: "#b84444",
    colorLink: BRAND,
    borderRadius: 12,
    controlHeight: 44,
    fontFamily: "'Inter', system-ui, 'Segoe UI', Roboto, sans-serif",
  },
  components: {
    Input: {
      hoverBorderColor: "#e88f98",
      activeBorderColor: BRAND,
      activeShadow: "0 0 0 3px rgba(225, 100, 99, 0.12)",
    },
    Button: {
      primaryShadow: "none",
      fontWeight: 600,
      controlHeight: 48,
      borderRadius: 999,
      contentFontSize: 15,
    },
    Form: {
      labelColor: "#6b5b5e",
      labelFontSize: 13,
      verticalLabelPadding: "0 0 6px",
      itemMarginBottom: 16,
    },
  },
};
