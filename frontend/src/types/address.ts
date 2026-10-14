// Địa chỉ backend trả về (tên cột: fullname, line)
export interface Address {
  id: number;
  fullname: string;
  phone: string;
  line: string;
  ward: string;
  district: string;
  province: string;
  isDefault: boolean;
}

// Dữ liệu gửi lên khi tạo / sửa địa chỉ (theo AddressCreateDto của backend)
export interface AddressInput {
  fullName: string;
  phone: string;
  line1: string;
  ward: string;
  district: string;
  province: string;
  isDefault?: boolean;
}
