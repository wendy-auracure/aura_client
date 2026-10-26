<template>
    <CourseFrame>
        <div class="classroom" @contextmenu.prevent>
            <header class="topbar">
                <button class="back" type="button" @click="back">返回课程</button>
                <div class="identity">
                    <h1>{{ currentLesson?.title }} · {{ currentLesson?.summary }}</h1>
                    <p>{{ currentStamp }}</p>
                </div>
                <div :class="['badge', { done: currentRow?.completed }]">{{ currentRow?.completed ? '已完成' : '未开始' }}</div>
            </header>
            <a-alert v-if="notice" class="notice" type="warning" :message="notice" show-icon />
            <div class="body">
                <nav class="rail">
                    <button
                        v-for="lesson in lessons"
                        :key="lesson.id"
                        type="button"
                        :class="['rail-item', { active: lesson.id === lessonId, done: progressMap[lesson.id]?.completed }]"
                        @click="selectLesson(lesson.id)"
                    >
                        <span class="num">{{ lesson.index }}</span>
                        <span class="rail-copy">
                            <strong>{{ lesson.summary }}</strong>
                            <small>{{ progressMap[lesson.id]?.completed ? '已完成' : lesson.title }}</small>
                        </span>
                    </button>
                </nav>
                <div class="main">
                    <section v-if="currentPoints.length" class="syllabus">
                        <h2>本节要点</h2>
                        <ul>
                            <li v-for="point in currentPoints" :key="point">{{ point }}</li>
                        </ul>
                    </section>
                    <div class="stage-bar">
                        <div class="tabs">
                            <button type="button" :class="{ on: panel === 'video' }" @click="panel = 'video'">授课录像</button>
                            <button type="button" :class="{ on: panel === 'notes' }" @click="showNotes">课件</button>
                        </div>
                        <button type="button" :class="['ask-toggle', { on: askOpen }]" @click="askOpen = !askOpen">课程答疑</button>
                    </div>
                    <div v-show="panel === 'video'" class="player">
                        <video
                            ref="videoRef"
                            controls
                            playsinline
                            controlsList="nodownload noplaybackrate"
                            disablePictureInPicture
                            @contextmenu.prevent
                            @loadedmetadata="resume"
                            @timeupdate="onTime"
                            @pause="remember()"
                            @ended="finishLesson"
                        ></video>
                        <div v-if="watermark" class="watermark">{{ watermark }}</div>
                        <div v-if="!videoReady" class="empty">授课录像准备中。</div>
                    </div>
                    <p v-show="panel === 'video'" class="hint">观看至结尾后，本节将自动标记为已完成。</p>
                    <div v-show="panel === 'notes'" class="sheet">
                        <div v-if="pdfTotal" class="pager">
                            <button type="button" :disabled="pdfPage <= 1" @click="stepPage(-1)">上一页</button>
                            <label>
                                第
                                <input v-model.number="pageInput" type="number" min="1" :max="pdfTotal" @change="jumpPage" />
                                页，共 {{ pdfTotal }} 页
                            </label>
                            <button type="button" :disabled="pdfPage >= pdfTotal" @click="stepPage(1)">下一页</button>
                        </div>
                        <div class="sheet-frame">
                            <div ref="pdfHost" class="pdf"></div>
                            <div v-if="pdfMessage" class="empty-notes">{{ pdfMessage }}</div>
                        </div>
                    </div>
                    <section v-show="askOpen" class="ask">
                        <div class="ask-head">
                            <div class="ask-title">课程答疑</div>
                            <button type="button" class="ask-close" @click="askOpen = false">收起</button>
                        </div>
                        <div class="prompts">
                            <button type="button" @click="sendAsk('本节的考核重点是什么？')">本节考核重点</button>
                            <button type="button" @click="sendAsk('本节有哪些易混概念？')">易混概念辨析</button>
                        </div>
                        <div class="thread">
                            <div v-for="(item, index) in thread" :key="index" :class="['bubble', item.role]">{{ item.content }}</div>
                            <div v-if="askBusy" class="bubble assistant">正在根据课件整理回答…</div>
                        </div>
                        <form class="composer" @submit.prevent="sendAsk()">
                            <input v-model="askText" type="text" maxlength="500" placeholder="请输入与本节内容相关的问题" />
                            <button type="submit" :disabled="askBusy || !askText.trim()">发送</button>
                        </form>
                    </section>
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
        FALLBACK_LESSONS,
        LESSON_POINTS,
        askCourse,
        beatLesson,
        courseErrorMessage,
        fetchCourse,
        fetchLessonPdf,
        openLesson,
        saveLessonProgress,
    } from '@/api/course';
    import { formatClock, formatWatchedAt, loadCourseProgress, patchLessonProgress } from './progress';

    const route = useRoute();
    const userStore = useUserStore();
    const previewSubscribed = import.meta.env.DEV && route.query.preview === 'subscribed';
    if (previewSubscribed && !userStore.uid) {
        userStore.uid = 'preview-subscriber';
        userStore.email = 'subscriber@example.com';
        userStore.first_name = 'A';
        userStore.last_name = 'Lee';
    }
    const lessons = ref(FALLBACK_LESSONS);
    const lessonId = ref('1');
    const watermark = ref('');
    const videoReady = ref(false);
    const pdfMessage = ref('');
    const pdfPage = ref(1);
    const pdfTotal = ref(0);
    const pageInput = ref(1);
    const notice = ref('');
    const panel = ref('video');
    const askOpen = ref(false);
    const progressMap = ref(loadCourseProgress());
    const threads = reactive({});
    const askText = ref('');
    const askBusy = ref(false);
    const videoRef = ref();
    const pdfHost = ref();
    let sessionId = '';
    let progressReady = false;
    let heartbeat = null;
    let hls = null;
    let pdfDoc = null;
    let pdfLoadedFor = '';
    let renderToken = 0;
    let lastSave = 0;
    let opened = false;

    const currentLesson = computed(() => lessons.value.find((lesson) => lesson.id === lessonId.value));
    const currentPoints = computed(() => LESSON_POINTS[Number(lessonId.value)] || []);
    const currentRow = computed(() => progressMap.value[lessonId.value] || null);
    const thread = computed(() => threads[lessonId.value] || []);
    const currentStamp = computed(() => {
        const row = currentRow.value;
        if (!row?.watchedAt) return '尚未开始学习';
        const when = formatWatchedAt(row.watchedAt);
        const at = row.positionSec > 0 ? ` · 进度 ${formatClock(row.positionSec)}` : '';
        return `最近学习 ${when}${at}`;
    });

    function courseBase() {
        return route.path.startsWith('/web') ? '/web/course' : '/course';
    }
    function courseQuery(extra = {}) {
        return previewSubscribed ? { preview: 'subscribed', ...extra } : extra;
    }
    function back() {
        router.push({ path: courseBase(), query: courseQuery() });
    }
    function signIn() {
        authClient.redirectToLoginPage({
            postLoginRedirectUrl: window.location.href || import.meta.env.VITE_CLIENT_APP_URL,
        });
    }
    function remember(forceComplete = false) {
        const video = videoRef.value;
        const rawTime = Number(video?.currentTime);
        const positionSec = Number.isFinite(rawTime) && rawTime > 1 ? Math.floor(rawTime) : undefined;
        const duration = Number(video?.duration || 0);
        const finished = forceComplete || (duration > 30 && positionSec / duration >= 0.9);
        patchLessonProgress(lessonId.value, {
            positionSec,
            completed: finished,
            watchedAt: new Date().toISOString(),
        });
        progressMap.value = loadCourseProgress();
        const row = progressMap.value[lessonId.value];
        if (!previewSubscribed && progressReady) {
            saveLessonProgress(lessonId.value, row.positionSec, row.pdfPage || 1, row.completed).catch(() => {});
        }
    }
    function finishLesson() {
        remember(true);
    }
    function destroyVideo() {
        if (hls) {
            hls.destroy();
            hls = null;
        }
        const video = videoRef.value;
        if (!video) return;
        video.pause();
        video.removeAttribute('src');
        video.load();
    }
    async function attachVideo(src) {
        destroyVideo();
        const video = videoRef.value;
        if (!video || !src) {
            videoReady.value = false;
            return;
        }
        const useHls = src.includes('.m3u8');
        if (!useHls) {
            video.src = src;
            videoReady.value = true;
            return;
        }
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = src;
            videoReady.value = true;
            return;
        }
        const { default: Hls } = await import('hls.js');
        if (Hls.isSupported()) {
            hls = new Hls();
            hls.loadSource(src);
            hls.attachMedia(video);
            videoReady.value = true;
            return;
        }
        video.src = src;
        videoReady.value = true;
    }
    function resume() {
        const row = progressMap.value[lessonId.value];
        const video = videoRef.value;
        if (!video || !row?.positionSec || row.positionSec < 1) return;
        if (video.duration && row.positionSec < video.duration - 2) video.currentTime = row.positionSec;
    }
    function stamp(ctx, width, height, label) {
        ctx.save();
        ctx.globalAlpha = 0.16;
        ctx.fillStyle = '#00796b';
        ctx.font = '18px sans-serif';
        ctx.translate(width * 0.12, height * 0.5);
        ctx.rotate(-0.5);
        for (let row = 0; row < 4; row += 1) {
            ctx.fillText(label, 0, row * 72);
        }
        ctx.restore();
    }
    async function renderPage(pageNumber) {
        const host = pdfHost.value;
        const doc = pdfDoc;
        if (!host || !doc) return;
        const token = ++renderToken;
        const safe = Math.min(Math.max(1, pageNumber), doc.numPages);
        pdfPage.value = safe;
        pageInput.value = safe;
        host.innerHTML = '';
        const page = await doc.getPage(safe);
        if (token !== renderToken) return;
        const cssWidth = Math.max(host.clientWidth || 960, 320);
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        const base = page.getViewport({ scale: 1 });
        const scale = Math.min((cssWidth * pixelRatio) / base.width, 3);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;
        if (token !== renderToken) return;
        stamp(ctx, canvas.width, canvas.height, watermark.value || 'Aura Course');
        host.appendChild(canvas);
        patchLessonProgress(lessonId.value, { pdfPage: safe });
        progressMap.value = loadCourseProgress();
    }
    function stepPage(delta) {
        renderPage(pdfPage.value + delta);
    }
    function jumpPage() {
        const next = Number(pageInput.value);
        renderPage(Number.isFinite(next) ? next : pdfPage.value);
    }
    function onPagerKey(event) {
        if (panel.value !== 'notes' || !pdfTotal.value) return;
        const tag = document.activeElement?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        if (event.key === 'ArrowLeft') stepPage(-1);
        if (event.key === 'ArrowRight') stepPage(1);
    }
    async function openPdf(blob) {
        if (pdfDoc) {
            pdfDoc.destroy();
            pdfDoc = null;
        }
        const pdfjs = await import('pdfjs-dist/build/pdf');
        const worker = await import('pdfjs-dist/build/pdf.worker.min.js?url');
        pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
        const data = new Uint8Array(await blob.arrayBuffer());
        pdfDoc = await pdfjs.getDocument({ data }).promise;
        pdfTotal.value = pdfDoc.numPages;
        const saved = progressMap.value[lessonId.value]?.pdfPage || 1;
        await renderPage(saved);
        pdfLoadedFor = lessonId.value;
    }
    async function previewPdf(id) {
        const response = await fetch(`http://127.0.0.1:8991/pdf/${id}`);
        if (!response.ok) throw new Error('pdf');
        return response.blob();
    }
    async function loadPdf() {
        pdfMessage.value = '课件加载中…';
        if (pdfHost.value) pdfHost.value.innerHTML = '';
        try {
            const blob = previewSubscribed ? await previewPdf(lessonId.value) : await fetchLessonPdf(lessonId.value);
            pdfMessage.value = '';
            await openPdf(blob);
        } catch (error) {
            const code = error?.response?.data?.error;
            pdfMessage.value = code === 'pdf_not_ready' || previewSubscribed ? '课件暂时无法打开，请稍后重试。' : courseErrorMessage(error);
        }
    }
    async function showNotes() {
        panel.value = 'notes';
        if (pdfLoadedFor === lessonId.value && pdfHost.value?.childElementCount) return;
        await loadPdf();
    }
    function onTime() {
        const now = Date.now();
        if (now - lastSave < 10000) return;
        lastSave = now;
        remember();
    }
    function startHeartbeat() {
        clearInterval(heartbeat);
        if (!sessionId) return;
        heartbeat = setInterval(async () => {
            try {
                await beatLesson(lessonId.value, sessionId);
            } catch (error) {
                if (error?.response?.status === 409) {
                    notice.value = '课程已在其他设备打开，当前播放已停止。';
                    destroyVideo();
                    clearInterval(heartbeat);
                }
            }
        }, 30000);
    }
    async function sendAsk(preset) {
        const question = String(preset || askText.value || '').trim();
        if (!question || askBusy.value) return;
        askText.value = '';
        if (!threads[lessonId.value]) threads[lessonId.value] = [];
        const history = threads[lessonId.value].slice(-8);
        threads[lessonId.value].push({ role: 'user', content: question });
        askBusy.value = true;
        try {
            const data = await askCourse(lessonId.value, question, history);
            threads[lessonId.value].push({ role: 'assistant', content: data.answer || '现有课件未涵盖该问题。' });
        } catch (error) {
            threads[lessonId.value].push({ role: 'assistant', content: courseErrorMessage(error) });
        } finally {
            askBusy.value = false;
        }
    }
    async function selectLesson(id) {
        if (!userStore.uid) {
            signIn();
            return;
        }
        if (opened && lessonId.value !== id) remember();
        progressReady = false;
        opened = true;
        lessonId.value = id;
        notice.value = '';
        panel.value = 'video';
        pdfLoadedFor = '';
        pdfTotal.value = 0;
        pdfPage.value = 1;
        if (pdfDoc) {
            pdfDoc.destroy();
            pdfDoc = null;
        }
        videoReady.value = false;
        router.replace({ path: `${courseBase()}/learn`, query: courseQuery({ lesson: id }) });
        if (previewSubscribed) {
            patchLessonProgress(id, { watchedAt: new Date().toISOString() });
            progressMap.value = loadCourseProgress();
            progressReady = true;
            watermark.value = userStore.email || 'subscriber@example.com';
            pdfMessage.value = '';
            if (pdfHost.value) pdfHost.value.innerHTML = '';
            try {
                const response = await fetch(`http://127.0.0.1:8991/video/${id}`);
                const data = response.ok ? await response.json() : {};
                await attachVideo(data.src || '');
            } catch {
                videoReady.value = false;
            }
            return;
        }
        try {
            const data = await openLesson(id);
            sessionId = data.sessionId || '';
            watermark.value = data.watermark || userStore.email || '';
            const local = loadCourseProgress()[id] || {};
            const server = data.progress || {};
            const localTime = local.watchedAt ? Date.parse(local.watchedAt) : 0;
            const serverTime = server.watchedAt ? Date.parse(server.watchedAt) : 0;
            const useLocal = localTime > serverTime;
            patchLessonProgress(id, {
                positionSec: useLocal ? local.positionSec || 0 : server.positionSec || 0,
                pdfPage: useLocal ? local.pdfPage || 1 : server.pdfPage || 1,
                completed: Boolean(local.completed) || Boolean(server.completed),
                watchedAt: new Date().toISOString(),
            });
            progressMap.value = loadCourseProgress();
            progressReady = true;
            await attachVideo(data.video?.src || '');
            startHeartbeat();
        } catch (error) {
            if (error?.response?.data?.error === 'no_access' || error?.response?.status === 401) {
                router.push({ path: courseBase() });
                return;
            }
            message.error(courseErrorMessage(error));
        }
    }
    onMounted(async () => {
        window.addEventListener('keydown', onPagerKey);
        if (previewSubscribed) {
            selectLesson(String(route.query.lesson || '1'));
            return;
        }
        if (!userStore.uid) {
            signIn();
            return;
        }
        try {
            const data = await fetchCourse();
            if (data.lessons?.length) lessons.value = data.lessons;
            if (!data.access?.active) {
                router.push({ path: courseBase() });
                return;
            }
        } catch (error) {
            router.push({ path: courseBase() });
            return;
        }
        selectLesson(String(route.query.lesson || '1'));
    });
    onBeforeUnmount(() => {
        window.removeEventListener('keydown', onPagerKey);
        clearInterval(heartbeat);
        if (opened) remember();
        destroyVideo();
        if (pdfDoc) pdfDoc.destroy();
    });
