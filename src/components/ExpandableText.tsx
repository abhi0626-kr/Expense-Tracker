import { useState } from "react";

interface ExpandableTextProps {
  text: string;
  maxChars?: number;
  className?: string;
}

export const ExpandableText = ({ text, maxChars = 55, className = "" }: ExpandableTextProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text || text.length <= maxChars) {
    return <p className={className}>{text}</p>;
  }

  const truncatedText = text.slice(0, maxChars) + "...";

  return (
    <p className={className}>
      <span className="sm:hidden">
        {isExpanded ? text : truncatedText}{" "}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="text-violet-500 dark:text-violet-400 hover:underline font-semibold ml-1 inline-block text-[11px]"
        >
          {isExpanded ? "Show less" : "Show more"}
        </button>
      </span>
      <span className="hidden sm:inline">{text}</span>
    </p>
  );
};
