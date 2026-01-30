/**
 * New Prescription Page
 * Form to create a new prescription
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPrescription } from '../services/api';
import Disclaimer from '../components/Disclaimer';

const DOCTOR_ID = 'doctor-001';

function NewPrescription() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        medicineName: '',
        dosage: '',
        duration: '',
        patientEmail: '',
        condition: '',
        notes: '',
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await createPrescription({ ...formData, doctorId: DOCTOR_ID });
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

                {error && <div className="alert alert-error"><span>❌</span><span>{error}</span></div>}

                <form onSubmit={handleSubmit} className="card">
                    <div className="form-group">
                        <label className="form-label">Medicine Name *</label>
                        <input type="text" name="medicineName" className="form-input" value={formData.medicineName} onChange={handleChange} required placeholder="e.g., Paracetamol" />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Dosage *</label>
                        <input type="text" name="dosage" className="form-input" value={formData.dosage} onChange={handleChange} required placeholder="e.g., 500mg twice daily" />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Duration *</label>
                        <input type="text" name="duration" className="form-input" value={formData.duration} onChange={handleChange} required placeholder="e.g., 7 days" />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Patient Email *</label>
                        <input type="email" name="patientEmail" className="form-input" value={formData.patientEmail} onChange={handleChange} required placeholder="patient@email.com" />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Condition (Optional)</label>
                        <input type="text" name="condition" className="form-input" value={formData.condition} onChange={handleChange} placeholder="e.g., Fever" />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Notes (Optional)</label>
                        <textarea name="notes" className="form-textarea" value={formData.notes} onChange={handleChange} placeholder="Additional instructions..." />
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
