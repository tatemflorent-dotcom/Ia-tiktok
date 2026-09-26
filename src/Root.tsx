import React from "react";
import { CalculateMetadataFunction, Composition } from "remotion";
import { TikTokVideo } from "./TikTokVideo";
import { videoSchema, type VideoProps } from "./schema";
import { FPS, HEIGHT, WIDTH } from "./theme";
import { fontsLoaded } from "./fonts";
import { demoProps } from "./sample/demo";

const calculateMetadata: CalculateMetadataFunction<VideoProps> = async ({ props }) => {
  await fontsLoaded;
  return {
    durationInFrames: Math.ceil((props.durationMs / 1000) * FPS),
    defaultOutName: "video",
  };
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="TikTokVideo"
      component={TikTokVideo}
      schema={videoSchema}
      defaultProps={demoProps}
      calculateMetadata={calculateMetadata}
      durationInFrames={FPS * 68}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};
