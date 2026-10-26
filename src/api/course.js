import axios from 'axios';
import { authClient } from '@/utils/supabase';

export const COURSE_PRICE_LABEL = '每三个月 CAD $150';
export const COURSE_TITLE = '加拿大针灸统考考前辅导';

export const COURSE_ABOUT = [
    '这是一套加拿大针灸统考的考前辅导，共十节录播。每节先讲一块考试范围，再拆疑难选择题和病例，把口诀、辨证和选穴接到同一套答题习惯上。',
    '适合正在准备执照考试、需要把中医基础、诊法、经络穴位、针刺手法和执业安全串起来的人。课程不按直播日期排列，可以按自己的进度反复看。',
    '每一节都有一节录像和一份课件。订阅后才能打开。看到结尾会自动标成已学，并记下上次观看到的时间。',
];

export const COURSE_OUTCOMES = [
    '必背口诀和图表：五输穴、四总穴、十二经顺序',
    '脉诊、舌诊、八纲和脏腑辨证',
    '经络走向、特定穴、奇穴、耳针和常见病选穴',
    '补泻手法、针刺异常、消毒和加拿大执业规范',
];

export const LESSON_POINTS = {
    1: ['复习安排、答题计时与复核', '五输穴歌与四总穴歌', '十二经顺序及阴经五输穴', '辨证、原络配穴与五行例题'],
    2: ['阴阳五行与气血津液', '五脏六腑及奇恒之腑', '十二经、奇经八脉、病因与体质', '脾气虚与脾不统血的鉴别'],
    3: ['平脉与二十八脉', '浮沉、迟数、虚实', '常舌与常见舌苔', '亡阴亡阳、寒湿蕴脾与胃阴虚'],
    4: ['阴阳、表里、寒热、虚实', '半表半里与真寒假热', '气虚与阳虚、血虚与阴虚', '六淫、七情、饮食劳逸及痰饮瘀血'],
    5: ['症状与脏腑归属', '补泻原则与选穴', '前期内容复习', '脾气虚、寒湿与湿热的鉴别'],
    6: ['十二经走向与头面分布', '流注与奇经八脉', '五输、原络、郄穴、下合与俞募', '八会、八脉交会及交会穴'],
    7: ['常用经外奇穴', '耳穴定位与选穴原则', '头针与推拿', '拔罐、艾灸与特效穴'],
    8: ['禁针、慎针与妊娠禁忌', '提插、捻转等补泻手法', '晕针、滞针、弯针、断针与脏器损伤', '三棱针、皮肤针与皮内针'],
    9: ['常用穴位主治', '内科、痛证与妇科选穴', '中西医病名对照', '头皮针分区'],
    10: ['知情同意、病历与医患界限', '血管与脏器的避让', '消毒、洁针与个人防护', '断针与不良反应处理'],
};

export const FALLBACK_LESSONS = [
    { id: '1', index: 1, title: '第一节', summary: '复习方法与考试技巧', hasVideo: false, hasPdf: false },
    { id: '2', index: 2, title: '第二节', summary: '阴阳五行、脏腑经络', hasVideo: false, hasPdf: false },
    { id: '3', index: 3, title: '第三节', summary: '脉诊与舌诊', hasVideo: false, hasPdf: false },
    { id: '4', index: 4, title: '第四节', summary: '八纲辨证', hasVideo: false, hasPdf: false },
    { id: '5', index: 5, title: '第五节', summary: '脏腑辨证', hasVideo: false, hasPdf: false },
    { id: '6', index: 6, title: '第六节', summary: '经络与特定穴', hasVideo: false, hasPdf: false },
    { id: '7', index: 7, title: '第七节', summary: '奇穴、耳针、头针与艾灸拔罐', hasVideo: false, hasPdf: false },
    { id: '8', index: 8, title: '第八节', summary: '补泻手法与特殊针法', hasVideo: false, hasPdf: false },
    { id: '9', index: 9, title: '第九节', summary: '常用穴功效与常见病选穴', hasVideo: false, hasPdf: false },
    { id: '10', index: 10, title: '第十节', summary: '法规与操作安全', hasVideo: false, hasPdf: false },
];

