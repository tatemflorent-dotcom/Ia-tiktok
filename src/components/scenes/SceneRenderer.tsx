import React from "react";
import type { Scene } from "../../schema";
import { SceneFrame } from "./SceneFrame";
import { TextScene } from "./TextScene";
import { ScreenshotScene } from "./ScreenshotScene";
import { ShortcutScene } from "./ShortcutScene";
import { StepsScene } from "./StepsScene";
import { StatScene } from "./StatScene";

export const SceneRenderer: React.FC<{ scene: Scene; index: number }> = ({ scene, index }) => {
  let content: React.ReactNode;
  switch (scene.type) {
    case "text":
      content = <TextScene title={scene.title} subtitle={scene.subtitle} emoji={scene.emoji} />;
      break;
    case "screenshot":
      content = <ScreenshotScene app={scene.app} url={scene.url} image={scene.image} prompt={scene.prompt} lines={scene.lines} />;
      break;
    case "shortcut":
      content = <ShortcutScene keys={scene.keys} label={scene.label} />;
      break;
    case "steps":
      content = <StepsScene title={scene.title} items={scene.items} />;
      break;
    case "stat":
      content = <StatScene value={scene.value} prefix={scene.prefix} suffix={scene.suffix} label={scene.label} />;
      break;
  }
  return <SceneFrame variant={index + 1}>{content}</SceneFrame>;
};