</script>
<style lang="scss" scoped>
    .classroom {
        @media print {
            display: none;
        }
    }
    .topbar {
        display: flex;
        align-items: flex-start;
        gap: 20px;
        margin-bottom: 18px;
        padding-bottom: 16px;
        border-bottom: 1px solid #e1eee6;
    }
    .back {
        margin-top: 4px;
        padding: 0;
        border: 0;
        background: transparent;
        color: #00796b;
        cursor: pointer;
        white-space: nowrap;
    }
    .identity {
        min-width: 0;
        h1 {
            margin: 0;
            color: #16332f;
            font-size: 22px;
            font-weight: 600;
            line-height: 1.3;
        }
        p {
            margin: 6px 0 0;
            color: #60706c;
            font-size: 13px;
        }
    }
    .badge {
        margin-left: auto;
        padding: 6px 12px;
        border-radius: 99px;
        background: #f3f5f4;
        color: #757575;
        white-space: nowrap;
        &.done {
            background: #e1eee6;
            color: #00796b;
            font-weight: 600;
        }
    }
    .notice {
        margin-bottom: 12px;
    }
    .body {
        display: grid;
        grid-template-columns: 232px minmax(0, 1fr);
        gap: 20px;
        align-items: start;
        @media (max-width: 860px) {
            grid-template-columns: 1fr;
        }
    }
    .rail {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 8px;
        border-radius: 14px;
        background: #f4f8f6;
        @media (min-width: 861px) {
            position: sticky;
            top: 0;
        }
    }
    .rail-item {
        display: flex;
        gap: 10px;
        align-items: flex-start;
        padding: 10px;
        border: 0;
        border-radius: 10px;
        background: transparent;
        text-align: left;
        cursor: pointer;
        &.active {
            background: #fff;
            box-shadow: 0 1px 2px rgba(0, 80, 70, 0.08);
        }
        &.done .num {
            background: #00796b;
            color: #fff;
        }
    }
    .num {
        display: inline-flex;
        flex: 0 0 26px;
        align-items: center;
        justify-content: center;
        width: 26px;
        height: 26px;
        border-radius: 8px;
        background: #e1eee6;
        color: #00796b;
        font-size: 13px;
        font-weight: 600;
    }
    .rail-copy {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
        strong {
            color: #16332f;
            font-weight: 600;
            line-height: 1.35;
        }
        small {
            color: #7a8884;
            font-size: 12px;
        }
    }
    .rail-item.active .rail-copy strong {
        color: #00796b;
    }
    .syllabus {
        margin-bottom: 16px;
        padding: 14px 16px;
        border-radius: 14px;
        background: #f4f8f6;
        h2 {
            margin: 0 0 8px;
            color: #00796b;
            font-size: 15px;
            font-weight: 600;
        }
        ul {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px 18px;
            margin: 0;
            padding-left: 18px;
            color: #243532;
            line-height: 1.5;
        }
    }
    .stage-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 12px;
    }
    .tabs {
        display: flex;
        padding: 4px;
        border-radius: 999px;
        background: #f4f8f6;
        button {
            padding: 7px 16px;
            border: 0;
            border-radius: 999px;
            background: transparent;
            color: #60706c;
            cursor: pointer;
            &.on {
                background: #00796b;
                color: #fff;
            }
        }
    }
    .ask-toggle,
    .ask-close {
        padding: 7px 14px;
        border: 1px solid #d5e6e0;
        border-radius: 999px;
        background: #fff;
        color: #00796b;
        cursor: pointer;
        &.on {
            background: #e1eee6;
        }
    }
    .player {
        position: relative;
        overflow: hidden;
        border-radius: 16px;
        background: #111;
        aspect-ratio: 16 / 9;
        box-shadow: 0 10px 30px rgba(16, 40, 36, 0.12);
        video {
            width: 100%;
            height: 100%;
            background: #111;
        }
    }
    .hint,
    .empty-notes {
        margin: 10px 0 0;
        color: #7a8884;
        font-size: 13px;
    }
    .empty-notes {
        padding: 48px 16px;
        text-align: center;
    }
    .watermark {
        position: absolute;
        top: 18px;
        left: 18px;
        color: rgba(255, 255, 255, 0.82);
        font-size: 13px;
        letter-spacing: 0.02em;
        pointer-events: none;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.55);
        animation: drift 16s linear infinite alternate;
    }
    .empty {
        position: absolute;
        right: 24px;
        bottom: 24px;
        left: 24px;
        color: rgba(255, 255, 255, 0.82);
        text-align: center;
    }
    .sheet {
        padding: 16px 16px 12px;
        border-radius: 16px;
        background: #eef3f1;
    }
    .sheet-frame {
        overflow: hidden;
        border-radius: 10px;
        background: #fff;
        box-shadow: 0 8px 24px rgba(16, 40, 36, 0.08);
    }
    .pager {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 16px;
        margin-bottom: 12px;
        button {
            min-width: 76px;
            padding: 8px 14px;
            border: 0;
            border-radius: 999px;
            background: #fff;
            color: #00796b;
            cursor: pointer;
            box-shadow: 0 1px 2px rgba(16, 40, 36, 0.06);
            &:disabled {
                color: #b7c4c0;
                cursor: default;
            }
        }
        label {
            color: #60706c;
            font-size: 14px;
        }
        input {
            width: 52px;
            margin: 0 6px;
            padding: 6px 4px;
            border: 1px solid #d5e6e0;
            border-radius: 8px;
            background: #fff;
            text-align: center;
        }
    }
    .pdf {
        :deep(canvas) {
            display: block;
            width: 100%;
            height: auto;
            user-select: none;
        }
    }
    .ask {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-top: 16px;
        padding: 16px;
        border: 1px solid #e1eee6;
        border-radius: 16px;
        background: #f7fbf9;
    }
    .ask-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    .ask-title {
        color: #16332f;
        font-weight: 600;
    }
    .prompts {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        button {
            padding: 6px 10px;
            border: 1px solid #d5e6e0;
            border-radius: 999px;
            background: #fff;
            color: #00796b;
            cursor: pointer;
        }
    }
    .thread {
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-height: 280px;
        overflow: auto;
    }
    .bubble {
        max-width: 78%;
        padding: 10px 12px;
        border-radius: 12px;
        line-height: 1.55;
        white-space: pre-wrap;
        &.user {
            align-self: flex-end;
            background: #00796b;
            color: #fff;
        }
        &.assistant {
            align-self: flex-start;
            background: #fff;
            color: #16332f;
        }
    }
    .composer {
        display: flex;
        gap: 8px;
        input {
            flex: 1;
            min-width: 0;
            padding: 10px 12px;
            border: 1px solid #d5e6e0;
            border-radius: 12px;
            background: #fff;
        }
        button {
            padding: 10px 16px;
            border: 0;
            border-radius: 12px;
            background: #00796b;
            color: #fff;
            cursor: pointer;
            &:disabled {
                opacity: 0.45;
                cursor: default;
            }
        }
    }
    @keyframes drift {
        from {
            top: 18px;
            left: 18px;
        }
        to {
            top: 46%;
            left: 42%;
        }
    }
</style>
