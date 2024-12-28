import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'

// 导入组件
import LoginPage from '@/views/login/LoginPage.vue'
import HomePage from '@/views/home/HomePage.vue'
import accountList from "@/views/AccountManage/AccountList.vue"
import TrainingPlanWeek from "@/views/training/TrainingPlanWeek.vue"
import EmailManage from "@/views/EmailManage/EmailManage.vue"
import ListPage from "@/views/projectList/ListPage.vue"
import trainerWorkingHours from "@/views/dashboard/trainerWoringHouers.vue"
import projectReport from "@/views/dashboard/projectReport.vue";

const routes = [
    {
        path: '/',
        redirect: () => {
            const token = localStorage.getItem('token')
            return token ? '/home' : '/login'
        }
    },
    {
        path: '/login',
        name: 'login',
        component: LoginPage,
        meta: {
            requiresAuth: false
        }
    },
    {
        path: '/home',
        name: 'home',
        component: HomePage,
        meta: {
            requiresAuth: true
        }
    },
    {
        path: '/account',
        name: 'account',
        component: accountList,
        meta: {
            requiresAuth: true
        }
    },
    {
        path: '/report',
        name: 'report',
        component: projectReport,
        meta: {
            requiresAuth: true
        }
    },
    {
        path: '/plan',
        name: 'plan',
        component: TrainingPlanWeek,
        meta: {
            requiresAuth: true
        }
    },
    {
        path: '/email',
        name: 'email',
        component: EmailManage,
        meta: {
            requiresAuth: true
        }
    },
    {
        path: '/list',
        name: 'list',
        component: ListPage,
        meta: {
            requiresAuth: true
        }
    },
    {
        path: '/trainerWorkingHours',
        name: 'trainerWorkingHours',
        component: trainerWorkingHours,
        meta: {
            requiresAuth: true
        }
    },
    // 404路由
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: () => import('@/views/NotFound.vue'),
        meta: {
            requiresAuth: false
        }
    }
]

const router = createRouter({
    history: createWebHistory('/'),
    routes
})

// 全局前置守卫
router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('token')
    
    console.log('路由守卫:', {
        to: to.path,
        from: from.path,
        token: token ? '存在' : '不存在',
        requiresAuth: to.meta.requiresAuth
    })
    
    if (to.meta.requiresAuth && !token) {
        ElMessage.warning('请先登录')
        next('/login')
    } else {
        next()
    }
})

export default router