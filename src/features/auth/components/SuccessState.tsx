import React from 'react';
import { Button } from './Button';

interface SuccessStateProps {
  onGoToLogin: () => void;
}

export const SuccessState: React.FC<SuccessStateProps> = ({ onGoToLogin }) => {
  return (
    <div className="flex flex-col items-center text-center py-4 sm:py-6" role="status">
      <div className="w-16 h-16 rounded-full bg-[#ECF7F1] text-[#1E7B4F] flex items-center justify-center mb-4 border border-[#1E7B4F]/20">
        <span
          aria-hidden="true"
          className="material-symbols-outlined text-[36px] select-none"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          check_circle
        </span>
      </div>

      <h1 className="text-[28px] leading-9 sm:text-[32px] sm:leading-10 text-[#1C2430] font-bold tracking-[-0.02em] mb-2">
        ¡Tu cuenta fue creada!
      </h1>

      <p className="text-base text-[#5B6573] max-w-sm mb-6 leading-relaxed">
        Ya puedes iniciar sesión con tu correo y contraseña.
      </p>

      <Button icon="arrow_forward" onClick={onGoToLogin} type="button">
        Ir a iniciar sesión
      </Button>
    </div>
  );
};
