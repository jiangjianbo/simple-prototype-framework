function UiOptions(options: { label: string; desc?: string }) {
  return (_target: any, _key: string) => {}
}

/** 文档版本（对齐 Deckurate shared-types DocumentVersion 简化） */
export class DocumentVersion {
  @UiOptions({ label: '版本 ID' })
  id: string;

  @UiOptions({ label: '所属文档' })
  documentId: string;

  @UiOptions({ label: '版本号' })
  versionNumber: number;

  @UiOptions({ label: '文件名' })
  filename: string;

  @UiOptions({ label: '大小' })
  fileSize: number;

  @UiOptions({ label: '状态' })
  status: string;

  @UiOptions({ label: '片段数' })
  totalSegments: number;

  @UiOptions({ label: '创建时间' })
  createdAt: Date;
}
