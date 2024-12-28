<template>
  <div class="project-list">
    <div class="page-header">
      <h2>项目基础信息管理</h2>
      <el-button type="primary" @click="handleAdd">新增项目</el-button>
    </div>

    <el-table
        :data="projectList"
        style="width: 100%"
        border
        v-loading="loading">
      <el-table-column prop="projectNo" label="项目号" width="120">
        <template #default="scope">
          {{ scope.row.projectNo || '' }}
        </template>
      </el-table-column>
      <el-table-column prop="companyName" label="企业名称" width="180">
        <template #default="scope">
          {{ scope.row.companyName || '' }}
        </template>
      </el-table-column>
      <el-table-column prop="groupName" label="所属集团" width="150">
        <template #default="scope">
          {{ scope.row.groupName || '' }}
        </template>
      </el-table-column>
      <el-table-column prop="system" label="所属体系" width="120">
        <template #default="scope">
          <el-tag v-if="scope.row.system">{{ scope.row.system }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="contactPerson" label="联络人" width="120">
        <template #default="scope">
          {{ scope.row.contactPerson || '' }}
        </template>
      </el-table-column>
      <el-table-column prop="contactEmail" label="联络人邮箱" width="180">
        <template #default="scope">
          {{ scope.row.contactEmail || '' }}
        </template>
      </el-table-column>
      <el-table-column prop="hourlyRate" label="工时单价" width="120">
        <template #default="scope">
          {{ scope.row.hourlyRate ? scope.row.hourlyRate.toFixed(2) : '' }}
        </template>
      </el-table-column>
      <el-table-column prop="contractHours" label="合同工时(天)" width="120">
        <template #default="scope">
          {{ scope.row.contractHours ? scope.row.contractHours.toFixed(1) : '' }}
        </template>
      </el-table-column>
      <el-table-column prop="promisedHours" label="合同承诺工时(天)" width="150">
        <template #default="scope">
          {{ scope.row.promisedHours ? scope.row.promisedHours.toFixed(1) : '' }}
        </template>
      </el-table-column>
      <el-table-column prop="consumedHours" label="已消耗工时(天)" width="120">
        <template #default="scope">
          {{ scope.row.startDate ? calculateActualConsumedHours(scope.row.startDate).toFixed(1) : '' }}
        </template>
      </el-table-column>
      <el-table-column label="剩余工时(天)" width="120">
        <template #default="scope">
          {{ calculateRemainingHours(scope.row) ? calculateRemainingHours(scope.row).toFixed(1) : '' }}
        </template>
      </el-table-column>
      <el-table-column label="剩余费用(元)" width="120">
        <template #default="scope">
          {{ calculateRemainingCost(scope.row) !== '0.00' ? calculateRemainingCost(scope.row) : '' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="scope">
          <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页组件 -->
    <div class="pagination-container">
      <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
      />
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
        v-model="dialogVisible"
        :title="dialogType === 'add' ? '新增项目' : '编辑项目'"
        width="60%">
      <el-form :model="projectForm" :rules="rules" ref="formRef" label-width="140px">
        <el-form-item label="项目号" prop="projectNo">
          <el-input v-model="projectForm.projectNo" maxlength="50" show-word-limit/>
        </el-form-item>
        <el-form-item label="企业名称" prop="companyName">
          <el-input v-model="projectForm.companyName"/>
        </el-form-item>
        <el-form-item label="所属集团" prop="groupName">
          <el-input v-model="projectForm.groupName"/>
        </el-form-item>
        <el-form-item label="所属体系" prop="system">
          <el-select v-model="projectForm.system" placeholder="请选择">
            <el-option label="JES" value="JES"/>
            <el-option label="SES" value="SES"/>
            <el-option label="3FES" value="3FES"/>
            <el-option label="YLES" value="YLES"/>
          </el-select>
        </el-form-item>
        <el-form-item label="联络人" prop="contactPerson">
          <el-input v-model="projectForm.contactPerson"/>
        </el-form-item>
        <el-form-item label="联络人邮箱" prop="contactEmail">
          <el-input v-model="projectForm.contactEmail"/>
        </el-form-item>
        <el-form-item label="工时单价" prop="hourlyRate">
          <el-input-number
              v-model="projectForm.hourlyRate"
              :precision="2"
              :step="0.01"
              :min="0"/>
        </el-form-item>
        <el-form-item label="合同工时(天)" prop="contractHours">
          <el-input-number
              v-model="projectForm.contractHours"
              :step="0.5"
              :min="0"/>
        </el-form-item>
        <el-form-item label="合同承诺用时(天)" prop="promisedHours">
          <el-input-number
              v-model="projectForm.promisedHours"
              :step="0.5"
              :min="0"/>
        </el-form-item>
        <el-form-item label="项目开始时间" prop="startDate">
          <el-date-picker
              v-model="projectForm.startDate"
              type="date"
              placeholder="选择开始日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="已消耗工时(天)">
          <el-input :value="calculateActualConsumedHours(projectForm.startDate).toFixed(1)" disabled/>
        </el-form-item>
        <el-form-item label="剩余工时(天)">
          <el-input :value="calculateRemainingHours(projectForm).toFixed(1)" disabled/>
        </el-form-item>
        <el-form-item label="剩余费用(元)">
          <el-input :value="calculateRemainingCost(projectForm)" disabled/>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import {ref, onMounted} from 'vue'
import {ElMessage, ElMessageBox} from 'element-plus'
import request from "@/utils/request";

// 数据定义
const projectList = ref([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const dialogVisible = ref(false)
const dialogType = ref('add')
const formRef = ref(null)

const projectForm = ref({
  projectNo: '',
  companyName: '',
  groupName: '',
  system: '',
  contactPerson: '',
  contactEmail: '',
  hourlyRate: 0,
  contractHours: 0,
  promisedHours: 0,
  consumedHours: 0,
  startDate: ''
})

// 修改计算实际消耗工时的方法
const calculateActualConsumedHours = (startDate) => {
  if (!startDate) return 0

  const start = new Date(startDate)
  const now = new Date()

  if (start > now) {
    return 0
  }

  let days = 0
  let current = new Date(start)

  current.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)

  while (current <= now) {
    if (current.getDay() !== 0 && current.getDay() !== 6) {
      days++
    }
    current.setDate(current.getDate() + 1)
  }

  return days
}

// 修改计算剩余工时的方法
const calculateRemainingHours = (row) => {
  if (!row || !row.startDate || typeof row.promisedHours !== 'number') {
    return 0
  }

  const actualConsumedHours = calculateActualConsumedHours(row.startDate)

  return Math.max(0, row.promisedHours - actualConsumedHours)
}

// 修改计算剩余费用的方法
const calculateRemainingCost = (row) => {
  if (!row || typeof row.hourlyRate !== 'number') {
    return '0.00'
  }

  const remainingHours = calculateRemainingHours(row)
  const cost = remainingHours * row.hourlyRate
  return Math.max(0, cost).toFixed(2)
}

// 获取项目列表
const getProjectList = async () => {
  loading.value = true
  try {
    const response = await request('/project/list', {
      params: {
        page: currentPage.value,
        pageSize: pageSize.value
      }
    })
    if (response.data.code === 200) {
      projectList.value = response.data.data.records
      total.value = response.data.data.total
    } else {
      ElMessage.error(response.data.message || '获取数据失败')
    }
  } catch (error) {
    console.error('获取项目列表失败:', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

// 自定义验证规则
const validateMultipleOfHalf = (rule, value, callback) => {
  if (value % 0.5 !== 0) {
    callback(new Error('请输入0.5的倍数'))
  } else {
    callback()
  }
}

const rules = {
  projectNo: [
    {required: true, message: '请输入项目编号', trigger: 'change'},
    {min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'change'}
  ],
  companyName: [
    {required: true, message: '请输入公司名称', trigger: 'change'}
  ],
  groupName: [
    {required: true, message: '请输入组名', trigger: 'change'}
  ],
  system: [
    {required: true, message: '请输入系统名称', trigger: 'change'}
  ],
  contactPerson: [
    {required: true, message: '请输入联络人姓名', trigger: 'change'}
  ],
  contactEmail: [
    {required: true, message: '请输入联络人邮箱', trigger: 'change'},
    {type: 'email', message: '请输入正确的邮箱地址', trigger: 'change'}
  ],
  hourlyRate: [
    {required: true, message: '请输入工时单价', trigger: 'change'},
    {type: 'number', min: 0, message: '工时单价必须大于等于0', trigger: 'change'}
  ],
  contractHours: [
    {required: true, message: '请输入合同工时', trigger: 'change'},
    {type: 'number', min: 0, message: '合同工时必须大于等于0', trigger: 'change'},
    {validator: validateMultipleOfHalf, trigger: 'change'}
  ],
  promisedHours: [
    {required: true, message: '请输入承诺工时', trigger: 'change'},
    {type: 'number', min: 0, message: '承诺工时必须大于等于0', trigger: 'change'},
    {validator: validateMultipleOfHalf, trigger: 'change'}
  ],
  startDate : [
      {required: true,message: '请输入开始时间', trigger: 'change'}
  ]
}

// 处理页码变化
const handleCurrentChange = (val) => {
  currentPage.value = val
  getProjectList()
}

// 处理每页条数变化
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
  getProjectList()
}

// 新增项目
const handleAdd = () => {
  dialogType.value = 'add'
  projectForm.value = {
    projectNo: '',
    companyName: '',
    groupName: '',
    system: '',
    contactPerson: '',
    contactEmail: '',
    hourlyRate: 0,
    contractHours: 0,
    promisedHours: 0,
    consumedHours: 0,
    startDate: ''
  }
  dialogVisible.value = true
}

// 编辑项目
const handleEdit = (row) => {
  dialogType.value = 'edit'
  projectForm.value = { ...row }
  dialogVisible.value = true
}

// 删除项目
const handleDelete = (row) => {
  ElMessageBox.confirm(
      '确定要删除该项目吗？',
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
  ).then(async () => {
    try {
      const response = await request(`/project/delete/${row.projectNo}`)
      if (response.data.code === 200) {
        ElMessage.success('删除成功')
        await getProjectList()
      } else {
        ElMessage.error(response.data.message || '删除失败')
      }
    } catch (error) {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }).catch(() => {
  })
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    const url = dialogType.value === 'add' ? '/project/add' : '/project/update'
    const response = await request({
      url,
      method: dialogType.value === 'add' ? 'post' : 'put',
      data: projectForm.value
    })
    if (response.data.code === 200) {
      ElMessage.success(response.data.message)
      dialogVisible.value = false
      await getProjectList()
    } else {
      ElMessage.error(response.data.message || '操作失败')
    }
  } catch (error) {
    console.log('表单提交失败:', error)
    ElMessage.error('操作失败')
  }
}

// 页面加载时获取数据
onMounted(() => {
  getProjectList()
})
</script>

<style scoped>
.project-list {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
