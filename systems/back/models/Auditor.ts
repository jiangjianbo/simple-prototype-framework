function UiOptions(options: { label: string; desc?: string }) {
  return (_target: any, _key: string) => {}
}

export class Auditor {
  @UiOptions({ label: '审核人' })
  name: string;

  @UiOptions({ label: '审核时间' })
  auditTime: Date;

  @UiOptions({ label: '审核意见' })
  comment: string;
}
