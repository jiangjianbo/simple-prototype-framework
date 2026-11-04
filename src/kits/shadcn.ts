/**
 * shadcn 套件（默认套件，§15）：reka-ui + Tailwind 全量实现，精致风（圆角、阴影、动效）。
 * 同时承担「兜底套件」职责：其他套件未覆盖的契约名回落到这里。
 */

import type { Component } from 'vue'

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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

import AppLayout from '@/components/framework/AppLayout.vue'
import LoginLayout from '@/components/framework/LoginLayout.vue'
import ScreenLayout from '@/components/framework/ScreenLayout.vue'
import LayoutControls from '@/components/framework/LayoutControls.vue'
import Toolbar from '@/components/framework/Toolbar.vue'
import Kbd from '@/components/framework/Kbd.vue'
import TagList from '@/components/framework/TagList.vue'
import ToggleGroup from '@/components/framework/ToggleGroup.vue'
import TreeView from '@/components/framework/TreeView.vue'
import ProgressRing from '@/components/framework/ProgressRing.vue'
import ServiceStatus from '@/components/framework/ServiceStatus.vue'
import PageView from '@/components/framework/PageView.vue'
import NavMenu from '@/components/framework/NavMenu.vue'
import Breadcrumb from '@/components/framework/Breadcrumb.vue'
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
import BooleanBadge from '@/components/framework/BooleanBadge.vue'
import MissingComponent from '@/components/framework/MissingComponent.vue'
import FieldList from '@/components/framework/FieldList.vue'

/** null 渲染占位：tab-pane 由 tabs 复合件内部消化，不直接渲染 */
const TabPanePlaceholder = { render: () => null } as unknown as Component

export const SHADCN_KIT: Record<string, Component> = {
  // ===== 基础 =====
  text: Text,
  heading: Heading,
  link: LinkText,
  icon: IconBox,
  image: ImageBox,
  button: Button,
  badge: Badge,
  separator: Separator,
  'field-value': FieldValue,

  // ===== 卡片 / 容器 =====
  card: Card,
  'card-header': CardHeader,
  'card-title': CardTitle,
  'card-description': CardDescription,
  'card-content': CardContent,
  'card-footer': CardFooter,

  // ===== 表单 =====
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
  'field-list': FieldList,
  'boolean-badge': BooleanBadge,
  'missing-component': MissingComponent,

  // ===== 图表（Unovis） =====
  'chart-area': ChartXY,
  'chart-line': ChartXY,
  'chart-bar': ChartBar,
  'chart-donut': ChartDonut,

  // ===== 导航 =====
  tabs: TabsView,
  'tab-pane': TabPanePlaceholder,
  'tabs-root': Tabs,
  'tabs-list': TabsList,
  'tabs-trigger': TabsTrigger,
  'tabs-content': TabsContent,

  // ===== 反馈 =====
  alert: AlertView,

  // ===== 布局 =====
  row: LayoutRow,
  'form-item': FormItemView,
  toolbar: Toolbar,

  // ===== 扩展契约（Deckurate 基础组件引入，套件无关，全套餐件共享） =====
  kbd: Kbd,
  'tag-list': TagList,
  'toggle-group': ToggleGroup,
  tree: TreeView,
  'progress-ring': ProgressRing,
  'service-status': ServiceStatus,

  // ===== 场景布局 =====
  'app-layout': AppLayout,
  'login-layout': LoginLayout,
  'screen-layout': ScreenLayout,
  'layout-controls': LayoutControls,
  'page-view': PageView,
  'nav-menu': NavMenu,
  breadcrumb: Breadcrumb,
}
