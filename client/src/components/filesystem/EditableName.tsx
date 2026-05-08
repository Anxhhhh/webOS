import React, { useState, useEffect, useRef } from 'react';

interface EditableNameProps {
  initialName: string;
  isEditing: boolean;
  onConfirm: (newName: string) => void;
  onCancel: () => void;
  className?: string;
}

export const EditableName: React.FC<EditableNameProps> = ({
  initialName,
  isEditing,
  onConfirm,
  onCancel,
  className = '',
}) => {
  const [name, setName] = useState(initialName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      setName(initialName);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
    }
  }, [isEditing, initialName]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onConfirm(name);
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  if (!isEditing) {
    return <span className={`truncate w-full text-center ${className}`}>{initialName}</span>;
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={name}
      onChange={(e) => setName(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={() => onConfirm(name)}
      className={`
        w-full px-1 py-0.5 rounded bg-white/10 border border-white/20
        text-white text-xs text-center outline-none focus:bg-white/20
        transition-colors duration-200
        ${className}
      `}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    />
  );
};
