'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const workerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
});

export type WorkerData = z.infer<typeof workerSchema>;

interface AddWorkersFormProps {
  onSubmit: (workers: WorkerData[]) => void;
  loading?: boolean;
}

export function AddWorkersForm({ onSubmit, loading }: AddWorkersFormProps) {
  const [workers, setWorkers] = useState<WorkerData[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WorkerData>({
    resolver: zodResolver(workerSchema),
  });

  const handleAddWorker = (data: WorkerData) => {
    setWorkers([...workers, data]);
    reset();
    setShowAddForm(false);
  };

  const handleRemoveWorker = (index: number) => {
    setWorkers(workers.filter((_, i) => i !== index));
  };

  const handleFinalSubmit = () => {
    onSubmit(workers);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Add Team Members</h2>
        <p className="text-gray-600 mb-6">
          Invite your team members to access the maintenance tracker. They'll receive an email invitation.
        </p>
      </div>

      {workers.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Team Members to Invite</h3>
          {workers.map((worker, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
            >
              <div>
                <p className="font-medium">{worker.name}</p>
                <p className="text-sm text-gray-600">{worker.email}</p>
                {worker.phone && (
                  <p className="text-sm text-gray-500">{worker.phone}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleRemoveWorker(index)}
                className="text-red-600 hover:text-red-700"
                disabled={loading}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {showAddForm ? (
        <form onSubmit={handleSubmit(handleAddWorker)} className="space-y-4 border p-4 rounded-md">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              {...register('name')}
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={loading}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              {...register('email')}
              type="email"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={loading}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone Number (Optional)
            </label>
            <input
              {...register('phone')}
              type="tel"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              disabled={loading}
            >
              Add Team Member
            </button>
            <button
              type="button"
              onClick={() => {
                reset();
                setShowAddForm(false);
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          disabled={loading}
        >
          + Add Team Member
        </button>
      )}

      {workers.length === 0 && !showAddForm && (
        <div className="text-center py-8 text-gray-500">
          <p>No team members added yet.</p>
          <p className="text-sm mt-2">You can always add team members later from the settings.</p>
        </div>
      )}
    </div>
  );
}