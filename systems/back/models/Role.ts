function UiOptions(options: { label: string; desc?: string }) {
  return (_target: any, _key: string) => {}
}

export class Role {
  @UiOptions({ label: '角色 ID' })
  id: number;

  @UiOptions({ label: '角色名称' })
  name: string;

  @UiOptions({ label: '权限等级' })
  level: number;

  @UiOptions({ label: '说明' })
  desc: string;
}
