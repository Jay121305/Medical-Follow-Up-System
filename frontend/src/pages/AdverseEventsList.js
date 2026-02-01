import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import Header from '../components/Header';
import Loading from '../components/Loading';

/**
 * Adverse Events List Page
 * 
 * For doctors to view all adverse event reports from their patients.
 * Shows case status, severity, and allows access to complete cases.
 */
const AdverseEventsList = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [events, setEvents] = useState([]);
    const [filter, setFilter] = useState('all'); // all, urgent, pending, complete

    // Get doctorId from localStorage (set during login)
    const doctorId = localStorage.getItem('doctorId');

    useEffect(() => {
        loadAdverseEvents();
    }, []);

    const loadAdverseEvents = async () => {
        try {
            const response = await api.getAdverseEventsByDoctor(doctorId);
            if (response.success) {
                setEvents(response.data);
            }
        } catch (error) {
            console.error('Error loading adverse events:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status, isUrgent) => {
        if (isUrgent) {
            return <span className="badge badge-error">🚨 Urgent</span>;
        }
        
        switch (status) {
            case 'reported':
                return <span className="badge badge-warning">Reported</span>;
            case 'follow_up_sent':
                return <span className="badge badge-info">Follow-up Sent</span>;
            case 'data_collected':
                return <span className="badge badge-success">Complete</span>;
            case 'closed':
                return <span className="badge badge-ghost">Closed</span>;
            default:
                return <span className="badge">{status}</span>;
        }
    };

    const getSeverityIndicator = (severity) => {
        switch (severity) {
            case 'mild':
                return <span className="text-green-500">●</span>;
            case 'moderate':
                return <span className="text-yellow-500">●</span>;
            case 'severe':
                return <span className="text-red-500">●</span>;
            default:
                return <span className="text-gray-300">●</span>;
        }
    };

    const filteredEvents = events.filter(event => {
        switch (filter) {
            case 'urgent':
                return event.isUrgent;
            case 'pending':
                return ['reported', 'follow_up_sent'].includes(event.status);
            case 'complete':
                return event.dataComplete;
            default:
                return true;
        }
    });

    if (loading) return <Loading />;

    return (
        <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
            <Header title="Adverse Event Reports" showBack={true} />
            
            <div className="max-w-4xl mx-auto px-4 py-6">
                {/* Stats Summary */}
                <div className="grid grid-cols-4 gap-3 mb-6">
                    <div className="card bg-white shadow">
                        <div className="card-body p-4 text-center">
                            <div className="text-2xl font-bold text-purple-600">{events.length}</div>
                            <div className="text-xs text-gray-500">Total</div>
                        </div>
                    </div>
                    <div className="card bg-red-50 shadow">
                        <div className="card-body p-4 text-center">
                            <div className="text-2xl font-bold text-red-600">
                                {events.filter(e => e.isUrgent).length}
                            </div>
                            <div className="text-xs text-gray-500">Urgent</div>
                        </div>
                    </div>
                    <div className="card bg-yellow-50 shadow">
                        <div className="card-body p-4 text-center">
                            <div className="text-2xl font-bold text-yellow-600">
                                {events.filter(e => ['reported', 'follow_up_sent'].includes(e.status)).length}
                            </div>
                            <div className="text-xs text-gray-500">Pending</div>
                        </div>
                    </div>
                    <div className="card bg-green-50 shadow">
                        <div className="card-body p-4 text-center">
                            <div className="text-2xl font-bold text-green-600">
                                {events.filter(e => e.dataComplete).length}
                            </div>
                            <div className="text-xs text-gray-500">Complete</div>
                        </div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="tabs tabs-boxed bg-white mb-6 p-1">
                    {['all', 'urgent', 'pending', 'complete'].map(f => (
                        <button
                            key={f}
                            className={`tab flex-1 ${filter === f ? 'tab-active' : ''}`}
                            onClick={() => setFilter(f)}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Events List */}
                {filteredEvents.length === 0 ? (
                    <div className="card bg-white shadow">
                        <div className="card-body text-center py-12">
                            <div className="text-4xl mb-4">📋</div>
                            <h3 className="text-lg font-semibold text-gray-600">No adverse events</h3>
                            <p className="text-gray-400 text-sm">
                                {filter === 'all' 
                                    ? 'No adverse events have been reported yet.'
                                    : `No ${filter} cases at this time.`}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredEvents.map(event => (
                            <div 
                                key={event.id}
                                className={`card bg-white shadow cursor-pointer hover:shadow-lg transition-shadow ${
                                    event.isUrgent ? 'border-l-4 border-red-500' : ''
                                }`}
                                onClick={() => navigate(`/adverse-events/${event.id}`)}
                            >
                                <div className="card-body p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                {getSeverityIndicator(event.severity)}
                                                <span className="font-semibold">{event.patientName}</span>
                                                {getStatusBadge(event.status, event.isUrgent)}
                                            </div>
                                            
                                            <div className="text-sm text-purple-600 font-medium mb-2">
                                                {event.drugName}
                                            </div>
                                            
                                            <p className="text-sm text-gray-600 line-clamp-2">
                                                {event.initialReport}
                                            </p>
                                        </div>
                                        
                                        <div className="text-right ml-4">
                                            <div className="text-xs text-gray-400 mb-1">
                                                {new Date(event.createdAt).toLocaleDateString()}
                                            </div>
                                            <div className="text-xs font-mono text-gray-500">
                                                {event.caseId}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* New Report Button */}
                <div className="fixed bottom-6 right-6">
                    <button
                        onClick={() => navigate('/report-adverse-event')}
                        className="btn btn-error btn-circle btn-lg shadow-lg"
                        title="Report New Adverse Event"
                    >
                        ⚠️
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdverseEventsList;
