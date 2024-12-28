import { defineStore } from 'pinia'
import request from "@/utils/request"
import { ElMessage } from "element-plus"

export const useUserStore = defineStore('user', {
    state: () => ({
        userInfo: null,
        loading: false
    }),

    getters: {
        // 获取用户信息
        getUserInfo: (state) => state.userInfo,
        
        // 判断是否为超级管理员
        isSuperAdmin: (state) => {
            return state.userInfo.indexOf("超级管理员")!==-1
        },

        isAdmin: (state) => {
            return state.userInfo.indexOf("管理员")!==-1
        },

        userRole: () => null
    },

    actions: {
        // 设置用户信息
        setUserInfo(info) {
            this.userInfo = info
        },

        // 获取用户信息
        async fetchUserInfo() {
            if (this.loading) return
            
            try {
                this.loading = true
                const response = await request({
                    url: '/user/info',
                    method: 'GET'
                })

                console.log('Fetch user info response:', response)
                if (response.data.code === 200) {
                    // response.data.data 直接是用户名字符串
                    this.setUserInfo(response.data.data)
                    return true
                } else {
                    ElMessage.error(response.data.msg || '获取用户信息失败')
                    return false
                }
            } catch (error) {
                console.error('Fetch user info error:', error)
                ElMessage.error(error.response?.data?.msg || '获取用户信息失败')
                return false
            } finally {
                this.loading = false
            }
        },
    }
}) 