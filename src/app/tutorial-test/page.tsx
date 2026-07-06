'use client';

import { useTutorialStore } from '@/stores/tutorialStore';
import { useTutorial } from '@/hooks/useTutorial';
import { useTutorialOverlay } from '@/hooks/useTutorialOverlay';
import { TUTORIAL_DEFINITIONS } from '@/lib/tutorials';

export default function TutorialTestPage() {
  const store = useTutorialStore();
  const workerTutorial = useTutorial('worker-clock-in');
  const supervisorTutorial = useTutorial('supervisor-approve');
  const adminTutorial = useTutorial('admin-products');

  const workerOverlay = useTutorialOverlay('worker-clock-in');
  const supervisorOverlay = useTutorialOverlay('supervisor-approve');
  const adminOverlay = useTutorialOverlay('admin-products');

  const currentOverlay = (() => {
    if (workerTutorial.isActive) return workerOverlay;
    if (supervisorTutorial.isActive) return supervisorOverlay;
    if (adminTutorial.isActive) return adminOverlay;
    return null;
  })();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Tutorial System Test</h1>

        {/* Role Selector */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">User Role</h2>
          <div className="flex gap-2 mb-4">
            {['worker', 'supervisor', 'admin'].map((role) => (
              <button
                key={role}
                onClick={() => store.setUserRole(role as 'worker' | 'supervisor' | 'admin')}
                className={`px-4 py-2 rounded font-medium transition-colors ${
                  store.userRole === role
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-600">Current role: <strong>{store.userRole}</strong></p>
        </div>

        {/* Completed Tutorials */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Completed Tutorials</h2>
          <div className="space-y-2">
            {Array.from(store.completed).length === 0 ? (
              <p className="text-gray-600">No tutorials completed yet</p>
            ) : (
              Array.from(store.completed).map((id) => (
                <div key={id} className="flex justify-between items-center bg-green-50 p-3 rounded border border-green-200">
                  <span className="text-green-800 font-medium">{id}</span>
                  <button
                    onClick={() => store.resetTutorial(id)}
                    className="text-sm text-green-600 hover:text-green-800 underline"
                  >
                    Reset
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Store State */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Store State</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Current Tutorial:</p>
              <p className="font-mono text-gray-900">{store.currentTutorial || 'None'}</p>
            </div>
            <div>
              <p className="text-gray-600">Current Step:</p>
              <p className="font-mono text-gray-900">{store.currentStep}</p>
            </div>
          </div>
        </div>

        {/* Tutorial Launcher Buttons */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Launch Tutorials</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(TUTORIAL_DEFINITIONS).map(([id, tutorial]) => (
              <div key={id} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">{tutorial.name}</h3>
                <p className="text-sm text-gray-600 mb-3">
                  {tutorial.steps.length} steps • Role: {tutorial.role}
                </p>
                <button
                  onClick={() => store.showTutorial(id)}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 px-4 rounded transition-colors"
                >
                  Start Tutorial
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Test Elements */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Tutorial Test Elements</h2>
          <div className="space-y-4">
            <button
              className="clock-in-button w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded"
            >
              Clock In Button (worker-clock-in step 1)
            </button>

            <div className="task-list bg-gray-100 p-4 rounded border-2 border-gray-300">
              <p className="font-semibold text-gray-800 mb-2">Task List (worker-clock-in step 2)</p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>Task 1: Complete daily briefing</li>
                <li>Task 2: Review schedules</li>
                <li>Task 3: Check system status</li>
              </ul>
            </div>

            <button
              className="clock-out-button w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded"
            >
              Clock Out Button (worker-clock-in step 3)
            </button>

            <div className="worker-activity-list bg-gray-100 p-4 rounded border-2 border-gray-300">
              <p className="font-semibold text-gray-800 mb-2">Worker Activity List (supervisor-approve step 1)</p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>John Smith - 8h work completed</li>
                <li>Jane Doe - 7.5h work completed</li>
              </ul>
            </div>

            <button
              className="approve-button w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded"
            >
              Approve Button (supervisor-approve step 2)
            </button>

            <div className="product-list bg-gray-100 p-4 rounded border-2 border-gray-300">
              <p className="font-semibold text-gray-800 mb-2">Product List (admin-products step 1)</p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>Product A - $99.99</li>
                <li>Product B - $149.99</li>
              </ul>
            </div>

            <button
              className="edit-product-button w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-4 rounded"
            >
              Edit Product Button (admin-products step 2)
            </button>
          </div>
        </div>

        {/* Tutorial Progress Display */}
        {[workerTutorial, supervisorTutorial, adminTutorial].map((tutorial, idx) => {
          if (!tutorial.isActive) return null;
          return (
            <div key={idx} className="bg-blue-50 border border-blue-200 p-6 rounded-lg mb-8">
              <h2 className="text-lg font-semibold text-blue-900 mb-4">Current Tutorial Info</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-blue-800">Step</p>
                  <p className="font-mono text-blue-900">
                    {tutorial.currentStep + 1} / {tutorial.totalSteps}
                  </p>
                </div>
                <div>
                  <p className="text-blue-800">Progress</p>
                  <div className="w-full bg-blue-200 rounded-full h-2 mt-1">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${tutorial.progress}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <p className="text-blue-800">Current Step Title</p>
                  <p className="font-semibold text-blue-900">{tutorial.currentStepObj?.title}</p>
                </div>
                <div>
                  <p className="text-blue-800">Target Element</p>
                  <p className="font-mono text-sm text-blue-900">{tutorial.currentStepObj?.target}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tutorial Overlays */}
      {currentOverlay}
    </div>
  );
}
