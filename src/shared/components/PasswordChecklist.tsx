import React from 'react';
import { PasswordCriteria } from '../../features/auth/validation/validation';

interface PasswordChecklistProps {
  criteria: PasswordCriteria;
}

export const PasswordChecklist: React.FC<PasswordChecklistProps> = ({ criteria }) => {
  const items = [
    {
      id: 'req-length',
      label: 'Al menos 8 caracteres',
      met: criteria.hasMinLength,
    },
    {
      id: 'req-letter',
      label: 'Al menos una letra',
      met: criteria.hasLetter,
    },
    {
      id: 'req-number',
      label: 'Al menos un número',
      met: criteria.hasNumber,
    },
  ];

  return (
    <div
      aria-live="polite"
      className="bg-[#E6F2F1] p-3.5 rounded-lg border border-[#0F6E6E]/20 mt-2 mb-1"
    >
      <div className="text-xs font-semibold text-[#0F6E6E] mb-2 flex items-center gap-1.5 select-none">
        <span aria-hidden="true" className="material-symbols-outlined text-[16px]">
          verified_user
        </span>
        <span>Requisitos de contraseña:</span>
      </div>

      <ul className="flex flex-col gap-1.5 m-0 p-0 list-none">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-2 text-xs transition-colors duration-150"
            id={item.id}
          >
            <span
              aria-hidden="true"
              className={`material-symbols-outlined text-[18px] select-none ${
                item.met ? 'text-[#0F6E6E]' : 'text-[#5B6573]'
              }`}
            >
              {item.met ? 'check_circle' : 'radio_button_unchecked'}
            </span>
            <span
              className={
                item.met
                  ? 'text-[#1C2430] font-medium'
                  : 'text-[#5B6573] font-normal'
              }
            >
              {item.label}
            </span>
            <span className="sr-only">
              {item.met ? '(cumplido)' : '(pendiente)'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
