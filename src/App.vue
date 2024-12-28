<template>
  <div class="app-container">
    <!-- 侧边栏 -->
    <div class="sidebar" v-if="showSidebar">
      <SideMenu />
    </div>

    <!-- 主要内容区域 -->
    <div class="main-area">
      <!-- 顶部栏 -->
      <TopBar v-if="showTopBar" />
      
      <!-- 路由视图 -->
      <div class="content-area">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </div>

    <!-- 修改密码弹窗 -->
    <ModifyPassword ref="modifyPasswordRef" />
  </div>
</template>

<script setup>
import { ref, provide, computed } from 'vue'
import { useRoute } from 'vue-router'
import SideMenu from '@/components/common/SideMenu.vue'
import TopBar from '@/components/common/TopBar.vue'
import ModifyPassword from '@/views/AccountManage/ModifyPassword.vue'

const route = useRoute()
const modifyPasswordRef = ref(null)

// 计算是否显示侧边栏和顶部栏
const showSidebar = computed(() => route.path !== '/login')
const showTopBar = computed(() => route.path !== '/login')

// 提供修改密码方法给子组件
provide('showModifyPassword', () => {
  modifyPasswordRef.value?.show()
})
</script>

<style>
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
  'Helvetica Neue', Arial, 'Noto Sans', sans-serif;
}

/* 应用容器样式 */
.app-container {
  height: 100vh;
  display: flex;
  background-color: #f0f2f5;
}

/* 侧边栏样式 */
.sidebar {
  width: 200px;
  height: 100%;
  background-color: #fff;
  box-shadow: 2px 0 8px 0 rgba(29,35,41,.05);
  transition: width 0.3s;
  flex-shrink: 0;
}

/* 主要内容区域样式 */
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 内容区域样式 */
.content-area {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background-color: #f0f2f5;
}

/* 路由过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 响应式布局 */
@media screen and (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    z-index: 1000;
    transform: translateX(-100%);
  }

  .sidebar.expanded {
    transform: translateX(0);
  }

  .main-area {
    margin-left: 0;
  }
}
</style>