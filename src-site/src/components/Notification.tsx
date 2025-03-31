import React, { useState, useEffect } from "react";
import Link from "./Link";

interface NotificationProps {
  message: string;
  type?: "success" | "error";
  onClose?: () => void;
  duration?: number;
  link?: string; // Updated: link is now a string URL
}

export default function Notification({
  message,
  type = "success",
  onClose,
  duration = 3000,
  link,
  //@ts-expect-error todo: fix
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

  const content = (
    <div className={`${bgColor} text-white px-6 py-3 rounded-lg shadow-lg`}>
      {message}
    </div>
  );

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-in-up">
      {link ? <Link to={link}>{content}</Link> : content}
    </div>
  );
}
