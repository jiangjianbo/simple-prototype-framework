function UiOptions(options: { label: string; desc?: string }) {
  return (_target: any, _key: string) => {}
}

/** 文档 / 选辑（docType=composite 即选辑；对齐 Deckurate shared-types Document 简化） */
export class Document {
  @UiOptions({ label: '文档 ID', desc: '全局唯一标识' })
  id: string;

  @UiOptions({ label: '标题' })
  title: string;

  @UiOptions({ label: '类型', desc: 'slider=PPT / word=Word / pdf=PDF / composite=选辑' })
  docType: string;

  @UiOptions({ label: '文件名' })
  filename: string;

  @UiOptions({ label: '大小' })
  fileSize: number;

  @UiOptions({ label: '状态', desc: 'uploaded / processing / completed / failed' })
  status: string;

  @UiOptions({ label: '片段数' })
  totalSegments: number;

  @UiOptions({ label: '标签', desc: '逗号分隔' })
  tags: string;

  @UiOptions({ label: '当前版本' })
  currentVersion: string;

  @UiOptions({ label: '创建时间' })
  createdAt: Date;

  @UiOptions({ label: '更新时间' })
  updatedAt: Date;
}