function apiUrl(path) {
    return `${import.meta.env.VITE_APP_API_URL}/api/${path}`;
}

export async function courseAuthHeader() {
    const info = await authClient.getAuthenticationInfoOrNull();
    if (!info?.accessToken) return {};
    return { Authorization: `Bearer ${info.accessToken}` };
}

async function post(path, data = {}, extra = {}) {
    const headers = {
        'Content-type': 'application/json',
        ...(await courseAuthHeader()),
    };
    const response = await axios({
        url: apiUrl(path),
        method: 'POST',
        headers,
        data,
        ...extra,
    });
    return response;
}

export async function fetchCourse() {
    const response = await post('course', {});
    return response.data;
}

export async function createCourseCheckout() {
    const response = await post('course-checkout', {});
    return response.data;
}

export async function createCoursePortal() {
    const response = await post('course-portal', {});
    return response.data;
}

export async function confirmCourseCheckout(sessionId) {
    const response = await post('course-confirm', { sessionId });
    return response.data;
}

export async function openLesson(lessonId) {
    const response = await post('course-playback', { lessonId });
    return response.data;
}

export async function beatLesson(lessonId, sessionId) {
    const response = await post('course-heartbeat', { lessonId, sessionId });
    return response.data;
}

export async function saveLessonProgress(lessonId, positionSec, pdfPage, completed = false) {
    const response = await post('course-progress', { lessonId, positionSec, pdfPage, completed });
    return response.data;
}

export async function askCourse(lessonId, question, history = []) {
    const preview = import.meta.env.DEV && new URLSearchParams(window.location.search).get('preview') === 'subscribed';
    if (preview) {
        const response = await axios.post('http://127.0.0.1:8991/ask', { lessonId, question, history });
        return response.data;
    }
    const response = await post('course-ask', { lessonId, question, history });
    return response.data;
}

export async function fetchLessonPdf(lessonId) {
    const response = await post('course-pdf', { lessonId }, { responseType: 'blob' });
    const type = response.headers['content-type'] || '';
    if (type.includes('application/json')) {
        const text = await response.data.text();
        const body = JSON.parse(text);
        const error = new Error(body.error || 'pdf_not_ready');
        error.response = { data: body };
        throw error;
    }
    return response.data;
}

export function courseErrorMessage(error) {
    const code = error?.response?.data?.error;
    if (code === 'stripe_not_configured') return '支付尚未开通，请稍后再试。';
    if (code === 'schema_missing') return '课程服务尚未就绪，请稍后再试。';
    if (code === 'unauthorized') return '请先登录后再继续。';
    if (code === 'already_subscribed') return '当前账号已开通课程。';
    if (code === 'customer_not_found') return '还没有可管理的付款信息。';
    if (code === 'no_access') return '需要有效订阅才能学习本节。';
    if (code === 'session_replaced') return '课程已在其他设备打开。';
    if (code === 'pdf_not_ready' || code === 'video_not_ready') return '本节资料尚未提供。';
    if (code === 'openai_not_configured' || code === 'openai_request_failed') return '课程答疑暂时无法使用，请稍后再试。';
    if (!error?.response) return '课程服务暂时无法连接，请稍后再试。';
    return '操作未完成，请重试。';
}

export function formatAccessUntil(iso) {
    if (!iso) return '';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

export function courseExpiryLabel(access) {
    const until = formatAccessUntil(access?.currentPeriodEnd);
    if (!until) return '';
    const end = Date.parse(access.currentPeriodEnd);
    if (!access?.active && Number.isFinite(end) && end <= Date.now()) return `已于 ${until} 到期`;
    if (access?.active && !access.cancelAtPeriodEnd && access.reason !== 'canceled_period') {
        return `有效期至 ${until}，到期自动续费`;
    }
    return `有效期至 ${until}`;
}
