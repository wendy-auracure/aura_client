// 页面路由
export default [
    {
        path: '/:pathMatch(.*)',
        name: 'all',
        meta: {
            title: 'Home',
        },
        component: () => import('@/views/home.vue'),
    },
    {
        path: '/',
        name: 'home',
        meta: {
            title: 'Home',
        },
        component: () => import('@/views/home.vue'),
    },
    {
        path: '/blog',
        name: 'blog',
        meta: {
            title: 'Blog',
        },
        component: () => import('@/views/blog.vue'),
    },
    {
        path: '/discover',
        name: 'discover',
        meta: {
            title: 'Discover',
        },
        component: () => import('@/views/discover.vue'),
    },
    {
        path: '/clinic',
        name: 'clinic',
        meta: {
            title: 'Clinic',
        },
        component: () => import('@/views/clinic.vue'),
    },
    {
        path: '/past',
        name: 'past',
        meta: {
            title: 'Past Visits',
        },
        component: () => import('@/views/past.vue'),
    },
    {
        path: '/note',
        name: 'note',
        meta: {
            title: 'Note',
        },
        component: () => import('@/views/pastDetail.vue'),
    },
    {
        path: '/rate-list',
        name: 'rate-list',
        meta: {
            title: 'Rate',
        },
        component: () => import('@/views/rateList.vue'),
    },
    {
        path: '/rate-page',
        name: 'rate-page',
        meta: {
            title: 'Rate',
        },
        component: () => import('@/views/ratePage.vue'),
    },
    {
        path: '/rate-success',
        name: 'rate-success',
        meta: {
            title: 'Rate Success',
        },
        component: () => import('@/views/rateSuccess.vue'),
    },
    {
        path: '/intake-form',
        name: 'intake-form',
        meta: {
            title: 'Intake Form',
        },
        component: () => import('@/views/intake.vue'),
    },
    {
        path: '/intake-success',
        name: 'intake-success',
        meta: {
            title: 'Intake success',
        },
        component: () => import('@/views/intakeSuccess.vue'),
    },
    {
        path: '/intake-fail',
        name: 'intake-fail',
        meta: {
            title: 'Intake fail',
        },
        component: () => import('@/views/intakeFail.vue'),
    },
    {
        path: '/upcoming',
        name: 'upcoming',
        meta: {
            title: 'Upcoming Visits',
        },
        component: () => import('@/views/upcoming.vue'),
    },
    {
        path: '/schedule/index',
        name: 'schedule-index',
        meta: {
            title: 'Schedule',
        },
        component: () => import('@/views/schedule/index.vue'),
    },
    {
        path: '/schedule/visited',
        name: 'schedule-visited',
        meta: {
            title: 'Schedule',
        },
        component: () => import('@/views/schedule/visited.vue'),
    },
    {
        path: '/schedule/service',
        name: 'schedule-service',
        meta: {
            title: 'Schedule',
        },
        component: () => import('@/views/schedule/service.vue'),
    },
    {
        path: '/schedule/staff',
        name: 'schedule-staff',
        meta: {
            title: 'Schedule',
        },
        component: () => import('@/views/schedule/staff.vue'),
    },
    {
        path: '/schedule/date',
        name: 'schedule-date',
        meta: {
            title: 'Schedule',
        },
        component: () => import('@/views/schedule/date.vue'),
    },
    {
        path: '/schedule/confirm',
        name: 'schedule-confirm',
        meta: {
            title: 'Schedule',
        },
        component: () => import('@/views/schedule/confirm.vue'),
    },
    {
        path: '/schedule/confirmed',
        name: 'schedule-confirmed',
        meta: {
            title: 'Schedule',
        },
        component: () => import('@/views/schedule/confirmed.vue'),
    },
    {
        path: '/schedule/canceled',
        name: 'schedule-canceled',
        meta: {
            title: 'Schedule',
        },
        component: () => import('@/views/schedule/canceled.vue'),
    },
    {
        path: '/schedule/intake',
        name: 'schedule-intake',
        meta: {
            title: 'Intake Form',
        },
        component: () => import('@/views/schedule/intake.vue'),
    },
    {
        path: '/schedule/intake-success',
        name: 'schedule-intake-success',
        meta: {
            title: 'Intake success',
        },
        component: () => import('@/views/schedule/intakeSuccess.vue'),
    },
    {
        path: '/schedule/intake-fail',
        name: 'schedule-intake-fail',
        meta: {
            title: 'Intake fail',
        },
        component: () => import('@/views/schedule/intakeFail.vue'),
    },
    {
        path: '/schedule/profile',
        name: 'schedule-profile',
        meta: {
            title: 'Schedule',
        },
        component: () => import('@/views/schedule/profile.vue'),
    },
    {
        path: '/schedule/reschedule',
        name: 'schedule-reschedule',
        meta: {
            title: 'Schedule',
        },
        component: () => import('@/views/schedule/reschedule.vue'),
    },

    // web
    {
        path: '/web/',
        name: 'web-home',
        meta: {
            title: 'Home',
        },
        component: () => import('@/views/web/home.vue'),
    },
    {
        path: '/web/discover',
        name: 'web-discover',
        meta: {
            title: 'Discover',
        },
        component: () => import('@/views/web/discover.vue'),
    },
    {
        path: '/web/blog',
        name: 'web-blog',
        meta: {
            title: 'Blog',
        },
        component: () => import('@/views/blog.vue'),
    },
    {
        path: '/web/clinic',
        name: 'web-clinic',
        meta: {
            title: 'Clinic',
        },
        component: () => import('@/views/web/clinic.vue'),
    },
    {
        path: '/web/past',
        name: 'web-past',
        meta: {
            title: 'Past Visits',
        },
        component: () => import('@/views/web/past.vue'),
    },
    {
        path: '/web/note',
        name: 'web-note',
        meta: {
            title: 'Note',
        },
        component: () => import('@/views/pastDetail.vue'),
    },
    {
        path: '/web/rate-list',
        name: 'web-rate-list',
        meta: {
            title: 'Rate',
        },
        component: () => import('@/views/web/rateList.vue'),
    },
    {
        path: '/web/rate-page',
        name: 'web-rate-page',
        meta: {
            title: 'Rate',
        },
        component: () => import('@/views/web/ratePage.vue'),
    },
    {
        path: '/web/rate-success',
        name: 'web-rate-success',
        meta: {
            title: 'Rate Success',
        },
        component: () => import('@/views/web/rateSuccess.vue'),
    },
    {
        path: '/web/signup',
        name: 'web-signup',
        meta: {
            title: 'Sign Up',
        },
        component: () => import('@/views/signup.vue'),
    },
    {
        path: '/signup',
        name: 'signup',
        meta: {
            title: 'Sign Up',
        },
        component: () => import('@/views/signup.vue'),
    },
    {
        path: '/web/intake-form',
        name: 'web-intake-form',
        meta: {
            title: 'Intake Form',
        },
        component: () => import('@/views/intake.vue'),
    },
    {
        path: '/web/intake-success',
        name: 'web-intake-success',
        meta: {
            title: 'Intake success',
        },
        component: () => import('@/views/intakeSuccess.vue'),
    },
    {
        path: '/web/intake-fail',
        name: 'web-intake-fail',
        meta: {
            title: 'Intake fail',
        },
        component: () => import('@/views/intakeFail.vue'),
    },
    {
        path: '/web/upcoming',
        name: 'web-upcoming',
        meta: {
            title: 'Upcoming Visits',
        },
        component: () => import('@/views/web/upcoming.vue'),
    },
    {
        path: '/web/schedule/index',
        name: 'web-schedule-index',
        meta: {
            title: 'Schedule',
        },
        component: () => import('@/views/schedule/index.vue'),
    },
    {
        path: '/web/schedule/visited',
        name: 'web-schedule-visited',
        meta: {
            title: 'Schedule',
        },
        component: () => import('@/views/schedule/visited.vue'),
    },
    {
        path: '/web/schedule/service',
        name: 'web-schedule-service',
        meta: {
            title: 'Schedule',
        },
        component: () => import('@/views/schedule/service.vue'),
    },
    {
        path: '/web/schedule/staff',
        name: 'web-schedule-staff',
        meta: {
            title: 'Schedule',
        },
        component: () => import('@/views/schedule/staff.vue'),
    },
    {
        path: '/web/schedule/date',
        name: 'web-schedule-date',
        meta: {
            title: 'Schedule',
        },
        component: () => import('@/views/schedule/date.vue'),
    },
    {
        path: '/web/schedule/confirm',
        name: 'web-schedule-confirm',
        meta: {
            title: 'Schedule',
        },
        component: () => import('@/views/schedule/confirm.vue'),
    },
    {
        path: '/web/schedule/confirmed',
        name: 'web-schedule-confirmed',
        meta: {
            title: 'Schedule',
        },
        component: () => import('@/views/schedule/confirmed.vue'),
    },
    {
        path: '/web/schedule/canceled',
        name: 'web-schedule-canceled',
        meta: {
            title: 'Schedule',
        },
        component: () => import('@/views/schedule/canceled.vue'),
    },
    {
        path: '/web/schedule/intake',
        name: 'web-intake-form',
        meta: {
            title: 'Intake Form',
        },
        component: () => import('@/views/schedule/intake.vue'),
    },
    {
        path: '/web/schedule/intake-success',
        name: 'web-intake-success',
        meta: {
            title: 'Intake success',
        },
        component: () => import('@/views/schedule/intakeSuccess.vue'),
    },
    {
        path: '/web/schedule/intake-fail',
        name: 'web-intake-fail',
        meta: {
            title: 'Intake fail',
        },
        component: () => import('@/views/schedule/intakeFail.vue'),
    },
    {
        path: '/web/schedule/profile',
        name: 'web-schedule-profile',
        meta: {
            title: 'Schedule',
        },
        component: () => import('@/views/schedule/profile.vue'),
    },
    {
        path: '/web/schedule/reschedule',
        name: 'web-schedule-reschedule',
        meta: {
            title: 'Schedule',
        },
        component: () => import('@/views/schedule/reschedule.vue'),
    },
    {
        path: '/course',
        name: 'course',
        meta: {
            title: 'Course',
        },
        component: () => import('@/views/course/index.vue'),
    },
    {
        path: '/course/learn',
        name: 'course-learn',
        meta: {
            title: 'Course',
        },
        component: () => import('@/views/course/learn.vue'),
    },
    {
        path: '/web/course',
        name: 'web-course',
        meta: {
            title: 'Course',
        },
        component: () => import('@/views/course/index.vue'),
    },
    {
        path: '/web/course/learn',
        name: 'web-course-learn',
        meta: {
            title: 'Course',
        },
        component: () => import('@/views/course/learn.vue'),
    },
];
