"use client";

import { ReactNode } from "react";

export default function PhoneFrame({
  children,
  overlay,
}: {
  children: ReactNode;
  overlay?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-center min-h-screen p-8">
      <div className="relative">
        {/* Phone bezel */}
        <div className="w-[393px] h-[852px] bg-black rounded-[55px] p-[12px] shadow-2xl">
          {/* Screen */}
          <div className="w-full h-full bg-white rounded-[43px] overflow-hidden relative" id="phone-screen">
            {/* Notch / Dynamic Island */}
            <div className="absolute top-0 left-0 right-0 z-50 flex justify-center pt-[10px]">
              <div className="w-[126px] h-[37px] bg-black rounded-full" />
            </div>
            {/* Screen content */}
            <div className="h-full overflow-y-auto phone-scroll pt-[55px]">
              {children}
            </div>
            {/* Floating overlay */}
            {overlay}
          </div>
        </div>
      </div>
    </div>
  );
}
