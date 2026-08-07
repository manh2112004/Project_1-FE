import React, { useRef } from 'react';

interface OtpInputProps {
  value: string;
  onChange: (otp: string) => void;
  length?: number;
  disabled?: boolean;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  value,
  onChange,
  length = 6,
  disabled = false,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const otpArray = Array.from({ length }, (_, i) => value[i] || '');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value.replace(/\D/g, '');
    if (!val) {
      // Clear current digit
      const newOtp = otpArray.map((digit, i) => (i === index ? '' : digit)).join('');
      onChange(newOtp);
      return;
    }

    // Take last entered character if multiple typed
    const newDigit = val.charAt(val.length - 1);
    const updated = [...otpArray];
    updated[index] = newDigit;
    const newOtp = updated.join('');
    onChange(newOtp);

    // Auto-focus next input
    if (index < length - 1 && newDigit) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!otpArray[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pastedData) {
      onChange(pastedData);
      const focusIndex = Math.min(pastedData.length, length - 1);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  return (
    <div className="flex items-center justify-center gap-2.5 sm:gap-3 my-4" onPaste={handlePaste}>
      {otpArray.map((digit, index) => {
        const isFilled = digit !== '';
        return (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            disabled={disabled}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onFocus={(e) => e.target.select()}
            className={`w-11 h-14 sm:w-13 sm:h-16 text-center text-xl sm:text-2xl font-mono font-black rounded-2xl border bg-slate-900/90 text-white transition-all shadow-inner focus:outline-none ${
              isFilled
                ? 'border-emerald-500/80 text-emerald-400 bg-slate-900 shadow-emerald-500/10'
                : 'border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30'
            }`}
          />
        );
      })}
    </div>
  );
};
