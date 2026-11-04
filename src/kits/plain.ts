/**
 * plain 套件（§15）：原生元素 + 语义 Tailwind 工具类的极简实现。
 * 视觉语言：直角、细边框、无阴影无圆角；交互控件全部原生（select/checkbox/range/date）。
 *
 * 部分覆盖（套件特性）：未列出的契约名回落到默认套件 shadcn ——
 * 继承的复合件（schema-form / table / tabs / field-value）内部经契约解析取原语，
 * 因此在 plain 套件下自动使用 plain 原语渲染。
 */

import type { Component } from 'vue'

import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Separator, Skeleton, Label,
  TableHeader, TableBody, TableHead, TableCell, TableCaption, TableRow,
  AlertTitle, AlertDescription,
} from '@/components/plain/primitives'
import Button from '@/components/plain/Button.vue'
import Badge from '@/components/plain/Badge.vue'
import Alert from '@/components/plain/Alert.vue'
import Input from '@/components/plain/Input.vue'
import Textarea from '@/components/plain/Textarea.vue'
import InputNumber from '@/components/plain/InputNumber.vue'
import Switch from '@/components/plain/Switch.vue'
import Checkbox from '@/components/plain/Checkbox.vue'
import Select from '@/components/plain/Select.vue'
import RadioGroup from '@/components/plain/RadioGroup.vue'
import Slider from '@/components/plain/Slider.vue'
import DatePicker from '@/components/plain/DatePicker.vue'
import Table from '@/components/plain/Table.vue'
import Empty from '@/components/plain/Empty.vue'
import FieldList from '@/components/plain/FieldList.vue'
import StatCard from '@/components/plain/StatCard.vue'
import AppLayout from '@/components/plain/AppLayout.vue'
import PageView from '@/components/plain/PageView.vue'
import NavMenu from '@/components/plain/NavMenu.vue'
import Breadcrumb from '@/components/plain/Breadcrumb.vue'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/plain/tabs'

export const PLAIN_KIT: Record<string, Component> = {
  // ===== 基础 =====
  button: Button,
  badge: Badge,
  separator: Separator,

  // ===== 卡片 / 容器 =====
  card: Card,
  'card-header': CardHeader,
  'card-title': CardTitle,
  'card-description': CardDescription,
  'card-content': CardContent,
  'card-footer': CardFooter,

  // ===== 表单（原生控件） =====
  label: Label,
  input: Input,
  textarea: Textarea,
  'input-number': InputNumber,
  switch: Switch,
  checkbox: Checkbox,
  select: Select,
  'radio-group': RadioGroup,
  slider: Slider,
  'date-picker': DatePicker,

  // ===== 数据展示 =====
  'table-raw': Table,
  'table-header': TableHeader,
  'table-body': TableBody,
  'table-row': TableRow,
  'table-head': TableHead,
  'table-cell': TableCell,
  'table-caption': TableCaption,
  skeleton: Skeleton,
  empty: Empty,
  'field-list': FieldList,
  'stat-card': StatCard,

  // ===== 提示 =====
  alert: Alert,
  'alert-title': AlertTitle,
  'alert-description': AlertDescription,

  // ===== 导航（下划线标签页） =====
  'tabs-root': Tabs,
  'tabs-list': TabsList,
  'tabs-trigger': TabsTrigger,
  'tabs-content': TabsContent,

  // ===== 场景布局（plain 只覆盖 app-layout 整壳；login/screen/layout-controls 回落 shadcn —— 经契约组件自适应） =====
  'app-layout': AppLayout,
  'page-view': PageView,
  'nav-menu': NavMenu,
  breadcrumb: Breadcrumb,
}
