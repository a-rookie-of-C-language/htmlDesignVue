<template>
  <div class="login-container">
    <el-card class="login-card">
      <h2>用户登录</h2>
      <el-form
          :model="loginForm"
          :rules="rules"
          ref="loginForm"
          label-width="0px"
      >
        <el-form-item prop="account">
          <el-input
              v-model="loginForm.account"
              placeholder="请输入邮箱或手机号"
              prefix-icon="el-icon-user"
          ></el-input>
        </el-form-item>

        <el-form-item prop="password">
          <el-input
              v-model="loginForm.password"
              :type="passwordVisible ? 'text' : 'password'"
              placeholder="请输入密码"
              prefix-icon="el-icon-lock"
          >
            <template #suffix>
              <el-icon
                  class="password-icon"
                  @click="passwordVisible = !passwordVisible"
              >
                <component :is="passwordVisible ? 'View' : 'Hide'"/>
              </el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-button
              type="primary"
              :disabled="!isFormValid"
              @click="handleLogin"
              class="login-button"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
// import router from "@/router";
import {ElMessage} from "element-plus";
// import axios from "axios";
import request from "@/utils/request";

export default {
  name: 'LoginView',
  data() {
    return {
      loginForm: {
        account: '',
        password: ''
      },
      passwordVisible: false,
      rules: {
        account: [{validator: this.validateAccount, trigger: 'change'}],
        password: [{validator: this.validatePassword, trigger: 'change'}]
      }
    };
  },
  computed: {
    isFormValid() {
      return this.loginForm.account &&
          this.loginForm.password &&
          (this.validateEmail(this.loginForm.account) || this.validatePhone(this.loginForm.account)) &&
          this.loginForm.password.length >= 8 &&
          this.loginForm.password.length <= 20;
    }
  },
  methods: {
    validateAccount(rule, value, callback) {
      if (!value) {
        callback(new Error('请输入账号'));
      } else if (!this.validateEmail(value) && !this.validatePhone(value)) {
        callback(new Error('请输入正确的邮箱或手机号'));
      } else {
        callback();
      }
    },
    // 密码验证规则
    validatePassword(rule, value, callback) {
      if (!value) {
        callback(new Error('请输入密码'));
      } else {
        const hasLetter = /[a-zA-Z]/.test(value);
        const hasNumber = /\d/.test(value);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
        const validTypes = [hasLetter, hasNumber, hasSpecial].filter(type => type).length;

        if (value.length < 8 || value.length > 20) {
          callback(new Error('密码长度应为8-20位'));
        } else if (validTypes < 2) {
          callback(new Error('密码需包含字母、数字、特殊字符中的至少两种'));
        } else {
          callback();
        }
      }
    },
    validateEmail(email) {
      const reg = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
      return reg.test(email);
    },

    validatePhone(phone) {
      const reg = /^1[3-9]\d{9}$/;
      return reg.test(phone);
    },
    async handleLogin() {
      this.$refs.loginForm.validate(async (valid) => {
        if (valid) {
          try {
            const response = await request.post('/login', {
              account: this.loginForm.account,
              password: this.loginForm.password
            })

            console.log('登录响应:', response.data)

            if (response.data.code === 200) {
              const token = response.data.data
              localStorage.setItem('token', token)
              
              request.defaults.headers.common['Authorization'] = `Bearer ${token}`
              
              console.log('Token已设置:', token)
              
              ElMessage.success('登录成功')
              await this.$router.push('/home')
            } else {
              ElMessage.error(response.data.message || '登录失败')
            }
          } catch (error) {
            console.error('登录失败:', error)
            ElMessage.error('登录失败')
          }
        }
      })
    }
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f5f5;
}

.login-card {
  width: 400px;
  padding: 20px;
}

.login-card h2 {
  text-align: center;
  margin-bottom: 30px;
}

.login-button {
  width: 100%;
}

.el-input:hover {
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
}

.password-icon {
  cursor: pointer;
}
</style>
