<template>
  <div class="training-plan-container">
    <!-- 头部操作区 -->
    <div class="header-wrapper">
      <div class="left-controls">
        <el-date-picker
          v-model="dateRange"
          type="date"
          placeholder="选择日期"
          @change="handleDateChange"
        />
        <el-checkbox
          v-model="includeWeekend"
          @change="handleWeekendChange"
        >
          包含周末
        </el-checkbox>
        <el-select
          v-model="searchProjectNo"
          filterable
          remote
          placeholder="请选择项目编号"
          :remote-method="handleProjectSearch"
          :loading="projectNoLoading"
          @change="handleProjectChange"
          clearable
        >
          <el-option
            v-for="item in allProjectOptions"
            :key="item.projectNo"
            :label="item.label"
            :value="item.projectNo"
          />
        </el-select>
      </div>
      <div class="right-controls">
        <el-button 
          v-if="isAddPlanEnabled"
          type="primary" 
          @click="handleButtonAdd"
        >
          新增计划
        </el-button>
        <el-button type="success" @click="handleExport">导出Excel</el-button>
      </div>
    </div>

    <!-- 表格部分 -->
    <div class="table-wrapper">
      <el-table
        v-loading="loading"
        :data="paginatedTableData"
        border
        style="width: 100%"
        :span-method="spanMethod"
      >
        <!-- 固定列使用相对宽度 -->
        <el-table-column
            prop="groupName"
            label="集团"
            :width="tableWidth * 0.08"
        />

        <!-- 公司列 -->
        <el-table-column
            prop="companyName"
            label="公司"
            :width="tableWidth * 0.12"
        />

        <!-- 只渲染需要显示的日期列 -->
        <el-table-column
            v-for="day in visibleDayColumns"
            :key="day.date"
            :label="day.label"
            :width="getColumnWidth"
        >
          <template #default="scope">
            <div v-if="getDayPlans(scope.row.companyName, day.date).length > 0">
              <div
                v-for="plan in getDayPlans(scope.row.companyName, day.date)"
                :key="plan.id"
                class="plan-item"
              >
                <div class="plan-system">{{ plan.system }}</div>
                <!-- 操作按钮容器 -->
                <div class="action-buttons">
                  <el-button 
                    v-if="isAddPlanEnabled"
                    type="primary" 
                    link 
                    @click="handleEdit(plan)"
                  >
                    编辑
                  </el-button>
                  <el-button 
                    v-if="isAddPlanEnabled"
                    type="danger" 
                    link 
                    @click="handleDelete(plan)"
                  >
                    删除
                  </el-button>
                </div>
                <div class="plan-content">
                  <div class="plan-title">{{ plan.trainingContext.substring(0,6) }}</div>
                  <div class="plan-info">
                    <div class="plan-trainer-time">
                      <span>{{ plan.trainer }}</span>
                      <span>{{ plan.trainingTime }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty-plan">
              <div class="empty-cell">
                <span>暂无计划</span>
                <el-button
                  v-if="isAddPlanEnabled"
                  link
                  type="primary"
                  class="add-button"
                  size="small"
                  @click="handleCellAdd(scope.row.groupName, scope.row.companyName, day.date)"
                >
                  添加
                </el-button>
              </div>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 添加分页组件 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[5, 10]"
          :total="totalItems"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
        <TrainingPlanDialog
          v-model="dialogVisible"
          :group-name="currentGroup"
          :company-name="currentCompany"
          :plan="currentPlan"
          :is-edit="isEdit"
          @submit="handleDialogSubmit"
          ref="dialogRef"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted} from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import TrainingPlanDialog from './TrainingPlanDialog.vue'

// 基础响应式变量
const dateRange = ref(new Date())  // 确保有默认值
const includeWeekend = ref(false)
const planData = ref([])
const currentPage = ref(1)
const pageSize = ref(5)  // 默认显示5条
const dialogVisible = ref(false)
const currentGroup = ref('')
const currentCompany = ref('')
const currentPlan = ref(null)
const isEdit = ref(false)
const dialogRef = ref(null)


const getStartOfWeek = (date) => {
  const day = date.getDay() || 7; // 获取当前星期几，0是周日，1是周一
  const startOfWeek = new Date(date); // 创建一个新的日期对象
  startOfWeek.setDate(date.getDate() - day + 1); // 设置为周一
  return startOfWeek; // 返回周一的日期
}

