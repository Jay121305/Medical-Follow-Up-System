/**
 * OTP Input Component
 * 4-digit OTP input with auto-focus
 */

import React, { useRef, useState } from 'react';

function OTPInput({ length = 4, onComplete }) {
    const [otp, setOtp] = useState(new Array(length).fill(''));
    const inputRefs = useRef([]);

    const handleChange = (element, index) => {
        const value = element.value;

        // Only allow numbers
        if (isNaN(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < length - 1) {
            inputRefs.current[index + 1].focus();
        }

        // Check if OTP is complete
        const otpValue = newOtp.join('');
        if (otpValue.length === length) {
            onComplete(otpValue);
        }
    };

    const handleKeyDown = (e, index) => {
        // Handle backspace
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, length);

        if (!/^\d+$/.test(pastedData)) return;

        const newOtp = [...otp];
        pastedData.split('').forEach((char, index) => {
            if (index < length) {
                newOtp[index] = char;
            }
        });
        setOtp(newOtp);

        // Focus last filled input or next empty
        const focusIndex = Math.min(pastedData.length, length - 1);
        inputRefs.current[focusIndex].focus();

        // Check if complete
        if (pastedData.length === length) {
            onComplete(pastedData);
        }
    };

    return (
        <div className="otp-container">
            {otp.map((digit, index) => (
                <input
                    key={index}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    ref={(ref) => (inputRefs.current[index] = ref)}
                    onChange={(e) => handleChange(e.target, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onPaste={handlePaste}
                    className="otp-input"
                    autoFocus={index === 0}
                />
            ))}
        </div>
    );
}

export default OTPInput;
