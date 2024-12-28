<template>
  <div>
    <h2 class="title">培训老师统计报表</h2>
    <p class="sub-title">统计每年各培训老师的工时，参考下表</p>
    <el-table
        :data="paginatedData"
        style="width: 100%"
        border>
      <el-table-column
          prop="username"
          label="姓名"
          width="100"
      />
      <el-table-column
          v-for="month in months"
          :key="month"
          :prop="month"
          :label="month.toUpperCase()"
          width="100">
        <template #default="scope">
          <div
              class="cell"
              @mouseover="scope.row.showEdit = month"
              @mouseleave="scope.row.showEdit = null">
            <span>{{ scope.row[month] }}</span>
            <el-button
                v-if="scope.row.showEdit === month"
                size="small"
                type="text"
                @click="openEditDialog(scope.row, month)">
              编辑
            </el-button>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="total" label="总时长" width="100">
        <template #default="scope">
          {{ calculateTotal(scope.row) }}
        </template>
      </el-table-column>
    </el-table>

    <!-- 编辑对话框 -->
    <el-dialog
        v-model="dialogVisible"
        title="编辑时长"
        width="30%">
      <el-form>
        <el-form-item label="时长">
          <el-input-number v-model="editValue" :min="0"></el-input-number>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmEdit">确定</el-button>
      </template>
    </el-dialog>

    <div class="pagination-container" v-if="total > 0">
      <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import {onMounted, ref, computed} from 'vue'
import request from "@/utils/request"
import {ElMessage} from "element-plus";

const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

const trainerData = ref([])

const dialogVisible = ref(false)
const editValue = ref(0)
const currentRow = ref(null)
const currentMonth = ref('')

const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return trainerData.value.slice(start, end)
})

const calculateTotal = (row) => {
  return months.reduce((total, month) => total + (row[month] || 0), 0)
}

const openEditDialog = (row, month) => {
  currentRow.value = row
  currentMonth.value = month
  editValue.value = row[month]
  dialogVisible.value = true
}

const confirmEdit = async () => {
  if (currentRow.value && currentMonth.value) {
    try {
      const month = currentMonth.value.substring(0, 3).toLowerCase()
      const response = await request('/working-hours/update', {
        method: "PUT",
        data: {  // 对于 PUT 请求，使用 data
          username: currentRow.value.username,
          month: month,
          hours: editValue.value
        }
      })
      if (response.data.code === 200) {
        currentRow.value[currentMonth.value] = editValue.value
        updateTotal(currentRow.value)
        ElMessage.success('更新成功')
      } else {
        ElMessage.error(response.data.message)
      }
    } catch (error) {
      console.error(error)
      ElMessage.error('更新失败')
    }
  }
  dialogVisible.value = false
}

const updateTotal = (row) => {
  row.total = calculateTotal(row)
}

const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
}

const handleCurrentChange = (val) => {
  currentPage.value = val
}

const loadWorkingHours = async () => {
  try {
    const response = await request('/working-hours/get')
    if (response.data.code === 200) {
      trainerData.value = response.data.data
      total.value = response.data.data.length
      console.log(trainerData.value)
    } else {
      ElMessage.error(response.data.message)
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('加载数据失败')
  }
}


onMounted(() => {
  loadWorkingHours()
})
</script>

<style scoped>
.title {
  font-size: 24px;
  margin-bottom: 10px;
}

.sub-title {
  color: #666;
  font-size: 14px;
  margin-bottom: 20px;
}

.cell {
  position: relative;
}

.cell .el-button {
  position: absolute;
  right: 0;
  top: 0;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>