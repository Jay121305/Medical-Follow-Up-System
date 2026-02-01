import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import Header from '../components/Header';
import Loading from '../components/Loading';
import OTPInput from '../components/OTPInput';

/**
 * Adverse Event Follow-Up Page
 * 
 * STEPS 5-7 in the AE workflow:
 * - Patient verifies identity with OTP
 * - Answers 7 smart follow-up questions
 * - Provides consent for data sharing
 * - Completes the regulatory-ready safety case
 */
const AdverseEventFollowUp = () => {
    const { adverseEventId } = useParams();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);
    const [caseData, setCaseData] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [responses, setResponses] = useState({});
    const [consent, setConsent] = useState(false);
    const [showComplete, setShowComplete] = useState(false);
    const [result, setResult] = useState(null);

    useEffect(() => {
        // Check if already verified (from URL params or session)
        const urlParams = new URLSearchParams(window.location.search);
        const verified = urlParams.get('verified') === 'true';
        if (verified) {
            setOtpVerified(true);
            loadQuestions();
        } else {
            setLoading(false);
        }
    }, [adverseEventId]);

    const handleOTPVerify = async (otp) => {
        try {
            const response = await api.verifyAdverseEventOTP(adverseEventId, otp);
            if (response.success) {
                setOtpVerified(true);
                await loadQuestions();
            } else {
                throw new Error(response.error);
            }
        } catch (error) {
            throw error;
        }
    };

    const loadQuestions = async () => {
        try {
            setLoading(true);
            const response = await api.getAdverseEventQuestions(adverseEventId);
            if (response.success) {
                setCaseData(response.data);
                setQuestions(response.data.questions);
            }
        } catch (error) {
            console.error('Error loading questions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (questionId, value, isMulti = false) => {
        setResponses(prev => {
            if (isMulti) {
                const currentSelected = prev[questionId]?.selected || [];
                const newSelected = currentSelected.includes(value)
                    ? currentSelected.filter(v => v !== value)
                    : [...currentSelected, value];
                return {
                    ...prev,
                    [questionId]: { ...prev[questionId], selected: newSelected },
                };
            }
            return {
                ...prev,
                [questionId]: { ...prev[questionId], selected: value },
            };
        });
    };

    const handleNotes = (questionId, notes) => {
        setResponses(prev => ({
            ...prev,
            [questionId]: { ...prev[questionId], notes },
        }));
    };

    const canProceed = () => {
        const q = questions[currentQuestion];
        const response = responses[q.id];
        
        if (!response) return false;
        if (q.type === 'multi') {
            return response.selected && response.selected.length > 0;
        }
        return response.selected;
    };

    const handleNext = () => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        if (!consent) {
            alert('Please provide your consent to submit the report.');
            return;
        }

        setSubmitting(true);
        try {
            const response = await api.submitAdverseEventFollowUp(adverseEventId, {
                responses,
                consent,
            });

            if (response.success) {
                setResult(response.data);
                setShowComplete(true);
            }
        } catch (error) {
            console.error('Error submitting follow-up:', error);
            alert('Failed to submit. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <Loading />;

    // OTP Verification Screen
    if (!otpVerified) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
                <Header title="Verify Your Identity" />
                
                <div className="max-w-lg mx-auto px-4 py-8">
                    <div className="card bg-white shadow-xl">
                        <div className="card-body text-center">
                            <div className="text-6xl mb-4">🔐</div>
                            <h2 className="text-xl font-bold mb-2">Safety Report Follow-Up</h2>
                            <p className="text-gray-600 mb-6">
                                Please enter the OTP sent to your phone to continue with the follow-up questionnaire.
                            </p>
                            
                            <OTPInput 
                                onVerify={handleOTPVerify}
                                length={4}
                            />
                            
                            <div className="text-sm text-gray-500 mt-4">
                                This helps us protect your health information.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Completion Screen
    if (showComplete) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
                <Header title="Report Complete" />
                
                <div className="max-w-lg mx-auto px-4 py-8">
                    <div className="card bg-white shadow-xl">
                        <div className="card-body text-center">
                            <div className="text-6xl mb-4">
                                {result?.requiresExpedited ? '🚨' : '✅'}
                            </div>
                            <h2 className="text-2xl font-bold mb-4">
                                {result?.requiresExpedited 
                                    ? 'Important Safety Report Filed'
                                    : 'Thank You!'}
                            </h2>
                            
                            <p className="text-gray-600 mb-6">
                                Your complete safety report has been submitted. This information helps:
                            </p>
                            
                            <div className="text-left bg-purple-50 rounded-lg p-4 mb-6">
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-center gap-2">
                                        <span className="text-green-500">✓</span>
                                        Improve medicine safety for everyone
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-green-500">✓</span>
                                        Alert doctors to potential issues
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-green-500">✓</span>
                                        Enable regulatory review if needed
                                    </li>
                                </ul>
                            </div>

                            {result?.requiresExpedited && (
                                <div className="alert alert-warning mb-4">
                                    <span className="text-sm">
                                        Based on your responses, this case has been flagged for expedited review by healthcare professionals.
                                    </span>
                                </div>
                            )}

                            <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                <p className="text-xs text-gray-500 mb-1">Case Reference</p>
                                <p className="font-mono font-bold text-purple-600">
                                    {caseData?.caseId}
                                </p>
                            </div>

                            <button 
                                onClick={() => navigate('/')}
                                className="btn btn-primary w-full"
                            >
                                Return Home
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Questionnaire Screen
    const currentQ = questions[currentQuestion];
    const progress = ((currentQuestion + 1) / questions.length) * 100;
    const isLastQuestion = currentQuestion === questions.length - 1;

    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
            <Header title="Safety Follow-Up" />
            
            <div className="max-w-lg mx-auto px-4 py-4">
                {/* Case Info */}
                <div className="text-center mb-4">
                    <span className="text-xs text-gray-500">
                        About your reaction to <span className="font-semibold text-purple-600">{caseData?.drugName}</span>
                    </span>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Question {currentQuestion + 1} of {questions.length}</span>
                        <span>{caseData?.estimatedTime}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                            className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Question Card */}
                <div className="card bg-white shadow-xl">
                    <div className="card-body">
                        {/* Question Header */}
                        <h2 className="text-lg font-bold mb-1">{currentQ.question}</h2>
                        <p className="text-sm text-gray-500 mb-4">{currentQ.subtext}</p>

                        {/* Data Fields Badge */}
                        <div className="flex flex-wrap gap-1 mb-4">
                            {currentQ.dataFields.map((field, i) => (
                                <span key={i} className="badge badge-sm badge-ghost">
                                    {field}
                                </span>
                            ))}
                        </div>

                        {/* Options */}
                        <div className="space-y-3">
                            {currentQ.options.map(option => {
                                const isSelected = currentQ.type === 'multi'
                                    ? (responses[currentQ.id]?.selected || []).includes(option.value)
                                    : responses[currentQ.id]?.selected === option.value;

                                return (
                                    <button
                                        key={option.value}
                                        onClick={() => handleSelect(currentQ.id, option.value, currentQ.type === 'multi')}
                                        className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                                            isSelected
                                                ? option.urgent || option.serious
                                                    ? 'border-red-500 bg-red-50'
                                                    : 'border-purple-500 bg-purple-50'
                                                : 'border-gray-200 hover:border-purple-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{option.icon}</span>
                                            <span className="flex-1">
                                                <span className="font-medium">{option.label}</span>
                                                {(option.urgent || option.serious) && (
                                                    <span className="ml-2 badge badge-error badge-sm">
                                                        {option.urgent ? 'Urgent' : 'Serious'}
                                                    </span>
                                                )}
                                            </span>
                                            {isSelected && (
                                                <span className="text-purple-500">✓</span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Notes Field (if applicable) */}
                        {currentQ.textPrompt && responses[currentQ.id]?.selected && (
                            <div className="mt-4">
                                <label className="label">
                                    <span className="label-text">{currentQ.textPrompt}</span>
                                </label>
                                <textarea
                                    className="textarea textarea-bordered w-full"
                                    placeholder="Add more details (optional)..."
                                    value={responses[currentQ.id]?.notes || ''}
                                    onChange={(e) => handleNotes(currentQ.id, e.target.value)}
                                    rows={3}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Consent (on last question) */}
                {isLastQuestion && (
                    <div className="card bg-white shadow mt-4">
                        <div className="card-body">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="checkbox checkbox-primary mt-1"
                                    checked={consent}
                                    onChange={(e) => setConsent(e.target.checked)}
                                />
                                <span className="text-sm">
                                    I consent to sharing this safety information with healthcare professionals 
                                    and regulatory authorities to improve medicine safety. My personal information 
                                    will be protected as per privacy regulations.
                                </span>
                            </label>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <div className="flex gap-3 mt-6">
                    <button
                        onClick={handleBack}
                        className="btn btn-outline flex-1"
                        disabled={currentQuestion === 0}
                    >
                        ← Back
                    </button>
                    
                    {isLastQuestion ? (
                        <button
                            onClick={handleSubmit}
                            className={`btn btn-primary flex-1 ${submitting ? 'loading' : ''}`}
                            disabled={!canProceed() || !consent || submitting}
                        >
                            {submitting ? 'Submitting...' : 'Submit Report'}
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            className="btn btn-primary flex-1"
                            disabled={!canProceed()}
                        >
                            Next →
                        </button>
                    )}
                </div>

                {/* Help Text */}
                <p className="text-center text-xs text-gray-400 mt-4">
                    Your answers help create a complete safety picture.
                    All information is kept confidential.
                </p>
            </div>
        </div>
    );
};

export default AdverseEventFollowUp;
