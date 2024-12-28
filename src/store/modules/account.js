import {defineStore} from 'pinia'
import request from "@/utils/request";
import {ElMessage} from "element-plus";

export const useAccountStore = defineStore('account', {
    state: () => ({
        accounts: [],
        selectedIds: [],
        currentPage: 1,
        pageSize: 10,
        searchForm: {
            username: '',
            telephone: '',
            email: ''
        },
        loading: false,
        hasMore: true,
        serverPage: 1,
        totalRecords: 0,
        requestFailed: false
    }),

    actions: {
        // 获取账户列表
        async fetchAccounts(loadMore = false, search = false) {
            if (this.requestFailed) {
                console.warn('请求失败，正在冷却中...');
                return false;
            }

            try {
                this.loading = true;
                this.requestFailed = false;
                const params = {
                    page: this.serverPage,
                    search: search
                };

                if (search) {
                    Object.assign(params, this.searchForm);
                }

                const response = await request({
                    method: "GET",
                    url: "/account/account",
                    params
                });

                if (response.data.code === 200) {
                    const {records, total, hasMore} = response.data.data;

                    if (!Array.isArray(records)) {
                        console.error('Invalid records format:', records);
                        return false;
                    }

                    if (loadMore && !search) {
                        this.accounts = [...this.accounts, ...records];
                        this.serverPage++;
                    } else {
                        this.accounts = records;
                        this.serverPage = 2;
                    }

                    this.hasMore = hasMore;
                    this.totalRecords = total;
                    return true;
                }

                console.error('Server returned error:', response.data);
                return false;
            } catch (error) {
                console.error('Fetch accounts error:', error);
                ElMessage.error(error.response?.data?.msg || '获取账户列表失败');
                this.requestFailed = true;
                setTimeout(() => {
                    this.requestFailed = false;
                }, 5000);
                return false;
            } finally {
                this.loading = false;
            }
        },

        // 检查是否需要加载更多数据
        async checkAndLoadMore() {
            if (this.loading || !this.hasMore) return;

            const currentDataCount = this.accounts.length;
            const neededDataCount = (this.currentPage + 10) * this.pageSize;

            if (neededDataCount > currentDataCount) {
                await this.fetchAccounts(true);
            }
        },

        // 搜索账户
        searchAccounts() {
            if (!Array.isArray(this.accounts)) {
                return [];
            }

            return this.accounts.filter(account => {
                const {username, telephone, email} = this.searchForm;
                return (!username || account.username.toLowerCase().includes(username.toLowerCase())) &&
                    (!telephone || account.telephone.includes(telephone)) &&
                    (!email || account.email.toLowerCase().includes(email.toLowerCase()));
            });
        },

        // 添加账户
        async addAccount(account) {
            try {
                const response = await request({
                    method: 'POST',
                    url: '/account/add',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    data: account
                });

                if (response.data.code === 200) {
                    // 重置页码和数据
                    this.currentPage = 1;
                    this.serverPage = 1;
                    this.accounts = [];

                    try {
                        // 等待数据获取完成
                        const fetchResult = await this.fetchAccounts();
                        if (fetchResult) {
                            ElMessage.success('添加账户成功');
                            return true;
                        }
                    } catch (fetchError) {
                        console.error('Refresh data error:', fetchError);
                        ElMessage.error('刷新数据失败，请手动刷新页面');
                        return false;
                    }
                } else {
                    ElMessage.error(response.data.msg || '添加失败');
                    return false;
                }
            } catch (error) {
                console.error('Add account error:', error);
                ElMessage.error(error.response?.data?.msg || '添加账户失败');
                return false;
            }
        },

        // 更新账户
        async updateAccount(account) {
            try {
                const response = await request({
                    method: 'POST',
                    url: '/account/update',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    data: account
                });

                if (response.data.code === 200) {
                    // 保存当前页码
                    const currentPageBackup = this.currentPage;
                    // 重置服务器页码
                    this.serverPage = 1;
                    // 清空现有数据
                    this.accounts = [];
                    // 重新获取数据
                    await this.fetchAccounts();
                    // 恢复到之前的页码
                    this.currentPage = currentPageBackup;
                    ElMessage.success('更新账户成功');
                    return true;
                } else {
                    ElMessage.error(response.data.msg || '更新账户失败');
                    return false;
                }
            } catch (error) {
                console.error('Update account error:', error);
                ElMessage.error(error.response?.data?.msg || '更新账户失败');
                return false;
            }
        },

        // 删除选中的账户
        async deleteAccounts(ids = null) {
            const deleteIds = ids || this.selectedIds;
            if (!deleteIds.length) {
                ElMessage.warning('请选择要删除的账户');
                return false;
            }
            try {
                const response = await request({
                    method: 'DELETE',
                    url: '/account/delete',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    data: deleteIds
                });

                if (response.data.code === 200) {
                    // 重置到第一页
                    this.currentPage = 1;
                    this.serverPage = 1;
                    // 清空选中的ID
                    this.selectedIds = [];
                    // 清空现有数据
                    this.accounts = [];
                    // 重新获取数据
                    await this.fetchAccounts();
                    ElMessage.success('删除成功');
                    return true;
                } else {
                    ElMessage.error(response.data.msg || '删除账户失败');
                    return false;
                }
            } catch (error) {
                console.error('Delete accounts error:', error);
                ElMessage.error(error.response?.data?.msg || '删除账户失败');
                return false;
            }
        },

        // 重置搜索表单
        resetSearchForm() {
            this.searchForm = {
                username: '',
                telephone: '',
                email: ''
            };
            this.currentPage = 1;
        },

        // 设置选中的账户IDs
        setSelectedIds(ids) {
            this.selectedIds = ids;
        },

        // 设置当前页码
        setCurrentPage(page) {
            this.currentPage = page;
        },

        // 设置每页显示数量
        setPageSize(size) {
            this.pageSize = size;
            this.currentPage = 1;
        }
    },

    getters: {
        // 获取分页后的数据
        paginatedAccounts() {
            const start = (this.currentPage - 1) * this.pageSize;
            const end = start + this.pageSize;
            const result = this.searchAccounts().slice(start, end);

            this.checkAndLoadMore();

            return result;
        },

        // 获取总数据量
        total() {
            return this.totalRecords;
        },

        // 获取选中的账户数量
        selectedCount() {
            return this.selectedIds.length;
        }
    }
})