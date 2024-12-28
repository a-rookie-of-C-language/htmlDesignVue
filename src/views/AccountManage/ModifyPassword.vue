<template>
  <el-dialog
      v-model="visible"
      title="修改密码"
      width="500px"
  >
    <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="120px"
    >
      <el-form-item
          label="新密码"
          prop="newPassword"
      >
        <el-input
            v-model="formData.newPassword"
            type="password"
            placeholder="请输入新密码"
        />
      </el-form-item>
      <el-form-item
          label="确认新密码"
          prop="confirmPassword"
      >
        <el-input
            v-model="formData.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref ,defineExpose} from 'vue'
import { ElMessage } from 'element-plus'

const visible = ref(false)
const formRef = ref()
const formData = ref({
  newPassword: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== formData.value.newPassword) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  newPassword: [
    { required: true, message: '请输入新密码' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码' },
    { validator: validateConfirmPassword, trigger: 'change' }
  ]
}

const handleSubmit = async () => {
  await formRef.value.validate()
  // 这里模拟修改密码操作
  ElMessage.success('密码修改成功')
  visible.value = false
  formData.value = {
    newPassword: '',
    confirmPassword: ''
  }
}

defineExpose({
  show: () => visible.value = true
})
</script>