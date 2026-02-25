
import React, { useState, useEffect, useRef } from 'react';

// --- Constants & Configurations ---

// Roles for RBAC
const ROLES = {
    ADMIN: 'Admin',
    DISPATCHER: 'Dispatcher',
    FLEET_MANAGER: 'Fleet Manager',
    DRIVER: 'Driver',
    OPERATIONS_TEAM: 'Operations Team',
};

// Current user role for demonstration
const currentUserRole = ROLES.DISPATCHER;

// Standardized Status Keys
const TRIP_STATUS = {
    PENDING: 'PENDING',
    ASSIGNED: 'ASSIGNED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
    DELAYED: 'DELAYED',
};

const VEHICLE_STATUS = {
    AVAILABLE: 'AVAILABLE',
    IN_USE: 'IN_USE',
    MAINTENANCE: 'MAINTENANCE',
    OFFLINE: 'OFFLINE',
};

const DRIVER_STATUS = {
    AVAILABLE: 'AVAILABLE',
    ON_TRIP: 'ON_TRIP',
    ON_BREAK: 'ON_BREAK',
    OFFLINE: 'OFFLINE',
};

// UI Labels for Statuses
const STATUS_LABELS = {
    [TRIP_STATUS.PENDING]: 'Pending',
    [TRIP_STATUS.ASSIGNED]: 'Assigned',
    [TRIP_STATUS.IN_PROGRESS]: 'In Progress',
    [TRIP_STATUS.COMPLETED]: 'Completed',
    [TRIP_STATUS.CANCELLED]: 'Cancelled',
    [TRIP_STATUS.DELAYED]: 'Delayed',
    [VEHICLE_STATUS.AVAILABLE]: 'Available',
    [VEHICLE_STATUS.IN_USE]: 'In Use',
    [VEHICLE_STATUS.MAINTENANCE]: 'Maintenance',
    [VEHICLE_STATUS.OFFLINE]: 'Offline',
    [DRIVER_STATUS.AVAILABLE]: 'Available',
    [DRIVER_STATUS.ON_TRIP]: 'On Trip',
    [DRIVER_STATUS.ON_BREAK]: 'On Break',
    [DRIVER_STATUS.OFFLINE]: 'Offline',
};

// Deterministic Colors for Statuses
const STATUS_COLORS = {
    [TRIP_STATUS.PENDING]: 'var(--color-status-pending)',
    [TRIP_STATUS.ASSIGNED]: 'var(--color-status-assigned)',
    [TRIP_STATUS.IN_PROGRESS]: 'var(--color-status-in-progress)',
    [TRIP_STATUS.COMPLETED]: 'var(--color-status-completed)',
    [TRIP_STATUS.CANCELLED]: 'var(--color-status-cancelled)',
    [TRIP_STATUS.DELAYED]: 'var(--color-status-delayed)',
    [VEHICLE_STATUS.AVAILABLE]: 'var(--color-status-available)',
    [VEHICLE_STATUS.IN_USE]: 'var(--color-status-in-use)',
    [VEHICLE_STATUS.MAINTENANCE]: 'var(--color-status-maintenance)',
    [VEHICLE_STATUS.OFFLINE]: 'var(--color-status-offline)',
    [DRIVER_STATUS.AVAILABLE]: 'var(--color-status-available)',
    [DRIVER_STATUS.ON_TRIP]: 'var(--color-status-in-use)',
    [DRIVER_STATUS.ON_BREAK]: 'var(--color-status-pending)',
    [DRIVER_STATUS.OFFLINE]: 'var(--color-status-offline)',
};

// Workflow stages for Trips
const TRIP_WORKFLOW = [
    { id: 'REQUESTED', label: 'Requested', slaHours: 2, roles: [ROLES.DISPATCHER, ROLES.ADMIN] },
    { id: 'ASSIGNED', label: 'Assigned', slaHours: 1, roles: [ROLES.DISPATCHER] },
    { id: 'IN_PROGRESS', label: 'In Progress', slaHours: 24, roles: [ROLES.DRIVER, ROLES.OPERATIONS_TEAM] },
    { id: 'COMPLETED', label: 'Completed', slaHours: 0, roles: [ROLES.DISPATCHER, ROLES.FLEET_MANAGER] },
];

// --- Dummy Data ---
let dummyTrips = [
    { id: 'TRP001', name: 'Delivery to Warehouse A', origin: 'Depot X', destination: 'Warehouse A', scheduledTime: '2023-10-26T08:00:00Z', actualStartTime: null, actualEndTime: null, driverId: 'DRV001', vehicleId: 'VHC001', status: TRIP_STATUS.IN_PROGRESS, progress: 60, estimatedCompletion: '2023-10-26T14:00:00Z', notes: 'Urgent delivery.', lastUpdate: '2023-10-26T12:30:00Z', currentWorkflowStage: 'IN_PROGRESS', createdAt: '2023-10-25T10:00:00Z', slaBreached: false, files: [] },
    { id: 'TRP002', name: 'Pickup from Supplier B', origin: 'Supplier B', destination: 'Depot Y', scheduledTime: '2023-10-26T10:00:00Z', actualStartTime: null, actualEndTime: null, driverId: 'DRV002', vehicleId: 'VHC002', status: TRIP_STATUS.PENDING, progress: 0, estimatedCompletion: '2023-10-26T16:00:00Z', notes: 'Fragile goods.', lastUpdate: '2023-10-26T09:00:00Z', currentWorkflowStage: 'REQUESTED', createdAt: '2023-10-25T11:00:00Z', slaBreached: true, files: [] },
    { id: 'TRP003', name: 'Inter-city Transfer', origin: 'City A Hub', destination: 'City B Hub', scheduledTime: '2023-10-25T14:00:00Z', actualStartTime: '2023-10-25T14:15:00Z', actualEndTime: '2023-10-25T18:00:00Z', driverId: 'DRV003', vehicleId: 'VHC003', status: TRIP_STATUS.COMPLETED, progress: 100, estimatedCompletion: '2023-10-25T18:00:00Z', notes: 'Standard transfer.', lastUpdate: '2023-10-25T18:05:00Z', currentWorkflowStage: 'COMPLETED', createdAt: '2023-10-24T09:00:00Z', slaBreached: false, files: [{ id: 'DOC001', name: 'DeliveryReceipt_TRP003.pdf', url: '/docs/receipt_TRP003.pdf', uploadedAt: '2023-10-25T18:02:00Z' }] },
    { id: 'TRP004', name: 'Emergency Parts Delivery', origin: 'Central Depot', destination: 'Repair Shop Z', scheduledTime: '2023-10-26T11:00:00Z', actualStartTime: '2023-10-26T11:10:00Z', actualEndTime: null, driverId: 'DRV004', vehicleId: 'VHC004', status: TRIP_STATUS.DELAYED, progress: 30, estimatedCompletion: '2023-10-26T13:30:00Z', notes: 'Road works causing delay.', lastUpdate: '2023-10-26T12:00:00Z', currentWorkflowStage: 'IN_PROGRESS', createdAt: '2023-10-26T09:00:00Z', slaBreached: false, files: [] },
    { id: 'TRP005', name: 'Regular Route South', origin: 'Depot X', destination: 'Various Points South', scheduledTime: '2023-10-26T09:00:00Z', actualStartTime: null, actualEndTime: null, driverId: 'DRV005', vehicleId: 'VHC005', status: TRIP_STATUS.ASSIGNED, progress: 0, estimatedCompletion: '2023-10-26T17:00:00Z', notes: 'Multi-stop route.', lastUpdate: '2023-10-26T08:30:00Z', currentWorkflowStage: 'ASSIGNED', createdAt: '2023-10-25T14:00:00Z', slaBreached: false, files: [] },
    { id: 'TRP006', name: 'Client X Materials', origin: 'Factory', destination: 'Client X Site', scheduledTime: '2023-10-27T07:00:00Z', actualStartTime: null, actualEndTime: null, driverId: null, vehicleId: null, status: TRIP_STATUS.PENDING, progress: 0, estimatedCompletion: '2023-10-27T10:00:00Z', notes: 'Requires specialized truck.', lastUpdate: '2023-10-26T16:00:00Z', currentWorkflowStage: 'REQUESTED', createdAt: '2023-10-26T13:00:00Z', slaBreached: false, files: [] },
    { id: 'TRP007', name: 'Cancelled Order', origin: 'Depot Z', destination: 'Retail Store', scheduledTime: '2023-10-24T10:00:00Z', actualStartTime: null, actualEndTime: null, driverId: null, vehicleId: null, status: TRIP_STATUS.CANCELLED, progress: 0, estimatedCompletion: null, notes: 'Client cancelled order.', lastUpdate: '2023-10-23T17:00:00Z', currentWorkflowStage: 'REQUESTED', createdAt: '2023-10-23T10:00:00Z', slaBreached: false, files: [] },
];

