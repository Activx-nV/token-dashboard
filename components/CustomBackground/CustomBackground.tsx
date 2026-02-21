"use client";
import Threads from "./Threads";

export const CustomBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <Threads amplitude={1.5} distance={0} enableMouseInteraction={false} />
    </div>
  );
};
