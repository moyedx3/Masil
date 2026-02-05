"use client";

interface GPSStatusProps {
  status: "checking" | "verified" | "too-far" | "denied" | "error";
  distance?: number; // meters
}

export default function GPSStatus({ status, distance }: GPSStatusProps) {
  if (status === "checking") {
    return (
      <div className="flex items-center gap-3 p-3 bg-[#F1F3E0] rounded-xl border border-[#D2DCB6]">
        <div className="w-5 h-5 border-2 border-[#A1BC98] border-t-transparent rounded-full animate-spin" />
        <div>
          <p className="text-sm font-medium text-[#778873]">Checking location...</p>
          <p className="text-xs text-[#778873]">Using GPS to verify your position</p>
        </div>
      </div>
    );
  }

  if (status === "verified") {
    return (
      <div className="flex items-center gap-3 p-3 bg-[#F1F3E0] rounded-xl border border-[#D2DCB6]">
        <div className="w-8 h-8 bg-[#A8BBA3] rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white text-sm">✓</span>
        </div>
        <div>
          <p className="text-sm font-medium text-[#778873]">You&apos;re at this location</p>
          <p className="text-xs text-[#A1BC98]">
            {distance !== undefined ? `${distance}m away (within 50m)` : "Within 50m"}
          </p>
        </div>
      </div>
    );
  }

  if (status === "too-far") {
    return (
      <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white text-sm">✕</span>
        </div>
        <div>
          <p className="text-sm font-medium text-red-700">You&apos;re not at this location</p>
          <p className="text-xs text-red-500">
            {distance !== undefined
              ? `${distance}m away — move within 50m to post`
              : "Move closer to post a review (within 50m)"}
          </p>
        </div>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="flex items-center gap-3 p-3 bg-[#EBD9D1] rounded-xl border border-[#B87C4C]">
        <div className="w-8 h-8 bg-[#B87C4C] rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white text-sm">!</span>
        </div>
        <div>
          <p className="text-sm font-medium text-[#B87C4C]">Location access denied</p>
          <p className="text-xs text-[#778873]">
            Enable location permissions to post a review
          </p>
        </div>
      </div>
    );
  }

  // error
  return (
    <div className="flex items-center gap-3 p-3 bg-[#F1F3E0] rounded-xl border border-[#D2DCB6]">
      <div className="w-8 h-8 bg-[#778873] rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-white text-sm">?</span>
      </div>
      <div>
        <p className="text-sm font-medium text-[#778873]">Location unavailable</p>
        <p className="text-xs text-[#778873]">Could not determine your location</p>
      </div>
    </div>
  );
}