let dummyVehicles = [
    { id: 'VHC001', licensePlate: 'ABC-1234', make: 'Ford', model: 'Transit', year: 2020, type: 'Van', capacity: '1500 kg', status: VEHICLE_STATUS.IN_USE, currentLocation: '40.7128, -74.0060', lastMaintenance: '2023-09-15', nextMaintenance: '2024-03-15', driverId: 'DRV001' },
    { id: 'VHC002', licensePlate: 'DEF-5678', make: 'Mercedes', model: 'Sprinter', year: 2021, type: 'Van', capacity: '2000 kg', status: VEHICLE_STATUS.AVAILABLE, currentLocation: '40.7128, -74.0060', lastMaintenance: '2023-10-01', nextMaintenance: '2024-04-01', driverId: null },
    { id: 'VHC003', licensePlate: 'GHI-9012', make: 'Volvo', model: 'FH Series', year: 2019, type: 'Truck', capacity: '10000 kg', status: VEHICLE_STATUS.MAINTENANCE, currentLocation: 'Service Center', lastMaintenance: '2023-10-20', nextMaintenance: '2024-04-20', driverId: null },
    { id: 'VHC004', licensePlate: 'JKL-3456', make: 'Freightliner', model: 'Cascadia', year: 2022, type: 'Truck', capacity: '12000 kg', status: VEHICLE_STATUS.IN_USE, currentLocation: '34.0522, -118.2437', lastMaintenance: '2023-08-10', nextMaintenance: '2024-02-10', driverId: 'DRV004' },
    { id: 'VHC005', licensePlate: 'MNO-7890', make: 'Ram', model: 'ProMaster', year: 2018, type: 'Van', capacity: '1200 kg', status: VEHICLE_STATUS.AVAILABLE, currentLocation: '40.7128, -74.0060', lastMaintenance: '2023-09-25', nextMaintenance: '2024-03-25', driverId: null },
    { id: 'VHC006', licensePlate: 'PQR-1122', make: 'Tesla', model: 'Semi', year: 2023, type: 'Electric Truck', capacity: '15000 kg', status: VEHICLE_STATUS.OFFLINE, currentLocation: 'Charging Station', lastMaintenance: '2023-07-01', nextMaintenance: '2024-01-01', driverId: null },
];

let dummyDrivers = [
    { id: 'DRV001', name: 'Alice Smith', license: 'D-12345', phone: '555-1111', email: 'alice.s@example.com', status: DRIVER_STATUS.ON_TRIP, currentTripId: 'TRP001', availability: '2023-10-26T14:00:00Z', assignedVehicleId: 'VHC001' },
    { id: 'DRV002', name: 'Bob Johnson', license: 'D-67890', phone: '555-2222', email: 'bob.j@example.com', status: DRIVER_STATUS.AVAILABLE, currentTripId: null, availability: '2023-10-26T09:00:00Z', assignedVehicleId: null },
    { id: 'DRV003', name: 'Charlie Brown', license: 'D-11223', phone: '555-3333', email: 'charlie.b@example.com', status: DRIVER_STATUS.ON_BREAK, currentTripId: null, availability: '2023-10-26T10:00:00Z', assignedVehicleId: null },
    { id: 'DRV004', name: 'Diana Prince', license: 'D-44556', phone: '555-4444', email: 'diana.p@example.com', status: DRIVER_STATUS.ON_TRIP, currentTripId: 'TRP004', availability: '2023-10-26T13:30:00Z', assignedVehicleId: 'VHC004' },
    { id: 'DRV005', name: 'Eve Adams', license: 'D-77889', phone: '555-5555', email: 'eve.a@example.com', status: DRIVER_STATUS.AVAILABLE, currentTripId: null, availability: '2023-10-26T08:00:00Z', assignedVehicleId: null },
    { id: 'DRV006', name: 'Frank White', license: 'D-00112', phone: '555-6666', email: 'frank.w@example.com', status: DRIVER_STATUS.OFFLINE, currentTripId: null, availability: '2023-10-27T08:00:00Z', assignedVehicleId: null },
    { id: 'DRV007', name: 'Grace Hopper', license: 'D-33445', phone: '555-7777', email: 'grace.h@example.com', status: DRIVER_STATUS.AVAILABLE, currentTripId: null, availability: '2023-10-26T09:00:00Z', assignedVehicleId: null },
];

let dummyAuditLogs = [
    { id: 'AUD001', entity: 'Trip', entityId: 'TRP001', action: 'Trip status updated', details: 'Status changed from ASSIGNED to IN_PROGRESS', user: 'Dispatcher Bob', timestamp: '2023-10-26T10:00:00Z', type: 'update' },
    { id: 'AUD002', entity: 'Trip', entityId: 'TRP002', action: 'SLA Breached', details: 'Trip not assigned within SLA', user: 'System', timestamp: '2023-10-26T09:30:00Z', type: 'info' },
    { id: 'AUD003', entity: 'Vehicle', entityId: 'VHC003', action: 'Vehicle status updated', details: 'Status changed from AVAILABLE to MAINTENANCE', user: 'Fleet Manager Sue', timestamp: '2023-10-20T14:00:00Z', type: 'update' },
    { id: 'AUD004', entity: 'Trip', entityId: 'TRP003', action: 'Delivery Receipt Uploaded', details: 'File: DeliveryReceipt_TRP003.pdf', user: 'Driver Charlie', timestamp: '2023-10-25T18:02:00Z', type: 'action' },
    { id: 'AUD005', entity: 'Trip', entityId: 'TRP004', action: 'Trip status updated', details: 'Status changed from IN_PROGRESS to DELAYED', user: 'Driver Diana', timestamp: '2023-10-26T12:00:00Z', type: 'update' },
    { id: 'AUD006', entity: 'Trip', entityId: 'TRP007', action: 'Trip cancelled', details: 'Client cancellation', user: 'Dispatcher Bob', timestamp: '2023-10-23T17:00:00Z', type: 'action' },
];

let dummyActivities = [
    { id: 'ACT001', type: 'trip_started', message: 'Trip TRP001 (Delivery to Warehouse A) started by Alice Smith.', timestamp: '2023-10-26T10:00:00Z', icon: '🚚' },
    { id: 'ACT002', type: 'trip_delay', message: 'Trip TRP004 (Emergency Parts Delivery) is delayed due to road works.', timestamp: '2023-10-26T12:00:00Z', icon: '⚠️' },
    { id: 'ACT003', type: 'trip_assigned', message: 'Trip TRP005 (Regular Route South) assigned to Eve Adams.', timestamp: '2023-10-26T08:30:00Z', icon: '✍️' },
    { id: 'ACT004', type: 'vehicle_maintenance', message: 'Vehicle VHC003 (GHI-9012) entered maintenance.', timestamp: '2023-10-20T14:00:00Z', icon: '⚙️' },
    { id: 'ACT005', type: 'trip_completed', message: 'Trip TRP003 (Inter-city Transfer) completed by Charlie Brown.', timestamp: '2023-10-25T18:05:00Z', icon: '✅' },
];

const generateId = (prefix) => prefix + String(Math.floor(Math.random() * 10000)).padStart(4, '0');

// --- Helper Components (defined within App scope for direct access to navigate, etc.) ---

// Card component
const Card = ({ title, subtitle, meta, status, onClick, children }) => {
    const statusColor = STATUS_COLORS[status] || 'var(--color-border)';
    const statusLabel = STATUS_LABELS[status] || status;

    return (
        <div className="card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
            <div className="card-status-indicator" style={{ backgroundColor: statusColor }}></div>
            <div className="card-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xs)' }}>
                    <h3 className="card-title">{title}</h3>
                    {status && (
                        <span className="card-badge" style={{ backgroundColor: statusColor, color: (statusColor === 'var(--color-status-pending)' || statusColor === 'var(--color-status-maintenance)') ? 'var(--color-text-dark)' : 'var(--color-text-light)' }}>
                            {statusLabel}
                        </span>
                    )}
                </div>
                {subtitle && <p className="card-subtitle">{subtitle}</p>}
                {children}
                {meta && <div className="card-meta">{meta}</div>}
            </div>
        </div>
    );
};

