"use client";

import { IxTree } from "@siemens/ix-react";
import type { TreeContext, TreeModel } from "@siemens/ix";

const ZERO_UUID = "00000000-0000-4000-8000-000000000000";

interface TreeData {
  name: string;
}

interface NodeTreeProps {
  model: TreeModel<TreeData>;
  context: TreeContext;
  onContextChange: (context: TreeContext) => void;
}

export default function NodeTree({
  // model,
  // context,
  // onContextChange,
}: NodeTreeProps) {
  return (
    <>
      <h4>Tree</h4>
      {/* <IxTree
        root={ZERO_UUID}
        model={model as TreeModel<unknown>}
        context={context}
        onContextChange={(event) => onContextChange(event.detail)}
      /> */}
    </>
  );
}
