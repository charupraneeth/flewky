import { reactive } from "vue";
import { GlobalState } from "../@types";

const gState: GlobalState = reactive({
  IO: {} as any,
  email: "",
});

export default gState;
