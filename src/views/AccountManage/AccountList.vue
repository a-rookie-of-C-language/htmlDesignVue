<template>
  <div class="account-list">
    <div class="operation-bar">
      <div class="left">
        <el-button type="primary" @click="handleAdd" >新增</el-button>
        <el-button
            type="danger"
            :disabled="!accountStore.selectedIds.length"
            @click="handleBatchDelete"
        >
          ({{accountStore.selectedIds.length}})删除选中
        </el-button>
      </div>

      <div class="search-box">
        <div class="search-group">
          <el-input
              v-model="accountStore.searchForm.username"
              placeholder="请输入用户名"
              clearable
          />
          <el-input
              v-model="accountStore.searchForm.telephone"
              placeholder="请输入电话"
              clearable
          />
          <el-input
              v-model="accountStore.searchForm.email"
              placeholder="请输入邮箱"
              clearable
          />
        </div>
        <div class="search-buttons">
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </div>
      </div>
    </div>

    <el-table
        :data="tableData"
        @selection-change="handleSelectionChange"
        v-loading="loading"
    >
      <el-empty
          v-if="!tableData.length"
          description="暂无数据"
      />
      <el-table-column type="selection" width="55" />
      <el-table-column prop="username" label="用户名" />
      <el-table-column prop="role" label="角色" />
      <el-table-column prop="telephone" label="电话" />
      <el-table-column prop="email" label="邮箱" />
      <el-table-column prop="remark" label="备注" />
      <el-table-column label="操作" width="250">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleView(row)">查看</el-button>
          <el-button 
            link 
            type="primary" 
            @click="handleEdit(row)"
            :disabled="!canEditUser(row)"
          >编辑</el-button>
          <el-button 
            link 
            type="danger" 
            @click="handleDelete(row)"
            :disabled="!canDeleteUser(row)"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
        v-if="total > 0"
        v-model:current-page="accountStore.currentPage"
        v-model:page-size="accountStore.pageSize"
        :total="accountStore.total"
        :loading="accountStore.loading"
        layout="total, prev, pager, next, sizes"
    />

    <!-- 新增/编辑弹窗 -->
    <el-dialog
        v-model="dialogVisible"
        :title="dialogType === 'add' ? '新增用户' : dialogType === 'edit' ? '编辑用户' : '查看用户'"
        width="500px"
        @close="handleDialogClose"
    >
      <el-form
          ref="formRef"
          :model="formData"
          :rules="rules"
          label-width="100px"
          :disabled="dialogType === 'view'"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="formData.username" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="formData.role" placeholder="请选择角色" :disabled="isEdit">
            <el-option label="管理员" value="管理员" :disabled="!userStore.isSuperAdmin" />
            <el-option label="老师" value="老师" />
          </el-select>
        </el-form-item>
        <el-form-item label="电话" prop="telephone">
          <el-input v-model="formData.telephone" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="formData.email" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
              v-model="formData.remark"
              type="textarea"
              rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button
            v-if="dialogType !== 'view'"
            type="primary"
            @click="handleSubmit"
        >
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAccountStore } from '@/store/modules/account'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/store/modules/user'

const accountStore = useAccountStore()
const userStore = useUserStore()
const route = useRoute()
const loading = ref(false)
const isEdit = ref(true)

// 表格数据
const tableData = computed(() => accountStore.paginatedAccounts)
const total = computed(() => accountStore.total)

// 表单相关
const dialogVisible = ref(false)
const dialogType = ref('add') // add/edit/view
const formRef = ref()
const formData = ref({
  username: '',
  role: '',
  telephone: '',
  email: '',
  remark: ''
})

// 表单验证规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'change' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'change' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ],
  telephone: [
    { required: true, message: '请输入电话', trigger: 'change' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'change' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'change'},
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'change' }
  ]
}

// 修改判断是否可以编辑用户的方法
const canEditUser = (row) => {

  if (userStore.isSuperAdmin) {
    // 超级管理员可以编辑除自己外的所有人
    return row.username !== userStore.userInfo.split(" ")[0]
  } else if (row.username === userStore.userInfo.split(" ")[0]) {
    // 所有用户都可以编辑自己的信息
    return true
  } else if (userStore.userInfo.split(" ")[1] === '管理员') {
    // 管理员可以编辑除了其他管理员和超级管理员外的所有人
    return row.role !== '管理员'
  } else {
    // 普通用户只能编辑自己
    return false
  }
}

// 修改判断是否可以删除用户的方法
const canDeleteUser = (row) => {
  if (userStore.isSuperAdmin) {
    // 超级管理员可以删除除自己外的所有人
    return row.username !== userStore.userInfo.split(" ")[0]
  } else if (userStore.userInfo.split(" ")[1] === '管理员') {
    // 管理员可以删除除了管理员和超级管理员外的所有人
    return row.role !== '管理员' && !userStore.isSuperAdmin
  } else {
    // 普通用户不能删除任何人
    return false
  }
}

