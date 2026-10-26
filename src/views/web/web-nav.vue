<template>
    <div class="web-nav">
        <img src="/src/assets/img/logo.svg" alt="" style="cursor: pointer" @click="router.push({ path: '/web/' })" />
        <div style="margin-left: auto">
            <div class="menu">
                <div :class="['menu-item', { active: route.path === '/web/' }]" @click="router.push({ path: '/web/' })">Home</div>
                <div :class="['menu-item', { active: route.path === '/web/past' }]" @click="router.push({ path: '/web/past' })" v-if="uid">
                    Past visits
                </div>
                <div :class="['menu-item', { active: route.path === '/web/upcoming' }]" @click="router.push({ path: '/web/upcoming' })" v-if="uid">
                    Upcoming visits
                </div>
                <div :class="['menu-item', { active: route.path === '/web/discover' }]" @click="router.push({ path: '/web/discover' })">Discover</div>
                <div :class="['menu-item', { active: route.path.startsWith('/web/course') }]" @click="router.push({ path: '/web/course' })">
                    Course
                </div>
                <div :class="['menu-item']" @click="account" v-if="uid">Account</div>
                <div :class="['menu-item']" @click="singIn" v-if="!uid">Sign in</div>
                <a-dropdown v-if="uid">
                    <div class="avatar">
                        {{ userInfo.first_name.slice(0, 1) }}
                    </div>
                    <template #overlay>
                        <a-menu>
                            <a-menu-item>
                                <div @click="logout">Sign out</div>
                            </a-menu-item>
                        </a-menu>
                    </template>
                </a-dropdown>
            </div>
        </div>
    </div>
</template>
<script setup>
    import LoginDrawer from '@/components/LoginDrawer.vue';
    const loginDrawer = ref();
    import axios from 'axios';
    import { onMounted, ref } from 'vue';
    import { SmartLoading } from '@/components/smart-loading';
    import router from '@/routers/index';
    import { useRoute } from 'vue-router';
    import { useUserStore } from '@/stores/modules/system/user';
    import { supabase, authClient } from '@/utils/supabase';
    import { clearAllCoolies } from '@/utils/cookie-util';
    import { localClear } from '@/utils/local-util';
    import { message } from 'ant-design-vue';

    const uid = ref(useUserStore().getUid);
    const route = useRoute();
    const userInfo = ref(useUserStore().getUserInfo);
    const logout = () => {
        authClient.logout();
        localClear();
        clearAllCoolies();
        useUserStore().logout();
        message.success('Logout successfully');
        router.push({ path: '/web/' });
    };
    const account = () => {
        authClient.redirectToAccountPage({
            redirectBackToUrl: window.location.href,
        });
    };
    const singIn = () => {
        authClient.redirectToLoginPage({
            postLoginRedirectUrl: window.location.href || import.meta.env.VITE_CLIENT_APP_URL,
        });
    };
    onMounted(async () => {});
</script>
<style lang="scss" scoped>
    .web-nav {
        display: flex;
        align-items: center;
        flex-shrink: 0;
        margin-bottom: 30px;
        padding: 0 50px;
        width: 100%;
        height: 96px;
        background-color: #fff;
        .menu {
            display: flex;
            align-items: center;
            .menu-item {
                display: flex;
                align-items: center;
                justify-content: center;
                height: 32px;
                padding: 0 14px;
                border-radius: 8px;
                cursor: pointer;
                &.active {
                    background-color: #e1eee6;
                }
            }
        }
        .avatar {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-left: 20px;
            width: 43px;
            height: 43px;
            border-radius: 40px;
            background-color: #f5f5dc;
            font-size: 20px;
            cursor: pointer;
        }
    }
</style>
