"use client";

import dynamic from "next/dynamic";

const EngineScene = dynamic(() => import("./engine-scene"), { ssr: false });

export default function EngineSceneClient() {
  return <EngineScene />;
}
