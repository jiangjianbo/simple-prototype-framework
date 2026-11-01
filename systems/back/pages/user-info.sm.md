# 页面状态机：user-info

> 基于设计文档 §13.9 示例。语义：事件声明在哪一列（状态），触发后就转移到该状态，
> 并执行该状态列在响应区的全部动作。
>
> 流转闭环：浏览 --btnEdit--> 编辑中 --btnSave--> 浏览 / --btnSubmit--> 审核中（form.reset()）。
> `userInfo` 在触发区被读（.lock 条件），在响应区被写（.lock=false），两区语义独立（§13.9.4）。

| 组件 / 事件 | 浏览（初始） | 编辑中 | 审核中 |
|---|---|---|---|
| userInfo | .lock==true | .lock==false | .lock==true |
| auditor | .name==$currentUserName | .name==$currentUserName | .name!=$currentUserName |
| btnEdit | | @click | |
| btnSave | @click | | |
| btnSubmit | | | @click |
| === | === | === | === |
| txtUser | .readOnly=true | .readOnly=false | .readOnly=true |
| txtDescription | .readOnly=true | .readOnly=false | .readOnly=true |
| btnSubmit | .enabled=false | .enabled=true | .enabled=false |
| userInfo | | .lock=false | |
| form | | | .reset() |
