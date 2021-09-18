import { reactive } from "vue";
import { GlobalState } from "../@types";

const gState: GlobalState = reactive({
  IO: {} as any,
});

export default gState;
