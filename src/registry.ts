/**
 * 全量组件注册表（§7.1）——kebab-case 注册名与 JSON `component` 字段一致。
 *
 * 技术栈映射：原设计基于 Element Plus；本实现按 shadcn-vue（reka-ui + Tailwind）
 * 提供「等价语义组件」：
 *   button→Button、input→Input、switch→Switch、date-picker→DatePicker(native)、
 *   table→TanStack DataTable、select→reka-ui Select 复合、tag→Badge、
 *   descriptions→DescriptionsView、divider→Separator …
 * 图表基于 Unovis（shadcn-vue charts 官方底层），复杂表格基于 TanStack Table。
 */

import type { Component } from 'vue'

// ---- UI 基础（shadcn-vue 风格自有副本） ----
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Separator from '@/components/ui/separator/Separator.vue'
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
} from '@/components/ui/card'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption,
} from '@/components/ui/table'
import Skeleton from '@/components/ui/skeleton/Skeleton.vue'
import Label from '@/components/ui/label/Label.vue'
import Input from '@/components/ui/input/Input.vue'
import Textarea from '@/components/ui/textarea/Textarea.vue'
import Switch from '@/components/ui/switch/Switch.vue'
import Checkbox from '@/components/ui/checkbox/Checkbox.vue'
import Select from '@/components/ui/select/Select.vue'
import RadioGroup from '@/components/ui/radio-group/RadioGroup.vue'
import Slider from '@/components/ui/slider/Slider.vue'
import DatePicker from '@/components/ui/date-picker/DatePicker.vue'

// ---- 框架自封装 ----
import FrameWithTitleAndMenuFooter from '@/components/framework/FrameWithTitleAndMenuFooter.vue'
import PageDefault from '@/components/framework/PageDefault.vue'
import MenuTree from '@/components/framework/MenuTree.vue'
import BreadcrumbAuto from '@/components/framework/BreadcrumbAuto.vue'
import FieldPlaceholder from '@/components/framework/FieldPlaceholder.vue'
import ReadonlyBoolean from '@/components/framework/ReadonlyBoolean.vue'
import FallbackDisplay from '@/components/framework/FallbackDisplay.vue'
import Text from '@/components/framework/Text.vue'
import Heading from '@/components/framework/Heading.vue'
import LinkText from '@/components/framework/LinkText.vue'
import IconBox from '@/components/framework/IconBox.vue'
import ImageBox from '@/components/framework/ImageBox.vue'
import FieldValue from '@/components/framework/FieldValue.vue'
import AlertView from '@/components/framework/AlertView.vue'
import AvatarView from '@/components/framework/AvatarView.vue'
import ProgressView from '@/components/framework/ProgressView.vue'
import EmptyView from '@/components/framework/EmptyView.vue'
import StatCard from '@/components/framework/StatCard.vue'
import DescriptionsView from '@/components/framework/DescriptionsView.vue'
import SchemaForm from '@/components/framework/SchemaForm.vue'
import DataTable from '@/components/framework/DataTable.vue'
import InputNumber from '@/components/framework/InputNumber.vue'
import TabsView from '@/components/framework/TabsView.vue'
import LayoutRow from '@/components/framework/LayoutRow.vue'
import FormItemView from '@/components/framework/FormItemView.vue'
import ChartXY from '@/components/framework/ChartXY.vue'
import ChartBar from '@/components/framework/ChartBar.vue'
import ChartDonut from '@/components/framework/ChartDonut.vue'

export const registry: Record<string, Component> = {
  // ===== 基础 =====
  text: Text,
  heading: Heading,
  link: LinkText,
  icon: IconBox,
  image: ImageBox,
  button: Button,
  badge: Badge,
  tag: Badge,
  separator: Separator,
  divider: Separator,
  'field-value': FieldValue,

  // ===== 卡片 / 容器 =====
  card: Card,
  'card-header': CardHeader,
  'card-title': CardTitle,
  'card-description': CardDescription,
  'card-content': CardContent,
  'card-footer': CardFooter,

  // ===== 表单 =====
  form: SchemaForm,
  'schema-form': SchemaForm,
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
  table: DataTable,
  'table-raw': Table,
  'table-header': TableHeader,
  'table-body': TableBody,
  'table-row': TableRow,
  'table-head': TableHead,
  'table-cell': TableCell,
  'table-caption': TableCaption,
  descriptions: DescriptionsView,
  skeleton: Skeleton,
  progress: ProgressView,
  empty: EmptyView,
  avatar: AvatarView,
  'stat-card': StatCard,
  'field-placeholder': FieldPlaceholder,
  'readonly-boolean': ReadonlyBoolean,
  'fallback-display': FallbackDisplay,

  // ===== 图表（Unovis） =====
  'chart-area': ChartXY,
  'chart-line': ChartXY,
  'chart-bar': ChartBar,
  'chart-donut': ChartDonut,

  // ===== 导航 =====
  tabs: TabsView,
  'tab-pane': { render: () => null },

  // ===== 反馈 =====
  alert: AlertView,

  // ===== 布局 =====
  row: LayoutRow,
  'form-item': FormItemView,

  // ===== 框架级 =====
  'frame-with-title-and-menu-footer': FrameWithTitleAndMenuFooter,
  'page-default': PageDefault,
  'menu-tree': MenuTree,
  'breadcrumb-auto': BreadcrumbAuto,
}
