<template>
  <div class="training-plan">
    <div class="plan-header">
      <el-date-picker
          v-model="dateRange"
          type="date"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          :default-time="defaultTime"
          :default-value="defaultDate"
          time-zone="Asia/Shanghai"
          @change="handleDateChange"
          placeholder="选择日期"
      />
      <div class="header-actions">
        <el-button
            type="primary"
            @click="handleExport"
        >导出Excel
        </el-button>
      </div>
    </div>

    <el-table
        :data="paginatedData"
        border
        style="width: 100%"
        :span-method="spanMethod"
    >
      <!-- 集团列 -->
      <el-table-column
          prop="groupName"
          label="集团"
          width="120"
          fixed="left"
          align="center"
      />

      <!-- 公司列 -->
      <el-table-column
          prop="companyName"
          label="公司"
          width="180"
          fixed="left"
          align="center"
      />

      <!-- 周一到周五的列 -->
      <el-table-column
          v-for="day in weekDayColumns"
          :key="day.date"
          :label="day.label"
          min-width="200"
      >
        <template #default="scope">
          <div class="day-cell">
            <template v-if="getDayPlans(scope.row.companyName, day.date).length > 0">
              <div
                  v-for="plan in getDayPlans(scope.row.companyName, day.date)"
                  :key="plan.id"
                  class="plan-item"
                  :class="{ 'highlight-cell': isHighlightDay(day.date) }"
              >
                <div class="plan-content">
                  <div class="plan-system">{{ plan.system }}</div>
                  <div class="plan-text">{{ plan.trainingContext }}</div>
                  <div class="plan-footer">
                    <span class="plan-trainer">{{ plan.trainer }}</span>
                    <span class="plan-time">{{ formatTime(plan.trainingTime) }}</span>
                  </div>
                </div>
              </div>
            </template>
            <div v-else class="empty-plan">
              <span>暂无计划</span>
            </div>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页组件 -->
    <div class="pagination-container">
      <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[5, 10, 15, 20]"
          :total="totalItems"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { format, startOfWeek, addDays, parseISO } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import request from '@/utils/request'

// 基础设置
const defaultDate = ref(new Date())
const defaultTime = new Date(2000, 1, 1, 0, 0, 0)
const dateRange = ref(format(new Date(), 'yyyy-MM-dd'))

// 分页相关
const currentPage = ref(1)
const pageSize = ref(5)
const weeklyPlans = ref([])

// 周日期计算
const weekDates = computed(() => {
  if (!dateRange.value) return { start: null, end: null }

  try {
    const date = typeof dateRange.value === 'string'
      ? parseISO(dateRange.value)
      : dateRange.value

    const start = startOfWeek(date, { weekStartsOn: 1 })
    const end = addDays(start, 4)

    return {
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd')
    }
  } catch (error) {
    console.error('计算周日期范围错误:', error)
    return { start: null, end: null }
  }
})

// 表格数据处理
const tableData = computed(() => {
  const groupedData = []
  const groups = {}

  weeklyPlans.value.forEach(plan => {
    const key = plan.groupName
    if (!groups[key]) {
      groups[key] = new Set()
    }
    groups[key].add(plan.companyName)
  })

  Object.entries(groups).forEach(([groupName, companies]) => {
    Array.from(companies).forEach(companyName => {
      groupedData.push({
        groupName,
        companyName
      })
    })
  })

  return groupedData
})

// 分页数据计算
const totalItems = computed(() => tableData.value.length)

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  const result = []
  let currentIndex = 0
  let currentGroup = null

  for (const item of tableData.value) {
    if (currentIndex >= start && currentIndex < end) {
      result.push(item)
    } else if (currentIndex >= end && item.groupName === currentGroup) {
      result.push(item)
    }
    currentGroup = item.groupName
    currentIndex++
  }

  return result
})

// 周视图列计算
const weekDayColumns = computed(() => {
  if (!weekDates.value.start) return []

  const columns = []
  const startDate = parseISO(weekDates.value.start)

  for (let i = 0; i < 5; i++) {
    const currentDate = addDays(startDate, i)
    columns.push({
      date: format(currentDate, 'yyyy-MM-dd'),
      weekday: format(currentDate, 'EEEE', { locale: zhCN }),
      label: format(currentDate, 'MM月dd日 EEEE', { locale: zhCN })
    })
  }

  return columns
})

