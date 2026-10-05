import React from "react";

import SdPane from "./SdPane";
import SdTree from "./SdTree";
import SdWave from "./SdWave";
import SdWaveBar from "./SdWaveBar";
import SdWaveValue from "./SdWaveValue";
import SdGauge from "./SdGauge";
import SdText from "./SdText";
import SdButton from "./SdButton";
import SdDummy from "./SdDummy";
import SdDummyLeafComponent from "./SdDummyLeafComponent";
import SdDummyContainerComponent from "./SdDummyContainerComponent";

export const components: Record<string, React.ElementType> = {
  SdPane,
  SdTree,
  SdWave,
  SdWaveBar,
  SdWaveValue,
  SdGauge,
  SdText,
  SdButton,
  SdDummy,
  SdDummyLeafComponent,
  SdDummyContainerComponent,
};