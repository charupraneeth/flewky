import {
  createRouter,
  createWebHashHistory,
  Router,
  RouteRecordRaw,
} from "vue-router";

import Home from "../views/Home.vue";
import Chat from "../views/Chat.vue";
import Login from "../views/Login.vue";

const routes: RouteRecordRaw[] = [
  { path: "/", component: Home },
  { path: "/app", component: Chat },
  { path: "/login", component: Login },
];

const router: Router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
