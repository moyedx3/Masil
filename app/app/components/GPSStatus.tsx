"use client";

interface GPSStatusProps {
  status: "checking" | "verified" | "too-far" | "denied" | "error";
  distance?: number; // meters
}

export default function GPSStatus({ status, distance }: GPSStatusProps) {
  if (status === "checking") {
    return (
      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
        <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        <div>
          <p className="text-sm font-medium text-blue-700">Checking location...</p>
          <p className="text-xs text-blue-500">Using GPS to verify your position</p>
        </div>
      </div>
    );
  }

  if (status === "verified") {
    return (
      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
        <div className="w-8 h-8 bg-[#22C55E] rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white text-sm">✓</span>
        </div>
        <div>
          <p className="text-sm font-medium text-green-700">You&apos;re at this location</p>
          <p className="text-xs text-green-500">
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
      <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-xl border border-yellow-100">
        <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white text-sm">!</span>
        </div>
        <div>
          <p className="text-sm font-medium text-yellow-700">Location access denied</p>
          <p className="text-xs text-yellow-600">
            Enable location permissions to post a review
          </p>
        </div>
      </div>
    );
  }

  // error
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
      <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-white text-sm">?</span>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-700">Location unavailable</p>
        <p className="text-xs text-gray-500">Could not determine your location</p>
      </div>
    </div>
  );
}
