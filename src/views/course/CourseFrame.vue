<template>
    <WebNav v-if="!isMobile"></WebNav>
    <div class="container">
        <div class="nav" v-if="isMobile">
            <MenuOutlined id="menu" @click="openLogin" />
            <span class="title">Aura Cure</span>
        </div>
        <div :class="['content', { mobile: isMobile }]">
            <slot></slot>
        </div>
        <LoginDrawer ref="loginDrawer"></LoginDrawer>
    </div>
</template>
<script setup>
    import WebNav from '@/views/web/web-nav.vue';
    import LoginDrawer from '@/components/LoginDrawer.vue';

    const loginDrawer = ref();
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent || '');
    const openLogin = () => {
        loginDrawer.value.openModal();
    };
</script>