const isAddPlanEnabled = computed(() => {
  const selectedDate = new Date(dateRange.value)
  const startOfWeek = getStartOfWeek(new Date()) // 获取当前周的周一
  return selectedDate >= startOfWeek
})

// 搜索相关变量
const searchProjectNo = ref('')  // 项目编号搜索
const projectNoLoading = ref(false)  // 项目编号加载状态
const allProjectOptions = ref([])  // 所有项目选项

// 总条目数
const totalItems = computed(() => tableData.value.length)

// 添加表格宽度响应式变量
const tableWidth = ref(0)

// 计算日期列宽度的方法
const getColumnWidth = computed(() => {
  if (!tableWidth.value) return 0
  const fixedColumnsWidth = tableWidth.value * 0.2 // 集团和公司列占20%
  const remainingWidth = tableWidth.value - fixedColumnsWidth
  const columnsCount = visibleDayColumns.value.length // 使用可见列数量
  return remainingWidth / columnsCount
})


// 添加加载状态
const loading = ref(false)

// 初始化数据
onMounted(async () => {
  try {
    loading.value = true
    initializeDate() // 初始化日期
    await fetchProjectOptions() // 获取项目选项
    await fetchData() // 获取表格数据
  } catch (error) {
    console.error('初始化失败:', error)
    ElMessage.error('数据加载失败')
  } finally {
    loading.value = false
  }
})

// 修改表格数据计算
const tableData = computed(() => {
  if (!planData.value || planData.value.length === 0) {
    return []
  }

  // 按集团分组
  const groupedData = new Map()
  
  planData.value.forEach(plan => {
    if (!groupedData.has(plan.groupName)) {
      groupedData.set(plan.groupName, new Set())
    }
    groupedData.get(plan.groupName).add(plan.companyName)
  })

  // 转换为表格数据格式
  const result = []
  groupedData.forEach((companies, groupName) => {
    companies.forEach(companyName => {
      result.push({
        groupName,
        companyName
      })
    })
  })

  return result
})

// 修改分页数据计算
const paginatedTableData = computed(() => {
  // 按集团分组的数据分页
  const allData = tableData.value
  
  // 确保不会跨集团分页
  let pageData = []
  let currentGroup = null
  let groupRows = []
  
  allData.forEach((row, index) => {
    if (currentGroup !== row.groupName) {
      if (groupRows.length > 0) {
        if (pageData.length + groupRows.length <= pageSize.value) {
          pageData.push(...groupRows)
        }
      }
      currentGroup = row.groupName
      groupRows = [row]
    } else {
      groupRows.push(row)
    }
    
    // 处理最后一组
    if (index === allData.length - 1) {
      if (pageData.length + groupRows.length <= pageSize.value) {
        pageData.push(...groupRows)
      }
    }
  })
  
  // 根据当前页码返回对应的数据
  const pageStart = (currentPage.value - 1) * pageSize.value
  const pageEnd = pageStart + pageSize.value
  return allData.slice(pageStart, Math.min(pageEnd, allData.length))
})

// 获取所有项目选项
const fetchProjectOptions = async (query = '') => {
  try {
    projectNoLoading.value = true
    const response = await request({
      url: '/project/list',
      method: 'GET',
      params: {
        projectNo: query,
        pageSize: 50  // 可以根据需求调整
      }
    })

    if (response.data.code === 200) {
      // 确保返回的数据是数组
      const projects = Array.isArray(response.data.data) ? response.data.data : 
                      (response.data.data.records || [])
      
      allProjectOptions.value = projects.map(item => ({
        projectNo: item.projectNo,
        label: `${item.projectNo} - ${item.companyName || ''}`,
        value: item.projectNo
      }))
      
      console.log('获取到的项目选项:', allProjectOptions.value)
    } else {
      ElMessage.error(response.data.msg || '获取项目列表失败')
    }
  } catch (error) {
    console.error('获取项目列表失败:', error)
    ElMessage.error('获取项目列表失败')
  } finally {
    projectNoLoading.value = false
  }
}

// 项目搜索处理
const handleProjectSearch = async (query) => {
  await fetchProjectOptions(query)
}

// 项目选择变化处理
const handleProjectChange = async (value) => {
  searchProjectNo.value = value
  await fetchData() // 无论是选择新值还是清除，都重新获取数据
}

// weekDates 计算属性
const weekDates = computed(() => {
  if (!dateRange.value) {
    return { dates: [] }
  }

  const currentDate = new Date(dateRange.value)
  const day = currentDate.getDay()
  const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(currentDate)
  monday.setDate(diff)
  
  const dates = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    const formattedDate = date.toISOString().split('T')[0]
    dates.push(formattedDate)
  }
  
  return {
    start: dates[0],
    end: dates[6],
    dates
  }
})

