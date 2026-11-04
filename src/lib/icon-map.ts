/**
 * 受控的 lucide 图标映射：JSON 中 icon 字段使用 kebab-case 名。
 * 按需引入避免整包 lucide 进 bundle。
 */

import {
  Activity, Bell, Brain, Calendar, Check, ChartColumn, ChevronDown, ChevronLeft,
  ChevronRight, CircleUser, Clock, Cpu, Database, Eye, FileText, FolderClosed,
  Gauge, Globe, History, Home, Inbox, Info, KeyRound, Layers, LayoutDashboard,
  LayoutGrid, ListTodo, Lock, LogOut, Mail, MapPin, Menu, MessageSquare, Package,
  Pencil, Phone, Plus, Presentation, Save, Search, Server, Settings, ShieldAlert,
  ShieldCheck, ShoppingCart, Star, Table2, Tags, Trash2, TrendingDown, TrendingUp,
  TriangleAlert, User, UserCog, Users, X, Zap, type LucideIcon,
} from 'lucide-vue-next'

const MAP: Record<string, LucideIcon> = {
  activity: Activity,
  'alert-triangle': TriangleAlert,
  'bar-chart-3': ChartColumn,
  'chart-column': ChartColumn,
  bell: Bell,
  brain: Brain,
  calendar: Calendar,
  check: Check,
  'chevron-down': ChevronDown,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  cpu: Cpu,
  database: Database,
  eye: Eye,
  'file-text': FileText,
  folder: FolderClosed,
  gauge: Gauge,
  globe: Globe,
  history: History,
  inbox: Inbox,
  info: Info,
  'key-round': KeyRound,
  layers: Layers,
  'layout-dashboard': LayoutDashboard,
  'list-todo': ListTodo,
  lock: Lock,
  'log-out': LogOut,
  mail: Mail,
  'map-pin': MapPin,
  menu: Menu,
  'message-square': MessageSquare,
  package: Package,
  pencil: Pencil,
  phone: Phone,
  pie: ChartColumn,
  plus: Plus,
  presentation: Presentation,
  save: Save,
  search: Search,
  server: Server,
  settings: Settings,
  'shield-alert': ShieldAlert,
  'shield-check': ShieldCheck,
  'shopping-cart': ShoppingCart,
  star: Star,
  table: Table2,
  tags: Tags,
  'trash-2': Trash2,
  'triangle-alert': TriangleAlert,
  'trending-down': TrendingDown,
  'trending-up': TrendingUp,
  user: User,
  'user-cog': UserCog,
  users: Users,
  x: X,
  zap: Zap,
}

export function resolveIcon(name?: string | null): LucideIcon {
  if (!name) return LayoutGrid
  return MAP[name] ?? LayoutGrid
}
