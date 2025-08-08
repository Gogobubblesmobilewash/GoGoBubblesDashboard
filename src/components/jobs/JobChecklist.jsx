import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/api';
import { toast } from 'react-hot-toast';
import { 
  FiCheck, FiClock, FiMapPin, FiAlertTriangle, FiCheckCircle, 
  FiPlay, FiPause, FiSquare, FiList, FiBarChart2, FiUser 
} from 'react-icons/fi';

const JobChecklist = ({ orderId, onProgressUpdate }) => {
  const [checklist, setChecklist] = useState([]);
  const [progress, setProgress] = useState({
    totalTasks: 0,
    completedTasks: 0,
    completionPercentage: 0,
    estimatedTimeRemaining: 0,
    actualTimeElapsed: 0
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);

  useEffect(() => {
    if (orderId) {
      loadChecklist();
      loadProgress();
    }
  }, [orderId]);

  const loadChecklist = async () => {
    try {
      const { data, error } = await supabase
        .from('job_checklist')
        .select(`
          *,
          completed_by_bubbler:completed_by (first_name, last_name)
        `)
        .eq('order_id', orderId)
        .order('task_order');

      if (error) throw error;
      
      // Group tasks by category for better organization
      const groupedTasks = (data || []).reduce((acc, task) => {
        if (!acc[task.task_category]) {
          acc[task.task_category] = [];
        }
        acc[task.task_category].push(task);
        return acc;
      }, {});
      
      setChecklist(data || []);
    } catch (error) {
      console.error('Error loading checklist:', error);
      toast.error('Failed to load job checklist');
    } finally {
      setLoading(false);
    }
  };

  const loadProgress = async () => {
    try {
      const { data, error } = await supabase.rpc('calculate_job_progress', {
        order_uuid: orderId
      });

      if (error) throw error;
      if (data && data.length > 0) {
        setProgress(data[0]);
        if (onProgressUpdate) {
          onProgressUpdate(data[0]);
        }
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const toggleTask = async (taskId, isCompleted) => {
    if (updating) return;

    setUpdating(true);
    try {
      const currentUser = (await supabase.auth.getUser()).data.user;
      
      const updateData = {
        is_completed: !isCompleted,
        completed_at: !isCompleted ? new Date().toISOString() : null,
        completed_by: !isCompleted ? currentUser.id : null,
        actual_minutes: !isCompleted ? 15 : null // Default 15 minutes per task
      };

      const { error } = await supabase
        .from('job_checklist')
        .update(updateData)
        .eq('id', taskId);

      if (error) throw error;

      // Create progress snapshot
      await supabase.rpc('create_progress_snapshot', {
        order_uuid: orderId,
        bubbler_uuid: currentUser.id,
        snapshot_type_param: 'task_completion'
      });

      toast.success(isCompleted ? 'Task unchecked' : 'Task completed!');
      loadChecklist();
      loadProgress();
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    } finally {
      setUpdating(false);
    }
  };

  const getTaskIcon = (task) => {
    if (task.is_completed) {
      return <FiCheckCircle className="h-5 w-5 text-green-500" />;
    }
    return <FiClock className="h-5 w-5 text-gray-400" />;
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    if (percentage >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getTimeStatus = () => {
    const { estimatedTimeRemaining, actualTimeElapsed } = progress;
    const totalEstimated = estimatedTimeRemaining + actualTimeElapsed;
    const efficiency = totalEstimated > 0 ? (actualTimeElapsed / totalEstimated) * 100 : 0;

    if (efficiency > 120) return { status: 'Behind Schedule', color: 'text-red-600', icon: FiAlertTriangle };
    if (efficiency > 100) return { status: 'Slightly Behind', color: 'text-orange-600', icon: FiClock };
    if (efficiency > 80) return { status: 'On Track', color: 'text-green-600', icon: FiCheckCircle };
    return { status: 'Ahead of Schedule', color: 'text-blue-600', icon: FiPlay };
  };

  const timeStatus = getTimeStatus();
  const TimeStatusIcon = timeStatus.icon;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-6 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Progress Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Job Progress</h3>
          <button
            onClick={() => setShowProgressModal(true)}
            className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <FiBarChart2 className="h-4 w-4 mr-2" />
            View Details
          </button>
        </div>

        {/* Progress Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${getProgressColor(progress.completionPercentage)}`}>
              {progress.completionPercentage.toFixed(0)}%
            </div>
            <div className="text-sm text-gray-600">Complete</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {progress.completedTasks}/{progress.totalTasks}
            </div>
            <div className="text-sm text-gray-600">Tasks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {progress.estimatedTimeRemaining}
            </div>
            <div className="text-sm text-gray-600">Min Remaining</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center">
              <TimeStatusIcon className={`h-5 w-5 mr-1 ${timeStatus.color}`} />
              <span className={`text-sm font-medium ${timeStatus.color}`}>
                {timeStatus.status}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>{progress.completionPercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                progress.completionPercentage >= 80 ? 'bg-green-500' :
                progress.completionPercentage >= 60 ? 'bg-yellow-500' :
                progress.completionPercentage >= 40 ? 'bg-orange-500' : 'bg-red-500'
              }`}
              style={{ width: `${progress.completionPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div className="p-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">Task Checklist</h4>
        
        {/* Group tasks by category */}
        {Object.entries(checklist.reduce((acc, task) => {
          if (!acc[task.task_category]) {
            acc[task.task_category] = [];
          }
          acc[task.task_category].push(task);
          return acc;
        }, {})).map(([category, tasks]) => (
          <div key={category} className="mb-6">
            <h5 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              {category.replace('_', ' ')}
            </h5>
            <div className="space-y-3">
              {tasks.map((task) => (
                <div 
                  key={task.id} 
                  className={`flex items-center p-3 rounded-lg border transition-all duration-200 ${
                    task.is_completed 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <button
                    onClick={() => toggleTask(task.id, task.is_completed)}
                    disabled={updating}
                    className={`flex items-center flex-1 text-left ${
                      updating ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                    }`}
                  >
                    <div className="mr-3">
                      {getTaskIcon(task)}
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium ${
                        task.is_completed ? 'text-green-800 line-through' : 'text-gray-900'
                      }`}>
                        {task.task_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {task.estimated_minutes} min
                        {task.completed_by_bubbler && (
                          <span className="ml-2">
                            • Completed by {task.completed_by_bubbler.first_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                  
                  {task.is_completed && task.completed_at && (
                    <div className="text-xs text-gray-500 ml-2">
                      {new Date(task.completed_at).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Progress Details Modal */}
      {showProgressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Job Progress Details</h3>
              <button
                onClick={() => setShowProgressModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiSquare className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Time Analysis */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Time Analysis</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Actual Time Elapsed:</span>
                    <span className="ml-2 font-medium">{progress.actualTimeElapsed} minutes</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Estimated Time Remaining:</span>
                    <span className="ml-2 font-medium">{progress.estimatedTimeRemaining} minutes</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Estimated Time:</span>
                    <span className="ml-2 font-medium">
                      {progress.estimatedTimeRemaining + progress.actualTimeElapsed} minutes
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Efficiency:</span>
                    <span className="ml-2 font-medium">
                      {progress.estimatedTimeRemaining + progress.actualTimeElapsed > 0 
                        ? ((progress.actualTimeElapsed / (progress.estimatedTimeRemaining + progress.actualTimeElapsed)) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Task Breakdown */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Task Breakdown</h4>
                <div className="space-y-2">
                  {checklist.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center">
                        {getTaskIcon(task)}
                        <span className={`ml-2 ${task.is_completed ? 'line-through text-gray-500' : ''}`}>
                          {task.task_name}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {task.estimated_minutes} min
                        {task.actual_minutes && (
                          <span className="ml-2">(Actual: {task.actual_minutes} min)</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Summary */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Status Summary</h4>
                <div className="flex items-center">
                  <TimeStatusIcon className={`h-5 w-5 mr-2 ${timeStatus.color}`} />
                  <span className={`font-medium ${timeStatus.color}`}>
                    {timeStatus.status}
                  </span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  {progress.completionPercentage >= 100 
                    ? 'All tasks completed!'
                    : `${progress.totalTasks - progress.completedTasks} tasks remaining`
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobChecklist; 