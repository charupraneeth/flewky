import { reactive } from "vue";
import { GlobalState } from "../@types";

const gState: GlobalState = reactive({
  IO: {} as any,
  email: "",
  isMobile: document.documentElement.clientWidth < 760,
});

export default gState;
