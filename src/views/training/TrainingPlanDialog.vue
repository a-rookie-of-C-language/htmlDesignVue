<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑培训计划' : '新增培训计划'"
    width="500px"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
    >
      <!-- 集团名称 -->
      <el-form-item label="集团名称" prop="groupName">
        <el-input v-model="formData.groupName" disabled />
      </el-form-item>

      <!-- 公司名称 -->
      <el-form-item label="公司名称" prop="companyName">
        <el-input v-model="formData.companyName" disabled />
      </el-form-item>

      <!-- 项目编号 -->
      <el-form-item label="项目编号" prop="projectNo">
        <el-select
          v-model="formData.projectNo"
          placeholder="请选择项目编号"
          clearable
          filterable
          :loading="projectNoLoading"
          @change="handleProjectNoChange"
          :disabled="isEdit"
        >
          <el-option
            v-for="item in projectNoOptions"
            :key="item.projectNo"
            :label="item.projectNo"
            :value="item.projectNo"
          />
        </el-select>
      </el-form-item>

      <!-- 培训类型 -->
      <el-form-item label="培训类型" prop="system">
        <el-select v-model="formData.system" disabled>
          <el-option label="JES" value="JES" />
          <el-option label="SES" value="SES" />
          <el-option label="3FES" value="3FES" />
          <el-option label="YLES" value="YLES" />
        </el-select>
      </el-form-item>

      <!-- 培训内容 -->
      <el-form-item label="培训内容" prop="trainingContext">
        <el-input
          v-model="formData.trainingContext"
          type="textarea"
          placeholder="请输入培训内容"
        />
      </el-form-item>

      <!-- 培训时段 -->
      <el-form-item label="培训时段" prop="trainingTime">
        <el-select v-model="formData.trainingTime" placeholder="请选择">
          <el-option label="上午" value="上午" />
          <el-option label="下午" value="下午" />
          <el-option label="全天" value="全天" />
        </el-select>
      </el-form-item>

      <!-- 培训日期 -->
      <el-form-item label="培训日期" prop="trainingDate">
        <el-date-picker
          v-model="formData.trainingDate"
          type="date"
          placeholder="选择日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          disabled
        />
      </el-form-item>

      <!-- 讲师 -->
      <el-form-item label="讲师" prop="trainer">
        <el-select
          v-model="formData.trainer"
          placeholder="请选择讲师"
          clearable
          filterable
          :loading="trainerLoading"
        >
          <el-option
            v-for="name in trainerOptions"
            :key="name"
            :label="name"
            :value="name"
          />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: Boolean,
  plan: Object,
  groupName: String,
  companyName: String,
  isEdit: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'submit'])

const dialogVisible = ref(false)
const formRef = ref(null)
const projectNoLoading = ref(false)
const projectNoOptions = ref([])
const trainerLoading = ref(false)
const trainerOptions = ref([])

// 表单数据
const formData = ref({
  id: '',
  groupName: '',
  companyName: '',
  projectNo: '',
  system: '',
  trainingContext: '',
  trainingTime: '',
  trainingDate: '',
  trainer: ''
})

// 表单验证规则
const rules = {
  projectNo: [{ required: true, message: '请选择项目编号', trigger: 'change' }],
  trainingType: [{ required: true, message: '请输入培训类型', trigger: 'blur' }],
  trainingContext: [{ required: true, message: '请输入培训内容', trigger: 'blur' }],
  trainingTime: [{ required: true, message: '请选择培训时段', trigger: 'change' }],
  trainingDate: [{ required: true, message: '请选择培训日期', trigger: 'change' }],
  trainer: [{ required: true, message: '请输入讲师姓名', trigger: 'blur' }]
}