// Breadcrumbs component
const Breadcrumbs = ({ path, navigate }) => {
    return (
        <div className="breadcrumbs">
            {path.map((item, index) => (
                <div key={item.label} className="breadcrumb-item">
                    {index < path.length - 1 ? (
                        <span onClick={() => item.onClick ? item.onClick() : navigate(item.screen, item.params)}>
                            {item.label}
                        </span>
                    ) : (
                        <span>{item.label}</span>
                    )}
                </div>
            ))}
        </div>
    );
};

// FormInput component
const FormInput = ({ label, id, type = 'text', value, onChange, placeholder, required = false, error, disabled = false, autoPopulated = false, accept }) => (
    <div className="form-group">
        <label htmlFor={id} className="form-label">{label}{required && <span style={{ color: 'var(--color-status-cancelled)' }}>*</span>}</label>
        {type === 'textarea' ? (
            <textarea
                id={id}
                className={`form-textarea ${error ? 'error' : ''}`}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
                style={autoPopulated ? { backgroundColor: 'var(--color-primary-light)' } : {}}
            />
        ) : type === 'file' ? (
            <div className="file-upload-input">
                <input
                    type="file"
                    id={id}
                    onChange={onChange}
                    required={required}
                    disabled={disabled}
                    accept={accept}
                    style={{ border: 'none', padding: 0 }}
                />
            </div>
        ) : (
            <input
                type={type}
                id={id}
                className={`form-input ${error ? 'error' : ''}`}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
                style={autoPopulated ? { backgroundColor: 'var(--color-primary-light)' } : {}}
            />
        )}
        {error && <p className="error-message">{error}</p>}
    </div>
);

// FormSelect component
const FormSelect = ({ label, id, value, onChange, options, required = false, error, disabled = false, autoPopulated = false }) => (
    <div className="form-group">
        <label htmlFor={id} className="form-label">{label}{required && <span style={{ color: 'var(--color-status-cancelled)' }}>*</span>}</label>
        <select
            id={id}
            className={`form-select ${error ? 'error' : ''}`}
            value={value}
            onChange={onChange}
            required={required}
            disabled={disabled}
            style={autoPopulated ? { backgroundColor: 'var(--color-primary-light)' } : {}}
        >
            <option value="">Select...</option>
            {options.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
            ))}
        </select>
        {error && <p className="error-message">{error}</p>}
    </div>
);

