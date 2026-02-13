'use client';

import LightPillar from './LightPillar';

export const CustomBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <LightPillar />
    </div>
  );
};
