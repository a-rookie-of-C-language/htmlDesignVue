<template>
  <el-menu
      :default-active="activeMenu"
      class="side-menu"
      :collapse="isCollapse"
      @select="handleSelect"
  >
    <!-- 首页 -->
    <el-menu-item index="/home">
      <el-icon><HomeFilled /></el-icon>
      <template #title>首页</template>
    </el-menu-item>
    <!-- 账户/角色管理 -->
    <el-menu-item index="/account">
      <el-icon><User /></el-icon>
      <template #title>账户/角色管理</template>
    </el-menu-item>

    <!-- 基础信息管理 -->
    <el-sub-menu index="1">
      <template #title>
        <el-icon><Document /></el-icon>
        <span>基础信息管理</span>
      </template>
      <el-menu-item index="/email">
        邮箱管理
      </el-menu-item>
      <el-menu-item index="/list">
        项目基础信息管理
      </el-menu-item>
      <!-- 可以添加更多子菜单项 -->
    </el-sub-menu>

    <!-- 项目管理 -->
    <el-sub-menu index="2">
      <template #title>
        <el-icon><Folder /></el-icon>
        <span>项目管理</span>
      </template>
      <el-menu-item index="/plan">
        培训计划管理
      </el-menu-item>
    </el-sub-menu>

    <!-- 数据看板 -->
    <el-sub-menu index="3">
      <template #title>
        <el-icon><DataLine /></el-icon>
        <span>数据看板</span>
      </template>
      <el-menu-item index="/report">
        项目统计报表
      </el-menu-item>
      <el-menu-item index="/trainerWorkingHours">
        培训老师统计报表
      </el-menu-item>
    </el-sub-menu>
  </el-menu>
</template>

<script setup>
import {ref, computed, onUnmounted, onMounted} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  HomeFilled,
  User,
  Document,
  Folder,
  DataLine
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

// 是否折叠菜单
const isCollapse = ref(false)

// 当前激活的菜单
const activeMenu = computed(() => {
  // 根据当前路由路径判断激活菜单
  return route.path
})

// 菜单选择处理
const handleSelect = (index) => {
  router.push(index)
}

// 监听窗口大小变化,自动折叠/展开菜单
const handleResize = () => {
  isCollapse.value = window.innerWidth < 1000
}

// 组件挂载时添加窗口大小监听
onMounted(() => {
  handleResize()
  window.addEventListener('resize', handleResize)
})

// 组件卸载时移除监听
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.side-menu {
  height: 100%;
  border-right: none;
}

.side-menu:not(.el-menu--collapse) {
  width: 200px;
}

/* 菜单项样式 */
:deep(.el-menu-item) {
  height: 50px;
  line-height: 50px;
  padding: 0 20px !important;
}

:deep(.el-sub-menu__title) {
  height: 50px;
  line-height: 50px;
  padding: 0 20px !important;
}

/* 图标样式 */
:deep(.el-icon) {
  width: 24px;
  text-align: center;
  font-size: 18px;
  margin-right: 5px;
}

/* 选中状态样式 */
:deep(.el-menu-item.is-active) {
  background-color: #ecf5ff;
  color: #409eff;
}

/* 悬停状态样式 */
:deep(.el-menu-item:hover),
:deep(.el-sub-menu__title:hover) {
  background-color: #f5f7fa;
}

/* 折叠动画 */
.el-menu-vertical-demo:not(.el-menu--collapse) {
  width: 200px;
  min-height: 400px;
}

/* 子菜单样式 */
:deep(.el-menu--inline) {
  background-color: #f5f7fa;
}

:deep(.el-menu--inline .el-menu-item) {
  padding-left: 48px !important;
}
</style>