<template>
  <div class="email-manage">
    <!-- 操作栏 -->
    <div class="operation-bar">
      <el-button type="primary" @click="handleEdit">
        {{ isEditing ? '保存' : '编辑' }}
      </el-button>
    </div>

    <!-- 邮箱配置表单 -->
    <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="120px"
        class="email-form"
    >
      <!-- 基本配置 -->
      <el-card
          class="form-card"
      >
        <template #header>
          <div class="card-header">
            <span>基本配置</span>
          </div>
        </template>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="SMTP服务器" prop="smtpServer">
              <el-input v-model="formData.smtpServer" placeholder="请输入SMTP服务器地址" :disabled="!isEditing"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="SMTP端口" prop="smtpPort">
              <el-input-number
                  v-model="formData.smtpPort"
                  :min="1"
                  :max="65535"
                  class="w-100"
                  :disabled="!isEditing"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="发件人邮箱" prop="senderEmail">
              <el-input v-model="formData.senderEmail" placeholder="请输入发件人邮箱" :disabled="!isEditing"/>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发件人名称" prop="senderName">
              <el-input v-model="formData.senderName" placeholder="请输入发件人名称" :disabled="!isEditing"/>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="邮箱密码" prop="password">
          <el-input
              v-model="formData.password"
              type="password"
              placeholder="请输入邮箱密码"
              show-password
              :disabled="!isEditing"
          />
        </el-form-item>
      </el-card>

      <!-- 邮件模板 -->
      <el-card
          class="form-card"
          :disabled="!isEditing"
      >
        <template #header>
          <div class="card-header">
            <span>邮件模板</span>
          </div>
        </template>

        <el-form-item label="邮件主题" prop="subject">
          <el-input v-model="formData.subject" placeholder="请输入邮件主题" :disabled="!isEditing"/>
        </el-form-item>

        <el-form-item label="邮件内容" prop="content">
          <el-input
              v-model="formData.content"
              type="textarea"
              :rows="6"
              placeholder="请输入邮件内容"
              :disabled="!isEditing"
          />
        </el-form-item>

        <el-form-item label="附件" prop="attachments">
          <el-upload
              v-model:file-list="fileList"
              action="#"
              :auto-upload="false"
              :disabled="!isEditing"
              :accept="acceptTypes"
              :before-upload="handleBeforeUpload"
              :on-exceed="handleExceed"
              :limit="5"
              list-type="picture-card"
              :on-preview="handlePictureCardPreview"
          >
            <el-icon>
              <Plus/>
            </el-icon>
          </el-upload>

          <!-- 图片预览对话框 -->
          <el-dialog v-model="dialogVisible" title="预览">
            <img w-full :src="dialogImageUrl" alt="Preview Image" style="max-width: 100%;"/>
          </el-dialog>

          <template #tip>
            <div class="el-upload__tip">
              支持 jpg、png、gif 等图片格式，单个文件不超过10MB
            </div>
          </template>
        </el-form-item>
      </el-card>
      <!-- 测试发送 -->
      <el-card>
        <template #header>
          <div class="card-header">
            <span>测试发送</span>
          </div>
        </template>
        <el-form-item label="测试邮箱" prop="testEmail">
          <el-input v-model="formData.testEmail" placeholder="请输入测试邮箱">
            <template #append>
              <el-button
                  @click="handleTestSend"
                  :loading="sending"
                  :disabled="isEditing||!isConfigComplete"
              >
                发送测试
              </el-button>
            </template>
          </el-input>
        </el-form-item>
      </el-card>
    </el-form>
  </div>
</template>

<script setup>
import {ref, computed, onMounted} from 'vue'
import {ElMessage} from 'element-plus'
import {Plus} from '@element-plus/icons-vue'
import request from "@/utils/request"

// 表单引用
const formRef = ref(null)

// 编辑状态
const isEditing = ref(false)

// 发送状态
const sending = ref(false)

// 文件列表
const fileList = ref([])

// 表单数据
const formData = ref({
  smtpServer: '',
  smtpPort: 465,
  senderEmail: '',
  senderName: '',
  password: '',
  subject: '',
  content: '',
  testEmail: ''
})

// 表单验证规则
const rules = {
  smtpServer: [
    {required: true, message: '请输入SMTP服务器地址', trigger: 'change'}
  ],
  smtpPort: [
    {required: true, message: '请输入SMTP端口', trigger: 'change'}
  ],
  senderEmail: [
    {required: true, message: '请输入发件人邮箱', trigger: 'change'},
    {type: 'email', message: '输入正确的邮箱格式', trigger: 'change'}
  ],
  senderName: [
    {required: true, message: '请输入发件人名称', trigger: 'change'}
  ],
  password: [
    {required: true, message: '请输入邮箱密码', trigger: 'change'}
  ],
  subject: [
    {required: true, message: '请输入邮件主题', trigger: 'change'}
  ],
  content: [
    {required: true, message: '请输入邮件内容', trigger: 'change'}
  ],
  testEmail: [
    {type: 'email', message: '请输入正确的邮箱格式', trigger: 'change'}
  ]
}