// 获取数据的方法
const fetchData = async () => {
  try {
    loading.value = true
    
    if (!weekDates.value || !weekDates.value.start || !weekDates.value.end) {
      console.warn('日期范围未初始化')
      return
    }

    const params = {
      startDate: weekDates.value.start,
      endDate: weekDates.value.end,
      includeWeekend: includeWeekend.value
    }
    
    // 只有当有项目编号时才添加到参数中
    if (searchProjectNo.value) {
      params.projectNo = searchProjectNo.value
    }
    
    console.log('发送请求参数:', params)

    const response = await request({
      url: '/trainingPlan/get',
      method: 'GET',
      params
    })

    if (response.data.code === 200) {
      planData.value = response.data.data || []
      console.log('获取到的数据:', planData.value)
    } else {
      ElMessage.error(response.data.msg || '获取数据失败')
    }
  } catch (error) {
    console.error('获取数据失败:', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

// 初始化函数
const initializeDate = () => {
  const today = new Date()
  dateRange.value = today.toISOString().split('T')[0]
  console.log('初始化日期:', dateRange.value)
}

// 添加日期变化监听
watch(dateRange, async (newVal) => {
  if (newVal) {
    console.log('日期变化:', newVal)
    await fetchData()
  }
}, { immediate: true })

// 添加周末显示变化监听
watch(includeWeekend, async () => {
  console.log('周末显示变化:', includeWeekend.value)
  await fetchData()
})

// 分页处理方法
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1 // 重置到第一页
}

const handleCurrentChange = (val) => {
  currentPage.value = val
}

// 对话框处理
const handleDialogSubmit = async () => {
  await fetchData()
  dialogVisible.value = false
}

const handleButtonAdd = () => {
  isEdit.value = false
  currentPlan.value = null
  dialogVisible.value = true
}

const handleCellAdd = (groupName, companyName, date) => {
  isEdit.value = false
  currentGroup.value = groupName
  currentCompany.value = companyName
  currentPlan.value = {
    groupName,
    companyName,
    trainingDate: date
  }
  dialogVisible.value = true
}

const handleEdit = (plan) => {
  isEdit.value = true
  currentPlan.value = { ...plan }
  dialogVisible.value = true
}

const handleDelete = async (plan) => {
  try {
    const response = await request({
      url: `/trainingPlan/${plan.id}`,
      method: 'DELETE'
    })
    if (response.data.code === 200) {
      ElMessage.success('删除成功')
      await fetchData()
    } else {
      ElMessage.error(response.data.msg || '删除失败')
    }
  } catch (error) {
    console.error('删除失败:', error)
    ElMessage.error('删除失败')
  }
}

// 修改获取日计划的方法
const getDayPlans = (companyName, date) => {
  if (!planData.value || !companyName || !date) return []
  
  return planData.value.filter(plan => {
    // 后端返回的是完整的计划对象，直接比较公司名称和日期
    return plan.companyName === companyName && 
           plan.trainingDate === date
  })
}

// 修改可见列计算
const visibleDayColumns = computed(() => {
  if (!weekDates.value.dates) return []
  
  return weekDates.value.dates
    .filter(date => {
      if (includeWeekend.value) return true
      const dayOfWeek = new Date(date).getDay()
      return dayOfWeek !== 0 && dayOfWeek !== 6
    })
    .map(date => {
      const dayDate = new Date(date)
      const weekDay = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][dayDate.getDay()]
      return {
        date,
        label: `${date.split('-')[1]}月${date.split('-')[2]}日 ${weekDay}`
      }
    })
})

// 导出Excel方法
const handleExport = async () => {
  try {
    const response = await request({
      url: '/trainingPlan/export',
      method: 'GET',
      params: {
        startDate: weekDates.value.start,
        endDate: weekDates.value.end,
        includeWeekend: includeWeekend.value
      },
      responseType: 'blob'  // 重要：设置响应类型为blob
    })
    
    // 创建下载链接
    const blob = new Blob([response.data], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    
    // 设置文件名
    const fileName = `培训计划_${weekDates.value.start}_${weekDates.value.end}.xlsx`
    link.setAttribute('download', fileName)
    
    // 触发下载
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

// 日期变化处理
const handleDateChange = (date) => {
  dateRange.value = date
}

// 周末显示变化处理
const handleWeekendChange = (val) => {
  includeWeekend.value = val
}

// 表格合并单元格方法
const spanMethod = ({ row, rowIndex, columnIndex }) => {
  if (columnIndex === 0) { // 集团列
    const groupName = row.groupName
    const rows = paginatedTableData.value
    
    // 在当前页中查找相同集团名行
    let count = 0
    let firstIndex = -1
    
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].groupName === groupName) {
        count++
        if (firstIndex === -1) {
          firstIndex = i
        }
      }
    }
    
    // 如果是该集团的第一行，则合并
    if (rowIndex === firstIndex) {
      return {
        rowspan: count,
        colspan: 1
      }
    } else if (rows[rowIndex].groupName === rows[rowIndex - 1]?.groupName) {
      // 如果不是第一行且与上一行集团名相同，则隐藏
      return {
        rowspan: 0,
        colspan: 0
      }
    }
  }
  return {
    rowspan: 1,
    colspan: 1
  }
}

// 添加监听器以在数据变化时重置分页
watch(planData, () => {
  currentPage.value = 1 // 数据变化时重置到第一页
}, { deep: true })

// 导出所有需要的方法和变量
</script>


<style scoped>
.training-plan-container {
  padding: 20px;
  background-color: #fff;
}

.header-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 16px;
  position: relative; /* 确保子元素可以绝对定位 */
}

