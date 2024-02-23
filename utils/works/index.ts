import PaperItems from "./papers";
import TutorialItems from "./tutorials";
import EffectItems from "./effects";
import ProjectItems from "./projects";

const Works = [
  ...ProjectItems,
  ...PaperItems,
  ...EffectItems,
  ...TutorialItems,
];

export { PaperItems, TutorialItems, EffectItems, ProjectItems, Works };
