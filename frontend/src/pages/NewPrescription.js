/**
 * New Prescription Page
 * Form to create a new prescription with OCR support and voice-to-text
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPrescription, scanPrescription } from '../services/api';
import Disclaimer from '../components/Disclaimer';

function NewPrescription({ user }) {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState(null);
    const [scanSuccess, setScanSuccess] = useState(null);
    const [isListening, setIsListening] = useState(false);
    const [voiceTarget, setVoiceTarget] = useState(null);
    const recognitionRef = useRef(null);
    
    const doctorId = user?.id || 'doctor-001';
    
    const [formData, setFormData] = useState({
        patientName: '',
        patientPhone: '',
        patientAge: '',
        condition: '',
        notes: '',
        duration: '',
    });
    
    // Medicines list - each medicine is a separate entry
    const [medicines, setMedicines] = useState([
        { name: '', dosage: '', frequencyCode: '1-0-1', frequencyText: 'Twice daily (Morning & Evening)', instructions: '' }
    ]);

    // Initialize speech recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';
            
            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                handleVoiceResult(transcript);
            };
            
            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
                setVoiceTarget(null);
            };
            
            recognitionRef.current.onend = () => {
                setIsListening(false);
                setVoiceTarget(null);
            };
        }
        
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, []);

    const handleVoiceResult = (transcript) => {
        if (voiceTarget && voiceTarget.type === 'medicine') {
            const idx = voiceTarget.index;
            setMedicines(prev => {
                const updated = [...prev];
                if (voiceTarget.field === 'name') {
                    updated[idx].name = transcript;
                } else if (voiceTarget.field === 'instructions') {
                    updated[idx].instructions = transcript;
                }
                return updated;
            });
        } else if (voiceTarget && voiceTarget.type === 'form') {
            setFormData(prev => ({
                ...prev,
                [voiceTarget.field]: transcript
            }));
        }
    };

    const startVoiceInput = (type, field, index = null) => {
        if (!recognitionRef.current) {
            setError('Voice input not supported in this browser');
            return;
        }
        
        setVoiceTarget({ type, field, index });
        setIsListening(true);
        recognitionRef.current.start();
    };

    const stopVoiceInput = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setIsListening(false);
        setVoiceTarget(null);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleMedicineChange = (idx, field, value) => {
        setMedicines(prev => {
            const updated = [...prev];
            updated[idx][field] = value;
            
            // Auto-update frequency text when frequency code changes
            if (field === 'frequencyCode') {
                updated[idx].frequencyText = interpretFrequencyCode(value);
            }
            
            return updated;
        });
    };

    const interpretFrequencyCode = (code) => {
        const parts = code.split('-');
        if (parts.length !== 3) return '';
        
        const [m, a, e] = parts.map(p => p === '1');
        const times = [];
        if (m) times.push('Morning');
        if (a) times.push('Afternoon');
        if (e) times.push('Evening');
        
        const count = times.length;
        if (count === 0) return 'As needed';
        if (count === 1) return `Once daily (${times[0]})`;
        if (count === 2) return `Twice daily (${times.join(' & ')})`;
        if (count === 3) return 'Three times daily';
        return '';
    };

    const addMedicine = () => {
        setMedicines(prev => [
            ...prev,
            { name: '', dosage: '', frequencyCode: '1-0-1', frequencyText: 'Twice daily (Morning & Evening)', instructions: '' }
        ]);
    };

    const removeMedicine = (idx) => {
        if (medicines.length <= 1) return;
        setMedicines(prev => prev.filter((_, i) => i !== idx));
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file (JPG, PNG, etc.)');
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            setError('Image size must be less than 10MB');
            return;
        }

        setScanning(true);
        setError(null);
        setScanSuccess(null);

        try {
            // Convert to base64
            const base64 = await fileToBase64(file);
            
            // Call OCR API
            const result = await scanPrescription(base64);
            
            if (result.success && result.data) {
                // Auto-fill form with extracted data
                const extracted = result.data;
                setFormData(prev => ({
                    ...prev,
                    patientName: extracted.patientName || prev.patientName,
                    patientPhone: extracted.patientPhone || prev.patientPhone,
                    medicineName: extracted.medicineName || prev.medicineName,
                    dosage: extracted.dosage || prev.dosage,
                    frequencyCode: extracted.frequencyCode || prev.frequencyCode,
                    frequencyText: extracted.frequencyText || prev.frequencyText,
                    duration: extracted.duration || prev.duration,
                    condition: extracted.condition || prev.condition,
                    notes: extracted.additionalNotes || prev.notes,
                }));
                
                // Store multiple medicines if present
                if (extracted.medicines && extracted.medicines.length > 0) {
                    setMedicines(extracted.medicines.map(m => ({
                        name: m.name || '',
                        dosage: m.dosage || '',
                        frequencyCode: m.frequencyCode || '1-0-1',
                        frequencyText: m.frequencyText || 'Twice daily (Morning & Evening)',
                        instructions: m.instructions || ''
                    })));
                } else if (extracted.medicineName) {
                    // Create single medicine entry
                    setMedicines([{
                        name: extracted.medicineName,
                        dosage: extracted.dosage?.split('(')[0]?.trim() || '',
                        frequencyCode: extracted.frequencyCode || '1-0-1',
                        frequencyText: extracted.frequencyText || 'Twice daily (Morning & Evening)',
                        instructions: extracted.additionalNotes || ''
                    }]);
                }
                
                setScanSuccess('Prescription scanned successfully! Please verify the extracted information.');
            } else {
                setError(result.error || 'Failed to extract prescription data');
            }
        } catch (err) {
            setError(err.message || 'Failed to scan prescription');
        } finally {
            setScanning(false);
            // Clear file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Include medicines array and doctor info
            const prescriptionData = {
                ...formData,
                doctorId,
                doctorName: user?.name || 'Doctor',
                medicines: medicines.filter(m => m.name.trim() !== ''),
                medicineName: medicines[0]?.name || '',
                dosage: medicines[0]?.dosage || '',
            };
            
            await createPrescription(prescriptionData);
            navigate('/doctor/prescriptions');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page">
            <div className="container" style={{ maxWidth: '600px' }}>
                <Disclaimer />
                <h1 className="mb-3">New Prescription</h1>

                {/* OCR Upload Section */}
                <div className="card mb-4" style={{ background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)', border: '2px dashed var(--color-primary)' }}>
                    <div className="text-center">
                        <h3 style={{ marginBottom: '0.5rem' }}>📷 Scan Prescription</h3>
                        <p className="text-muted mb-3">Upload a photo of your prescription to auto-fill the form</p>
                        
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/*"
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                            id="prescription-upload"
                        />
                        
                        <label 
                            htmlFor="prescription-upload" 
                            className="btn btn-primary"
                            style={{ cursor: scanning ? 'not-allowed' : 'pointer', opacity: scanning ? 0.7 : 1 }}
                        >
                            {scanning ? (
                                <>⏳ Scanning...</>
                            ) : (
                                <>📤 Upload Prescription Image</>
                            )}
                        </label>
                        
                        <p className="text-sm text-muted mt-2">Supports JPG, PNG • Max 10MB</p>
                    </div>
                </div>

                {scanSuccess && (
                    <div className="card mb-4" style={{ border: '2px solid var(--color-success)', background: '#d4edda' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                            <span style={{ fontSize: '1.5rem' }}>✅</span>
                            <span style={{ fontWeight: '600' }}>{scanSuccess}</span>
                        </div>
                        
                        {/* Structured Preview of Extracted Data */}
                        {medicines.length > 0 && medicines[0].name && (
                            <div style={{ background: '#fff', padding: '1rem', borderRadius: '8px' }}>
                                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>💊 Extracted Medications:</h4>
                                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                                    <thead>
                                        <tr style={{ background: 'var(--color-bg-secondary)' }}>
                                            <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.85rem', fontWeight: '600', borderBottom: '2px solid var(--color-border)', width: '30%' }}>Medicine Name</th>
                                            <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.85rem', fontWeight: '600', borderBottom: '2px solid var(--color-border)', width: '20%' }}>Dosage</th>
                                            <th style={{ textAlign: 'center', padding: '0.75rem', fontSize: '0.85rem', fontWeight: '600', borderBottom: '2px solid var(--color-border)', width: '25%' }}>
                                                <div>Frequency</div>
                                                <div style={{ fontSize: '0.7rem', fontWeight: 'normal', color: 'var(--color-text-muted)' }}>🌅 Morning | ☀️ Afternoon | 🌙 Evening</div>
                                            </th>
                                            <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.85rem', fontWeight: '600', borderBottom: '2px solid var(--color-border)' }}>When to Take</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {medicines.map((med, idx) => (
                                            <tr key={idx}>
                                                <td style={{ padding: '0.75rem', fontWeight: '600', color: 'var(--color-primary)', verticalAlign: 'top', borderBottom: '1px solid var(--color-border)' }}>
                                                    {med.name || '-'}
                                                </td>
                                                <td style={{ padding: '0.75rem', verticalAlign: 'top', borderBottom: '1px solid var(--color-border)' }}>
                                                    {med.dosage || '-'}
                                                </td>
                                                <td style={{ padding: '0.75rem', textAlign: 'center', verticalAlign: 'top', borderBottom: '1px solid var(--color-border)' }}>
                                                    {med.frequencyCode ? (
                                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                                            {med.frequencyCode.split('-').map((digit, i) => (
                                                                <span 
                                                                    key={i} 
                                                                    style={{ 
                                                                        width: '28px', 
                                                                        height: '28px', 
                                                                        borderRadius: '50%', 
                                                                        display: 'flex', 
                                                                        alignItems: 'center', 
                                                                        justifyContent: 'center',
                                                                        background: digit === '1' ? 'var(--color-success)' : '#e0e0e0',
                                                                        color: digit === '1' ? '#fff' : '#999',
                                                                        fontWeight: '600',
                                                                        fontSize: '0.85rem'
                                                                    }}
                                                                >
                                                                    {digit === '1' ? '✓' : '–'}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : '-'}
                                                    {med.frequencyCode && (
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                                                            {med.frequencyCode}
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ padding: '0.75rem', verticalAlign: 'top', borderBottom: '1px solid var(--color-border)', fontSize: '0.9rem' }}>
                                                    {med.frequencyText || '-'}
                                                    {med.instructions && (
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem', fontStyle: 'italic' }}>
                                                            📝 {med.instructions}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {formData.duration && (
                                    <p style={{ margin: '0.75rem 0 0 0', fontSize: '0.9rem' }}><strong>⏱️ Duration:</strong> {formData.duration}</p>
                                )}
                                {formData.condition && (
                                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}><strong>🏥 Condition:</strong> {formData.condition}</p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {error && <div className="alert alert-error mb-3"><span>❌</span><span>{error}</span></div>}

                {/* Voice Input Status */}
                {isListening && (
                    <div className="card mb-3" style={{ background: 'linear-gradient(135deg, #f093fb15 0%, #f5576c15 100%)', border: '2px solid #f5576c' }}>
                        <div className="text-center">
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem', animation: 'pulse 1s infinite' }}>🎤</div>
                            <p style={{ marginBottom: '0.5rem', fontWeight: '600' }}>Listening...</p>
                            <p className="text-muted text-sm mb-2">Speak clearly for: {voiceTarget?.field}</p>
                            <button type="button" className="btn btn-sm btn-secondary" onClick={stopVoiceInput}>Stop</button>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="card">
                    <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                        Patient Information
                    </h3>

                    <div className="form-group">
                        <label className="form-label">Patient Name</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input type="text" name="patientName" className="form-input" value={formData.patientName} onChange={handleChange} placeholder="John Doe" />
                            <button type="button" className="btn btn-sm btn-outline" onClick={() => startVoiceInput('form', 'patientName')} title="Voice input">
                                🎤
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-2">
                        <div className="form-group">
                            <label className="form-label">Patient Phone (WhatsApp) *</label>
                            <input type="tel" name="patientPhone" className="form-input" value={formData.patientPhone} onChange={handleChange} required placeholder="+91 9876543210" />
                            <small className="text-muted">OTP via WhatsApp + SMS</small>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Patient Age</label>
                            <input type="text" name="patientAge" className="form-input" value={formData.patientAge} onChange={handleChange} placeholder="e.g., 35" />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Condition / Diagnosis</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input type="text" name="condition" className="form-input" value={formData.condition} onChange={handleChange} placeholder="e.g., Fever, Cold, Headache" />
                            <button type="button" className="btn btn-sm btn-outline" onClick={() => startVoiceInput('form', 'condition')} title="Voice input">
                                🎤
                            </button>
                        </div>
                    </div>

                    <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>💊 Medications</span>
                        <button type="button" className="btn btn-sm btn-primary" onClick={addMedicine}>+ Add Medicine</button>
                    </h3>

                    {medicines.map((med, idx) => (
                        <div key={idx} className="card mb-3" style={{ padding: '1rem', border: '1px solid var(--color-border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <span style={{ fontWeight: '600', color: 'var(--color-primary)' }}>Medicine #{idx + 1}</span>
                                {medicines.length > 1 && (
                                    <button type="button" className="btn btn-sm" style={{ background: '#ffebee', color: '#d32f2f' }} onClick={() => removeMedicine(idx)}>
                                        Remove
                                    </button>
                                )}
                            </div>
                            
                            <div className="form-group">
                                <label className="form-label">Medicine Name *</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        value={med.name} 
                                        onChange={(e) => handleMedicineChange(idx, 'name', e.target.value)} 
                                        required={idx === 0}
                                        placeholder="e.g., Paracetamol" 
                                    />
                                    <button type="button" className="btn btn-sm btn-outline" onClick={() => startVoiceInput('medicine', 'name', idx)} title="Voice input">
                                        🎤
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-2">
                                <div className="form-group">
                                    <label className="form-label">Dosage</label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        value={med.dosage} 
                                        onChange={(e) => handleMedicineChange(idx, 'dosage', e.target.value)} 
                                        placeholder="e.g., 500mg" 
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Frequency Code</label>
                                    <select 
                                        className="form-input" 
                                        value={med.frequencyCode} 
                                        onChange={(e) => handleMedicineChange(idx, 'frequencyCode', e.target.value)}
                                    >
                                        <option value="1-0-0">1-0-0 (Morning only)</option>
                                        <option value="0-1-0">0-1-0 (Afternoon only)</option>
                                        <option value="0-0-1">0-0-1 (Evening only)</option>
                                        <option value="1-1-0">1-1-0 (Morning & Afternoon)</option>
                                        <option value="1-0-1">1-0-1 (Morning & Evening)</option>
                                        <option value="0-1-1">0-1-1 (Afternoon & Evening)</option>
                                        <option value="1-1-1">1-1-1 (Three times daily)</option>
                                    </select>
                                    <small className="text-muted">{med.frequencyText}</small>
                                </div>
                            </div>

                            <div className="form-group mb-0">
                                <label className="form-label">Instructions</label>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        value={med.instructions} 
                                        onChange={(e) => handleMedicineChange(idx, 'instructions', e.target.value)} 
                                        placeholder="e.g., After food, with water" 
                                    />
                                    <button type="button" className="btn btn-sm btn-outline" onClick={() => startVoiceInput('medicine', 'instructions', idx)} title="Voice input">
                                        🎤
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    <div className="form-group">
                        <label className="form-label">Duration *</label>
                        <input type="text" name="duration" className="form-input" value={formData.duration} onChange={handleChange} required placeholder="e.g., 7 days" />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Additional Notes</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <textarea name="notes" className="form-textarea" value={formData.notes} onChange={handleChange} placeholder="Additional instructions for the patient..." />
                            <button type="button" className="btn btn-sm btn-outline" onClick={() => startVoiceInput('form', 'notes')} title="Voice input" style={{ alignSelf: 'flex-start' }}>
                                🎤
                            </button>
                        </div>
                    </div>

                    <div className="d-flex gap-2">
                        <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Create Prescription'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default NewPrescription;
