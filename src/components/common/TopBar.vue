<template>
  <div class="top-bar">
    <!-- Logo区域 -->
    <div class="logo-area">
      <el-icon class="logo-icon" :size="24">
        <Grid />
      </el-icon>
      <span class="logo-text">HES管理系统后台</span>
    </div>

    <!-- 用户区域 -->
    <div class="user-area">
      <el-dropdown trigger="click" @command="handleCommand">
        <div class="user-info">
          <span class="username">{{ username }}</span>
          <el-icon class="el-icon--right">
            <ArrowDown />
          </el-icon>
        </div>

        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="modifyPassword">
              修改密码
            </el-dropdown-item>
            <el-dropdown-item command="logout" divided>
              退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- 修改密码对话框 -->
    <el-dialog
      v-model="passwordDialogVisible"
      title="修改密码"
      width="400px"
    >
      <el-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-width="100px"
      >
        <el-form-item label="原密码" prop="oldPassword">
          <el-input
            v-model="passwordForm.oldPassword"
            type="password"
            show-password
          />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="passwordDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleChangePassword">
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Grid, ArrowDown } from '@element-plus/icons-vue'
import request from '@/utils/request'

const router = useRouter()
const username = ref('')
const passwordDialogVisible = ref(false)
const passwordFormRef = ref(null)

// 密码表单数据
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 密码表单验证规则
const passwordRules = {
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.value.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    const response = await request({
      method: 'GET',
      url: '/user/info'
    })
    if (response.data.code === 200) {
      username.value = response.data.data.split(" ")[0]
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
}

// 修改密码
const handleChangePassword = async () => {
  if (!passwordFormRef.value) return
  
  await passwordFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const response = await request({
          method: 'POST',
          url: '/user/password',
          data: {
            oldPassword: passwordForm.value.oldPassword,
            newPassword: passwordForm.value.newPassword
          }
        })
        
        if (response.data.code === 200) {
          ElMessage.success('密码修改成功，请重新登录')
          passwordDialogVisible.value = false
          // 清除登录信息并跳转到登录页
          localStorage.removeItem('token')
          await router.push('/login')
        } else {
          ElMessage.error(response.data.msg || '修改失败')
        }
      } catch (error) {
        console.error('修改密码失败:', error)
        ElMessage.error('修改密码失败')
      }
    }
  })
}

// 下拉菜单命令处理
const handleCommand = (command) => {
  switch(command) {
    case 'modifyPassword':
      passwordDialogVisible.value = true
      break
    case 'logout':
      handleLogout()
      break
  }
}

// 退出登录
const handleLogout = () => {
  ElMessageBox.confirm(
    '确认退出登录?',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    localStorage.removeItem('token')
    router.push('/login')
  })
}

// 组件挂载时获取用户信息
onMounted(() => {
  fetchUserInfo()
})
</script>

<style scoped>
.top-bar {
  height: 48px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #fff;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  transform: rotate(90deg);
  color: #333;
}

.logo-text {
  font-size: 14px;
  color: #333;
}

.user-area {
  height: 100%;
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0 8px;
  height: 100%;
  transition: background-color 0.3s;
}

.user-info:hover {
  background-color: #f5f7fa;
}

.username {
  font-size: 14px;
  color: #333;
  margin-right: 4px;
}

/* 下拉菜单样式调整 */
:deep(.el-dropdown-menu__item) {
  font-size: 14px;
  padding: 8px 20px;
}

:deep(.el-dropdown-menu__item--divided) {
  margin-top: 6px;
  border-top-color: #ebeef5;
}

:deep(.el-dropdown-menu__item--divided::before) {
  height: 1px;
  margin: 0 -20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>