// 添加配置完整性检查
const isConfigComplete = computed(() => {
  const {smtpServer, smtpPort, senderEmail, senderName, password, subject, content} = formData.value
  return smtpServer &&
      smtpPort &&
      senderEmail &&
      senderName &&
      password &&
      subject &&
      content
})

// 从 localStorage 加载数据
const loadStoredConfig = () => {
  const storedConfig = localStorage.getItem('emailConfig')
  if (storedConfig) {
    try {
      const config = JSON.parse(storedConfig)
      formData.value = {
        ...formData.value,
        ...config
      }
    } catch (error) {
      console.error('加载存储的配置失败:', error)
    }
  }
}

// 保存配置到 localStorage
const saveConfigToStorage = (config) => {
  try {
    localStorage.setItem('emailConfig', JSON.stringify(config))
  } catch (error) {
    console.error('保存配置到存储失败:', error)
  }
}

// 修改编辑/保存处理
const handleEdit = async () => {
  if (isEditing.value) {
    formRef.value.validate(async (valid) => {
      if (valid) {
        sending.value = true
        try {
          const config = {
            host: formData.value.smtpServer,
            port: formData.value.smtpPort,
            username: formData.value.senderEmail,
            password: formData.value.password,
            fromName: formData.value.senderName
          }

          const response = await request({
            method: 'POST',
            url:'/email/config',
            data:config
          })
          if (response.data.code === 200) {
            // 保存成功后，将配置保存到 localStorage
            saveConfigToStorage(formData.value)
            ElMessage.success('邮箱配置保存成功')
            isEditing.value = false  // 移到这里，确保保存成功后才改变编辑状态
          } else {
            ElMessage.error(response.data.message || '配置保存失败')
          }
        } catch (error) {
          console.error('保存邮箱配置失败:', error)
          ElMessage.error('配置保存失败')
        } finally {
          sending.value = false
        }
      }
    })
  } else {
    isEditing.value = true  // 直接进入编辑状态
  }
}

// 在组件挂载时加载存储的配置
onMounted(() => {
  loadStoredConfig()
})

// 修改测试发送方法
const handleTestSend = async () => {
  if (!formData.value.testEmail) {
    ElMessage.error('请输入测试邮箱地址')
    return
  }

  sending.value = true
  try {
    const formDataObj = new FormData()
    
    // 正确添加表单数据
    formDataObj.append('to', formData.value.testEmail)
    formDataObj.append('subject', formData.value.subject)
    formDataObj.append('content', formData.value.content)

    // 添加附件
    if (fileList.value.length > 0) {
      fileList.value.forEach(file => {
        if (file.raw) {
          formDataObj.append('attachments', file.raw)
        }
      })
    }

    const response = await request({
      method: 'POST',
      url: '/email/send-with-attachments',
      data: formDataObj,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    if (response.data.code === 200) {
      ElMessage.success('测试邮件发送成功')
    } else {
      ElMessage.error(response.data.message || '发送失败')
    }
  } catch (error) {
    console.error('发送邮件失败:', error)
    ElMessage.error('发送失败：' + (error.response?.data?.message || error.message))
  } finally {
    sending.value = false
  }
}

// 定义接受的文件类型
const acceptTypes = '.jpg,.jpeg,.png,.gif,.bmp,.webp'

// 上传前验证
const handleBeforeUpload = (file) => {
  // 验证文件类型
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件！')
    return false
  }

  // 验证文件大小（10MB = 10 * 1024 * 1024 bytes）
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    ElMessage.error('图片大小不能超过 10MB！')
    return false
  }

  return true
}

// 超出文件数量限制时的回调
const handleExceed = (files, uploadFiles) => {
  ElMessage.warning(
      `最多只能上传 5 张图片，本次选择了 ${files.length} 张图片，共选择了 ${files.length + uploadFiles.length} 张图片`
  )
}

// 图片预览相关的响应式变量
const dialogImageUrl = ref('')
const dialogVisible = ref(false)

// 处理图片预览
const handlePictureCardPreview = (uploadFile) => {
  dialogImageUrl.value = uploadFile.url
  dialogVisible.value = true
}
</script>

<style scoped>
.email-manage {
  padding: 20px;
}

.operation-bar {
  margin-bottom: 20px;
}

.email-form {
  max-width: 1200px;
}

.form-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.w-100 {
  width: 100%;
}

:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-upload-list) {
  margin-top: 10px;
}

/* 响应式调整 */
@media screen and (max-width: 768px) {
  .el-form-item {
    margin-bottom: 18px;
  }

  .el-col {
    width: 100% !important;
  }
}

:deep(.el-upload--picture-card) {
  width: 100px;
  height: 100px;
  line-height: 100px;
}

:deep(.el-upload-list--picture-card .el-upload-list__item) {
  width: 100px;
  height: 100px;
}

:deep(.el-upload-list--picture-card) {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>