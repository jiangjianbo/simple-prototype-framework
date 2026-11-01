// UiOptions 简化：仅 label 和 desc（§6.1，装饰器仅作为 ts-morph 静态扫描标记）
function UiOptions(options: { label: string; desc?: string }) {
  return (_target: any, _key: string) => {}
}

export class User {
  @UiOptions({ label: '用户 ID', desc: '全局唯一标识' })
  id: string;

  @UiOptions({ label: '姓名', desc: '登录显示名' })
  name: string;

  @UiOptions({ label: '邮箱' })
  email: string;

  @UiOptions({ label: '年龄' })
  age: number;

  @UiOptions({ label: '是否激活' })
  isActive: boolean;

  @UiOptions({ label: '入职日期' })
  createdAt: Date;

  @UiOptions({ label: '角色' })
  roles: Role[];
}
