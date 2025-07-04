import React, { useState, useEffect } from 'react';
import { FiPlus as Plus, FiSearch as Search, FiFilter as Filter, FiCalendar as Calendar, FiUser as User, FiFileText as FileText, FiRefreshCw as RefreshCw } from 'react-icons/fi';
import Modal from '../shared/Modal';
import { notesAPI } from '../../services/api';

const AdminNotes = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filterJobId, setFilterJobId] = useState('');
  const [filteredNotes, setFilteredNotes] = useState([]);
  
  const [newNote, setNewNote] = useState({
    relatedJobId: '',
    teamMember: '',
    followUp: 'No',
    author: '',
    content: ''
  });

  // Fetch all notes on component mount
  useEffect(() => {
    fetchNotes();
  }, []);

  // Filter notes when filterJobId changes
  useEffect(() => {
    if (filterJobId.trim()) {
      setFilteredNotes(notes.filter(note => 
        note.relatedJobId && note.relatedJobId.toLowerCase().includes(filterJobId.toLowerCase())
      ));
    } else {
      setFilteredNotes(notes);
    }
  }, [notes, filterJobId]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await notesAPI.getAllNotes();
      if (response.success) {
        setNotes(response.data || []);
      } else {
        setError(response.message || 'Failed to fetch notes');
      }
    } catch (err) {
      setError('Failed to load admin notes. Please try again.');
      console.error('Error fetching notes:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotesByJob = async (jobId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await notesAPI.getNotesByJob(jobId);
      if (response.success) {
        setNotes(response.data || []);
      } else {
        setError(response.message || 'Failed to fetch notes for this job');
      }
    } catch (err) {
      setError('Failed to load notes for this job. Please try again.');
      console.error('Error fetching notes by job:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.content.trim()) {
      setError('Note content is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const noteData = {
        ...newNote,
        date: new Date().toISOString().split('T')[0],
        author: newNote.author || 'Admin'
      };

      const response = await notesAPI.addNote(noteData);
      if (response.success) {
        // Refresh the notes list
        await fetchNotes();
        setNewNote({
          relatedJobId: '',
          teamMember: '',
          followUp: 'No',
          author: '',
          content: ''
        });
        setShowModal(false);
      } else {
        setError(response.message || 'Failed to add note');
      }
    } catch (err) {
      setError('Failed to add note. Please try again.');
      console.error('Error adding note:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterByJob = () => {
    if (filterJobId.trim()) {
      fetchNotesByJob(filterJobId.trim());
    } else {
      fetchNotes();
    }
  };

  const clearFilter = () => {
    setFilterJobId('');
    fetchNotes();
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  if (loading && notes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-cyan-600" />
          <p className="text-gray-600">Loading admin notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Notes</h1>
          <p className="text-gray-600 mt-1">Manage team notes and job-related information</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn-primary"
          disabled={loading}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Note
        </button>
      </div>

      {/* Filter Section */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Job ID
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={filterJobId}
                onChange={(e) => setFilterJobId(e.target.value)}
                placeholder="Enter Job ID to filter..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
              <button
                onClick={handleFilterByJob}
                className="btn-secondary"
                disabled={loading}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </button>
              {filterJobId && (
                <button
                  onClick={clearFilter}
                  className="btn-secondary"
                  disabled={loading}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          <button
            onClick={fetchNotes}
            className="btn-secondary"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Notes Grid */}
      {filteredNotes.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredNotes.map((note, index) => (
            <div key={index} className="card">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-cyan-600" />
                    <span className="text-sm font-medium text-gray-500">
                      {note.relatedJobId ? `Job: ${note.relatedJobId}` : 'General Note'}
                    </span>
                  </div>
                  <p className="text-gray-900 whitespace-pre-wrap">{note.content}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mb-3">
                <div className="flex items-center">
                  <User className="h-3 w-3 mr-1" />
                  <span>{note.teamMember || 'N/A'}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>{formatDate(note.date)}</span>
                </div>
                {note.author && (
                  <div className="flex items-center">
                    <span>By: {note.author}</span>
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2">
                {note.followUp && note.followUp !== 'No' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    Follow-up: {note.followUp}
                  </span>
                )}
                {note.relatedJobId && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Job Related
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 text-lg">
            {filterJobId ? 'No notes found for this job ID.' : 'No admin notes yet.'}
          </p>
          <p className="text-gray-400 mt-2">
            {filterJobId ? 'Try a different job ID or clear the filter.' : 'Create your first admin note to get started!'}
          </p>
        </div>
      )}

      {/* Add Note Modal */}
      {showModal && (
        <Modal 
          title="Add New Admin Note" 
          onClose={() => {
            setShowModal(false);
            setNewNote({
              relatedJobId: '',
              teamMember: '',
              followUp: 'No',
              author: '',
              content: ''
            });
            setError(null);
          }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Related Job ID (Optional)
              </label>
              <input
                type="text"
                value={newNote.relatedJobId}
                onChange={(e) => setNewNote({ ...newNote, relatedJobId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                placeholder="Enter job ID if related to a specific job"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team Member
                </label>
                <input
                  type="text"
                  value={newNote.teamMember}
                  onChange={(e) => setNewNote({ ...newNote, teamMember: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                  placeholder="Enter team member name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Author
                </label>
                <input
                  type="text"
                  value={newNote.author}
                  onChange={(e) => setNewNote({ ...newNote, author: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                  placeholder="Enter author name"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Follow-up Required
              </label>
              <select
                value={newNote.followUp}
                onChange={(e) => setNewNote({ ...newNote, followUp: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
                <option value="Urgent">Urgent</option>
                <option value="Next Week">Next Week</option>
                <option value="Next Month">Next Month</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note Content *
              </label>
              <textarea
                value={newNote.content}
                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                rows="4"
                placeholder="Enter your note content..."
                required
              />
            </div>
            
            <div className="flex space-x-2 pt-4">
              <button 
                onClick={handleAddNote}
                className="btn-primary flex-1"
                disabled={loading || !newNote.content.trim()}
              >
                {loading ? 'Adding...' : 'Add Note'}
              </button>
              <button 
                onClick={() => {
                  setShowModal(false);
                  setNewNote({
                    relatedJobId: '',
                    teamMember: '',
                    followUp: 'No',
                    author: '',
                    content: ''
                  });
                  setError(null);
                }}
                className="btn-secondary flex-1"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminNotes;