// 监听对话框显示状态
watch(
  () => props.modelValue,
  async (newVal) => {
    dialogVisible.value = newVal
    if (newVal) {
      if (props.isEdit && props.plan) {
        Object.assign(formData.value, props.plan)
      } else {
        formData.value = {
          groupName: props.plan?.groupName || '',
          companyName: props.plan?.companyName || '',
          projectNo: '',
          system: '',
          trainingContext: '',
          trainingTime: '',
          trainingDate: props.plan?.trainingDate || '',
          trainer: ''
        }
      }
      // 加载项目编号和讲师列表
      await Promise.all([
        loadProjectNos(),
        loadTrainers()
      ])
    }
  }
)

// 监听 dialogVisible 变化
watch(dialogVisible, (val) => {
  emit('update:modelValue', val)
})

// 加载项目编号列表
const loadProjectNos = async () => {
  projectNoLoading.value = true
  try {
    const response = await request({
      url: '/trainingPlan/projectNo',
      method: 'GET'
    })
    if (response.data.code === 200) {
      // 如果是从单元格添加（有预设的集团和公司），则过滤
      if (formData.value.groupName && formData.value.companyName) {
        projectNoOptions.value = response.data.data.filter(item => 
          item.groupName === formData.value.groupName && 
          item.companyName === formData.value.companyName
        )
      } else {
        // 如果是从表格外添加，显示所有选项
        projectNoOptions.value = response.data.data
      }
    } else {
      ElMessage.error(response.data.msg || '获取项目编号失败')
    }
  } catch (error) {
    console.error('获取项目编号失败:', error)
    ElMessage.error('获取项��编号失败')
  } finally {
    projectNoLoading.value = false
  }
}

// 加载讲师列表
const loadTrainers = async () => {
  trainerLoading.value = true
  try {
    const response = await request({
      url: '/working-hours/getName',
      method: 'GET'
    })
    if (response.data.code === 200) {
      trainerOptions.value = response.data.data
    } else {
      ElMessage.error(response.data.msg || '获取讲师列表失败')
    }
  } catch (error) {
    console.error('获取讲师列表失败:', error)
    ElMessage.error('获取讲师列表失败')
  } finally {
    trainerLoading.value = false
  }
}

// 处理提交
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    const url = props.isEdit ? '/trainingPlan/update' : '/trainingPlan/add'
    const response = await request({
      url,
      method: props.isEdit ? 'PUT' : 'POST',
      data: formData.value
    })
    
    if (response.data.code === 200) {
      ElMessage.success(props.isEdit ? '更新成功' : '添加成功')
      dialogVisible.value = false
      emit('submit')
    } else {
      ElMessage.error(response.data.msg || (props.isEdit ? '更新失败' : '添加失败'))
    }
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('提交失败')
  }
}

// 处理对话框关闭
const handleClose = () => {
  // 重置表单数据
  formRef.value?.resetFields()
  // 清空表单数据
  formData.value = {
    id: '',
    groupName: '',
    companyName: '',
    projectNo: '',
    system: '',
    trainingContext: '',
    trainingTime: '',
    trainingDate: '',
    trainer: ''
  }
  emit('update:modelValue', false)
}

// 暴露重置方法
defineExpose({
  resetForm: () => {
    formRef.value?.resetFields()
    // 清空表单数据
    formData.value = {
      id: '',
      groupName: '',
      companyName: '',
      projectNo: '',
      system: '',
      trainingContext: '',
      trainingTime: '',
      trainingDate: '',
      trainer: ''
    }
  }
})

// 处理项目编号变化
const handleProjectNoChange = (value) => {
  if (value) {
    const selectedProject = projectNoOptions.value.find(item => item.projectNo === value)
    if (selectedProject) {
      // 当选择项目编号时，自动设置相关字段
      formData.value.system = selectedProject.system
      formData.value.groupName = selectedProject.groupName
      formData.value.companyName = selectedProject.companyName
    }
  } else {
    // 当清空项目编号时，如果是从表格外添加，则清空相关字段
    if (!props.plan) {
      formData.value.system = ''
      formData.value.groupName = ''
      formData.value.companyName = ''
    }
  }
}
</script>

<style scoped>
.el-select {
  width: 100%;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style> 