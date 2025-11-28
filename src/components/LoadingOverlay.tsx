import { Loader2 } from "lucide-react";

const LoadingOverlay = () => (
  <div className="fixed inset-0 bg-black/20 backdrop-blur-[1px] flex items-center justify-center z-[60]">
    <div className="bg-white px-6 py-4 rounded-xl shadow-xl flex items-center space-x-3 border border-gray-100">
      <Loader2 className="animate-spin text-blue-600" size={24} />
      <span className="font-medium text-gray-700 text-sm">
        加载中，请稍候...
      </span>
    </div>
  </div>
);

export default LoadingOverlay;
