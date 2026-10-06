import { PaymentMethod, PaymentStatus } from "../order/entity/order.entity"

export interface PaymentOrderInfo{
    code:string
    total:number
    description:string

}
export interface PaymentInitResult{
    paymentStatus:PaymentStatus
    redicecUrl?:string

}
export interface PaymentProvider {
  readonly method: PaymentMethod;

  /**
   * false khi cổng chưa đấu nối. Nghiệp vụ đặt hàng phải kiểm tra cờ này
   * TRƯỚC khi ghi gì xuống database: phát hiện muộn thì đơn đã tạo và tồn kho
   * đã bị trừ trong khi khách không có cách nào trả tiền.
   */
  readonly implemented: boolean;

  initiate(order: PaymentOrderInfo): Promise<PaymentInitResult>;
}