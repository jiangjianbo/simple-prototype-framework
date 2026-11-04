function UiOptions(options: { label: string; desc?: string }) {
  return (_target: any, _key: string) => {}
}

/** 回收站记录（对齐 Deckurate shared-types TrashRecord 简化） */
export class TrashRecord {
  @UiOptions({ label: '记录 ID' })
  id: string;

  @UiOptions({ label: '条目类型', desc: 'document / composite / segment' })
  entityType: string;

  @UiOptions({ label: '名称' })
  filename: string;

  @UiOptions({ label: '大小' })
  fileSize: number;

  @UiOptions({ label: '删除时间' })
  deletedAt: Date;
}
