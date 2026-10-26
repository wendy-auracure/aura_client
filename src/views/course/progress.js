const KEY = 'aura-course-progress-v1';

export function loadCourseProgress() {
    try {
        const parsed = JSON.parse(localStorage.getItem(KEY) || '{}');
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
}

export function patchLessonProgress(lessonId, patch) {
    const all = loadCourseProgress();
    const prev = all[lessonId] || {};
    all[lessonId] = {
        positionSec: patch.positionSec ?? prev.positionSec ?? 0,
        pdfPage: patch.pdfPage ?? prev.pdfPage ?? 1,
        completed: patch.completed === true ? true : Boolean(prev.completed),
        watchedAt: patch.watchedAt || prev.watchedAt || new Date().toISOString(),
    };
    localStorage.setItem(KEY, JSON.stringify(all));
    return all[lessonId];
}

export function applyServerProgress(rows) {
    if (!Array.isArray(rows) || !rows.length) return loadCourseProgress();
    const all = loadCourseProgress();
    for (const row of rows) {
        if (!row?.lessonId) continue;
        const prev = all[row.lessonId] || {};
        const watchedAt = row.watchedAt || prev.watchedAt || null;
        const serverTime = watchedAt ? Date.parse(watchedAt) : 0;
        const localTime = prev.watchedAt ? Date.parse(prev.watchedAt) : 0;
        if (localTime > serverTime) continue;
        all[row.lessonId] = {
            positionSec: row.positionSec ?? prev.positionSec ?? 0,
            pdfPage: row.pdfPage ?? prev.pdfPage ?? 1,
            completed: Boolean(row.completed) || Boolean(prev.completed),
            watchedAt,
        };
    }
    localStorage.setItem(KEY, JSON.stringify(all));
    return all;
}

export function continueLessonId(lessons, progress) {
    const rows = lessons.map((lesson) => ({ id: lesson.id, ...(progress[lesson.id] || {}) }));
    const watching = rows
        .filter((row) => row.watchedAt && !row.completed)
        .sort((a, b) => String(b.watchedAt).localeCompare(String(a.watchedAt)));
    if (watching[0]) return watching[0].id;
    const fresh = rows.find((row) => !row.completed);
    return fresh?.id || lessons[0]?.id || '1';
}

export function formatWatchedAt(iso) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${date.getMonth() + 1}月${date.getDate()}日 ${hour}:${minute}`;
}

export function formatClock(sec) {
    const total = Math.max(0, Math.floor(Number(sec) || 0));
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
