/**
 * Patient Follow-Up Form - Adverse Event Safety Reporting
 * Optimized for Maximum Data Density with Minimal User Effort
 * 
 * Design Philosophy:
 * - Each question populates MULTIPLE safety fields
 * - Previous answers influence subsequent questions
 * - Text input is analyzed to adapt follow-up questions
 * - 7-8 questions → regulatory-ready case data
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getFollowUpDrafts, submitFollowUp } from '../services/api';
import Loading from '../components/Loading';
import Disclaimer from '../components/Disclaimer';

// ============================================
// QUESTION DEFINITIONS - SMART BRANCHING FLOW
// First understand patient status, then branch accordingly
// ============================================

const QUESTIONS = {
    // ===== PHASE 1: UNDERSTAND PATIENT STATUS =====
    
    // Q1: Overall status - THE MOST IMPORTANT FIRST QUESTION
    overallStatus: {
        id: 'overallStatus',
        question: "How are you feeling after taking the prescribed medicine?",
        subtext: "This helps us understand your current health status",
        options: [
            { value: 'fully_recovered', label: 'Fully recovered / Feeling great', icon: '✅' },
            { value: 'improving', label: 'Getting better gradually', icon: '📈' },
            { value: 'same', label: 'No change in my condition', icon: '➡️' },
            { value: 'had_problem', label: 'Experienced some problems', icon: '⚠️' },
        ],
        textPrompt: "Tell us more about how you're feeling:",
        dataExtracted: ['Treatment outcome', 'Patient status', 'Recovery assessment', 'Follow-up priority'],
        category: 'status'
    },

    // Q2: Medication adherence - Did they complete the course?
    medicationAdherence: {
        id: 'medicationAdherence',
        question: "Did you complete the full course of medication?",
        subtext: "Taking medication as prescribed is important for recovery",
        options: [
            { value: 'completed', label: 'Yes, completed the full course', icon: '✓' },
            { value: 'still_taking', label: 'Still taking it as prescribed', icon: '💊' },
            { value: 'missed_some', label: 'Missed a few doses', icon: '📅' },
            { value: 'stopped_early', label: 'Stopped before completing', icon: '🛑' },
        ],
        textPrompt: "If you missed doses or stopped early, please explain why:",
        dataExtracted: ['Medication adherence', 'Compliance status', 'Treatment completion', 'Dose regularity'],
        category: 'adherence'
    },

    // Q3: Symptom improvement - For those who are recovering/recovered
    symptomImprovement: {
        id: 'symptomImprovement',
        question: "How much have your original symptoms improved?",
        subtext: "Compared to when you first visited the doctor",
        options: [
            { value: 'fully_resolved', label: 'Completely gone', icon: '🎉' },
            { value: 'mostly_better', label: 'Mostly better (70-90%)', icon: '😊' },
            { value: 'somewhat_better', label: 'Somewhat better (30-70%)', icon: '🙂' },
            { value: 'little_better', label: 'Only slightly better', icon: '😐' },
        ],
        textPrompt: "Which symptoms have improved the most?",
        dataExtracted: ['Symptom resolution', 'Treatment efficacy', 'Recovery rate', 'Clinical response'],
        category: 'improvement',
        conditional: (responses) => ['fully_recovered', 'improving'].includes(responses.overallStatus?.selected)
    },

    // Q4: When did improvement start?
    improvementTimeline: {
        id: 'improvementTimeline',
        question: "When did you start noticing improvement?",
        subtext: "This helps assess how well the treatment worked",
        options: [
            { value: 'within_24hrs', label: 'Within 24 hours', icon: '⚡' },
            { value: '2_3_days', label: 'After 2-3 days', icon: '📅' },
            { value: 'within_week', label: 'Within a week', icon: '📆' },
            { value: 'after_week', label: 'After a week or more', icon: '🗓️' },
        ],
        textPrompt: "Describe how your recovery progressed:",
        dataExtracted: ['Time to improvement', 'Treatment response time', 'Efficacy timeline', 'Recovery pattern'],
        category: 'timeline',
        conditional: (responses) => ['fully_recovered', 'improving'].includes(responses.overallStatus?.selected)
    },

    // ===== PHASE 2: FOR PATIENTS WITH PROBLEMS =====

    // Q5: Nature of problem - Only if they had issues
    problemType: {
        id: 'problemType',
        question: "What kind of problem did you experience?",
        subtext: "Select the option that best describes your situation",
        options: [
            { value: 'side_effects', label: 'Side effects from the medicine', icon: '💊' },
            { value: 'condition_worse', label: 'Original condition got worse', icon: '📉' },
            { value: 'new_symptoms', label: 'New unrelated symptoms appeared', icon: '🆕' },
            { value: 'not_working', label: 'Medicine doesn\'t seem to work', icon: '❌' },
        ],
        textPrompt: "Please describe what happened:",
        dataExtracted: ['Problem classification', 'Event type', 'Causality assessment', 'Clinical concern'],
        category: 'problem_type',
        conditional: (responses) => responses.overallStatus?.selected === 'had_problem'
    },

    // Q6: Time to onset - When did problem start?
    timeToOnset: {
        id: 'timeToOnset',
        question: "When did this problem start after taking the medicine?",
        subtext: "This helps determine if the medicine is related",
        options: [
            { value: 'within_1hr', label: 'Within 1 hour', icon: '⚡' },
            { value: 'same_day', label: 'Same day', icon: '📅' },
            { value: 'next_day', label: 'Next day', icon: '➡️' },
            { value: '2_7_days', label: '2-7 days later', icon: '📆' },
            { value: 'after_week', label: 'After 1 week', icon: '🗓️' },
        ],
        textPrompt: "Can you describe what you first noticed?",
        dataExtracted: ['Time-to-onset', 'Temporal association', 'Causality strength', 'Signal detection'],
        category: 'onset',
        conditional: (responses) => responses.overallStatus?.selected === 'had_problem'
    },

    // Q7: Symptoms experienced
    symptoms: {
        id: 'symptoms',
        question: "What symptoms did you experience?",
        subtext: "Select all that apply",
        multiSelect: true,
        options: [
            { value: 'nausea', label: 'Nausea / Vomiting', icon: '🤢' },
            { value: 'dizziness', label: 'Dizziness / Lightheadedness', icon: '💫' },
            { value: 'rash', label: 'Skin rash / Itching', icon: '🔴' },
            { value: 'stomach', label: 'Stomach pain / Diarrhea', icon: '😣' },
            { value: 'headache', label: 'Severe headache', icon: '🤕' },
            { value: 'fatigue', label: 'Extreme fatigue / Weakness', icon: '😴' },
            { value: 'breathing', label: 'Breathing difficulty', icon: '😮‍💨' },
            { value: 'swelling', label: 'Swelling (face/lips/throat)', icon: '😶' },
            { value: 'other', label: 'Other symptoms', icon: '📝' },
        ],
        textPrompt: "Describe your symptoms in detail:",
        dataExtracted: ['Event terms', 'Medical classification', 'Seriousness indicators', 'MedDRA coding'],
        category: 'symptoms',
        conditional: (responses) => responses.overallStatus?.selected === 'had_problem'
    },

    // Q8: Severity
    severity: {
        id: 'severity',
        question: "How severe was the problem at its worst?",
        subtext: "This helps prioritize your case",
        options: [
            { value: 'mild', label: 'Mild - Noticed but didn\'t affect daily life', icon: '🟢' },
            { value: 'moderate', label: 'Moderate - Affected some daily activities', icon: '🟡' },
            { value: 'severe', label: 'Severe - Significantly impacted daily life', icon: '🔴' },
        ],
        textPrompt: "How did this affect your daily routine?",
        dataExtracted: ['Severity grading', 'Clinical impact', 'Risk prioritization', 'Follow-up urgency'],
        category: 'severity',
        conditional: (responses) => responses.overallStatus?.selected === 'had_problem'
    },

    // Q9: Medical attention needed?
    medicalAttention: {
        id: 'medicalAttention',
        question: "Did you need medical attention for this problem?",
        subtext: "This determines case seriousness",
        options: [
            { value: 'none', label: 'No, managed at home', icon: '🏠' },
            { value: 'doctor', label: 'Visited a doctor', icon: '👨‍⚕️' },
            { value: 'emergency', label: 'Emergency room visit', icon: '🚑' },
            { value: 'hospital', label: 'Hospital admission', icon: '🏥' },
        ],
        textPrompt: "What treatment or advice did you receive?",
        dataExtracted: ['Seriousness assessment', 'Hospitalization flag', 'Regulatory criteria', 'Escalation trigger'],
        category: 'seriousness',
        conditional: (responses) => responses.overallStatus?.selected === 'had_problem'
    },

    // Q10: Action taken with medicine
    actionTaken: {
        id: 'actionTaken',
        question: "What did you do with the medicine after the problem?",
        subtext: "Your response helps assess the situation",
        options: [
            { value: 'stopped', label: 'Stopped taking it', icon: '🛑' },
            { value: 'reduced', label: 'Reduced the dose', icon: '📉' },
            { value: 'continued', label: 'Continued as prescribed', icon: '➡️' },
            { value: 'doctor_advised', label: 'Doctor advised to stop/change', icon: '👨‍⚕️' },
        ],
        textPrompt: "Who made this decision?",
        dataExtracted: ['Action taken', 'Dechallenge status', 'Risk-benefit decision', 'Physician response'],
        category: 'action',
        conditional: (responses) => responses.overallStatus?.selected === 'had_problem'
    },

    // Q11: Outcome after action
    outcomeAfterAction: {
        id: 'outcomeAfterAction',
        question: "What happened after taking this action?",
        subtext: "This helps establish the link between medicine and problem",
        options: [
            { value: 'resolved', label: 'Problem completely resolved', icon: '✅' },
            { value: 'improved', label: 'Improved significantly', icon: '📈' },
            { value: 'no_change', label: 'No change', icon: '➡️' },
            { value: 'worsened', label: 'Got worse', icon: '📉' },
        ],
        textPrompt: "How long did it take to see this change?",
        dataExtracted: ['Outcome', 'Dechallenge result', 'Causality reinforcement', 'Case completeness'],
        category: 'outcome',
        conditional: (responses) => responses.overallStatus?.selected === 'had_problem'
    },

    // ===== PHASE 3: COMMON QUESTIONS FOR ALL =====

    // Q12: Other medications
    otherMedications: {
        id: 'otherMedications',
        question: "Were you taking any other medicines during this time?",
        subtext: "Including vitamins, supplements, or herbal products",
        options: [
            { value: 'none', label: 'No other medications', icon: '✓' },
            { value: 'prescription', label: 'Other prescription medicines', icon: '💊' },
            { value: 'otc', label: 'Over-the-counter medicines', icon: '🏪' },
            { value: 'supplements', label: 'Vitamins/Supplements/Herbal', icon: '🌿' },
        ],
        textPrompt: "Please list them if possible:",
        dataExtracted: ['Concomitant medications', 'Drug interactions', 'Confounding factors', 'Complete picture'],
        category: 'concomitant'
    },

    // Q13: Need follow-up?
    needsFollowUp: {
        id: 'needsFollowUp',
        question: "Would you like any further assistance?",
        subtext: "We're here to help",
        options: [
            { value: 'all_good', label: 'No, I\'m doing fine', icon: '👍' },
            { value: 'questions', label: 'I have some questions', icon: '❓' },
            { value: 'callback', label: 'Please call me back', icon: '📞' },
            { value: 'appointment', label: 'Need a follow-up appointment', icon: '📅' },
        ],
        textPrompt: "Any specific questions or concerns?",
        dataExtracted: ['Follow-up need', 'Patient engagement', 'Support required', 'Next steps'],
        category: 'followup'
    },
};

// Dynamic question order based on responses
const getQuestionOrder = (responses) => {
    const baseQuestions = ['overallStatus', 'medicationAdherence'];
    
    const status = responses.overallStatus?.selected;
    
    if (status === 'fully_recovered' || status === 'improving') {
        // Happy path - patient is doing well
        return [
            ...baseQuestions,
            'symptomImprovement',
            'improvementTimeline',
            'otherMedications',
            'needsFollowUp'
        ];
    } else if (status === 'had_problem') {
        // Problem path - need detailed adverse event info
        return [
            ...baseQuestions,
            'problemType',
            'timeToOnset',
            'symptoms',
            'severity',
            'medicalAttention',
            'actionTaken',
            'outcomeAfterAction',
            'otherMedications',
            'needsFollowUp'
        ];
    } else if (status === 'same') {
        // No change path
        return [
            ...baseQuestions,
            'otherMedications',
            'needsFollowUp'
        ];
    }
    
    // Default - just ask first two questions
    return baseQuestions;
};

// ============================================
// STYLES
// ============================================
const styles = {
    container: {
        maxWidth: '600px',
        margin: '0 auto',
        padding: '1rem',
        paddingBottom: '100px',
    },
    header: {
        textAlign: 'center',
        marginBottom: '1.5rem',
        paddingTop: '1rem',
    },
    questionCard: {
        background: '#fff',
        borderRadius: '20px',
        padding: '1.5rem',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        marginBottom: '1rem',
        animation: 'slideIn 0.4s ease',
    },
    progressBar: {
        display: 'flex',
        gap: '4px',
        marginBottom: '2rem',
        padding: '0 0.5rem',
    },
    progressSegment: {
        height: '4px',
        borderRadius: '2px',
        flex: 1,
        transition: 'all 0.3s ease',
    },
    questionNumber: {
        fontSize: '0.8rem',
        color: '#667eea',
        fontWeight: '600',
        marginBottom: '0.5rem',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
    },
    questionText: {
        fontSize: '1.3rem',
        fontWeight: '700',
        marginBottom: '0.5rem',
        color: '#1a1a2e',
        lineHeight: '1.3',
    },
    questionSubtext: {
        fontSize: '0.9rem',
        color: '#888',
        marginBottom: '1.5rem',
    },
    optionGrid: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem',
    },
    optionButton: {
        width: '100%',
        padding: '1rem 1.25rem',
        border: '2px solid #e8e8e8',
        borderRadius: '14px',
        background: '#fafafa',
        cursor: 'pointer',
        textAlign: 'left',
        fontSize: '1rem',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
    },
    optionIcon: {
        fontSize: '1.3rem',
        width: '32px',
        textAlign: 'center',
    },
    optionLabel: {
        flex: 1,
        fontWeight: '500',
    },
    optionCheck: {
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        border: '2px solid #ddd',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
    },
    textInputSection: {
        marginTop: '1.5rem',
        paddingTop: '1.5rem',
        borderTop: '1px solid #f0f0f0',
    },
    textInputLabel: {
        fontSize: '0.95rem',
        fontWeight: '600',
        color: '#444',
        marginBottom: '0.75rem',
        display: 'block',
    },
    textInput: {
        width: '100%',
        padding: '1rem',
        border: '2px solid #e8e8e8',
        borderRadius: '14px',
        fontSize: '1rem',
        resize: 'none',
        fontFamily: 'inherit',
        minHeight: '80px',
        boxSizing: 'border-box',
        transition: 'border-color 0.2s ease',
    },
    textInputHint: {
        fontSize: '0.8rem',
        color: '#aaa',
        marginTop: '0.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
    },
    navigationButtons: {
        display: 'flex',
        gap: '1rem',
        marginTop: '1.5rem',
    },
    backButton: {
        padding: '0.75rem 1.5rem',
        background: 'transparent',
        border: '2px solid #e0e0e0',
        borderRadius: '12px',
        color: '#666',
        cursor: 'pointer',
        fontSize: '1rem',
        fontWeight: '500',
        transition: 'all 0.2s ease',
    },
    nextButton: {
        flex: 1,
        padding: '1rem 1.5rem',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        border: 'none',
        borderRadius: '12px',
        color: '#fff',
        cursor: 'pointer',
        fontSize: '1.05rem',
        fontWeight: '600',
        transition: 'all 0.2s ease',
    },
    dataExtractedBox: {
        background: 'linear-gradient(135deg, #667eea08 0%, #764ba208 100%)',
        borderRadius: '12px',
        padding: '1rem',
        marginTop: '1rem',
    },
    dataExtractedTitle: {
        fontSize: '0.75rem',
        color: '#667eea',
        fontWeight: '600',
        marginBottom: '0.5rem',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
    },
    dataExtractedTags: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.5rem',
    },
    dataTag: {
        fontSize: '0.75rem',
        padding: '0.25rem 0.6rem',
        background: '#667eea15',
        color: '#667eea',
        borderRadius: '20px',
        fontWeight: '500',
    },
    summaryCard: {
        background: '#fff',
        borderRadius: '20px',
        padding: '1.5rem',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        marginBottom: '1rem',
    },
    summaryItem: {
        padding: '1rem 0',
        borderBottom: '1px solid #f5f5f5',
    },
    summaryQuestion: {
        fontSize: '0.85rem',
        color: '#888',
        marginBottom: '0.25rem',
    },
    summaryAnswer: {
        fontSize: '1rem',
        fontWeight: '600',
        color: '#333',
    },
    urgentBanner: {
        background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%)',
        color: '#fff',
        padding: '1rem 1.25rem',
        borderRadius: '14px',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '1rem',
    },
};

// ============================================
// MAIN COMPONENT
// ============================================
function PatientFollowUp() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [prescription, setPrescription] = useState(null);
    const [prescriptionId, setPrescriptionId] = useState(null);
    
    // Responses state: { questionId: { selected: value|array, notes: string } }
    const [responses, setResponses] = useState({});
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [consent, setConsent] = useState(false);
    const [showSummary, setShowSummary] = useState(false);

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

    // Get active questions based on responses (dynamic branching)
    const getActiveQuestions = useCallback(() => {
        return getQuestionOrder(responses).filter(qId => {
            const q = QUESTIONS[qId];
            if (!q) return false;
            if (q.conditional) {
                return q.conditional(responses);
            }
            return true;
        });
    }, [responses]);

    const activeQuestions = getActiveQuestions();
    const currentQuestionId = activeQuestions[currentQuestionIndex];
    const currentQuestion = currentQuestionId ? QUESTIONS[currentQuestionId] : null;
    const totalQuestions = activeQuestions.length;

    // Handle option selection
    const handleOptionSelect = (value) => {
        const q = currentQuestion;
        
        if (q.multiSelect) {
            // For multi-select, toggle the value in an array
            setResponses(prev => {
                const current = prev[q.id]?.selected || [];
                const updated = current.includes(value) 
                    ? current.filter(v => v !== value)
                    : [...current, value];
                return {
                    ...prev,
                    [q.id]: { ...prev[q.id], selected: updated }
                };
            });
        } else {
            // For single select, just set the value
            setResponses(prev => ({
                ...prev,
                [q.id]: { ...prev[q.id], selected: value }
            }));
        }
    };

    // Handle notes input
    const handleNotesChange = (value) => {
        setResponses(prev => ({
            ...prev,
            [currentQuestion.id]: { ...prev[currentQuestion.id], notes: value }
        }));
    };

    // Check if current question has a valid response
    const hasValidResponse = () => {
        if (!currentQuestion) return false;
        const response = responses[currentQuestion.id];
        if (!response) return false;
        
        if (currentQuestion.multiSelect) {
            return response.selected && response.selected.length > 0;
        }
        return response.selected !== undefined && response.selected !== null;
    };

    // Navigate to next question
    const handleNext = () => {
        if (currentQuestionIndex < totalQuestions - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            setShowSummary(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // Navigate to previous question
    const handleBack = () => {
        if (showSummary) {
            setShowSummary(false);
        } else if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // Get readable answer for summary
    const getReadableAnswer = (questionId) => {
        const q = QUESTIONS[questionId];
        const response = responses[questionId];
        if (!response || !response.selected) return 'Not answered';
        
        if (q.multiSelect) {
            return response.selected.map(v => {
                const opt = q.options.find(o => o.value === v);
                return opt ? opt.label : v;
            }).join(', ');
        }
        
        const opt = q.options.find(o => o.value === response.selected);
        return opt ? opt.label : response.selected;
    };

    // Check for urgent conditions
    const isUrgentCase = () => {
        const status = responses.overallStatus?.selected;
        const medicalAttention = responses.medicalAttention?.selected;
        const severity = responses.severity?.selected;
        const symptoms = responses.symptoms?.selected || [];
        
        // Only urgent if patient had problems AND serious indicators
        if (status !== 'had_problem') return false;
        
        return medicalAttention === 'hospital' || 
               medicalAttention === 'emergency' ||
               severity === 'severe' ||
               symptoms.includes('breathing') ||
               symptoms.includes('swelling');
    };

    // Get path type for summary display
    const getPathType = () => {
        const status = responses.overallStatus?.selected;
        if (status === 'fully_recovered' || status === 'improving') return 'positive';
        if (status === 'had_problem') return 'adverse';
        return 'neutral';
    };

    // Submit the form
    const handleSubmit = async () => {
        if (!consent) {
            alert('Please confirm your consent to share this information.');
            return;
        }
        
        setSubmitting(true);
        try {
            const pathType = getPathType();
            
            // Build comprehensive response object - structure varies by path
            const safetyData = {
                // Core status (always present)
                overallStatus: responses.overallStatus?.selected || '',
                medicationAdherence: responses.medicationAdherence?.selected || '',
                pathType: pathType,
                
                // Positive path fields
                symptomImprovement: responses.symptomImprovement?.selected || '',
                improvementTimeline: responses.improvementTimeline?.selected || '',
                
                // Adverse event fields (only if had_problem)
                problemType: responses.problemType?.selected || '',
                timeToOnset: responses.timeToOnset?.selected || '',
                symptoms: (responses.symptoms?.selected || []).join(', '),
                severity: responses.severity?.selected || '',
                medicalAttention: responses.medicalAttention?.selected || '',
                actionTaken: responses.actionTaken?.selected || '',
                outcomeAfterAction: responses.outcomeAfterAction?.selected || '',
                
                // Common fields
                concomitantMedications: responses.otherMedications?.selected || '',
                followUpNeeded: responses.needsFollowUp?.selected || '',
                
                // Notes combined
                patientNotes: Object.entries(responses)
                    .filter(([key, r]) => r.notes && r.notes.trim())
                    .map(([qId, r]) => `${QUESTIONS[qId]?.question}: ${r.notes}`)
                    .join(' | ') || 'No additional notes',
                
                // Derived fields
                isSerious: responses.medicalAttention?.selected === 'hospital' || 
                          responses.medicalAttention?.selected === 'emergency',
                needsUrgentAttention: isUrgentCase(),
                isPositiveOutcome: pathType === 'positive',
                
                // Summary
                summaryText: activeQuestions.map(qId => 
                    `${QUESTIONS[qId].question}: ${getReadableAnswer(qId)}`
                ).join(' | ')
            };
            
            await submitFollowUp(id, safetyData, true);
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

    return (
        <div className="page" style={{ background: 'linear-gradient(180deg, #f8f9fc 0%, #eef1f8 100%)', minHeight: '100vh' }}>
            <style>
                {`
                    @keyframes slideIn {
                        from { opacity: 0; transform: translateY(30px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    .option-btn:hover {
                        border-color: #667eea !important;
                        transform: translateY(-2px);
                        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
                    }
                    .text-input:focus {
                        border-color: #667eea !important;
                        outline: none;
                    }
                    .next-btn:hover:not(:disabled) {
                        transform: translateY(-2px);
                        box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
                    }
                    .next-btn:disabled {
                        background: #ccc !important;
                        cursor: not-allowed;
                    }
                `}
            </style>
            
            <div style={styles.container}>
                {/* Header */}
                <div style={styles.header}>
                    <h1 style={{ fontSize: '1.4rem', marginBottom: '0.25rem', color: '#1a1a2e' }}>
                        Safety Follow-Up
                    </h1>
                    {prescription && (
                        <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>
                            {prescription.medicineName || prescription.condition}
                        </p>
                    )}
                </div>

                {/* Progress Bar */}
                <div style={styles.progressBar}>
                    {activeQuestions.map((_, i) => (
                        <div
                            key={i}
                            style={{
                                ...styles.progressSegment,
                                background: i < currentQuestionIndex 
                                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                    : i === currentQuestionIndex && !showSummary
                                        ? '#667eea'
                                        : '#e0e0e0',
                            }}
                        />
                    ))}
                </div>

                {/* Urgent Warning Banner */}
                {isUrgentCase() && !showSummary && (
                    <div style={styles.urgentBanner}>
                        <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                        <div>
                            <strong style={{ display: 'block', marginBottom: '0.25rem' }}>
                                Immediate Medical Attention Recommended
                            </strong>
                            <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                                Based on your responses, please consult a healthcare provider
                            </span>
                        </div>
                    </div>
                )}

                {/* Current Question */}
                {!showSummary && currentQuestion && (
                    <div style={styles.questionCard}>
                        <div style={styles.questionNumber}>
                            Question {currentQuestionIndex + 1} of {totalQuestions}
                        </div>
                        
                        <h2 style={styles.questionText}>
                            {currentQuestion.question}
                        </h2>
                        
                        <p style={styles.questionSubtext}>
                            {currentQuestion.subtext}
                        </p>

                        {/* Options */}
                        <div style={styles.optionGrid}>
                            {currentQuestion.options.map((option) => {
                                const response = responses[currentQuestion.id];
                                const isSelected = currentQuestion.multiSelect
                                    ? (response?.selected || []).includes(option.value)
                                    : response?.selected === option.value;
                                
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        className="option-btn"
                                        style={{
                                            ...styles.optionButton,
                                            borderColor: isSelected ? '#667eea' : '#e8e8e8',
                                            background: isSelected 
                                                ? 'linear-gradient(135deg, #667eea08 0%, #764ba208 100%)' 
                                                : '#fafafa',
                                        }}
                                        onClick={() => handleOptionSelect(option.value)}
                                    >
                                        <span style={styles.optionIcon}>{option.icon}</span>
                                        <span style={styles.optionLabel}>{option.label}</span>
                                        <span style={{
                                            ...styles.optionCheck,
                                            background: isSelected ? '#667eea' : 'transparent',
                                            borderColor: isSelected ? '#667eea' : '#ddd',
                                        }}>
                                            {isSelected && (
                                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                                    <path d="M3 7L6 10L11 4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                                                </svg>
                                            )}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Text Input for Additional Details */}
                        <div style={styles.textInputSection}>
                            <label style={styles.textInputLabel}>
                                💬 {currentQuestion.textPrompt}
                            </label>
                            <textarea
                                className="text-input"
                                value={responses[currentQuestion.id]?.notes || ''}
                                onChange={(e) => handleNotesChange(e.target.value)}
                                placeholder="Your description helps us understand better... (optional)"
                                style={styles.textInput}
                            />
                            <div style={styles.textInputHint}>
                                <span>💡</span>
                                <span>Your description is analyzed to personalize follow-up questions</span>
                            </div>
                        </div>

                        {/* Data Extracted Info */}
                        <div style={styles.dataExtractedBox}>
                            <div style={styles.dataExtractedTitle}>
                                📊 This question captures:
                            </div>
                            <div style={styles.dataExtractedTags}>
                                {currentQuestion.dataExtracted.map((field, i) => (
                                    <span key={i} style={styles.dataTag}>{field}</span>
                                ))}
                            </div>
                        </div>

                        {/* Navigation */}
                        <div style={styles.navigationButtons}>
                            {currentQuestionIndex > 0 && (
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    style={styles.backButton}
                                >
                                    ← Back
                                </button>
                            )}
                            <button
                                type="button"
                                className="next-btn"
                                onClick={handleNext}
                                disabled={!hasValidResponse()}
                                style={{
                                    ...styles.nextButton,
                                    opacity: hasValidResponse() ? 1 : 0.6,
                                }}
                            >
                                {currentQuestionIndex === totalQuestions - 1 ? 'Review Answers' : 'Continue →'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Summary Screen */}
                {showSummary && (
                    <div style={{ animation: 'slideIn 0.4s ease' }}>
                        {/* Path-specific Banner */}
                        {getPathType() === 'positive' && (
                            <div style={{
                                ...styles.urgentBanner,
                                background: 'linear-gradient(135deg, #00b894 0%, #00a884 100%)',
                            }}>
                                <span style={{ fontSize: '1.5rem' }}>🎉</span>
                                <div>
                                    <strong style={{ display: 'block', marginBottom: '0.25rem' }}>
                                        Great to hear you're doing well!
                                    </strong>
                                    <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                                        Your positive recovery will be shared with your doctor
                                    </span>
                                </div>
                            </div>
                        )}
                        
                        {isUrgentCase() && (
                            <div style={styles.urgentBanner}>
                                <span style={{ fontSize: '1.5rem' }}>🏥</span>
                                <div>
                                    <strong style={{ display: 'block', marginBottom: '0.25rem' }}>
                                        This case will be flagged as urgent
                                    </strong>
                                    <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                                        Your doctor will be notified immediately
                                    </span>
                                </div>
                            </div>
                        )}

                        <div style={styles.summaryCard}>
                            <h2 style={{ marginBottom: '1rem', fontSize: '1.3rem', color: '#1a1a2e' }}>
                                ✓ Review Your Responses
                            </h2>
                            
                            {activeQuestions.map((qId, index) => {
                                const q = QUESTIONS[qId];
                                const response = responses[qId];
                                
                                return (
                                    <div key={qId} style={styles.summaryItem}>
                                        <div style={styles.summaryQuestion}>
                                            {index + 1}. {q.question}
                                        </div>
                                        <div style={styles.summaryAnswer}>
                                            {getReadableAnswer(qId)}
                                        </div>
                                        {response?.notes && (
                                            <div style={{ 
                                                fontSize: '0.85rem', 
                                                color: '#666', 
                                                marginTop: '0.5rem',
                                                fontStyle: 'italic',
                                                background: '#f8f9fc',
                                                padding: '0.5rem',
                                                borderRadius: '8px'
                                            }}>
                                                "{response.notes}"
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            <button
                                type="button"
                                onClick={handleBack}
                                style={{
                                    ...styles.backButton,
                                    marginTop: '1rem',
                                }}
                            >
                                ← Edit Responses
                            </button>
                        </div>

                        {/* Consent & Submit */}
                        <div style={styles.summaryCard}>
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
                                        width: '24px', 
                                        height: '24px', 
                                        marginTop: '2px',
                                        accentColor: '#667eea',
                                        flexShrink: 0,
                                    }}
                                />
                                <span style={{ fontSize: '0.95rem', color: '#444', lineHeight: '1.5' }}>
                                    I confirm this information is accurate and I consent to share it with my healthcare provider for safety monitoring purposes.
                                </span>
                            </label>

                            <button
                                type="button"
                                className="next-btn"
                                onClick={handleSubmit}
                                disabled={!consent || submitting}
                                style={{
                                    ...styles.nextButton,
                                    width: '100%',
                                    padding: '1.25rem',
                                    fontSize: '1.1rem',
                                    opacity: consent ? 1 : 0.6,
                                }}
                            >
                                {submitting ? 'Submitting...' : '✓ Submit Safety Report'}
                            </button>
                        </div>

                        {/* Data Summary */}
                        <div style={{
                            ...styles.summaryCard,
                            background: getPathType() === 'positive' 
                                ? 'linear-gradient(135deg, #00b89408 0%, #00a88408 100%)'
                                : 'linear-gradient(135deg, #667eea08 0%, #764ba208 100%)',
                        }}>
                            <div style={{ 
                                fontSize: '0.85rem', 
                                color: getPathType() === 'positive' ? '#00b894' : '#667eea', 
                                fontWeight: '600',
                                marginBottom: '0.75rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}>
                                📊 {getPathType() === 'positive' ? 'Recovery Data Captured' : 'Safety Data Captured'}
                            </div>
                            <div style={{ 
                                display: 'flex', 
                                flexWrap: 'wrap', 
                                gap: '0.5rem',
                                fontSize: '0.8rem'
                            }}>
                                {getPathType() === 'positive' ? (
                                    // Positive outcome data fields
                                    ['Overall status', 'Medication adherence', 'Symptom improvement', 'Recovery timeline', 'Other medications', 'Follow-up needs'].map((field, i) => (
                                        <span key={i} style={{...styles.dataTag, background: '#00b89415', color: '#00b894'}}>✓ {field}</span>
                                    ))
                                ) : getPathType() === 'adverse' ? (
                                    // Adverse event data fields
                                    ['Time-to-onset', 'Event description', 'Severity', 'Seriousness', 'Action taken', 'Outcome', 'Concomitant drugs'].map((field, i) => (
                                        <span key={i} style={styles.dataTag}>✓ {field}</span>
                                    ))
                                ) : (
                                    // Neutral path
                                    ['Overall status', 'Medication adherence', 'Other medications', 'Follow-up needs'].map((field, i) => (
                                        <span key={i} style={styles.dataTag}>✓ {field}</span>
                                    ))
                                )}
                            </div>
                            <p style={{ 
                                fontSize: '0.85rem', 
                                color: '#666', 
                                marginTop: '1rem',
                                marginBottom: 0
                            }}>
                                {getPathType() === 'positive' 
                                    ? 'Your recovery progress will help your doctor track treatment success.'
                                    : getPathType() === 'adverse'
                                    ? 'Your responses meet regulatory requirements for adverse event reporting.'
                                    : 'Your feedback helps your doctor understand your treatment progress.'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Prescription Reference */}
                {prescription && !showSummary && (
                    <details style={{ marginTop: '1rem' }}>
                        <summary style={{ 
                            cursor: 'pointer', 
                            color: '#888', 
                            fontSize: '0.9rem',
                            padding: '0.5rem 0',
                        }}>
                            View prescription details
                        </summary>
                        <div style={{ 
                            padding: '1rem', 
                            background: '#fff', 
                            borderRadius: '14px',
                            marginTop: '0.5rem',
                            fontSize: '0.9rem',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        }}>
                            {prescription.medicines && prescription.medicines.length > 0 ? (
                                prescription.medicines.map((med, i) => (
                                    <p key={i}><strong>{med.name}:</strong> {med.dosageInstructions || med.dosage}</p>
                                ))
                            ) : (
                                <>
                                    <p><strong>Medicine:</strong> {prescription.medicineName}</p>
                                    <p><strong>Dosage:</strong> {prescription.dosage}</p>
                                </>
                            )}
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
