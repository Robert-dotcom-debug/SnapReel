import { createRouter, createWebHistory } from "vue-router";
import LoginView from "../views/LoginView.vue";
import RegisterView from "../views/RegisterView.vue";
import FeedView from "../views/FeedView.vue";
import UploadView from "../views/UploadView.vue";

const routes = [
  { path: "/", component: FeedView },
  { path: "/login", component: LoginView },
  { path: "/register", component: RegisterView },
  { path: "/upload", component: UploadView },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;