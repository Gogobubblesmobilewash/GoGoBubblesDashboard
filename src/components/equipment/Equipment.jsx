import React, { useState, useEffect } from 'react';
import {
  FiBriefcase as Briefcase,
  FiCalendar as Calendar,
  FiCheckCircle as CheckCircle,
  FiClock as Clock,
  FiAlertTriangle as AlertTriangle,
  FiPlus as Plus,
  FiEdit as Edit,
  FiTrash2 as Trash2,
  FiSearch as Search,
  FiDownload as Download,
  FiUpload as Upload,
  FiUser as User
} from 'react-icons/fi';
import useStore from '../../store/useStore';
import Modal from '../shared/Modal';
import { equipmentAPI } from '../../services/api';

const Equipment = () => {
  const { user, isAdmin, equipment, setEquipment, loading, setLoading } = useStore();
  const [filteredEquipment, setFilteredEquipment] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
  });

  // for modal control
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [assigningEquipment, setAssigningEquipment] = useState(null);

  useEffect(() => {
    loadEquipment();
  }, []);

  useEffect(() => {
    filterEquipment();
  }, [equipment, filters]);

  const loadEquipment = async () => {
    setLoading(true);
    try {
      const data = await equipmentAPI.getEquipment();
      setEquipment(data);
    } catch (error) {
      console.error('Error loading equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterEquipment = () => {
    let result = equipment;

    if (filters.status !== 'all') {
      result = result.filter((e) => e.status === filters.status);
    }
    if (filters.search) {
      result = result.filter((e) =>
        [e.item, e.assignedTo, e.serialNumber]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(filters.search.toLowerCase()))
      );
    }
    setFilteredEquipment(result);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'rented':
        return 'bg-blue-100 text-blue-800';
      case 'returned':
        return 'bg-gray-100 text-gray-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'damaged':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available':
      case 'returned':
        return CheckCircle;
      case 'rented':
        return Clock;
      case 'maintenance':
      case 'damaged':
        return AlertTriangle;
      default:
        return Clock;
    }
  };

  const isOverdue = (expectedReturn) =>
    expectedReturn && new Date(expectedReturn) < new Date();

  const handleReturn = (id) => {
    setEquipment(
      equipment.map((e) =>
        e.id === id ? { ...e, returned: true, status: 'returned' } : e
      )
    );
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this equipment?')) {
      setLoading(true);
      try {
        const response = await equipmentAPI.updateEquipmentStatus(id, 'deleted');
        console.log('Equipment deleted response:', response);
        
        // Reload equipment to get updated data
        await loadEquipment();
      } catch (error) {
        console.error('Error deleting equipment:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAssignEquipment = async () => {
    if (assigningEquipment) {
      setLoading(true);
      try {
        const response = await equipmentAPI.assignEquipment(assigningEquipment.id, assigningEquipment.assignedTo);
        console.log('Equipment assigned response:', response);
        
        // Reload equipment to get updated data
        await loadEquipment();
        setShowAssignModal(false);
        setAssigningEquipment(null);
      } catch (error) {
        console.error('Error assigning equipment:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSaveEquipment = async () => {
    if (editingEquipment) {
      setLoading(true);
      try {
        if (editingEquipment.id) {
          // Update existing equipment
          const response = await equipmentAPI.updateEquipmentStatus(editingEquipment.id, editingEquipment.status);
          console.log('Equipment updated response:', response);
        } else {
          // Add new equipment
          const response = await equipmentAPI.addEquipment(editingEquipment);
          console.log('Equipment added response:', response);
        }
        
        // Reload equipment to get updated data
        await loadEquipment();
        setShowEditModal(false);
        setEditingEquipment(null);
      } catch (error) {
        console.error('Error saving equipment:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleConfirmReturn = async () => {
    if (selectedEquipment) {
      setLoading(true);
      try {
        const returnDate = new Date().toISOString().split('T')[0];
        const response = await equipmentAPI.returnEquipment(selectedEquipment.id, returnDate);
        console.log('Equipment returned response:', response);
        
        // Reload equipment to get updated data
        await loadEquipment();
        setShowReturnModal(false);
        setSelectedEquipment(null);
      } catch (error) {
        console.error('Error returning equipment:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const EquipmentCard = ({ item }) => {
    const StatusIcon = getStatusIcon(item.status);
    const overdue = isOverdue(item.expectedReturn);

    return (
      <div className="card-hover">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold">{item.item}</h3>
            <p className="text-xs text-gray-500">SN: {item.serialNumber}</p>
          </div>
          <div className="flex items-center space-x-2">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                item.status
              )}`}
            >
              <StatusIcon className="h-3 w-3 mr-1" />
              {item.status}
            </span>
            {overdue && (
              <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-xs">
                Overdue
              </span>
            )}
          </div>
        </div>

        <div className="space-y-2 mb-4 text-sm text-gray-600">
          {item.assignedTo && (
            <div>
              <Briefcase className="inline h-4 w-4 mr-1" />
              Assigned to: {item.assignedTo}
            </div>
          )}
          {item.rentalDate && (
            <div>
              <Calendar className="inline h-4 w-4 mr-1" />
              Rented: {new Date(item.rentalDate).toLocaleDateString()}
            </div>
          )}
          {item.expectedReturn && (
            <div>
              <Calendar className="inline h-4 w-4 mr-1" />
              <span className={overdue ? 'text-red-600 font-medium' : ''}>
                Return by: {new Date(item.expectedReturn).toLocaleDateString()}
              </span>
            </div>
          )}
          <div>
            <span
              className={`w-2 h-2 rounded-full inline-block mr-1 ${
                item.condition === 'excellent'
                  ? 'bg-green-500'
                  : item.condition === 'good'
                  ? 'bg-blue-500'
                  : 'bg-yellow-500'
              }`}
            />
            Condition: {item.condition}
          </div>
        </div>

        {item.notes && (
          <div className="bg-gray-50 rounded p-2 text-xs text-gray-700">
            {item.notes}
          </div>
        )}

        <div className="flex justify-between items-center mt-3">
          <div className="flex space-x-2">
            {item.status === 'available' && isAdmin && (
              <button
                className="btn-secondary text-xs"
                onClick={() => {
                  setAssigningEquipment({ ...item });
                  setShowAssignModal(true);
                }}
              >
                Assign
              </button>
            )}
            {item.status === 'rented' && (
              <button
                className="btn-primary text-xs"
                onClick={() => {
                  setSelectedEquipment(item);
                  setShowReturnModal(true);
                }}
              >
                Mark Returned
              </button>
            )}
          </div>
          {isAdmin && (
            <div className="flex space-x-2">
              <button
                className="p-2 text-gray-400 hover:text-gray-600"
                onClick={() => {
                  setEditingEquipment({ ...item });
                  setShowEditModal(true);
                }}
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                className="p-2 text-red-400 hover:text-red-600"
                onClick={() => handleDelete(item.id)}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin border-b-2 border-cyan-500 h-12 w-12 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {isAdmin ? 'Equipment Management' : 'My Equipment'}
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            {isAdmin
              ? 'Manage and track equipment across your team'
              : 'View and manage your assigned equipment'}
          </p>
        </div>
        {isAdmin && (
          <button
            className="btn-primary mt-4 sm:mt-0"
            onClick={() => {
              setModalMode('add');
              setSelectedEquipment(null);
              setShowModal(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Equipment
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['available', 'rented', 'returned'].map((status) => (
          <div key={status} className="card text-center">
            <div className="text-2xl font-bold text-blue-600">
              {equipment.filter((e) => e.status === status).length}
            </div>
            <div className="text-xs text-gray-500 capitalize">{status}</div>
          </div>
        ))}
        <div className="card text-center">
          <div className="text-2xl font-bold text-red-600">
            {equipment.filter((e) => isOverdue(e.expectedReturn)).length}
          </div>
          <div className="text-xs text-gray-500">Overdue</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col lg:flex-row lg:justify-between gap-4">
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                placeholder="Search equipment"
                className="pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-cyan-500"
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
              />
            </div>
            <select
              className="px-4 py-2 border rounded-xl focus:ring-2 focus:ring-cyan-500"
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
            >
              <option value="all">All</option>
              <option value="available">Available</option>
              <option value="rented">Rented</option>
              <option value="returned">Returned</option>
              <option value="maintenance">Maintenance</option>
              <option value="damaged">Damaged</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary text-xs">
              <Download className="h-4 w-4 mr-1" />
              Export
            </button>
            {isAdmin && (
              <button className="btn-secondary text-xs">
                <Upload className="h-4 w-4 mr-1" />
                Import
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Equipment Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredEquipment.map((item) => (
          <EquipmentCard key={item.id} item={item} />
        ))}
      </div>

      {filteredEquipment.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Briefcase className="h-10 w-10 mx-auto mb-2" />
          No equipment found. Try adjusting filters.
        </div>
      )}

      {/* Assign Equipment Modal */}
      {showAssignModal && assigningEquipment && (
        <Modal title="Assign Equipment" onClose={() => { setShowAssignModal(false); setAssigningEquipment(null); }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Equipment</label>
              <p className="text-gray-600">{assigningEquipment.item}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign to</label>
              <input
                type="text"
                value={assigningEquipment.assignedTo || ''}
                onChange={(e) => setAssigningEquipment({ ...assigningEquipment, assignedTo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                placeholder="Enter bubbler name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rental Date</label>
              <input
                type="date"
                value={assigningEquipment.rentalDate || ''}
                onChange={(e) => setAssigningEquipment({ ...assigningEquipment, rentalDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expected Return Date</label>
              <input
                type="date"
                value={assigningEquipment.expectedReturn || ''}
                onChange={(e) => setAssigningEquipment({ ...assigningEquipment, expectedReturn: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <div className="flex space-x-2 pt-4">
              <button onClick={handleAssignEquipment} className="btn-primary flex-1">Assign Equipment</button>
              <button onClick={() => { setShowAssignModal(false); setAssigningEquipment(null); }} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Equipment Modal */}
      {showEditModal && editingEquipment && (
        <Modal title="Edit Equipment" onClose={() => { setShowEditModal(false); setEditingEquipment(null); }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Equipment Name</label>
              <input
                type="text"
                value={editingEquipment.item}
                onChange={(e) => setEditingEquipment({ ...editingEquipment, item: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
              <input
                type="text"
                value={editingEquipment.serialNumber}
                onChange={(e) => setEditingEquipment({ ...editingEquipment, serialNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
              <select
                value={editingEquipment.condition}
                onChange={(e) => setEditingEquipment({ ...editingEquipment, condition: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
              >
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={editingEquipment.status}
                onChange={(e) => setEditingEquipment({ ...editingEquipment, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
              >
                <option value="available">Available</option>
                <option value="rented">Rented</option>
                <option value="returned">Returned</option>
                <option value="maintenance">Maintenance</option>
                <option value="damaged">Damaged</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={editingEquipment.notes || ''}
                onChange={(e) => setEditingEquipment({ ...editingEquipment, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                rows="3"
                placeholder="Add notes about this equipment..."
              />
            </div>
            <div className="flex space-x-2 pt-4">
              <button onClick={handleSaveEquipment} className="btn-primary flex-1">Save Changes</button>
              <button onClick={() => { setShowEditModal(false); setEditingEquipment(null); }} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Return Confirmation Modal */}
      {showReturnModal && selectedEquipment && (
        <Modal title="Confirm Return" onClose={() => { setShowReturnModal(false); setSelectedEquipment(null); }}>
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to mark <strong>{selectedEquipment.item}</strong> as returned?
            </p>
            {selectedEquipment.assignedTo && (
              <p className="text-sm text-gray-500">
                This will return the equipment from <strong>{selectedEquipment.assignedTo}</strong>
              </p>
            )}
            <div className="flex space-x-2 pt-4">
              <button onClick={handleConfirmReturn} className="btn-primary flex-1">Confirm Return</button>
              <button onClick={() => { setShowReturnModal(false); setSelectedEquipment(null); }} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Equipment;