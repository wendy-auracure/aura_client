<template>
    <CourseFrame>
        <div class="course">
            <div class="heading">{{ courseTitle }}</div>
            <div class="price">{{ priceLabel }}</div>
            <div v-if="expiryLabel" class="expiry">{{ expiryLabel }}</div>
            <div class="lede">共十节录播。每节含授课录像与课件，一次购买后可学习六个月。</div>
            <a-alert v-if="banner" class="banner" :type="banner.type" :message="banner.text" show-icon />
            <div class="actions">
                <a-button v-if="!signedIn" type="primary" size="large" @click="signIn">登录并购买</a-button>
                <a-button v-else-if="!access?.active" type="primary" size="large" :loading="busy" @click="subscribe">
                    购买 · {{ priceLabel }}
                </a-button>
                <a-button v-else type="primary" size="large" @click="continueCourse">{{ continueLabel }}</a-button>
            </div>
            <div class="terms">一次付款 CAD $150，自购买起 6 个月内可学习，到期后需再次购买。课程仅授权本人使用，请勿录制或转发。</div>
            <div v-if="access?.active" class="progress">
                <div class="progress-label">已完成 {{ learnedCount }} / {{ lessons.length }}</div>
                <div class="bar"><div class="bar-fill" :style="{ width: learnedWidth }"></div></div>
            </div>
            <div class="list">
                <div
                    :class="['lesson', { 'can-open': access?.active, done: lessonDone(lesson) }]"
                    v-for="lesson in lessons"
                    :key="lesson.id"
                    @click="openLesson(lesson)"
                >
                    <div class="index">{{ lesson.index }}</div>
                    <div class="copy">
                        <div class="title">{{ lesson.title }}　{{ lesson.summary }}</div>
                        <div class="meta">授课录像与课件</div>
                        <div v-if="lessonStamp(lesson)" class="stamp">{{ lessonStamp(lesson) }}</div>
                    </div>
                    <div :class="['state', { open: access?.active, done: lessonDone(lesson) }]">{{ lessonState(lesson) }}</div>
                </div>
            </div>
        </div>
    </CourseFrame>
</template>
<script setup>
    import { message } from 'ant-design-vue';
    import { useRoute } from 'vue-router';
    import router from '@/routers/index';
    import { authClient } from '@/utils/supabase';
    import { useUserStore } from '@/stores/modules/system/user';
    import CourseFrame from './CourseFrame.vue';
    import {
        COURSE_PRICE_LABEL,
        COURSE_TITLE,
        FALLBACK_LESSONS,
        confirmCourseCheckout,
        courseErrorMessage,
        createCourseCheckout,
        courseExpiryLabel,
        fetchCourse,
        formatAccessUntil,
    } from '@/api/course';
    import { applyServerProgress, continueLessonId, formatClock, formatWatchedAt, loadCourseProgress } from './progress';

    const route = useRoute();
    const userStore = useUserStore();
    const previewSubscribed = import.meta.env.DEV && route.query.preview === 'subscribed';
    if (previewSubscribed && !userStore.uid) {
        userStore.uid = 'preview-subscriber';
        userStore.email = 'subscriber@example.com';
        userStore.first_name = 'A';
        userStore.last_name = 'Lee';
    }
    const signedIn = computed(() => Boolean(userStore.uid));
    const lessons = ref(FALLBACK_LESSONS);
    const access = ref(
        previewSubscribed
            ? {
                  active: true,
                  status: 'active',
                  reason: 'active',
                  cancelAtPeriodEnd: false,
                  currentPeriodEnd: '2027-01-25T12:00:00.000Z',
              }
            : null
    );
    const busy = ref(false);
    const loadError = ref(false);
    const serviceError = ref('');
    const priceLabel = COURSE_PRICE_LABEL;
    const courseTitle = COURSE_TITLE;
    const progress = ref(loadCourseProgress());
    let pollTimer = null;

    const learnedCount = computed(() => lessons.value.filter((lesson) => progress.value[lesson.id]?.completed).length);
    const learnedWidth = computed(() => `${lessons.value.length ? Math.round((learnedCount.value / lessons.value.length) * 100) : 0}%`);
    const continueLabel = computed(() => (Object.values(progress.value).some((row) => row?.watchedAt) ? '继续学习' : '开始学习'));
    const expiryLabel = computed(() => courseExpiryLabel(access.value));

    const banner = computed(() => {
        if (serviceError.value) {
            return { type: 'warning', text: courseErrorMessage({ response: { data: { error: serviceError.value } } }) };
        }
        if (loadError.value) return { type: 'warning', text: '课程目录暂时无法加载，当前显示的是课程纲要。' };
        if (access.value?.reason === 'past_due_grace') {
            return { type: 'warning', text: '最近一次扣款未成功。请在 3 日内更新付款方式，以免中断学习。' };
        }
        if (access.value?.reason === 'past_due') {
            return { type: 'error', text: '课程访问已暂停，请更新付款方式后继续。' };
        }
        if (access.value?.reason === 'canceled_period' || access.value?.cancelAtPeriodEnd) {
            const until = formatAccessUntil(access.value.currentPeriodEnd);
            return { type: 'info', text: until ? `订阅已取消，学习权限保留至 ${until}。` : '订阅已取消，学习权限保留至本计费周期结束。' };
        }
        if (route.query.checkout === 'cancel') return { type: 'info', text: '已取消本次订阅。' };
        if (route.query.checkout === 'success' && access.value?.active) return { type: 'success', text: '订阅已生效，可以开始学习。' };
        if (route.query.checkout === 'success') return { type: 'info', text: '付款已收到，正在确认课程权限。' };
        return null;
    });

    function courseBase() {
        return route.path.startsWith('/web') ? '/web/course' : '/course';
    }
    function courseQuery(extra = {}) {
        return previewSubscribed ? { preview: 'subscribed', ...extra } : extra;
    }
    function signIn() {
        authClient.redirectToLoginPage({
            postLoginRedirectUrl: window.location.href || import.meta.env.VITE_CLIENT_APP_URL,
        });
    }
    function lessonRow(lesson) {
        return progress.value[lesson.id] || null;
    }
    function lessonDone(lesson) {
        return Boolean(lessonRow(lesson)?.completed);
    }
    function lessonState(lesson) {
        if (!access.value?.active) return '未购买';
        if (lessonDone(lesson)) return '已完成';
        if (lessonRow(lesson)?.watchedAt) return '学习中';
        return '未开始';
    }
    function lessonStamp(lesson) {
        const row = lessonRow(lesson);
        if (!access.value?.active || !row?.watchedAt) return '';
        const when = formatWatchedAt(row.watchedAt);
        const at = row.positionSec > 0 ? ` · 进度 ${formatClock(row.positionSec)}` : '';
        return `最近学习 ${when}${at}`;
    }
    function continueCourse() {
        const lessonId = continueLessonId(lessons.value, progress.value);
        router.push({ path: `${courseBase()}/learn`, query: courseQuery({ lesson: lessonId }) });
    }
    function openLesson(lesson) {
        if (!access.value?.active) return;
        router.push({ path: `${courseBase()}/learn`, query: courseQuery({ lesson: lesson.id }) });
    }
    async function subscribe() {
        busy.value = true;
        try {
            const data = await createCourseCheckout();
            window.location.href = data.url;
        } catch (error) {
            message.error(courseErrorMessage(error));
            busy.value = false;
        }
    }
    async function load(attempt = 0) {
        if (previewSubscribed) return;
        try {
            if (attempt === 0 && route.query.session_id) {
                await confirmCourseCheckout(String(route.query.session_id)).catch(() => {});
            }
            const data = await fetchCourse();
            lessons.value = data.lessons?.length ? data.lessons : FALLBACK_LESSONS;
            access.value = data.access;
            if (Array.isArray(data.progress)) progress.value = applyServerProgress(data.progress);
            serviceError.value = data.error || '';
            loadError.value = false;
            if (route.query.checkout === 'success' && !data.access?.active && attempt < 4) {
                pollTimer = setTimeout(() => load(attempt + 1), 2000);
            }
        } catch {
            lessons.value = FALLBACK_LESSONS;
            loadError.value = true;
        }
    }
    onMounted(() => {
        progress.value = loadCourseProgress();
        load();
    });
    onBeforeUnmount(() => {
        clearTimeout(pollTimer);
    });
