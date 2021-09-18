import {
  createRouter,
  createWebHashHistory,
  Router,
  RouteRecordRaw,
} from "vue-router";

import Home from "../views/Home.vue";
import Chat from "../views/Chat.vue";

const routes: RouteRecordRaw[] = [
  { path: "/", component: Home },
  { path: "/app", component: Chat },
];

const router: Router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
