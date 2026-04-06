import { gameRegistry } from "./registry";
import reactionSpeed from "./reaction-speed";
import handEye from "./hand-eye";
import spatial from "./spatial";
import memory from "./memory";
import strategy from "./strategy";
import rhythm from "./rhythm";
import pattern from "./pattern";
import multitask from "./multitask";
import decision from "./decision";
import emotional from "./emotional";
import teamwork from "./teamwork";
import risk from "./risk";
import resource from "./resource";
import nBack from "./n-back";
import flanker from "./flanker";
import mot from "./mot";
import taskSwitch from "./task-switch";

const allGames = [
  reactionSpeed,
  handEye,
  spatial,
  memory,
  strategy,
  rhythm,
  pattern,
  multitask,
  decision,
  emotional,
  teamwork,
  risk,
  resource,
  nBack,
  flanker,
  mot,
  taskSwitch,
];

allGames.forEach((game) => gameRegistry.register(game));

export { gameRegistry };