</script>
<style lang="scss" scoped>
    .course {
        max-width: 820px;
    }
    .heading {
        color: #00796b;
        font-weight: bold;
        font-size: 26px;
    }
    .price {
        margin-top: 8px;
        font-size: 18px;
    }
    .expiry {
        margin-top: 6px;
        color: #424242;
    }
    .lede,
    .terms {
        margin-top: 12px;
        color: #757575;
        line-height: 1.6;
    }
    .section-title {
        margin-top: 28px;
        color: #00796b;
        font-weight: 600;
    }
    .outcomes ul,
    .points {
        margin: 8px 0 0;
        padding-left: 18px;
        color: #424242;
        line-height: 1.6;
    }
    .list-title {
        margin-bottom: 0;
    }
    .banner {
        margin-top: 16px;
    }
    .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 20px;
    }
    .list {
        margin-top: 12px;
    }
    .lesson {
        display: flex;
        align-items: flex-start;
        margin-bottom: 10px;
        padding: 14px;
        border: 1px solid #e1eee6;
        border-radius: 8px;
        cursor: default;
        &.can-open {
            cursor: pointer;
        }
    }
    .index {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 8px;
        background: #e1eee6;
        color: #00796b;
        font-weight: 600;
    }
    .copy {
        margin-left: 12px;
    }
    .title {
        font-weight: 600;
    }
    .meta {
        margin-top: 4px;
        color: #757575;
        font-size: 13px;
    }
    .progress {
        margin-top: 22px;
    }
    .progress-label {
        margin-bottom: 8px;
        color: #00796b;
        font-weight: 600;
    }
    .bar {
        height: 8px;
        border-radius: 99px;
        background: #e1eee6;
        overflow: hidden;
    }
    .bar-fill {
        height: 100%;
        background: #00796b;
    }
    .stamp {
        margin-top: 4px;
        color: #00796b;
        font-size: 13px;
    }
    .state {
        margin-top: 8px;
        margin-left: auto;
        color: #757575;
        white-space: nowrap;
        &.open {
            color: #00796b;
        }
        &.done {
            color: #00796b;
            font-weight: 600;
        }
    }
    .lesson.done .index {
        background: #00796b;
        color: #fff;
    }
</style>
