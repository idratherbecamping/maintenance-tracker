'use client';

interface ReviewCompleteProps {
  companyName?: string;
  workerCount: number;
  vehicleCount: number;
  onComplete: () => void;
  loading?: boolean;
}

export function ReviewComplete({ 
  companyName, 
  workerCount, 
  vehicleCount, 
  onComplete,
  loading 
}: ReviewCompleteProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Setup Complete!</h2>
        <p className="text-gray-900 mb-6">
          Great job! You've successfully set up your maintenance tracking account.
        </p>
      </div>

      <div className="bg-green-50 p-6 rounded-lg">
        <h3 className="text-green-900 font-medium mb-4">Here's what you've set up:</h3>
        <ul className="space-y-3 text-green-800">
          <li className="flex items-start">
            <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Business profile for {companyName || 'your company'}</span>
          </li>
          {workerCount > 0 && (
            <li className="flex items-start">
              <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{workerCount} team member{workerCount !== 1 ? 's' : ''} invited</span>
            </li>
          )}
          {vehicleCount > 0 && (
            <li className="flex items-start">
              <svg className="w-5 h-5 text-green-600 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{vehicleCount} vehicle{vehicleCount !== 1 ? 's' : ''} added to your fleet</span>
            </li>
          )}
        </ul>
      </div>

      <div className="bg-blue-50 p-4 rounded-md">
        <h4 className="text-blue-900 font-medium mb-2">What's next?</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Start logging maintenance records for your vehicles</li>
          <li>• Set up automated maintenance reminders</li>
          <li>• Track costs and generate reports</li>
          <li>• Upload maintenance photos and receipts</li>
        </ul>
      </div>

      <div className="flex justify-center pt-4">
        <button
          onClick={onComplete}
          disabled={loading}
          className="px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Getting started...' : 'Go to Dashboard'}
        </button>
      </div>
    </div>
  );
}