.left-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.right-controls {
  display: flex;
  gap: 8px;
}

/* 确保日期选择器有合适的宽度 */
:deep(.el-date-picker) {
  width: 180px;
}

/* 确保选择器有合适的宽度 */
:deep(.el-select) {
  width: 200px;
}

/* 表格容器样式 */
.table-wrapper {
  margin-top: 20px;
}

/* 表格基础样式 */
:deep(.el-table) {
  border: 1px solid #DCDFE6;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 0;
  width: 100% !important;
}

:deep(.el-table__header-wrapper th) {
  background-color: #F5F7FA;
  font-weight: 600;
  color: #303133;
  height: 50px;
  border-right: 1px solid #DCDFE6 !important;
  border-bottom: 1px solid #DCDFE6 !important;
}

:deep(.el-table__row td) {
  border: 1px solid #DCDFE6 !important;
  padding: 0;
}

/* 计划项容器样式 */
.plan-item {
  position: relative;  /* 为绝对定位按钮容器提供参考 */
  padding: 8px;
  margin: 4px;
  background-color: #fff;
  border: 1px solid #EBEEF5;
  border-radius: 4px;
  transition: all 0.3s;
}

/* 操作按钮容器样式 */
.action-buttons {
  position: absolute;
  top: 4px;
  right: 4px;
  display: flex;
  gap: 4px;
  opacity: 0;  /* 默认隐藏 */
  transition: opacity 0.2s ease;
  z-index: 2;  /* 确保按钮在其他内容之上 */
}

/* 鼠标悬浮时显示按钮 */
.plan-item:hover .action-buttons {
  opacity: 1;
}

/* 按钮样式优化 */
:deep(.el-button.is-link) {
  height: 20px;
  padding: 0 4px;
  font-size: 12px;
}

:deep(.el-button.is-link[type="primary"]) {
  color: #409EFF;
}

:deep(.el-button.is-link[type="danger"]) {
  color: #F56C6C;
}

/* 按钮悬浮效果 */
:deep(.el-button.is-link:hover) {
  opacity: 0.8;
  background-color: transparent;
}

/* 确保其他内容不会被按钮遮挡 */
.plan-system,
.plan-content {
  position: relative;
  z-index: 1;
}

/* 系统标签样式调整 */
.plan-system {
  display: inline-block;
  padding: 2px 8px;
  background-color: #ECF5FF;
  color: #409EFF;
  border-radius: 4px;
  font-size: 12px;
  margin-bottom: 8px;
}

/* 内容区域样式调整 */
.plan-content {
  margin-top: 4px;
}

.plan-title {
  font-size: 13px;
  color: #303133;
  margin-bottom: 4px;
}

.plan-trainer-time {
  display: flex;
  gap: 8px;
  color: #606266;
  font-size: 12px;
}

/* 底部信息样式 */
.plan-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #606266;
}

.plan-trainer-time {
  display: flex;
  gap: 12px;
}

/* 操作按钮样式 */
.plan-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.3s;
}

.plan-item:hover .plan-actions {
  opacity: 1;
}

