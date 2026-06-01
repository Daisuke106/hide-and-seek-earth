import React from 'react';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'エラー',
  message,
  onRetry,
}) => {
  return (
    <div className="error-state">
      <h3>{title}</h3>
      <p>{message}</p>
      {onRetry && (
        <button className="retry-button" onClick={onRetry}>
          再試行
        </button>
      )}
    </div>
  );
};