// 初始化数据的方法
const initData = async () => {
  loading.value = true
  try {
    // 重置store状态
    accountStore.currentPage = 1
    accountStore.serverPage = 1
    accountStore.accounts = []
    await accountStore.fetchAccounts()
  } catch (error) {
    console.error('Init data error:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 添加初始化用户信息的方法
const initUserInfo = async () => {
    console.log('Initializing user info...')
    try {
        await userStore.fetchUserInfo()
        console.log('User info loaded:', {
            userInfo: userStore.userInfo,
            isSuperAdmin: userStore.isSuperAdmin
        })
    } catch (error) {
        console.error('Failed to load user info:', error)
        ElMessage.error('获取用户信息失败')
    }
}

// 监听路由变化
watch(
  () => route.path,
  () => {
    if (route.path.includes('account')) {
      initData()
    }
  }
)

// 修改组件挂载时的初始化
onMounted(async () => {
    console.log('Component mounted')
    try {
        loading.value = true
        // 确保用户信息已加载
        await initUserInfo()
        // 再获取账户列表
        await initData()
    } catch (error) {
        console.error('初始化失败:', error)
        ElMessage.error('数据加载失败')
    } finally {
        loading.value = false
    }
})

// 方法
const handleAdd = () => {
  dialogType.value = 'add'
  isEdit.value = false
  formData.value = {
    username: '',
    role: '',
    telephone: '',
    email: '',
    remark: ''
  }
  dialogVisible.value = true

}

const handleEdit = (row) => {
  dialogType.value = 'edit'
  formData.value = { ...row }
  dialogVisible.value = true
}

const handleView = (row) => {
  dialogType.value = 'view'
  formData.value = { ...row }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    loading.value = true

    let success;
    if (dialogType.value === 'add') {
      success = await accountStore.addAccount({
        username: formData.value.username,
        role: formData.value.role,
        telephone: formData.value.telephone,
        email: formData.value.email,
        remark: formData.value.remark
      });
    } else {
      success = await accountStore.updateAccount({
        id: formData.value.id,
        username: formData.value.username,
        role: formData.value.role,
        telephone: formData.value.telephone,
        email: formData.value.email,
        remark: formData.value.remark
      });
    }
    
    if (success) {
      dialogVisible.value = false;
      resetForm();
    }
  } catch (error) {
    console.error('Form submission error:', error)
    ElMessage.error(dialogType.value === 'add' ? '添加失败' : '修改失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = async () => {
  loading.value = true;
  try {
    // 使用 search = true 参数调用后端搜索
    await accountStore.fetchAccounts(false, true);
  } finally {
    loading.value = false;
  }
};


const resetSearch = () => {
  accountStore.resetSearchForm()
  handleSearch()
}

// 修改表格选择变化的处理方法
const handleSelectionChange = (selection) => {
  // 根据权限过滤可选择的用户
  const filteredSelection = selection.filter(item => {
    if (userStore.isSuperAdmin) {
      // 超级管理员不能选择自己
      return item.username !== userStore.userInfo?.username
    } else if (userStore.userInfo?.role === '管理员') {
      // 管理员不能选择其他管理员和超级管理员
      return item.role !== '管理员' && !userStore.isSuperAdmin
    } else {
      // 普通用户不能选择任何人
      return false
    }
  })
  accountStore.setSelectedIds(filteredSelection.map(item => item.id))
}

const handleBatchDelete = () => {
  if (!accountStore.selectedIds.length) {
    ElMessage.warning('请选择要删除的用户')
    return
  }

  // 检查选中的用户中是否包含不能删除的用户
  const hasUnDeletable = tableData.value.some(item => 
    accountStore.selectedIds.includes(item.id) && !canDeleteUser(item)
  )

  if (hasUnDeletable) {
    ElMessage.warning('选中的用户中包含无法删除的用户')
    return
  }

  ElMessageBox.confirm(
    `确认删除选中的 ${accountStore.selectedCount} 个用户?`, 
    '提示', 
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    loading.value = true
    try {
      await accountStore.deleteAccounts(null)
    } finally {
      loading.value = false
    }
  }).catch(() => {
    // 用户取消删除操作
  })
}

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
    formData.value = {
      username: '',
      role: '',
      telephone: '',
      email: '',
      remark: ''
    }
  }
}

// 监听对话框关闭
const handleDialogClose = () => {
  resetForm()
}

const handleDelete = (row) => {
  if (!canDeleteUser(row)) {
    ElMessage.warning(row.username === userStore.userInfo?.username ? 
      '不能删除自己的账号' : 
      '没有权限删除该用户')
    return
  }
  
  ElMessageBox.confirm(
    `确认删除用户 "${row.username}"?`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    loading.value = true
    try {
      await accountStore.deleteAccounts([row.id])
    } catch (error) {
      console.error('Delete error:', error)
      ElMessage.error('删除失败')
    } finally {
      loading.value = false
    }
  }).catch(() => {
    // 用户取消删除操作
  })
}
</script>

<style scoped>
.account-list {
  padding: 20px;
  height: 100%;
}

.operation-bar {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-box {
  display: flex;
  gap: 10px;
  align-items: center;
}

.search-box .el-input {
  width: 200px;
}

.search-group {
  display: flex;
  gap: 10px;
}

.search-buttons {
  display: flex;
  gap: 10px;
}

.table-wrapper {
  position: relative;
  height: calc(100vh - 200px);
  overflow: auto;
}

/* 分页器样式 */
.el-pagination {
  margin-top: 20px;
  justify-content: flex-end;
}

/* 可以添加一些按钮间距的样式 */
.el-button + .el-button {
  margin-left: 8px;
}
</style>