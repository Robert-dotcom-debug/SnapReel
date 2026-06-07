import { createRouter, createWebHistory } from "vue-router";
import LoginView from "../views/LoginView.vue";
import RegisterView from "../views/RegisterView.vue";
import FeedView from "../views/FeedView.vue";
import UploadView from "../views/UploadView.vue";
import AccountView from "../views/AccountView.vue";
import PublicProfileView from "../views/PublicProfileView.vue";
import HashtagView from "../views/HashtagView.vue";
import VideoDetailView from "../views/VideoDetailView.vue";

const routes = [
  { path: "/", component: FeedView, meta: { requiresAuth: true } },
  { path: "/login", component: LoginView, meta: { guestOnly: true } },
  { path: "/register", component: RegisterView, meta: { guestOnly: true } },
  { path: "/upload", component: UploadView, meta: { requiresAuth: true } },
  { path: "/account", component: AccountView, meta: { requiresAuth: true } },
  { path: "/profile/:userId", component: PublicProfileView, meta: { requiresAuth: true } },
  { path: "/hashtag/:tag", component: HashtagView, meta: { requiresAuth: true } },
  { path: "/video/:videoId", component: VideoDetailView, meta: { requiresAuth: true } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const hasSession = Boolean(localStorage.getItem("token"));

  if (to.meta.requiresAuth && !hasSession) {
    return "/login";
  }

  if (to.meta.guestOnly && hasSession) {
    return "/";
  }

  return true;
});

export default router;
