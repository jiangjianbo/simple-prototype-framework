// UiOptions 简化：仅 label 和 desc（§6.1，装饰器仅作为 ts-morph 静态扫描标记）
function UiOptions(options: { label: string; desc?: string }) {
  return (_target: any, _key: string) => {}
}

export class Profile {
  @UiOptions({ label: '姓名', desc: '员工真实姓名' })
  name: string;

  @UiOptions({ label: '邮箱' })
  email: string;

  @UiOptions({ label: '手机号' })
  phone: string;

  @UiOptions({ label: '所属部门' })
  department: string;

  @UiOptions({ label: '职位' })
  position: string;

  @UiOptions({ label: '入职日期' })
  joinDate: Date;

  @UiOptions({ label: '个人简介', desc: '展示给同事的一段话' })
  bio: string;

  @UiOptions({ label: '接收消息通知' })
  notifyEnabled: boolean;
}
