import React from 'react';

interface CardProps {
  id?: string;
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ id, children, className = '' }) => {
  return (
    <section
      id={id}
      className={`bg-white rounded-xl border-0 sm:border sm:border-[#D9DDE3] shadow-none sm:shadow-[0_2px_8px_rgba(28,36,48,0.06)] p-5 sm:p-10 transition-all duration-150 ${className}`}
    >
      {children}
    </section>
  );
};
