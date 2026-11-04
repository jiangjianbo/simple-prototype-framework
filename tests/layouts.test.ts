/**
 * 场景布局（Scene Layout）回归：每个界面的最底层布局。
 * 统一契约：所有场景布局提供 controls 槽承载切换控件簇，槽留空回落契约组件 layout-controls。
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

import AppLayout from '@/components/framework/AppLayout.vue'
import LoginLayout from '@/components/framework/LoginLayout.vue'
import ScreenLayout from '@/components/framework/ScreenLayout.vue'

const el = (id: string) => ({ template: `<div id="${id}">${id}</div>` })

describe('场景布局', () => {
  it('app-layout：controls 槽留空回落 layout-controls；提供槽内容则整簇替换', () => {
    const withFallback = mount(AppLayout, {
      slots: { title: '后台', content: el('app-content') },
    })
    expect(withFallback.find('[data-slot="layout-controls"]').exists()).toBe(true)
    expect(withFallback.find('#app-content').exists()).toBe(true)

    const overridden = mount(AppLayout, { slots: { controls: el('custom-controls') } })
    expect(overridden.find('#custom-controls').exists()).toBe(true)
    expect(overridden.find('[data-slot="layout-controls"]').exists()).toBe(false)
  })

  it('login-layout：面板用契约 card（随套件变形），controls 回落在右上角', () => {
    const wrapper = mount(LoginLayout, {
      slots: { brand: el('login-brand'), title: el('login-title'), form: el('login-form') },
    })
    expect(wrapper.find('[data-slot="card"]').exists()).toBe(true)
    expect(wrapper.find('#login-brand').exists()).toBe(true)
    expect(wrapper.find('#login-title').exists()).toBe(true)
    expect(wrapper.find('#login-form').exists()).toBe(true)
    expect(wrapper.find('[data-slot="layout-controls"]').exists()).toBe(true)
  })

  it('screen-layout：标题栏 + 全宽内容区 + footer 槽，controls 回落', () => {
    const wrapper = mount(ScreenLayout, {
      slots: { icon: el('screen-icon'), title: el('screen-title'), default: el('screen-grid'), footer: el('screen-footer') },
    })
    expect(wrapper.find('#screen-icon').exists()).toBe(true)
    expect(wrapper.find('#screen-title').exists()).toBe(true)
    expect(wrapper.find('#screen-grid').exists()).toBe(true)
    expect(wrapper.find('#screen-footer').exists()).toBe(true)
    expect(wrapper.find('[data-slot="layout-controls"]').exists()).toBe(true)

    const noFooter = mount(ScreenLayout)
    expect(noFooter.find('footer').exists()).toBe(false)
  })
})
