function UiOptions(options: { label: string; desc?: string }) {
  return (_target: any, _key: string) => {}
}

export class Setting {
  @UiOptions({ label: '站点名称' })
  siteName: string;

  @UiOptions({ label: '界面主题' })
  theme: string;

  @UiOptions({ label: '日志级别' })
  logLevel: string;

  @UiOptions({ label: '最大会话数', desc: '单用户并发会话上限' })
  maxSessions: number;

  @UiOptions({ label: '启用多因素认证' })
  mfaEnabled: boolean;

  @UiOptions({ label: '日志保留天数' })
  retentionDays: number;

  @UiOptions({ label: '计划维护时间' })
  maintenanceAt: Date;
}
