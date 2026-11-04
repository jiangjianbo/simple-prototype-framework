function UiOptions(options: { label: string; desc?: string }) {
  return (_target: any, _key: string) => {}
}

/** 标签（对齐 Deckurate shared-types Tag 简化） */
export class Tag {
  @UiOptions({ label: '标签 ID' })
  id: string;

  @UiOptions({ label: '名称', desc: '全局唯一' })
  name: string;

  @UiOptions({ label: '分类' })
  category: string;

  @UiOptions({ label: '使用次数' })
  usageCount: number;

  @UiOptions({ label: '创建时间' })
  createdAt: Date;
}