:deep(.el-button--small) {
  padding: 4px 8px;
  font-size: 12px;
}

:deep(.el-button.is-link) {
  height: auto;
  border: none;
}

:deep(.el-button.is-link[type="primary"]) {
  color: #409EFF;
}

:deep(.el-button.is-link[type="danger"]) {
  color: #F56C6C;
}

:deep(.el-button.is-link:hover) {
  background-color: transparent;
  opacity: 0.8;
}

/* 空计划样式 */
.empty-plan {
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  font-size: 13px;
  border: 1px dashed #E4E7ED;
  border-radius: 4px;
  margin: 6px;
  background-color: #FAFAFA;
}

/* 表格单元格样式 */
:deep(.el-table__cell) {
  padding: 4px !important;
  white-space: normal;
  line-height: 1.5;
}

/* 周末单元格样式 */
:deep(.el-table__row td.weekend) {
  background-color: #FAFAFA;
}

/* 按钮样式优化 */
:deep(.el-button--text) {
  padding: 2px 4px;
}

:deep(.el-button--text:hover) {
  background-color: #F5F7FA;
  border-radius: 2px;
}

/* 添加周末视图的样式 */
.weekend-view {
  font-size: 12px; /* 缩小整体字体 */
  transform: scale(0.9); /* 整体缩放 */
  transform-origin: top left;
}

.weekend-view :deep(.el-table__header) th {
  padding: 8px 0 !important; /* 减小表头padding */
  height: 40px !important; /* 减小表高度 */
}

.weekend-view :deep(.el-table__cell) {
  padding: 6px !important; /* 减小单元格padding */
}

.weekend-cell {
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
}

.weekend-text {
  color: #909399;
  font-size: 14px;
}

