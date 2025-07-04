import React from 'react';
import useStore from '../../store/useStore';

const Profile = () => {
  const { user } = useStore();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
      <div className="card">
        <p><strong>Name:</strong> {user?.name}</p>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Role:</strong> {user?.role}</p>
        <p><strong>Phone:</strong> {user?.phone || 'N/A'}</p>
      </div>
    </div>
  );
};

export default Profile; 