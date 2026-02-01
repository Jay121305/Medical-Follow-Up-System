/**
 * Patient Follow-Up Form (Steps 5, 6, 7)
 * MCQ-based form for easy patient response
 * Patient is the final authority
 * Now includes personalized questions based on prescription
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getFollowUpDrafts, submitFollowUp } from '../services/api';
import Loading from '../components/Loading';
import Disclaimer from '../components/Disclaimer';

// MCQ Options for each question (Generic Questions - Clinically Focused)
const GENERIC_QUESTIONS = {
    medicationAdherence: {
        question: "How consistently did you take your medication?",
        options: [
            { value: "complete", label: "Took all doses as prescribed" },
            { value: "mostly", label: "Missed 1-2 doses only" },
            { value: "partial", label: "Took less than half the doses" },
            { value: "stopped", label: "Stopped or couldn't take the medication" },
        ]
    },
    symptomStatus: {
        question: "Compared to when you started treatment, how are your main symptoms now?",
        options: [
            { value: "resolved", label: "Symptoms fully resolved" },
            { value: "improved", label: "Noticeably better but not fully gone" },
            { value: "unchanged", label: "No significant change" },
            { value: "worsened", label: "Symptoms have gotten worse" },
        ]
    },
    sideEffects: {
        question: "Did you experience any concerning reactions to the medication?",
        options: [
            { value: "none", label: "No issues or reactions" },
            { value: "mild", label: "Minor discomfort that didn't affect daily life" },
            { value: "moderate", label: "Bothersome effects that affected daily activities" },
            { value: "severe", label: "Serious reaction requiring medical attention" },
        ]
    },
    completionStatus: {
        question: "What is the current status of your treatment course?",
        options: [
            { value: "completed", label: "Completed the full course" },
            { value: "ongoing", label: "Still taking as prescribed" },
            { value: "stopped_improved", label: "Stopped early because symptoms improved" },
            { value: "stopped_problem", label: "Stopped due to side effects or other issues" },
        ]
    },
    overallCondition: {
        question: "How would you describe your overall health condition right now?",
        options: [
            { value: "recovered", label: "Feel fully recovered" },
            { value: "improving", label: "Getting better, recovery in progress" },
            { value: "same", label: "About the same as before treatment" },
            { value: "worse", label: "Feeling worse than before" },
        ]
    }
};

// Styles for MCQ options
const mcqStyles = {
    optionGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
    },
    optionLabel: {
        display: 'flex',
        alignItems: 'center',
        padding: '0.75rem 1rem',
        borderRadius: '8px',
        border: '2px solid var(--color-border)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        background: 'var(--color-bg-secondary)',
    },
    optionLabelSelected: {
        borderColor: 'var(--color-primary)',
        background: 'var(--color-primary-bg)',
    },
    optionLabelHover: {
        borderColor: 'var(--color-primary-light)',
    },
    radioInput: {
        marginRight: '0.75rem',
        width: '18px',
        height: '18px',
        accentColor: 'var(--color-primary)',
    },
    questionTitle: {
        fontSize: '1rem',
        fontWeight: '600',
        marginBottom: '0.75rem',
        color: 'var(--color-text)',
    }
};

function PatientFollowUp() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [prescription, setPrescription] = useState(null);
    const [prescriptionId, setPrescriptionId] = useState(null);
    const [personalizedQuestions, setPersonalizedQuestions] = useState([]);
    const [responses, setResponses] = useState({
        medicationAdherence: '',
        symptomStatus: '',
        sideEffects: '',
        completionStatus: '',
        overallCondition: '',
        additionalNotes: '',
    });
    const [personalizedResponses, setPersonalizedResponses] = useState({});
    const [consent, setConsent] = useState(false);
    const [hoveredOption, setHoveredOption] = useState(null);

    useEffect(() => { loadDrafts(); }, [id]);

    const loadDrafts = async () => {
        try {
            const result = await getFollowUpDrafts(id);
            setPrescription(result.data.prescriptionInfo);
            setPrescriptionId(result.data.prescriptionId);
            
            // Load personalized questions if available
            if (result.data.personalizedQuestions && result.data.personalizedQuestions.length > 0) {
                setPersonalizedQuestions(result.data.personalizedQuestions);
                // Initialize personalized responses
                const initialPersonalized = {};
                result.data.personalizedQuestions.forEach(q => {
                    initialPersonalized[q.id] = '';
                });
                setPersonalizedResponses(initialPersonalized);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field, value) => {
        setResponses(prev => ({ ...prev, [field]: value }));
    };

    const handlePersonalizedChange = (questionId, value) => {
        setPersonalizedResponses(prev => ({ ...prev, [questionId]: value }));
    };

    const getOptionLabel = (field, value) => {
        const option = GENERIC_QUESTIONS[field]?.options.find(opt => opt.value === value);
        return option ? option.label : value;
    };

    const getPersonalizedOptionLabel = (question, value) => {
        const option = question.options?.find(opt => opt.value === value);
        return option ? option.label : value;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate required generic fields
        const requiredFields = ['medicationAdherence', 'symptomStatus', 'sideEffects', 'completionStatus', 'overallCondition'];
        const missingFields = requiredFields.filter(field => !responses[field]);
        
        if (missingFields.length > 0) {
            alert('Please answer all required questions before submitting.');
            return;
        }

        // Validate required personalized questions
        const requiredPersonalized = personalizedQuestions.filter(q => q.required);
        const missingPersonalized = requiredPersonalized.filter(q => !personalizedResponses[q.id]);
        
        if (missingPersonalized.length > 0) {
            alert('Please answer all required personalized questions before submitting.');
            return;
        }
        
        if (!consent) {
            alert('Please confirm your consent to share this information with your doctor.');
            return;
        }
        
        setSubmitting(true);
        try {
            // Convert values to readable labels for submission
            const readableResponses = {
                medicationAdherence: getOptionLabel('medicationAdherence', responses.medicationAdherence),
                symptomStatus: getOptionLabel('symptomStatus', responses.symptomStatus),
                sideEffects: getOptionLabel('sideEffects', responses.sideEffects),
                completionStatus: getOptionLabel('completionStatus', responses.completionStatus),
                overallCondition: getOptionLabel('overallCondition', responses.overallCondition),
                additionalNotes: responses.additionalNotes || 'No additional notes',
            };

            // Add personalized responses
            if (personalizedQuestions.length > 0) {
                readableResponses.personalizedResponses = personalizedQuestions.map(q => ({
                    question: q.question,
                    answer: personalizedResponses[q.id] ? getPersonalizedOptionLabel(q, personalizedResponses[q.id]) : 'Not answered',
                    category: q.category,
                }));
            }
            
            await submitFollowUp(id, readableResponses, true);
            navigate(`/follow-up/${id}/success`);
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const renderMCQQuestion = (fieldName, isRequired = true) => {
        const questionData = GENERIC_QUESTIONS[fieldName];
        if (!questionData) return null;

        return (
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={mcqStyles.questionTitle}>
                    {questionData.question}
                    {isRequired && <span style={{ color: 'var(--color-error)', marginLeft: '4px' }}>*</span>}
                </label>
                <div style={mcqStyles.optionGroup}>
                    {questionData.options.map((option) => {
                        const isSelected = responses[fieldName] === option.value;
                        const isHovered = hoveredOption === `${fieldName}-${option.value}`;
                        
                        return (
                            <label
                                key={option.value}
                                style={{
                                    ...mcqStyles.optionLabel,
                                    ...(isSelected ? mcqStyles.optionLabelSelected : {}),
                                    ...(isHovered && !isSelected ? { borderColor: 'var(--color-primary-light)', background: 'var(--color-bg-tertiary)' } : {}),
                                }}
                                onMouseEnter={() => setHoveredOption(`${fieldName}-${option.value}`)}
                                onMouseLeave={() => setHoveredOption(null)}
                            >
                                <input
                                    type="radio"
                                    name={fieldName}
                                    value={option.value}
                                    checked={isSelected}
                                    onChange={() => handleChange(fieldName, option.value)}
                                    style={mcqStyles.radioInput}
                                />
                                <span>{option.label}</span>
                            </label>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderPersonalizedQuestion = (question) => {
        return (
            <div key={question.id} className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={mcqStyles.questionTitle}>
                    {question.question}
                    {question.required && <span style={{ color: 'var(--color-error)', marginLeft: '4px' }}>*</span>}
                </label>
                <div style={mcqStyles.optionGroup}>
                    {question.options?.map((option) => {
                        const isSelected = personalizedResponses[question.id] === option.value;
                        const isHovered = hoveredOption === `personalized-${question.id}-${option.value}`;
                        
                        return (
                            <label
                                key={option.value}
                                style={{
                                    ...mcqStyles.optionLabel,
                                    ...(isSelected ? mcqStyles.optionLabelSelected : {}),
                                    ...(isHovered && !isSelected ? { borderColor: 'var(--color-primary-light)', background: 'var(--color-bg-tertiary)' } : {}),
                                }}
                                onMouseEnter={() => setHoveredOption(`personalized-${question.id}-${option.value}`)}
                                onMouseLeave={() => setHoveredOption(null)}
                            >
                                <input
                                    type="radio"
                                    name={`personalized-${question.id}`}
                                    value={option.value}
                                    checked={isSelected}
                                    onChange={() => handlePersonalizedChange(question.id, option.value)}
                                    style={mcqStyles.radioInput}
                                />
                                <span>{option.label}</span>
                            </label>
                        );
                    })}
                </div>
            </div>
        );
    };

    if (loading) return <Loading message="Loading your follow-up form..." />;
    if (error) return <div className="page"><div className="container"><div className="alert alert-error">{error}</div></div></div>;

    // Calculate progress
    const requiredGenericFields = ['medicationAdherence', 'symptomStatus', 'sideEffects', 'completionStatus', 'overallCondition'];
    const answeredGeneric = requiredGenericFields.filter(field => responses[field]).length;
    
    const requiredPersonalizedQuestions = personalizedQuestions.filter(q => q.required);
    const answeredPersonalized = requiredPersonalizedQuestions.filter(q => personalizedResponses[q.id]).length;
    
    const totalRequired = requiredGenericFields.length + requiredPersonalizedQuestions.length;
    const totalAnswered = answeredGeneric + answeredPersonalized;
    const progress = Math.round((totalAnswered / totalRequired) * 100);

    return (
        <div className="page">
            <div className="container" style={{ maxWidth: '700px' }}>
                <Disclaimer variant="alert" />

                <h1 className="mb-2">📋 Your Follow-Up Form</h1>
                <p className="text-muted mb-3">Please answer the questions below about your medication experience. Select the option that best describes your situation.</p>

                {/* Progress Bar */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span className="text-sm">Progress</span>
                        <span className="text-sm" style={{ fontWeight: '600' }}>{totalAnswered}/{totalRequired} required questions</span>
                    </div>
                    <div style={{ height: '8px', background: 'var(--color-border)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ 
                            height: '100%', 
                            width: `${progress}%`, 
                            background: progress === 100 ? 'var(--color-success)' : 'var(--color-primary)',
                            transition: 'width 0.3s ease, background 0.3s ease',
                            borderRadius: '4px'
                        }} />
                    </div>
                </div>

                {prescription && (
                    <div className="card mb-4" style={{ background: 'var(--color-primary-bg)', border: '1px solid var(--color-primary)' }}>
                        <div className="d-flex justify-between align-center mb-3">
                            <h4 style={{ margin: 0 }}>💊 Prescription Reference</h4>
                            {prescriptionId && (
                                <Link to={`/prescription/${prescriptionId}`} className="btn btn-sm btn-primary">
                                    View Full Prescription
                                </Link>
                            )}
                        </div>
                        
                        {/* Structured Medication Display */}
                        <div style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ background: 'var(--color-bg-secondary)' }}>
                                        <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.85rem', fontWeight: '600', borderBottom: '2px solid var(--color-border)', width: '40%' }}>Medicine Name</th>
                                        <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.85rem', fontWeight: '600', borderBottom: '2px solid var(--color-border)' }}>Dosage Instructions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style={{ padding: '0.75rem', fontWeight: '600', color: 'var(--color-primary)', verticalAlign: 'top' }}>
                                            {prescription.medicineName}
                                        </td>
                                        <td style={{ padding: '0.75rem', verticalAlign: 'top' }}>
                                            <div style={{ marginBottom: '0.25rem' }}>{prescription.dosage}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Duration: {prescription.duration}</div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        {prescription.condition && (
                            <p style={{ margin: '0.75rem 0 0 0', fontSize: '0.9rem' }}>
                                <strong>Condition:</strong> {prescription.condition}
                            </p>
                        )}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Required Generic Questions */}
                    <div className="card mb-3">
                        <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
                            📝 Treatment Assessment
                        </h3>
                        
                        {renderMCQQuestion('medicationAdherence', true)}
                        {renderMCQQuestion('symptomStatus', true)}
                        {renderMCQQuestion('sideEffects', true)}
                        {renderMCQQuestion('completionStatus', true)}
                        {renderMCQQuestion('overallCondition', true)}
                    </div>

                    {/* Personalized Questions (if any) */}
                    {personalizedQuestions.length > 0 && (
                        <div className="card mb-3" style={{ border: '2px solid var(--color-primary)', background: 'linear-gradient(135deg, #667eea08 0%, #764ba208 100%)' }}>
                            <h3 style={{ marginBottom: '0.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span>🎯</span> Questions Specific to Your Condition
                            </h3>
                            <p className="text-sm text-muted mb-4">These questions help your doctor assess your specific condition and treatment effectiveness.</p>
                            
                            {personalizedQuestions.map(question => renderPersonalizedQuestion(question))}
                        </div>
                    )}

                    {/* Additional Notes */}
                    <div className="card mb-3">
                        <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
                            📋 Additional Information
                        </h3>
                        
                        <div className="form-group" style={{ marginBottom: '0' }}>
                            <label style={mcqStyles.questionTitle}>
                                Is there anything else your doctor should know? (Optional)
                            </label>
                            <textarea 
                                className="form-textarea" 
                                value={responses.additionalNotes} 
                                onChange={(e) => handleChange('additionalNotes', e.target.value)} 
                                placeholder="Describe any new symptoms, concerns, or questions you have about your treatment..."
                                rows={3}
                                style={{ resize: 'vertical' }}
                            />
                        </div>
                    </div>

                    {/* Consent & Submit */}
                    <div className="card">
                        <div className="alert alert-warning mb-3" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                            <input 
                                type="checkbox" 
                                id="consent" 
                                checked={consent} 
                                onChange={(e) => setConsent(e.target.checked)} 
                                style={{ marginTop: '3px', width: '20px', height: '20px', flexShrink: 0 }} 
                            />
                            <label htmlFor="consent" style={{ cursor: 'pointer' }}>
                                <strong>I confirm</strong> that the information I have provided is accurate to the best of my knowledge and I consent to share it with my healthcare provider for follow-up purposes.
                            </label>
                        </div>

                        <button 
                            type="submit" 
                            className="btn btn-success btn-lg btn-block" 
                            disabled={submitting || !consent || progress < 100}
                            style={{ padding: '1rem', fontSize: '1.1rem' }}
                        >
                            {submitting ? 'Submitting...' : progress < 100 ? `Answer All Required Questions (${totalAnswered}/${totalRequired})` : '✓ Submit & Share with Doctor'}
                        </button>
                        
                        {progress < 100 && (
                            <p className="text-sm text-muted text-center mt-2" style={{ marginBottom: 0 }}>
                                Please answer all required questions to submit the form
                            </p>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}

export default PatientFollowUp;