/* 优化空单元格样式 */
.empty-cell {
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fafafa;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.empty-text {
  color: #909399;
  font-size: 12px;
}

/* 调整按钮大小 */
.weekend-view :deep(.el-button--small) {
  padding: 6px 12px !important;
  font-size: 11px !important;
}

/* 调整表格内容溢出 */
.weekend-view :deep(.el-table__body-wrapper) {
  overflow-x: hidden !important;
}

/* 确保内容不会被截断 */
.weekend-view .plan-item {
  word-break: break-word;
  white-space: normal;
}

/* 调整分页器大小 */
.weekend-view + .pagination-container :deep(.el-pagination) {
  transform: scale(0.9);
  transform-origin: right center;
}

/* 调整表格最大宽度，确保全显示 */
.training-plan {
  max-width: 100%;
  overflow-x: hidden;
}

.weekend-view {
  width: 100% !important;
  margin: 0 !important;
}

/* 优化空间利用 */
.weekend-view :deep(.el-table__row) {
  height: auto !important;
}

/* 调整列宽比例 */
.weekend-view :deep(.el-table__header) th:first-child,
.weekend-view :deep(.el-table__row) td:first-child {
  width: 100px !important;
}

.weekend-view :deep(.el-table__header) th:nth-child(2),
.weekend-view :deep(.el-table__row) td:nth-child(2) {
  width: 150px !important;
}

/* 确保操作按钮在缩小后仍然可见且可点击 */
.weekend-plan .plan-actions {
  top: 4px !important;
  right: 4px !important;
}

.weekend-plan .plan-actions .el-button {
  padding: 2px 6px !important;
  height: 24px !important;
  min-width: 40px !important;
}

/* 单元格样式 */
.empty-cell {
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #FAFAFA;
  border: 1px dashed #E4E7ED;
  border-radius: 4px;
  margin: 6px;
  position: relative;
}

.empty-content {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-text {
  color: #909399;
  font-size: 13px;
  position: absolute;
  transition: opacity 0.3s;
}

/* 添加按钮默认隐藏 */
.add-button {
  position: absolute;
  opacity: 0;
  pointer-events: none;
  transition: all 0.3s;
}

/* 鼠标悬停时的效果 */
.empty-cell:hover .empty-text {
  opacity: 0;
}

.empty-cell:hover .add-button {
  opacity: 1;
  pointer-events: auto;
}

/* 按钮样式 */
.add-button {
  padding: 6px 16px;
  font-size: 12px;
}

/* 确保按钮在悬浮状态下可点击 */
.empty-cell:hover {
  cursor: pointer;
}

/* 优化按钮过渡效果 */
.add-button {
  transform: translateY(5px);
  transition: all 0.3s ease;
}

.empty-cell:hover .add-button {
  transform: translateY(0);
}

/* 调整下拉框样式 */
:deep(.el-select .el-input__wrapper) {
  box-shadow: 0 0 0 1px #dcdfe6 inset;
}

:deep(.el-select .el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #409eff inset;
}

:deep(.el-select .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #409eff inset;
}

/* 添加项搜索相关样式 */
.header-left .el-select {
  width: 200px;
}

/* 载状态样式 */
:deep(.el-select .el-input.is-loading .el-input__wrapper) {
  cursor: wait;
}

/* 分页容器样式 */
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

:deep(.el-pagination) {
  padding: 0;
  margin: 0;
}

:deep(.el-pagination .el-select .el-input) {
  width: 100px;
}

/* 确保表格占满器宽度并防止水平滚动 */
:deep(.el-table) {
  width: 100% !important;
  overflow-x: hidden !important;
}

:deep(.el-table__body-wrapper) {
  overflow-x: hidden !important;
}

/* 优化单元格内容布局 */
:deep(.el-table__cell) {
  padding: 4px !important;
  white-space: normal;
  line-height: 1.5;
}

/* 确保内容自动换行 */
.plan-item {
  word-break: break-word;
  white-space: normal;
}

/* 确保表格占满容器宽度 */
:deep(.el-table) {
  width: 100% !important;
}

/* 移除表格的水平滚动 */
:deep(.el-table__body-wrapper),
:deep(.el-table__header-wrapper) {
  overflow-x: hidden !important;
}

/* 调整表格器样式 */
.training-plan {
  width: 100%;
  overflow-x: hidden;
}

/* 优化表格样式 */
:deep(.el-table) {
  width: 100% !important;
  border-collapse: collapse;
  table-layout: fixed;
}

/* 优化表头样式 */
:deep(.el-table__header-wrapper th) {
  background-color: #F5F7FA;
  color: #606266;
  font-weight: 500;
  height: 40px;
  line-height: 40px;
  padding: 0 !important;
}

/* 优化单元格样式 */
:deep(.el-table__cell) {
  padding: 8px !important;
  height: auto !important;
}

/* 优化空单元格样式 */
.empty-cell {
  height: 100px;
  background-color: #FAFAFA;
  border-radius: 4px;
  margin: 4px;
  transition: all 0.3s;
}

/* 优化计划项样式 */
.plan-item {
  margin: 4px;
  padding: 8px;
  border-radius: 4px;
  background-color: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.plan-item:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

/* 确保内容不会溢出 */
:deep(.el-table__body-wrapper) {
  overflow-x: hidden !important;
}

/* 优化表格边框 */
:deep(.el-table--border) {
  border-radius: 4px;
  overflow: hidden;
}

/* 调整周末列的样式 */
:deep(.el-table__row td.weekend) {
  background-color: #FAFAFA;
}

/* 响应式调整 */
@media screen and (max-width: 1400px) {
  :deep(.el-table__cell) {
    padding: 6px !important;
  }
  
  .plan-item {
    padding: 6px;
    margin: 3px;
  }
}

@media screen and (max-width: 1200px) {
  :deep(.el-table__cell) {
    padding: 4px !important;
  }
  
  .plan-item {
    padding: 4px;
    margin: 2px;
  }
}

/* 确保表格行有唯一样式 */
:deep(.el-table__row) {
  transition: none; /* 防止行切换时的动画效果 */
}

/* 添加选择器样式 */
:deep(.el-select) {
  width: 240px;
}

:deep(.el-select-dropdown__item) {
  padding: 0 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.add-button {
  position: absolute; /* 绝对定位 */
  top: 10px; /* 距离顶部的距离 */
  right: 10px; /* 距离右侧的距离 */
  z-index: 10; /* 确保在其他元素之上 */
  transition: background-color 0.3s, transform 0.3s; /* 添加过渡效果 */
}

.add-button:hover {
  background-color: #409eff; /* 悬停时的背景颜色 */
  transform: scale(1.05); /* 悬停时放大 */
}

.empty-cell {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%; /* 设置宽度 */
  height: 100px; /* 设置高度 */
  border: 1px dashed #dcdfe6; /* 可选：添加边框 */
  border-radius: 4px; /* 可选：圆角 */
}

.plan-item {
  width: 100%; /* 确保计划项宽度一致 */
  height: 100px; /* 设置高度 */
  border: 1px solid #dcdfe6; /* 可选：添加边框 */
  border-radius: 4px; /* 可选：圆角 */
  padding: 10px; /* 内边距 */
}
</style> 