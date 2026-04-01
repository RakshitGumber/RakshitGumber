import { Icon } from "@iconify/react";
import { useState } from "react";

export const PowerButton = () => {
  const [showActions, setShowActions] = useState(false);
  return (
    <>
      <button
        onClick={() => setShowActions(!showActions)}
        className="flex items-center justify-center w-16 h-full text-3xl border-l-2 border-border cursor-pointer"
      >
        {showActions ? (
          <Icon icon="fa6-solid:x" />
        ) : (
          <Icon icon="fa6-solid:otter" />
        )}
      </button>
      {showActions && (
        <div className="absolute top-14 right-0 flex flex-col items-center justify-center w-16 border-l-2 border-border">
          <button className="border-b-2 flex items-center justify-center text-3xl border-border w-full h-12">
            <Icon icon="fa6-solid:sun"></Icon>
          </button>
          <button className="border-b-2 flex items-center justify-center text-3xl border-border w-full h-12">
            <Icon icon="fa6-solid:file-arrow-down"></Icon>
          </button>
        </div>
      )}
    </>
  );
};
