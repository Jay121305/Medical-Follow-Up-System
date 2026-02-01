/**
 * Patient Follow-Up Form - Progressive Question Flow
 * Questions are shown one at a time, with each subsequent question
 * adapting based on previous answers for maximum clinical data extraction
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getFollowUpDrafts, submitFollowUp } from '../services/api';
import Loading from '../components/Loading';
import Disclaimer from '../components/Disclaimer';

// Progressive Question Flow - Questions adapt based on previous answers
const getQuestionFlow = (responses, prescription) => {
    const questions = [];

    // Q1: Primary outcome - most important question
    questions.push({
        id: 'treatmentOutcome',
        question: "How do you feel after the treatment?",
        options: [
            { value: 'fully_recovered', label: '✅ Fully recovered' },
            { value: 'much_better', label: '📈 Much better, still recovering' },
            { value: 'same', label: '➡️ No change' },
            { value: 'worse', label: '📉 Condition worsened' },
        ],
        required: true
    });

    // Q2: Branch based on Q1 response
    if (responses.treatmentOutcome) {
        if (responses.treatmentOutcome === 'fully_recovered') {
            questions.push({
                id: 'recoveryTime',
                question: "When did you start feeling better?",
                options: [
                    { value: 'within_days', label: 'Within 2-3 days' },
                    { value: 'within_week', label: 'After about a week' },
                    { value: 'took_longer', label: 'Took the full course' },
                ],
                required: true
            });
        } else if (responses.treatmentOutcome === 'much_better') {
            questions.push({
                id: 'remainingSymptoms',
                question: "What symptoms are still present?",
                options: [
                    { value: 'mild_discomfort', label: 'Mild discomfort only' },
                    { value: 'occasional_symptoms', label: 'Occasional symptoms' },
                    { value: 'persistent_but_less', label: 'Still there but less severe' },
                ],
                required: true
            });
        } else if (responses.treatmentOutcome === 'same') {
            questions.push({
                id: 'noImprovementReason',
                question: "Why do you think there was no improvement?",
                options: [
                    { value: 'too_early', label: 'May be too early to tell' },
                    { value: 'missed_doses', label: "Couldn't take medication regularly" },
                    { value: 'medicine_not_working', label: "Medicine doesn't seem effective" },
                    { value: 'unsure', label: 'Not sure' },
                ],
                required: true
            });
        } else if (responses.treatmentOutcome === 'worse') {
            questions.push({
                id: 'worseningDetails',
                question: "⚠️ What are you experiencing now?",
                options: [
                    { value: 'original_worse', label: 'Original symptoms got worse' },
                    { value: 'new_symptoms', label: 'New symptoms appeared' },
                    { value: 'side_effects', label: 'Experiencing side effects' },
                    { value: 'multiple_issues', label: 'Multiple problems' },
                ],
                required: true,
                urgent: true
            });
        }
    }

    // Q3: Medication adherence - only if not already answered about it
    if (responses.treatmentOutcome && 
        (responses.recoveryTime || responses.remainingSymptoms || responses.noImprovementReason || responses.worseningDetails)) {
        
        if (responses.noImprovementReason !== 'missed_doses') {
            questions.push({
                id: 'medicationTaken',
                question: "Did you complete the prescribed medication course?",
                options: [
                    { value: 'completed', label: '✓ Yes, completed fully' },
                    { value: 'ongoing', label: '⏳ Still taking it' },
                    { value: 'stopped_early', label: '✗ Stopped before completing' },
                ],
                required: true
            });
        }
    }

    // Q4: Side effects - contextual based on treatment outcome
    if (responses.medicationTaken || responses.noImprovementReason === 'missed_doses') {
        const hasSideEffectConcern = responses.worseningDetails === 'side_effects' || 
                                      responses.medicationTaken === 'stopped_early';
        
        if (hasSideEffectConcern) {
            questions.push({
                id: 'sideEffectDetails',
                question: "What side effects did you experience?",
                options: [
                    { value: 'stomach_issues', label: '🤢 Stomach upset / Nausea' },
                    { value: 'allergic', label: '🔴 Rash / Itching / Swelling' },
                    { value: 'drowsiness', label: '😴 Drowsiness / Dizziness' },
                    { value: 'other', label: '📝 Other (describe below)' },
                ],
                required: true
            });
        } else {
            questions.push({
                id: 'anySideEffects',
                question: "Did you notice any side effects?",
                options: [
                    { value: 'none', label: "✓ None at all" },
                    { value: 'mild', label: "Minor, didn't bother me" },
                    { value: 'noticeable', label: 'Yes, but manageable' },
                ],
                required: true
            });
        }
    }

    // Q5: Final assessment - need for follow-up
    const answeredCount = Object.keys(responses).filter(k => responses[k]).length;
    if (answeredCount >= 3) {
        const needsUrgentCare = responses.treatmentOutcome === 'worse' || 
                               responses.sideEffectDetails === 'allergic';
        
        if (!needsUrgentCare) {
            questions.push({
                id: 'needsFollowUp',
                question: "Do you need any further assistance?",
                options: [
                    { value: 'all_good', label: "👍 I'm good, no questions" },
                    { value: 'have_questions', label: '❓ I have some questions' },
                    { value: 'need_appointment', label: '📅 Would like a follow-up visit' },
                ],
                required: true
            });
        } else {
            questions.push({
                id: 'urgentCareNeeded',
                question: "⚠️ Based on your responses, please indicate:",
                options: [
                    { value: 'will_visit', label: '🏥 I will visit the doctor soon' },
                    { value: 'already_visited', label: '✓ Already consulted another doctor' },
                    { value: 'need_callback', label: '📞 Please call me back' },
                ],
                required: true,
                urgent: true
            });
        }
    }

    return questions;
};

// Styles
const styles = {
    container: {
        maxWidth: '600px',
        margin: '0 auto',
        padding: '1rem',
    },
    questionCard: {
        background: '#fff',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        marginBottom: '1.5rem',
        animation: 'slideIn 0.3s ease',
    },
    questionNumber: {
        fontSize: '0.85rem',
        color: '#888',
        marginBottom: '0.5rem',
        fontWeight: '500',
    },
    questionText: {
        fontSize: '1.25rem',
        fontWeight: '600',
        marginBottom: '1.5rem',
        color: '#1a1a2e',
        lineHeight: '1.4',
    },
    optionButton: {
        width: '100%',
        padding: '1rem 1.25rem',
        marginBottom: '0.75rem',
        border: '2px solid #e8e8e8',
        borderRadius: '12px',
        background: '#fafafa',
        cursor: 'pointer',
        textAlign: 'left',
        fontSize: '1rem',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
    },
    optionButtonSelected: {
        borderColor: '#667eea',
        background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
    },
    optionButtonHover: {
        borderColor: '#667eea',
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.15)',
    },
    progressContainer: {
        display: 'flex',
        gap: '6px',
        marginBottom: '2rem',
    },
    progressDot: {
        height: '6px',
        borderRadius: '3px',
        transition: 'all 0.3s ease',
        flex: 1,
    },
    summaryItem: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '0.75rem 0',
        borderBottom: '1px solid #f0f0f0',
    },
    urgentBanner: {
        background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%)',
        color: '#fff',
        padding: '1rem 1.25rem',
        borderRadius: '12px',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
    },
};

function PatientFollowUp() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [prescription, setPrescription] = useState(null);
    const [prescriptionId, setPrescriptionId] = useState(null);
    const [responses, setResponses] = useState({});
    const [additionalNotes, setAdditionalNotes] = useState('');
    const [consent, setConsent] = useState(false);
    const [hoveredOption, setHoveredOption] = useState(null);

    useEffect(() => { loadDrafts(); }, [id]);

    const loadDrafts = async () => {
        try {
            const result = await getFollowUpDrafts(id);
            setPrescription(result.data.prescriptionInfo);
            setPrescriptionId(result.data.prescriptionId);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const questions = getQuestionFlow(responses, prescription);
    const currentQuestionIndex = questions.findIndex(q => !responses[q.id]);
    const currentQuestion = questions[currentQuestionIndex];
    const answeredCount = Object.keys(responses).filter(k => responses[k]).length;
    const isComplete = currentQuestionIndex === -1 && answeredCount >= 3;

    const handleOptionSelect = (questionId, value) => {
        setResponses(prev => ({ ...prev, [questionId]: value }));
        
        // Auto-scroll to next question after a brief delay
        setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 300);
    };

    const handleGoBack = () => {
        const answeredQuestions = Object.keys(responses);
        if (answeredQuestions.length > 0) {
            const lastAnswered = answeredQuestions[answeredQuestions.length - 1];
            setResponses(prev => {
                const newResponses = { ...prev };
                delete newResponses[lastAnswered];
                return newResponses;
            });
        }
    };

    const getReadableAnswer = (questionId, value) => {
        const allQuestions = getQuestionFlow({...responses}, prescription);
        const question = allQuestions.find(q => q.id === questionId);
        if (!question) return value;
        const option = question.options.find(o => o.value === value);
        return option ? option.label.replace(/^[✅📈➡️📉✓⏳✗🤢🔴😴📝👍❓📅🏥📞]\s*/, '') : value;
    };

    const handleSubmit = async () => {
        if (!consent) {
            alert('Please confirm your consent to share this information with your doctor.');
            return;
        }
        
        setSubmitting(true);
        try {
            // Build readable responses for the doctor
            const readableResponses = {
                treatmentOutcome: getReadableAnswer('treatmentOutcome', responses.treatmentOutcome),
                additionalNotes: additionalNotes || 'No additional notes',
                allResponses: Object.entries(responses).map(([key, value]) => ({
                    questionId: key,
                    answer: getReadableAnswer(key, value),
                })),
            };

            // Add specific fields based on responses
            if (responses.sideEffectDetails || responses.anySideEffects) {
                readableResponses.sideEffects = getReadableAnswer(
                    responses.sideEffectDetails ? 'sideEffectDetails' : 'anySideEffects',
                    responses.sideEffectDetails || responses.anySideEffects
                );
            }

            if (responses.medicationTaken) {
                readableResponses.medicationAdherence = getReadableAnswer('medicationTaken', responses.medicationTaken);
            }

            // Check if urgent
            readableResponses.needsUrgentAttention = 
                responses.treatmentOutcome === 'worse' || 
                responses.sideEffectDetails === 'allergic' ||
                responses.urgentCareNeeded === 'need_callback';
            
            await submitFollowUp(id, readableResponses, true);
            navigate(`/follow-up/${id}/success`);
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <Loading message="Loading your follow-up..." />;
    if (error) return (
        <div className="page">
            <div style={styles.container}>
                <div className="alert alert-error">{error}</div>
            </div>
        </div>
    );

    // Check for urgent conditions
    const isUrgent = responses.treatmentOutcome === 'worse' || 
                     responses.sideEffectDetails === 'allergic';

    return (
        <div className="page" style={{ background: '#f8f9fc', minHeight: '100vh' }}>
            <style>
                {`
                    @keyframes slideIn {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                `}
            </style>
            
            <div style={styles.container}>
                {/* Compact Header */}
                <div style={{ textAlign: 'center', marginBottom: '1.5rem', paddingTop: '1rem' }}>
                    <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>Follow-Up</h1>
                    {prescription && (
                        <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>
                            {prescription.condition || prescription.medicineName}
                        </p>
                    )}
                </div>

                {/* Progress Dots */}
                <div style={styles.progressContainer}>
                    {[...Array(5)].map((_, i) => (
                        <div
                            key={i}
                            style={{
                                ...styles.progressDot,
                                background: i < answeredCount 
                                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                    : i === answeredCount 
                                        ? '#667eea50'
                                        : '#e0e0e0',
                            }}
                        />
                    ))}
                </div>

                {/* Urgent Warning Banner */}
                {isUrgent && (
                    <div style={styles.urgentBanner}>
                        <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                        <div>
                            <strong>Please consult your doctor</strong>
                            <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.9 }}>
                                Your responses indicate you may need medical attention
                            </p>
                        </div>
                    </div>
                )}

                {/* Current Question */}
                {!isComplete && currentQuestion && (
                    <div style={styles.questionCard}>
                        <div style={styles.questionNumber}>
                            Question {answeredCount + 1}
                        </div>
                        <div style={{
                            ...styles.questionText,
                            color: currentQuestion.urgent ? '#d63031' : '#1a1a2e'
                        }}>
                            {currentQuestion.question}
                        </div>
                        
                        <div>
                            {currentQuestion.options.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    style={{
                                        ...styles.optionButton,
                                        ...(responses[currentQuestion.id] === option.value 
                                            ? styles.optionButtonSelected 
                                            : {}),
                                        ...(hoveredOption === `${currentQuestion.id}-${option.value}` 
                                            ? styles.optionButtonHover 
                                            : {}),
                                    }}
                                    onClick={() => handleOptionSelect(currentQuestion.id, option.value)}
                                    onMouseEnter={() => setHoveredOption(`${currentQuestion.id}-${option.value}`)}
                                    onMouseLeave={() => setHoveredOption(null)}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>

                        {/* Back Button */}
                        {answeredCount > 0 && (
                            <button
                                type="button"
                                onClick={handleGoBack}
                                style={{
                                    marginTop: '1rem',
                                    padding: '0.5rem 1rem',
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#888',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                }}
                            >
                                ← Go back
                            </button>
                        )}
                    </div>
                )}

                {/* Summary & Submit */}
                {isComplete && (
                    <div style={{ animation: 'slideIn 0.3s ease' }}>
                        <div style={styles.questionCard}>
                            <h3 style={{ marginBottom: '1rem', color: '#1a1a2e' }}>
                                ✓ Review Your Responses
                            </h3>
                            
                            {Object.entries(responses).map(([key, value]) => (
                                <div key={key} style={styles.summaryItem}>
                                    <span style={{ color: '#666', fontSize: '0.9rem', flex: 1 }}>
                                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                    </span>
                                    <span style={{ fontWeight: '600', color: '#333', maxWidth: '50%', textAlign: 'right' }}>
                                        {getReadableAnswer(key, value)}
                                    </span>
                                </div>
                            ))}

                            <button
                                type="button"
                                onClick={handleGoBack}
                                style={{
                                    marginTop: '1rem',
                                    padding: '0.5rem 1rem',
                                    background: 'transparent',
                                    border: '1px solid #ddd',
                                    borderRadius: '8px',
                                    color: '#666',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                }}
                            >
                                ← Edit responses
                            </button>
                        </div>

                        {/* Additional Notes */}
                        <div style={styles.questionCard}>
                            <label style={{ fontWeight: '600', marginBottom: '0.75rem', display: 'block' }}>
                                Anything else to share? (Optional)
                            </label>
                            <textarea
                                value={additionalNotes}
                                onChange={(e) => setAdditionalNotes(e.target.value)}
                                placeholder="Any additional symptoms, concerns, or questions..."
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    border: '2px solid #e8e8e8',
                                    borderRadius: '12px',
                                    fontSize: '1rem',
                                    minHeight: '100px',
                                    resize: 'vertical',
                                    fontFamily: 'inherit',
                                    boxSizing: 'border-box',
                                }}
                            />
                        </div>

                        {/* Consent & Submit */}
                        <div style={styles.questionCard}>
                            <label style={{ 
                                display: 'flex', 
                                alignItems: 'flex-start', 
                                gap: '0.75rem',
                                cursor: 'pointer',
                                marginBottom: '1.5rem',
                            }}>
                                <input
                                    type="checkbox"
                                    checked={consent}
                                    onChange={(e) => setConsent(e.target.checked)}
                                    style={{ 
                                        width: '22px', 
                                        height: '22px', 
                                        marginTop: '2px',
                                        accentColor: '#667eea',
                                    }}
                                />
                                <span style={{ fontSize: '0.9rem', color: '#555' }}>
                                    I confirm this information is accurate and consent to share it with my doctor.
                                </span>
                            </label>

                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={!consent || submitting}
                                style={{
                                    width: '100%',
                                    padding: '1.25rem',
                                    background: consent 
                                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                        : '#ccc',
                                    border: 'none',
                                    borderRadius: '12px',
                                    color: '#fff',
                                    fontSize: '1.1rem',
                                    fontWeight: '600',
                                    cursor: consent ? 'pointer' : 'not-allowed',
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                {submitting ? 'Submitting...' : '✓ Submit to Doctor'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Prescription Reference - Collapsible */}
                {prescription && !isComplete && (
                    <details style={{ marginTop: '1rem' }}>
                        <summary style={{ 
                            cursor: 'pointer', 
                            color: '#666', 
                            fontSize: '0.9rem',
                            padding: '0.5rem 0',
                        }}>
                            View prescription details
                        </summary>
                        <div style={{ 
                            padding: '1rem', 
                            background: '#fff', 
                            borderRadius: '12px',
                            marginTop: '0.5rem',
                            fontSize: '0.9rem',
                        }}>
                            <p><strong>Medicine:</strong> {prescription.medicineName}</p>
                            <p><strong>Dosage:</strong> {prescription.dosage}</p>
                            <p><strong>Duration:</strong> {prescription.duration}</p>
                            {prescription.condition && (
                                <p><strong>Condition:</strong> {prescription.condition}</p>
                            )}
                            {prescriptionId && (
                                <Link 
                                    to={`/prescription/${prescriptionId}`}
                                    style={{ color: '#667eea', textDecoration: 'none' }}
                                >
                                    View full prescription →
                                </Link>
                            )}
                        </div>
                    </details>
                )}

                <Disclaimer variant="minimal" />
            </div>
        </div>
    );
}

export default PatientFollowUp;
