function UiOptions(options: { label: string; desc?: string }) {
  return (_target: any, _key: string) => {}
}

export class Order {
  @UiOptions({ label: '订单号' })
  id: string;

  @UiOptions({ label: '商品' })
  product: string;

  @UiOptions({ label: '品类' })
  category: string;

  @UiOptions({ label: '数量' })
  qty: number;

  @UiOptions({ label: '金额' })
  amount: number;

  @UiOptions({ label: '日期' })
  date: Date;

  @UiOptions({ label: '状态' })
  status: string;
}
