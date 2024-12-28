<template>
  <div class="project-report">
    <div class="page-header">
      <h2>项目统计报表</h2>
      <p class="sub-title">统计各项目的信息，参考下表</p>
    </div>

    <el-table
      v-if="projectList.length > 0"
      :data="projectList"
      style="width: 100%"
      border
      v-loading="loading">
      <el-table-column prop="projectNo" label="项目号" width="120"/>
      <el-table-column prop="system" label="模块" width="100">
        <template #default="scope">
          <el-tag>{{ scope.row.system }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="companyName" label="公司名称简写" width="150"/>
      <el-table-column prop="contractHours" label="时间" width="100">
        <template #default="scope">
          {{ scope.row.promisedHours?.toFixed(0) }}
        </template>
      </el-table-column>
      <el-table-column prop="hourlyRate" label="单价" width="100">
        <template #default="scope">
          {{ scope.row.hourlyRate?.toFixed(0) }}
        </template>
      </el-table-column>
      <el-table-column prop="consumedHours" label="已用" width="100">
        <template #default="scope">
          {{ scope.row.consumedHours?.toFixed(1) }}
        </template>
      </el-table-column>
      <el-table-column prop="remainingHours" label="剩余" width="100">
        <template #default="scope">
          {{ scope.row.promisedHours?.toFixed(1) - scope.row.consumedHours?.toFixed(1) }}
        </template>
      </el-table-column>
      <el-table-column prop="remainingAmount" label="剩余可开票金额" width="150">
        <template #default="scope">
          {{ scope.row.remainingAmount?.toFixed(2) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150">
        <template #default="scope">
          <el-button size="small" type="primary" @click="openDialog(scope.row)">更新金额</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 更新对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="更新剩余可开票金额">
      <el-form :model="currentProject">
        <el-form-item label="项目号">
          <el-input v-model="currentProject.projectNo" disabled></el-input>
        </el-form-item>
        <el-form-item label="剩余可开票金额">
          <el-input v-model="currentProject.remainingAmount" type="number"></el-input>
        </el-form-item>
      </el-form>
      <template v-slot:footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitUpdate">提交</el-button>
      </template>
    </el-dialog>

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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from "@/utils/request"

// 数据定义
const projectList = ref([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const dialogVisible = ref(false)
const currentProject = ref({})

// 获取项目列表
const getProjectList = async () => {
  loading.value = true
  try {
    const response = await request('/project/report', {
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

// 打��对话框
const openDialog = (row) => {
  currentProject.value = { ...row }
  dialogVisible.value = true
}

// 提交更新
const submitUpdate = async () => {
  try {
    const response = await request(`/project/updateRemainingAmount`, {
      projectNo: currentProject.value.projectNo,
      remainingAmount: currentProject.value.remainingAmount
    })
    if (response.data.code === 200) {
      ElMessage.success('更新成功')
      dialogVisible.value = false
      getProjectList()
    } else {
      ElMessage.error(response.data.message || '更新失败')
    }
  } catch (error) {
    console.error('更新失败:', error)
    ElMessage.error('更新失败')
  }
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

// 页面加载时获取数据
onMounted(() => {
  getProjectList()
})
</script>

<style scoped>
.project-report {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0 0 10px 0;
}

.sub-title {
  color: #666;
  font-size: 14px;
  margin: 0;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.el-tag {
  width: 60px;
  text-align: center;
}
</style>
