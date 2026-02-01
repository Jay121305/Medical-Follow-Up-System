/**
 * ============================================================================
 * OTPInput.js - One-Time Password Input Component
 * ============================================================================
 * 
 * PURPOSE:
 * Provide a user-friendly OTP input interface for patient verification.
 * Used in STEP 4 of the flow where patient enters the code received via SMS/WhatsApp.
 * 
 * FEATURES:
 * - Individual input boxes for each digit (visual clarity)
 * - Auto-focus to next input on entry (fast typing)
 * - Backspace navigates to previous input (easy correction)
 * - Paste support for copying OTP from messages
 * - Numeric only input validation
 * - Callback when OTP is complete
 * 
 * UX CONSIDERATIONS:
 * - inputMode="numeric" shows number keyboard on mobile
 * - Auto-focus on first input for immediate entry
 * - Visual feedback with individual boxes matches SMS OTP format
 * 
 * PROPS:
 * - length: Number of OTP digits (default: 4)
 * - onComplete: Callback function called when all digits are entered
 * 
 * USAGE:
 * <OTPInput
 *   length={4}
 *   onComplete={(otp) => verifyOTP(otp)}
 * />
 * 
 * ============================================================================
 */

import React, { useRef, useState } from 'react';

/**
 * OTPInput Component
 * 
 * @param {object} props
 * @param {number} props.length - Number of OTP digits (default: 4)
 * @param {function} props.onComplete - Callback with complete OTP string
 */
function OTPInput({ length = 4, onComplete }) {
    // ========== STATE ==========
    
    /**
     * Array to store each digit
     * e.g., ['1', '2', '3', '4'] for OTP "1234"
     */
    const [otp, setOtp] = useState(new Array(length).fill(''));
    
    /**
     * Refs array to access individual input elements
     * Needed for programmatic focus management
     */
    const inputRefs = useRef([]);

    // ========== HANDLERS ==========
    
    /**
     * Handle digit input
     * 
     * BEHAVIOR:
     * 1. Validate input is numeric
     * 2. Store only the last character (handles overwrite)
     * 3. Auto-focus next input if not at end
     * 4. Call onComplete when all digits filled
     * 
     * @param {HTMLInputElement} element - The input element
     * @param {number} index - Position in OTP array
     */
    const handleChange = (element, index) => {
        const value = element.value;

        // Only allow numbers - reject any non-numeric input
        if (isNaN(value)) return;

        // Update OTP array
        // Take last character to handle paste/overwrite scenarios
        const newOtp = [...otp];
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);

        // Auto-focus next input (if value entered and not at last position)
        if (value && index < length - 1) {
            inputRefs.current[index + 1].focus();
        }

        // Check if OTP is complete and call callback
        const otpValue = newOtp.join('');
        if (otpValue.length === length) {
            onComplete(otpValue);
        }
    };

    /**
     * Handle keyboard navigation
     * 
     * BEHAVIOR:
     * - Backspace on empty input focuses previous input
     * - Allows natural backspace deletion in filled inputs
     * 
     * @param {KeyboardEvent} e - Keyboard event
     * @param {number} index - Position in OTP array
     */
    const handleKeyDown = (e, index) => {
        // Handle backspace navigation
        // If current input is empty and backspace pressed, go to previous
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    /**
     * Handle paste event
     * 
     * BEHAVIOR:
     * 1. Prevent default paste (we'll handle it)
     * 2. Get pasted text, limit to OTP length
     * 3. Validate all characters are numeric
     * 4. Fill OTP boxes with pasted digits
     * 5. Focus appropriate input
     * 6. Call onComplete if paste fills all boxes
     * 
     * WHY: Users often copy OTP from SMS - this makes it seamless
     * 
     * @param {ClipboardEvent} e - Paste event
     */
    const handlePaste = (e) => {
        e.preventDefault();
        
        // Get pasted text, limit to OTP length
        const pastedData = e.clipboardData.getData('text').slice(0, length);

        // Validate - must be all digits
        if (!/^\d+$/.test(pastedData)) return;

        // Fill OTP array with pasted digits
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

        // Check if complete and call callback
        if (pastedData.length === length) {
            onComplete(pastedData);
        }
    };

    // ========== RENDER ==========
    return (
        <div className="otp-container">
            {/* Render individual input for each OTP digit */}
            {otp.map((digit, index) => (
                <input
                    key={index}
                    type="text"
                    inputMode="numeric"       // Mobile keyboard: show numbers
                    maxLength={1}             // Only one digit per box
                    value={digit}
                    ref={(ref) => (inputRefs.current[index] = ref)}  // Store ref for focus management
                    onChange={(e) => handleChange(e.target, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onPaste={handlePaste}     // Same handler for all inputs
                    className="otp-input"
                    autoFocus={index === 0}   // First input auto-focused
                />
            ))}
        </div>
    );
}

// ============================================================================
// EXPORT
// ============================================================================

export default OTPInput;