// 方法定义
const handleCurrentChange = (val) => {
  currentPage.value = val
}

const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
}

const handleDateChange = async (val) => {
  try {
    dateRange.value = val
    await getWeeklyPlans()
  } catch (error) {
    console.error('日期变化处理错误:', error)
  }
}

const getWeeklyPlans = async () => {
  if (!weekDates.value.start || !weekDates.value.end) {
    weeklyPlans.value = []
    return
  }

  try {
    const response = await request.get('/trainingPlan/get', {
      params: {
        startDate: weekDates.value.start,
        endDate: weekDates.value.end
      }
    })

    if (response.data && Array.isArray(response.data.data)) {
      weeklyPlans.value = response.data.data
      currentPage.value = 1
    } else {
      weeklyPlans.value = []
    }
  } catch (error) {
    console.error('获取培训计划失败:', error)
    weeklyPlans.value = []
    ElMessage.error('获取培训计划失败')
  }
}

const handleExport = async () => {
  try {
    const response = await request({
      url: '/trainingPlan/export',
      method: 'GET',
      params: {
        startDate: weekDates.value.start,
        endDate: weekDates.value.end
      },
      responseType: 'blob'
    })

    const url = URL.createObjectURL(response.data)
    const link = document.createElement('a')
    link.href = url
    link.download = `培训计划${weekDates.value.start}-${weekDates.value.end}.xlsx`

    document.body.appendChild(link)
    link.click()

    setTimeout(() => {
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }, 0)

    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

const isHighlightDay = (date) => {
  const today = format(new Date(), 'yyyy-MM-dd')
  return date === today
}

const formatTime = (time) => {
  if (!time) return ''
  try {
    const timeOnly = time.split('T')[1] || time
    return timeOnly.split(':').slice(0, 2).join(':')
  } catch (error) {
    console.error('时间格式化错误:', error)
    return time
  }
}

const getDayPlans = (companyName, date) => {
  return weeklyPlans.value.filter(plan => {
    if (!plan.trainingDate || plan.companyName !== companyName) return false
    try {
      const planDate = format(parseISO(plan.trainingDate), 'yyyy-MM-dd')
      return planDate === date
    } catch (error) {
      console.error('日期解析错误:', error)
      return false
    }
  })
}

const spanMethod = ({ row, column, rowIndex }) => {
  if (column.property === 'groupName') {
    const currentPageData = paginatedData.value
    const sameGroupInCurrentPage = currentPageData.filter(item => item.groupName === row.groupName)
    const firstIndexInCurrentPage = currentPageData.findIndex(item => item.groupName === row.groupName)

    if (rowIndex === firstIndexInCurrentPage) {
      return {
        rowspan: sameGroupInCurrentPage.length,
        colspan: 1
      }
    } else {
      return {
        rowspan: 0,
        colspan: 0
      }
    }
  }
}

// 组件加载时获取数据
onMounted(async () => {
  console.log('组件加载，初始日期:', dateRange.value)
  await getWeeklyPlans()
})
</script>

<style scoped>
.training-plan {
  padding: 20px;
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.day-cell {
  padding: 12px;
  min-height: 120px;
}

.plan-item {
  margin-bottom: 8px;
  padding: 8px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}

.plan-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.plan-system {
  font-weight: bold;
  color: #409EFF;
}

.plan-text {
  color: #606266;
}

.plan-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
}

.empty-plan {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #909399;
}

.highlight-cell {
  background-color: #ecf5ff;
  border: 1px solid #409EFF !important;
  position: relative;
}

.highlight-cell::before {
  content: '今日';
  position: absolute;
  top: -1px;
  right: -1px;
  background-color: #409EFF;
  color: white;
  padding: 2px 8px;
  font-size: 12px;
  border-radius: 0 6px 0 6px;
}

.pagination-container {
  margin-top: 20px;
  padding: 16px;
  display: flex;
  justify-content: flex-end;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.plan-trainer::before {
  content: '👤';
  margin-right: 4px;
  font-size: 12px;
}

.plan-time::before {
  content: '🕒';
  margin-right: 4px;
  font-size: 12px;
}
</style>