// Workflow Tracker component
const WorkflowTracker = ({ currentStageId, workflow, createdAt }) => {
    const tripCreatedAt = new Date(createdAt);
    return (
        <div className="workflow-tracker">
            {workflow.map((stage, index) => {
                const isCompleted = index < workflow.findIndex(s => s.id === currentStageId);
                const isActive = stage.id === currentStageId;
                const stageStartDate = new Date(createdAt); // Simplified for demo, actual would be dynamic per stage
                const slaDueDate = new Date(stageStartDate.getTime() + stage.slaHours * 60 * 60 * 1000);
                const slaBreached = isActive && (new Date() > slaDueDate);

                return (
                    <div
                        key={stage.id}
                        className={`workflow-stage ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''} ${slaBreached ? 'sla-breached' : ''}`}
                    >
                        <div className="stage-dot">{index + 1}</div>
                        <span className="stage-label">{stage.label}</span>
                        {isActive && (
                            <span className="stage-date" style={slaBreached ? { color: 'var(--color-status-delayed)', fontWeight: 'var(--font-weight-bold)' } : {}}>
                                {slaBreached ? 'SLA BREACHED!' : `Due: ${new Date(slaDueDate).toLocaleDateString()}`}
                            </span>
                        )}
                        {isCompleted && (
                            <span className="stage-date">
                                {/* Completed At: {new Date(trip?.actualEndTime || Date.now()).toLocaleDateString()} */}
                                Completed
                            </span>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

// Chart Placeholder Component
const ChartPlaceholder = ({ type, title }) => (
    <div className="chart-placeholder">
        {title} ({type} Chart)
    </div>
);

// --- Main App Component ---
function App() {
    // Centralized routing state
    const [view, setView] = useState({ screen: 'DASHBOARD', params: {} });
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
    const [globalSearchTerm, setGlobalSearchTerm] = useState('');
    const userMenuRef = useRef(null);
    const searchInputRef = useRef(null);

    // Dummy data states (for mutation simulation)
    const [trips, setTrips] = useState(dummyTrips);
    const [vehicles, setVehicles] = useState(dummyVehicles);
    const [drivers, setDrivers] = useState(dummyDrivers);
    const [auditLogs, setAuditLogs] = useState(dummyAuditLogs);
    const [activities, setActivities] = useState(dummyActivities);

    // Handlers
    const navigate = (screen, params = {}) => {
        setView(prevState => ({ ...prevState, screen, params }));
        setUserDropdownOpen(false); // Close dropdown on navigation
        setIsGlobalSearchOpen(false); // Close search on navigation
    };

    const handleLogout = () => {
        console.log('Logging out...');
        // Simulate logout, navigate to a login screen or dashboard
        navigate('DASHBOARD');
    };

    const toggleUserDropdown = () => {
        setUserDropdownOpen(prevState => !prevState);
    };

    const handleClickOutside = (event) => {
        if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
            setUserDropdownOpen(false);
        }
        if (searchInputRef.current && !searchInputRef.current.contains(event.target) && isGlobalSearchOpen && !event.target.closest('.global-search-input-wrapper')) {
            setIsGlobalSearchOpen(false);
            setGlobalSearchTerm('');
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isGlobalSearchOpen]);

    useEffect(() => {
        if (isGlobalSearchOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isGlobalSearchOpen]);

    // Simulate real-time updates and SLA tracking
    useEffect(() => {
        const interval = setInterval(() => {
            // Update trip progress and SLA
            setTrips(prevTrips => prevTrips.map(trip => {
                if (trip.status === TRIP_STATUS.IN_PROGRESS && trip.progress < 100) {
                    const newProgress = Math.min(100, trip.progress + Math.floor(Math.random() * 10));
                    const newStatus = newProgress === 100 ? TRIP_STATUS.COMPLETED : trip.status;
                    if (newProgress === 100) {
                         setActivities(prev => [{ id: generateId('ACT'), type: 'trip_completed', message: `Trip ${trip.id} completed!`, timestamp: new Date().toISOString(), icon: '✅' }, ...prev]);
                    }
                    return { ...trip, progress: newProgress, status: newStatus, lastUpdate: new Date().toISOString() };
                }
                // Check SLA for PENDING and ASSIGNED
                if ((trip.status === TRIP_STATUS.PENDING && trip.currentWorkflowStage === 'REQUESTED') ||
                    (trip.status === TRIP_STATUS.ASSIGNED && trip.currentWorkflowStage === 'ASSIGNED')) {
                    const stageConfig = TRIP_WORKFLOW.find(s => s.id === trip.currentWorkflowStage);
                    if (stageConfig) {
                        const createdAtDate = new Date(trip.createdAt);
                        const slaDueDate = new Date(createdAtDate.getTime() + stageConfig.slaHours * 60 * 60 * 1000);
                        const isBreached = new Date() > slaDueDate;
                        if (isBreached && !trip.slaBreached) {
                            setAuditLogs(prev => [...prev, { id: generateId('AUD'), entity: 'Trip', entityId: trip.id, action: 'SLA Breached', details: `Stage '${stageConfig.label}' SLA exceeded.`, user: 'System', timestamp: new Date().toISOString(), type: 'info' }]);
                            setActivities(prev => [{ id: generateId('ACT'), type: 'sla_breach', message: `SLA BREACHED for Trip ${trip.id} (${trip.name})!`, timestamp: new Date().toISOString(), icon: '⏰' }, ...prev]);
                            return { ...trip, slaBreached: true, lastUpdate: new Date().toISOString() };
                        }
                    }
                }
                return trip;
            }));
        }, 5000); // Every 5 seconds

        return () => clearInterval(interval);
    }, []);

    // Form handlers
    const handleSubmitTrip = (formData, isNew) => {
        if (isNew) {
            const newTrip = {
                ...formData,
                id: generateId('TRP'),
                status: TRIP_STATUS.PENDING,
                progress: 0,
                lastUpdate: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                currentWorkflowStage: 'REQUESTED',
                slaBreached: false,
            };
            setTrips(prevTrips => [...prevTrips, newTrip]);
            setAuditLogs(prev => [...prev, { id: generateId('AUD'), entity: 'Trip', entityId: newTrip.id, action: 'New Trip Created', details: `Trip ${newTrip.id} (${newTrip.name}) created.`, user: currentUserRole, timestamp: new Date().toISOString(), type: 'action' }]);
            setActivities(prev => [{ id: generateId('ACT'), type: 'trip_created', message: `New trip ${newTrip.id} (${newTrip.name}) created.`, timestamp: new Date().toISOString(), icon: '✨' }, ...prev]);
        } else {
            setTrips(prevTrips => prevTrips.map(t => t.id === formData.id ? { ...t, ...formData, lastUpdate: new Date().toISOString() } : t));
            setAuditLogs(prev => [...prev, { id: generateId('AUD'), entity: 'Trip', entityId: formData.id, action: 'Trip Updated', details: `Trip ${formData.id} (${formData.name}) updated.`, user: currentUserRole, timestamp: new Date().toISOString(), type: 'update' }]);
        }
        navigate('TRIPS_LIST');
    };

    const handleApproveTrip = (tripId) => {
        setTrips(prevTrips =>
            prevTrips.map(trip =>
                trip.id === tripId ? { ...trip, status: TRIP_STATUS.ASSIGNED, currentWorkflowStage: 'ASSIGNED', lastUpdate: new Date().toISOString(), slaBreached: false } : trip
            )
        );
        setAuditLogs(prev => [...prev, { id: generateId('AUD'), entity: 'Trip', entityId: tripId, action: 'Trip Approved', details: `Trip ${tripId} status set to ASSIGNED.`, user: currentUserRole, timestamp: new Date().toISOString(), type: 'action' }]);
        setActivities(prev => [{ id: generateId('ACT'), type: 'trip_approved', message: `Trip ${tripId} approved for dispatch.`, timestamp: new Date().toISOString(), icon: '👍' }, ...prev]);
        navigate('TRIP_DETAIL', { id: tripId });
    };

    const handleRejectTrip = (tripId) => {
        setTrips(prevTrips =>
            prevTrips.map(trip =>
                trip.id === tripId ? { ...trip, status: TRIP_STATUS.CANCELLED, lastUpdate: new Date().toISOString() } : trip
            )
        );
        setAuditLogs(prev => [...prev, { id: generateId('AUD'), entity: 'Trip', entityId: tripId, action: 'Trip Rejected', details: `Trip ${tripId} status set to CANCELLED.`, user: currentUserRole, timestamp: new Date().toISOString(), type: 'action' }]);
        setActivities(prev => [{ id: generateId('ACT'), type: 'trip_rejected', message: `Trip ${tripId} cancelled/rejected.`, timestamp: new Date().toISOString(), icon: '🚫' }, ...prev]);
        navigate('TRIP_DETAIL', { id: tripId });
    };

    const handleGlobalSearch = (term) => {
        setGlobalSearchTerm(term);
        // Implement actual search logic here. For demo, it's just a placeholder.
        console.log(`Searching globally for: ${term}`);
    };

    // Screens
    const DashboardScreen = () => {
        const activeTripsCount = trips.filter(t => t.status === TRIP_STATUS.IN_PROGRESS || t.status === TRIP_STATUS.ASSIGNED || t.status === TRIP_STATUS.DELAYED).length;
        const pendingTripsCount = trips.filter(t => t.status === TRIP_STATUS.PENDING).length;
        const availableVehiclesCount = vehicles.filter(v => v.status === VEHICLE_STATUS.AVAILABLE).length;
        const availableDriversCount = drivers.filter(d => d.status === DRIVER_STATUS.AVAILABLE).length;
        const slaBreachesCount = trips.filter(t => t.slaBreached).length;

        return (
            <div className="dashboard-content">
                <div className="dashboard-section">
                    <h2 className="dashboard-section-title">Overview</h2>
                    <div className="metric-cards">
                        <div className="metric-card" onClick={() => navigate('TRIPS_LIST', { status: TRIP_STATUS.IN_PROGRESS })}>
                            <div className="metric-card-title">Active Trips</div>
                            <div className="metric-card-value">{activeTripsCount}</div>
                        </div>
                        <div className="metric-card" onClick={() => navigate('TRIPS_LIST', { status: TRIP_STATUS.PENDING })}>
                            <div className="metric-card-title">Pending Assignments</div>
                            <div className="metric-card-value">{pendingTripsCount}</div>
                        </div>
                        <div className="metric-card" onClick={() => navigate('VEHICLES_LIST', { status: VEHICLE_STATUS.AVAILABLE })}>
                            <div className="metric-card-title">Available Vehicles</div>
                            <div className="metric-card-value">{availableVehiclesCount}</div>
                        </div>
                        <div className="metric-card" onClick={() => navigate('DRIVERS_LIST', { status: DRIVER_STATUS.AVAILABLE })}>
                            <div className="metric-card-title">Available Drivers</div>
                            <div className="metric-card-value">{availableDriversCount}</div>
                        </div>
                        {currentUserRole === ROLES.DISPATCHER && (
                            <div className="metric-card" style={{ borderColor: 'var(--color-status-delayed)', backgroundColor: 'rgba(253, 126, 20, 0.1)' }} onClick={() => navigate('TRIPS_LIST', { status: TRIP_STATUS.PENDING, slaBreached: true })}>
                                <div className="metric-card-title" style={{ color: 'var(--color-status-delayed)' }}>SLA Breaches</div>
                                <div className="metric-card-value" style={{ color: 'var(--color-status-delayed)' }}>{slaBreachesCount}</div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="dashboard-section">
                    <h2 className="dashboard-section-title">
                        Real-time Trip Status
                        <button className="button button-primary" onClick={() => navigate('TRIP_NEW')}>New Trip Request</button>
                    </h2>
                    <div className="card-list">
                        {trips.filter(t => t.status === TRIP_STATUS.IN_PROGRESS || t.status === TRIP_STATUS.DELAYED).slice(0, 5).map(trip => (
                            <Card
                                key={trip.id}
                                title={trip.name}
                                subtitle={`${trip.origin} to ${trip.destination}`}
                                status={trip.status}
                                meta={<span>Driver: {drivers.find(d => d.id === trip.driverId)?.name || 'N/A'} | Progress: {trip.progress}%</span>}
                                onClick={() => navigate('TRIP_DETAIL', { id: trip.id })}
                            />
                        ))}
                        {trips.filter(t => t.status === TRIP_STATUS.IN_PROGRESS || t.status === TRIP_STATUS.DELAYED).length === 0 && (
                            <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#666' }}>No active or delayed trips.</p>
                        )}
                    </div>
                </div>

                <div className="dashboard-section">
                    <h2 className="dashboard-section-title">Recent Activities</h2>
                    <div>
                        {activities.slice(0, 5).map(activity => (
                            <div key={activity.id} className="recent-activity-item">
                                <span className="activity-icon">{activity.icon}</span>
                                <div className="activity-content">
                                    <div className="activity-text">{activity.message}</div>
                                    <div className="activity-timestamp">{new Date(activity.timestamp).toLocaleString()}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="dashboard-section">
                    <h2 className="dashboard-section-title">Analytics Snapshot</h2>
                    <div className="card-list" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                        <ChartPlaceholder type="Bar" title="Trips by Status" />
                        <ChartPlaceholder type="Donut" title="Vehicle Utilization" />
                    </div>
                    <div style={{ textAlign: 'right', marginTop: 'var(--spacing-md)' }}>
                        <button className="button button-secondary" onClick={() => navigate('REPORTS_ANALYTICS')}>View All Reports</button>
                    </div>
                </div>
            </div>
        );
    };

    const TripsScreen = () => {
        const [searchTerm, setSearchTerm] = useState('');
        const [filterStatus, setFilterStatus] = useState(view.params.status || '');
        const [showSlaBreached, setShowSlaBreached] = useState(view.params.slaBreached || false);

        const filteredTrips = trips.filter(trip => {
            const matchesSearch = trip.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  trip.origin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  trip.destination?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  trip.id?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = filterStatus ? trip.status === filterStatus : true;
            const matchesSLA = showSlaBreached ? trip.slaBreached : true;
            return matchesSearch && matchesStatus && matchesSLA;
        });

        const handleBulkApprove = () => { alert('Bulk Approve not implemented in this demo.'); };
        const handleExport = () => { alert('Export Trips not implemented in this demo.'); };

        return (
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                    <h2 style={{ fontSize: 'var(--font-size-heading-sm)', color: 'var(--color-primary-dark)' }}>Trip Management</h2>
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                        <button className="button button-secondary" onClick={handleExport}>Export</button>
                        {(currentUserRole === ROLES.DISPATCHER || currentUserRole === ROLES.ADMIN) && (
                            <>
                                <button className="button button-primary" onClick={() => navigate('TRIP_NEW')}>New Trip</button>
                                <button className="button button-primary" onClick={handleBulkApprove}>Bulk Approve</button>
                            </>
                        )}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        placeholder="Search trips..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="form-input"
                        style={{ flex: 1, minWidth: '200px' }}
                    />
                    <FormSelect
                        id="statusFilter"
                        label=""
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        options={Object.values(TRIP_STATUS).map(s => ({ value: s, label: STATUS_LABELS[s] }))}
                        style={{ minWidth: '150px' }}
                    />
                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', fontSize: 'var(--font-size-sm)' }}>
                        <input
                            type="checkbox"
                            checked={showSlaBreached}
                            onChange={(e) => setShowSlaBreached(e.target.checked)}
                        />
                        SLA Breached
                    </label>
                </div>

                <div className="card-list">
                    {filteredTrips.length > 0 ? (
                        filteredTrips.map(trip => (
                            <Card
                                key={trip.id}
                                title={trip.name}
                                subtitle={`${trip.origin} to ${trip.destination}`}
                                status={trip.status}
                                meta={<><span>Driver: {drivers.find(d => d.id === trip.driverId)?.name || 'Unassigned'}</span><span>Scheduled: {new Date(trip.scheduledTime).toLocaleDateString()}</span></>}
                                onClick={() => navigate('TRIP_DETAIL', { id: trip.id })}
                            >
                                {trip.slaBreached && <div style={{ color: 'var(--color-status-delayed)', fontSize: 'var(--font-size-sm)', marginTop: 'var(--spacing-xs)', fontWeight: 'var(--font-weight-medium)' }}>SLA Breached!</div>}
                            </Card>
                        ))
                    ) : (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--spacing-xl)', color: '#666', border: '1px dashed var(--color-border)', borderRadius: 'var(--border-radius-md)' }}>
                            <p>No trips found matching your criteria.</p>
                            <button className="button button-primary" onClick={() => navigate('TRIP_NEW')} style={{ marginTop: 'var(--spacing-md)' }}>Create New Trip</button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const TripDetailScreen = ({ tripId }) => {
        const trip = trips.find(t => t.id === tripId);
        const driver = drivers.find(d => d.id === trip?.driverId);
        const vehicle = vehicles.find(v => v.id === trip?.vehicleId);
        const tripLogs = auditLogs.filter(log => log.entity === 'Trip' && log.entityId === tripId);

        if (!trip) {
            return <div className="detail-screen">Trip not found.</div>;
        }

        const canApproveReject = (currentUserRole === ROLES.DISPATCHER || currentUserRole === ROLES.ADMIN) && trip.status === TRIP_STATUS.PENDING;
        const canEdit = (currentUserRole === ROLES.DISPATCHER || currentUserRole === ROLES.ADMIN || currentUserRole === ROLES.FLEET_MANAGER) && (trip.status !== TRIP_STATUS.COMPLETED && trip.status !== TRIP_STATUS.CANCELLED);

        return (
            <div className="detail-screen">
                <div className="detail-header">
                    <h1 className="detail-title">
                        {trip.name}
                        <span className="card-badge" style={{ backgroundColor: STATUS_COLORS[trip.status], color: (trip.status === TRIP_STATUS.PENDING || trip.status === TRIP_STATUS.DELAYED) ? 'var(--color-text-dark)' : 'var(--color-text-light)' }}>
                            {STATUS_LABELS[trip.status]}
                        </span>
                    </h1>
                    <div className="detail-actions">
                        {canEdit && (
                            <button className="button button-secondary" onClick={() => navigate('TRIP_EDIT', { id: trip.id })}>
                                Edit Trip
                            </button>
                        )}
                        {canApproveReject && (
                            <>
                                <button className="button button-primary" onClick={() => handleApproveTrip(trip.id)}>
                                    Approve Dispatch
                                </button>
                                <button className="button button-danger" onClick={() => handleRejectTrip(trip.id)}>
                                    Reject
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="detail-section">
                    <h3 className="section-title">Workflow Progress</h3>
                    <WorkflowTracker
                        currentStageId={trip.currentWorkflowStage}
                        workflow={TRIP_WORKFLOW}
                        createdAt={trip.createdAt}
                    />
                </div>

                <div className="detail-section">
                    <h3 className="section-title">Trip Details</h3>
                    <div className="detail-grid">
                        <div className="detail-item">
                            <span className="detail-label">Trip ID</span>
                            <span className="detail-value">{trip.id}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Origin</span>
                            <span className="detail-value">{trip.origin}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Destination</span>
                            <span className="detail-value">{trip.destination}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Scheduled Time</span>
                            <span className="detail-value">{new Date(trip.scheduledTime).toLocaleString()}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Estimated Completion</span>
                            <span className="detail-value">{trip.estimatedCompletion ? new Date(trip.estimatedCompletion).toLocaleString() : 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Current Progress</span>
                            <span className="detail-value">{trip.progress}%</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Notes</span>
                            <span className="detail-value">{trip.notes || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Last Updated</span>
                            <span className="detail-value">{new Date(trip.lastUpdate).toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="detail-section">
                    <h3 className="section-title">Assignment</h3>
                    <div className="detail-grid">
                        <div className="detail-item">
                            <span className="detail-label">Driver</span>
                            <span className="detail-value">{driver ? <span onClick={() => navigate('DRIVER_DETAIL', { id: driver.id })} style={{ color: 'var(--color-primary)', cursor: 'pointer' }}>{driver.name}</span> : 'Unassigned'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Vehicle</span>
                            <span className="detail-value">{vehicle ? <span onClick={() => navigate('VEHICLE_DETAIL', { id: vehicle.id })} style={{ color: 'var(--color-primary)', cursor: 'pointer' }}>{vehicle.licensePlate} ({vehicle.make})</span> : 'Unassigned'}</span>
                        </div>
                    </div>
                </div>

                <div className="detail-section">
                    <h3 className="section-title">Documents</h3>
                    {trip.files?.length > 0 ? (
                        <ul className="uploaded-file-list">
                            {trip.files.map(file => (
                                <li key={file.id} className="uploaded-file-item">
                                    <a href={file.url} target="_blank" rel="noopener noreferrer" style={{ flexGrow: 1 }}>{file.name}</a>
                                    <span style={{ fontSize: 'var(--font-size-xs)', color: '#999' }}>({new Date(file.uploadedAt).toLocaleDateString()})</span>
                                    <button className="remove-file-button" onClick={() => alert('Document preview/download not implemented in this demo.')}>View</button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p style={{ color: '#666' }}>No documents uploaded for this trip.</p>
                    )}
                </div>

                <div className="detail-section">
                    <h3 className="section-title">Audit Log</h3>
                    {tripLogs.length > 0 ? (
                        <div>
                            {tripLogs.map(log => (
                                <div key={log.id} className={`audit-log-entry ${log.type}`}>
                                    <div>{log.action}: {log.details}</div>
                                    <div className="log-timestamp">By {log.user} on {new Date(log.timestamp).toLocaleString()}</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: '#666' }}>No audit logs for this trip.</p>
                    )}
                </div>
            </div>
        );
    };

    const TripForm = ({ trip }) => {
        const isNew = !trip?.id;
        const [formData, setFormData] = useState({
            id: trip?.id || '',
            name: trip?.name || '',
            origin: trip?.origin || '',
            destination: trip?.destination || '',
            scheduledTime: trip?.scheduledTime ? new Date(trip.scheduledTime).toISOString().slice(0, 16) : '',
            notes: trip?.notes || '',
            driverId: trip?.driverId || '',
            vehicleId: trip?.vehicleId || '',
            files: trip?.files || [],
        });
        const [errors, setErrors] = useState({});

        const validate = () => {
            const newErrors = {};
            if (!formData.name) newErrors.name = 'Trip name is required.';
            if (!formData.origin) newErrors.origin = 'Origin is required.';
            if (!formData.destination) newErrors.destination = 'Destination is required.';
            if (!formData.scheduledTime) newErrors.scheduledTime = 'Scheduled time is required.';
            // Add more field-level validations as needed
            setErrors(newErrors);
            return Object.keys(newErrors).length === 0;
        };

        const handleChange = (e) => {
            const { id, value } = e.target;
            setFormData(prev => ({ ...prev, [id]: value }));
        };

        const handleFileChange = (e) => {
            const newFiles = Array.from(e.target.files).map(file => ({
                id: generateId('DOC'),
                name: file.name,
                url: URL.createObjectURL(file), // Placeholder URL
                uploadedAt: new Date().toISOString(),
            }));
            setFormData(prev => ({ ...prev, files: [...prev.files, ...newFiles] }));
        };

        const handleRemoveFile = (fileId) => {
            setFormData(prev => ({ ...prev, files: prev.files.filter(f => f.id !== fileId) }));
        };

        const handleSubmit = (e) => {
            e.preventDefault();
            if (validate()) {
                handleSubmitTrip(formData, isNew);
            } else {
                alert('Please correct the errors in the form.');
            }
        };

        const driverOptions = drivers.map(d => ({ value: d.id, label: d.name }));
        const vehicleOptions = vehicles.map(v => ({ value: v.id, label: `${v.licensePlate} (${v.make})` }));

        return (
            <div className="form">
                <h2 style={{ fontSize: 'var(--font-size-heading-sm)', color: 'var(--color-primary-dark)', marginBottom: 'var(--spacing-lg)' }}>
                    {isNew ? 'Create New Trip' : `Edit Trip: ${trip?.name}`}
                </h2>
                <form onSubmit={handleSubmit}>
                    <FormInput
                        label="Trip Name"
                        id="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        error={errors.name}
                    />
                    <FormInput
                        label="Origin"
                        id="origin"
                        value={formData.origin}
                        onChange={handleChange}
                        required
                        error={errors.origin}
                    />
                    <FormInput
                        label="Destination"
                        id="destination"
                        value={formData.destination}
                        onChange={handleChange}
                        required
                        error={errors.destination}
                    />
                    <FormInput
                        label="Scheduled Time"
                        id="scheduledTime"
                        type="datetime-local"
                        value={formData.scheduledTime}
                        onChange={handleChange}
                        required
                        error={errors.scheduledTime}
                    />
                    <FormSelect
                        label="Assign Driver"
                        id="driverId"
                        value={formData.driverId}
                        onChange={handleChange}
                        options={driverOptions}
                        disabled={!isNew && trip?.status !== TRIP_STATUS.PENDING} // Can only assign if new or pending
                        autoPopulated={!isNew && !!trip?.driverId}
                    />
                    <FormSelect
                        label="Assign Vehicle"
                        id="vehicleId"
                        value={formData.vehicleId}
                        onChange={handleChange}
                        options={vehicleOptions}
                        disabled={!isNew && trip?.status !== TRIP_STATUS.PENDING}
                        autoPopulated={!isNew && !!trip?.vehicleId}
                    />
                    <FormInput
                        label="Notes"
                        id="notes"
                        type="textarea"
                        value={formData.notes}
                        onChange={handleChange}
                    />

                    <div className="form-group">
                        <label className="form-label">Attached Documents</label>
                        <FormInput
                            label="Upload File"
                            id="file-upload"
                            type="file"
                            onChange={handleFileChange}
                            accept=".pdf,.doc,.docx,.jpg,.png"
                        />
                        {formData.files?.length > 0 && (
                            <ul className="uploaded-file-list">
                                {formData.files.map(file => (
                                    <li key={file.id} className="uploaded-file-item">
                                        <span>{file.name}</span>
                                        <button type="button" className="remove-file-button" onClick={() => handleRemoveFile(file.id)}>Remove</button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="form-actions">
                        <button type="button" className="button button-secondary" onClick={() => isNew ? navigate('TRIPS_LIST') : navigate('TRIP_DETAIL', { id: trip.id })}>
                            Cancel
                        </button>
                        <button type="submit" className="button button-primary">
                            {isNew ? 'Create Trip' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        );
    };

    const VehiclesScreen = () => {
        const [searchTerm, setSearchTerm] = useState('');
        const [filterStatus, setFilterStatus] = useState(view.params.status || '');

        const filteredVehicles = vehicles.filter(vehicle => {
            const matchesSearch = vehicle.licensePlate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  vehicle.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  vehicle.id?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = filterStatus ? vehicle.status === filterStatus : true;
            return matchesSearch && matchesStatus;
        });

        return (
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                    <h2 style={{ fontSize: 'var(--font-size-heading-sm)', color: 'var(--color-primary-dark)' }}>Vehicle Management</h2>
                    {(currentUserRole === ROLES.FLEET_MANAGER || currentUserRole === ROLES.ADMIN) && (
                        <button className="button button-primary" onClick={() => alert('New Vehicle Form not implemented.')}>New Vehicle</button>
                    )}
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        placeholder="Search vehicles..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="form-input"
                        style={{ flex: 1, minWidth: '200px' }}
                    />
                    <FormSelect
                        id="statusFilter"
                        label=""
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        options={Object.values(VEHICLE_STATUS).map(s => ({ value: s, label: STATUS_LABELS[s] }))}
                        style={{ minWidth: '150px' }}
                    />
                </div>
                <div className="card-list">
                    {filteredVehicles.length > 0 ? (
                        filteredVehicles.map(vehicle => (
                            <Card
                                key={vehicle.id}
                                title={vehicle.licensePlate}
                                subtitle={`${vehicle.make} ${vehicle.model} (${vehicle.year})`}
                                status={vehicle.status}
                                meta={<><span>Type: {vehicle.type}</span><span>Capacity: {vehicle.capacity}</span></>}
                                onClick={() => navigate('VEHICLE_DETAIL', { id: vehicle.id })}
                            />
                        ))
                    ) : (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--spacing-xl)', color: '#666', border: '1px dashed var(--color-border)', borderRadius: 'var(--border-radius-md)' }}>
                            <p>No vehicles found matching your criteria.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const VehicleDetailScreen = ({ vehicleId }) => {
        const vehicle = vehicles.find(v => v.id === vehicleId);
        const assignedDriver = drivers.find(d => d.assignedVehicleId === vehicleId);
        const relatedTrips = trips.filter(t => t.vehicleId === vehicleId);
        const vehicleLogs = auditLogs.filter(log => log.entity === 'Vehicle' && log.entityId === vehicleId);

        if (!vehicle) {
            return <div className="detail-screen">Vehicle not found.</div>;
        }

        const canEdit = (currentUserRole === ROLES.FLEET_MANAGER || currentUserRole === ROLES.ADMIN);

        return (
            <div className="detail-screen">
                <div className="detail-header">
                    <h1 className="detail-title">
                        {vehicle.licensePlate}
                        <span className="card-badge" style={{ backgroundColor: STATUS_COLORS[vehicle.status], color: (vehicle.status === VEHICLE_STATUS.MAINTENANCE) ? 'var(--color-text-dark)' : 'var(--color-text-light)' }}>
                            {STATUS_LABELS[vehicle.status]}
                        </span>
                    </h1>
                    <div className="detail-actions">
                        {canEdit && (
                            <button className="button button-secondary" onClick={() => alert('Edit Vehicle Form not implemented.')}>
                                Edit Vehicle
                            </button>
                        )}
                    </div>
                </div>

                <div className="detail-section">
                    <h3 className="section-title">Vehicle Information</h3>
                    <div className="detail-grid">
                        <div className="detail-item">
                            <span className="detail-label">Make & Model</span>
                            <span className="detail-value">{vehicle.make} {vehicle.model}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Year</span>
                            <span className="detail-value">{vehicle.year}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Type</span>
                            <span className="detail-value">{vehicle.type}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Capacity</span>
                            <span className="detail-value">{vehicle.capacity}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Current Location</span>
                            <span className="detail-value">{vehicle.currentLocation}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Last Maintenance</span>
                            <span className="detail-value">{new Date(vehicle.lastMaintenance).toLocaleDateString()}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Next Maintenance</span>
                            <span className="detail-value">{new Date(vehicle.nextMaintenance).toLocaleDateString()}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Assigned Driver</span>
                            <span className="detail-value">{assignedDriver ? <span onClick={() => navigate('DRIVER_DETAIL', { id: assignedDriver.id })} style={{ color: 'var(--color-primary)', cursor: 'pointer' }}>{assignedDriver.name}</span> : 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <div className="detail-section">
                    <h3 className="section-title">Related Trips</h3>
                    <div className="card-list">
                        {relatedTrips.length > 0 ? (
                            relatedTrips.map(trip => (
                                <Card
                                    key={trip.id}
                                    title={trip.name}
                                    subtitle={`${trip.origin} to ${trip.destination}`}
                                    status={trip.status}
                                    meta={<span>Scheduled: {new Date(trip.scheduledTime).toLocaleDateString()}</span>}
                                    onClick={() => navigate('TRIP_DETAIL', { id: trip.id })}
                                />
                            ))
                        ) : (
                            <p style={{ gridColumn: '1 / -1', color: '#666' }}>No active or recent trips for this vehicle.</p>
                        )}
                    </div>
                </div>

                <div className="detail-section">
                    <h3 className="section-title">Audit Log</h3>
                    {vehicleLogs.length > 0 ? (
                        <div>
                            {vehicleLogs.map(log => (
                                <div key={log.id} className={`audit-log-entry ${log.type}`}>
                                    <div>{log.action}: {log.details}</div>
                                    <div className="log-timestamp">By {log.user} on {new Date(log.timestamp).toLocaleString()}</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: '#666' }}>No audit logs for this vehicle.</p>
                    )}
                </div>
            </div>
        );
    };

    const DriversScreen = () => {
        const [searchTerm, setSearchTerm] = useState('');
        const [filterStatus, setFilterStatus] = useState(view.params.status || '');

        const filteredDrivers = drivers.filter(driver => {
            const matchesSearch = driver.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  driver.license?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  driver.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  driver.id?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = filterStatus ? driver.status === filterStatus : true;
            return matchesSearch && matchesStatus;
        });

        return (
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                    <h2 style={{ fontSize: 'var(--font-size-heading-sm)', color: 'var(--color-primary-dark)' }}>Driver Management</h2>
                    {(currentUserRole === ROLES.FLEET_MANAGER || currentUserRole === ROLES.ADMIN) && (
                        <button className="button button-primary" onClick={() => alert('New Driver Form not implemented.')}>New Driver</button>
                    )}
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        placeholder="Search drivers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="form-input"
                        style={{ flex: 1, minWidth: '200px' }}
                    />
                    <FormSelect
                        id="statusFilter"
                        label=""
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        options={Object.values(DRIVER_STATUS).map(s => ({ value: s, label: STATUS_LABELS[s] }))}
                        style={{ minWidth: '150px' }}
                    />
                </div>
                <div className="card-list">
                    {filteredDrivers.length > 0 ? (
                        filteredDrivers.map(driver => (
                            <Card
                                key={driver.id}
                                title={driver.name}
                                subtitle={`License: ${driver.license}`}
                                status={driver.status}
                                meta={<><span>Phone: {driver.phone}</span><span>Availability: {new Date(driver.availability).toLocaleDateString()}</span></>}
                                onClick={() => navigate('DRIVER_DETAIL', { id: driver.id })}
                            />
                        ))
                    ) : (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--spacing-xl)', color: '#666', border: '1px dashed var(--color-border)', borderRadius: 'var(--border-radius-md)' }}>
                            <p>No drivers found matching your criteria.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const DriverDetailScreen = ({ driverId }) => {
        const driver = drivers.find(d => d.id === driverId);
        const currentTrip = trips.find(t => t.id === driver?.currentTripId);
        const assignedVehicle = vehicles.find(v => v.id === driver?.assignedVehicleId);
        const driverLogs = auditLogs.filter(log => log.entity === 'Driver' && log.entityId === driverId);

        if (!driver) {
            return <div className="detail-screen">Driver not found.</div>;
        }

        const canEdit = (currentUserRole === ROLES.FLEET_MANAGER || currentUserRole === ROLES.ADMIN);

        return (
            <div className="detail-screen">
                <div className="detail-header">
                    <h1 className="detail-title">
                        {driver.name}
                        <span className="card-badge" style={{ backgroundColor: STATUS_COLORS[driver.status] }}>
                            {STATUS_LABELS[driver.status]}
                        </span>
                    </h1>
                    <div className="detail-actions">
                        {canEdit && (
                            <button className="button button-secondary" onClick={() => alert('Edit Driver Form not implemented.')}>
                                Edit Driver
                            </button>
                        )}
                    </div>
                </div>

                <div className="detail-section">
                    <h3 className="section-title">Driver Information</h3>
                    <div className="detail-grid">
                        <div className="detail-item">
                            <span className="detail-label">License</span>
                            <span className="detail-value">{driver.license}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Phone</span>
                            <span className="detail-value">{driver.phone}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Email</span>
                            <span className="detail-value">{driver.email}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Availability</span>
                            <span className="detail-value">{new Date(driver.availability).toLocaleString()}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Current Trip</span>
                            <span className="detail-value">{currentTrip ? <span onClick={() => navigate('TRIP_DETAIL', { id: currentTrip.id })} style={{ color: 'var(--color-primary)', cursor: 'pointer' }}>{currentTrip.name} ({currentTrip.id})</span> : 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Assigned Vehicle</span>
                            <span className="detail-value">{assignedVehicle ? <span onClick={() => navigate('VEHICLE_DETAIL', { id: assignedVehicle.id })} style={{ color: 'var(--color-primary)', cursor: 'pointer' }}>{assignedVehicle.licensePlate}</span> : 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <div className="detail-section">
                    <h3 className="section-title">Audit Log</h3>
                    {driverLogs.length > 0 ? (
                        <div>
                            {driverLogs.map(log => (
                                <div key={log.id} className={`audit-log-entry ${log.type}`}>
                                    <div>{log.action}: {log.details}</div>
                                    <div className="log-timestamp">By {log.user} on {new Date(log.timestamp).toLocaleString()}</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: '#666' }}>No audit logs for this driver.</p>
                    )}
                </div>
            </div>
        );
    };

    const ReportsAnalyticsScreen = () => {
        return (
            <div className="detail-screen">
                <h2 className="detail-title" style={{ marginBottom: 'var(--spacing-lg)' }}>Reports & Analytics</h2>

                <div className="dashboard-section">
                    <h3 className="section-title">Overall Performance</h3>
                    <div className="card-list" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                        <ChartPlaceholder type="Bar" title="Monthly Trip Volume" />
                        <ChartPlaceholder type="Line" title="Average Trip Duration" />
                        <ChartPlaceholder type="Donut" title="Fuel Consumption by Vehicle Type" />
                        <ChartPlaceholder type="Gauge" title="On-Time Delivery Rate" />
                    </div>
                    <div style={{ textAlign: 'right', marginTop: 'var(--spacing-md)' }}>
                        <button className="button button-secondary" onClick={() => alert('Export to PDF/Excel not implemented.')}>Export All Charts</button>
                    </div>
                </div>

                <div className="dashboard-section">
                    <h3 className="section-title">Historical Data</h3>
                    <div className="card-list" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                        <ChartPlaceholder type="Line" title="Past 12 Months Trip Trends" />
                        <ChartPlaceholder type="Bar" title="Historical SLA Performance" />
                    </div>
                </div>

                <div className="dashboard-section">
                    <h3 className="section-title">Custom Reports (Filters & Saved Views)</h3>
                    <p style={{ color: '#666' }}>This section would include advanced filters (side panel), saved report views, and export options (PDF/Excel) based on user roles and personalization.</p>
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-md)' }}>
                        <button className="button button-secondary" onClick={() => alert('Saved Filters/Views functionality not implemented.')}>Load Saved View</button>
                        <button className="button button-secondary" onClick={() => alert('Advanced Filters functionality not implemented.')}>Open Filters Panel</button>
                    </div>
                </div>
            </div>
        );
    };

    const NotFoundScreen = () => (
        <div className="detail-screen text-center">
            <h1 className="detail-title">404 - Page Not Found</h1>
            <p style={{ marginBottom: 'var(--spacing-lg)' }}>The screen you are trying to access does not exist.</p>
            <button className="button button-primary" onClick={() => navigate('DASHBOARD')}>Go to Dashboard</button>
        </div>
    );

    // Determine breadcrumbs
    const getBreadcrumbs = () => {
        const path = [{ label: 'Dashboard', screen: 'DASHBOARD' }];
        switch (view.screen) {
            case 'TRIPS_LIST':
                path.push({ label: 'Trips', screen: 'TRIPS_LIST' });
                break;
            case 'TRIP_DETAIL':
                path.push({ label: 'Trips', screen: 'TRIPS_LIST' });
                path.push({ label: `Trip: ${trips.find(t => t.id === view.params.id)?.name || view.params.id}`, screen: 'TRIP_DETAIL', params: view.params });
                break;
            case 'TRIP_EDIT':
                path.push({ label: 'Trips', screen: 'TRIPS_LIST' });
                path.push({ label: `Trip: ${trips.find(t => t.id === view.params.id)?.name || view.params.id}`, screen: 'TRIP_DETAIL', params: { id: view.params.id } });
                path.push({ label: 'Edit', screen: 'TRIP_EDIT', params: view.params });
                break;
            case 'TRIP_NEW':
                path.push({ label: 'Trips', screen: 'TRIPS_LIST' });
                path.push({ label: 'New Trip', screen: 'TRIP_NEW' });
                break;
            case 'VEHICLES_LIST':
                path.push({ label: 'Vehicles', screen: 'VEHICLES_LIST' });
                break;
            case 'VEHICLE_DETAIL':
                path.push({ label: 'Vehicles', screen: 'VEHICLES_LIST' });
                path.push({ label: `Vehicle: ${vehicles.find(v => v.id === view.params.id)?.licensePlate || view.params.id}`, screen: 'VEHICLE_DETAIL', params: view.params });
                break;
            case 'DRIVERS_LIST':
                path.push({ label: 'Drivers', screen: 'DRIVERS_LIST' });
                break;
            case 'DRIVER_DETAIL':
                path.push({ label: 'Drivers', screen: 'DRIVERS_LIST' });
                path.push({ label: `Driver: ${drivers.find(d => d.id === view.params.id)?.name || view.params.id}`, screen: 'DRIVER_DETAIL', params: view.params });
                break;
            case 'REPORTS_ANALYTICS':
                path.push({ label: 'Reports & Analytics', screen: 'REPORTS_ANALYTICS' });
                break;
            case 'SETTINGS':
                path.push({ label: 'Settings', screen: 'SETTINGS' });
                break;
            default:
                break;
        }
        return path;
    };

    const currentBreadcrumbs = getBreadcrumbs();

    // Render screen based on `view.screen`
    const renderScreen = () => {
        switch (view.screen) {
            case 'DASHBOARD': return <DashboardScreen />;
            case 'TRIPS_LIST': return <TripsScreen />;
            case 'TRIP_DETAIL': return <TripDetailScreen tripId={view.params.id} />;
            case 'TRIP_EDIT': return <TripForm trip={trips.find(t => t.id === view.params.id)} />;
            case 'TRIP_NEW': return <TripForm />;
            case 'VEHICLES_LIST': return <VehiclesScreen />;
            case 'VEHICLE_DETAIL': return <VehicleDetailScreen vehicleId={view.params.id} />;
            case 'DRIVERS_LIST': return <DriversScreen />;
            case 'DRIVER_DETAIL': return <DriverDetailScreen driverId={view.params.id} />;
            case 'REPORTS_ANALYTICS': return <ReportsAnalyticsScreen />;
            case 'SETTINGS': return <div className="detail-screen"><h2>Settings (Admin Only)</h2><p>User Management, Role Configuration, System Settings, Audit Configuration, Session Timeout rules would be managed here.</p></div>;
            default: return <NotFoundScreen />;
        }
    };

    // Global search results (dummy)
    const globalSearchResults = globalSearchTerm
        ? [
              ...trips.filter(t => t.name.toLowerCase().includes(globalSearchTerm.toLowerCase())).slice(0, 3).map(t => ({ id: t.id, label: t.name, type: 'Trip', screen: 'TRIP_DETAIL', params: { id: t.id } })),
              ...vehicles.filter(v => v.licensePlate.toLowerCase().includes(globalSearchTerm.toLowerCase())).slice(0, 3).map(v => ({ id: v.id, label: `${v.licensePlate} (${v.make})`, type: 'Vehicle', screen: 'VEHICLE_DETAIL', params: { id: v.id } })),
              ...drivers.filter(d => d.name.toLowerCase().includes(globalSearchTerm.toLowerCase())).slice(0, 3).map(d => ({ id: d.id, label: d.name, type: 'Driver', screen: 'DRIVER_DETAIL', params: { id: d.id } })),
          ]
        : [];

    return (
        <div className="app-container">
            <header className="header">
                <div className="app-title" onClick={() => navigate('DASHBOARD')} style={{ cursor: 'pointer' }}>
                    Trip Dispatch
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                    {/* Global Search Button */}
                    <button className="button button-secondary" onClick={() => setIsGlobalSearchOpen(true)} style={{ padding: '8px 12px', fontSize: 'var(--font-size-sm)' }}>
                        🔍 Search
                    </button>

                    {/* User Menu */}
                    <div className="user-menu" ref={userMenuRef}>
                        <div className="user-avatar" onClick={toggleUserDropdown}>
                            {currentUserRole.charAt(0)}
                        </div>
                        {userDropdownOpen && (
                            <div className="dropdown-menu">
                                <div className="dropdown-menu-item">Signed in as {currentUserRole}</div>
                                <div className="dropdown-menu-item" onClick={() => navigate('SETTINGS')}>Settings</div>
                                <div className="dropdown-menu-item" onClick={handleLogout}>Logout</div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <nav className="nav-bar">
                <span className={`nav-link ${view.screen === 'DASHBOARD' ? 'active' : ''}`} onClick={() => navigate('DASHBOARD')}>Dashboard</span>
                <span className={`nav-link ${view.screen.startsWith('TRIP') ? 'active' : ''}`} onClick={() => navigate('TRIPS_LIST')}>Trips</span>
                <span className={`nav-link ${view.screen.startsWith('VEHICLE') ? 'active' : ''}`} onClick={() => navigate('VEHICLES_LIST')}>Vehicles</span>
                <span className={`nav-link ${view.screen.startsWith('DRIVER') ? 'active' : ''}`} onClick={() => navigate('DRIVERS_LIST')}>Drivers</span>
                <span className={`nav-link ${view.screen === 'REPORTS_ANALYTICS' ? 'active' : ''}`} onClick={() => navigate('REPORTS_ANALYTICS')}>Reports</span>
                {(currentUserRole === ROLES.ADMIN) && (
                    <span className={`nav-link ${view.screen === 'SETTINGS' ? 'active' : ''}`} onClick={() => navigate('SETTINGS')}>Admin</span>
                )}
            </nav>

            <main className="main-content">
                <Breadcrumbs path={currentBreadcrumbs} navigate={navigate} />
                {renderScreen()}
            </main>

            {/* Global Search Overlay */}
            {isGlobalSearchOpen && (
                <div className="global-search-overlay" onClick={(e) => (e.target.classList.contains('global-search-overlay')) && setIsGlobalSearchOpen(false)}>
                    <div className="global-search-content">
                        <div className="global-search-input-wrapper">
                            <span style={{ fontSize: 'var(--font-size-lg)' }}>🔍</span>
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Search all records (Trips, Vehicles, Drivers...)"
                                className="global-search-input"
                                value={globalSearchTerm}
                                onChange={(e) => handleGlobalSearch(e.target.value)}
                            />
                            <button className="button button-secondary" onClick={() => setIsGlobalSearchOpen(false)}>✕</button>
                        </div>
                        {globalSearchTerm && globalSearchResults.length > 0 && (
                            <ul className="search-results-list">
                                {globalSearchResults.map(result => (
                                    <li key={result.id} className="search-result-item" onClick={() => navigate(result.screen, result.params)}>
                                        <span className="search-result-item-label">{result.label}</span>
                                        <span className="search-result-item-type">{result.type}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {globalSearchTerm && globalSearchResults.length === 0 && (
                            <p style={{ textAlign: 'center', color: '#999', padding: 'var(--spacing-md)' }}>No results found for "{globalSearchTerm}".</p>
                        )}
                        {!globalSearchTerm && (
                            <p style={{ textAlign: 'center', color: '#999', padding: 'var(--spacing-md)' }}>Start typing to search across the application.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;