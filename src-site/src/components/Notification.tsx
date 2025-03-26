import React, { useState, useEffect } from "react";

interface NotificationProps {
  message: string;
  type?: "success" | "error";
  onClose?: () => void;
  duration?: number;
}

export default function Notification({
  message,
  type = "success",
  onClose,
  duration = 3000,
  //@ts-expect-error fix later
}: NotificationProps): JSX.Element | null {
  const [isVisible, setIsVisible] = useState<boolean>(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const bgColor = type === "success" ? "bg-green-500" : "bg-red-500";

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-in-up">
      <div className={`${bgColor} text-white px-6 py-3 rounded-lg shadow-lg`}>
        {message}
      </div>
    </div>
  );
}
