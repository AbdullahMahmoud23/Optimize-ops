import { useState } from "react";

function RecordAudio() {
  const [selectedShift, setSelectedShift] = useState('Night');
  const [achievementValue, setAchievementValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState('0:00');

  const stepper = [
    { label: "Date", status: "done" },
    { label: "Shift", status: "done" },
    { label: "Targets", status: "done" },
    { label: "Record", status: "active" },
  ];

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Section */}
        <header className="space-y-3">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Daily Recording Portal</h1>
            <p className="text-gray-500 mt-1">Follow the steps below to submit your daily summary</p>
          </div>

          {/* Stepper Card */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-6">
            <div className="flex flex-wrap gap-4">
              {stepper.map((step, index) => {
                const isActive = step.status === "active";
                const isDone = step.status === "done";
                return (
                  <div key={step.label} className="flex items-center gap-3">
                    <div
                      className={`flex items-center justify-center rounded-full ${
                        isDone ? "bg-indigo-600 text-white" : isActive ? "bg-indigo-600 text-white" : "border-2 border-gray-200 text-gray-400"
                      }`}
                      style={{ width: "44px", height: "44px" }}
                    >
                      {isDone ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="text-sm font-semibold">{index + 1}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-400">Step {index + 1}</p>
                      <p className={`font-semibold ${isActive ? "text-gray-900" : "text-gray-600"}`}>{step.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Status Chips */}
            <div className="flex flex-wrap gap-3">
              <span className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded-full border border-gray-200">Date: 2025-11-14</span>
              <span className="px-4 py-2 bg-indigo-50 text-indigo-600 text-sm rounded-full border border-indigo-100">Shift: Selected</span>
              <span className="px-4 py-2 bg-green-50 text-green-600 text-sm rounded-full border border-green-100">Targets: 1 pending / 1</span>
              <span className="px-4 py-2 bg-amber-50 text-amber-600 text-sm rounded-full border border-amber-100">Record: Awaiting recording</span>
            </div>
          </div>
        </header>

        {/* Form Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Date Card */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-4">
              <div className="text-xs font-semibold text-gray-400 tracking-[0.4em]">DATE</div>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value="14/11/2025"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-12 text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
                <span className="absolute inset-y-0 right-4 flex items-center text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </span>
              </div>
            </div>

            {/* Shifts Card */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-4">
              <div className="text-xs font-semibold text-gray-400 tracking-[0.4em]">YOUR SHIFTS</div>
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={() => setSelectedShift('Night')}
                  className={`px-6 py-3 rounded-full font-semibold shadow transition-colors ${
                    selectedShift === 'Night' ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  Night
                </button>
                <button className="px-6 py-3 rounded-full border-2 border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors">
                  Add Shift
                </button>
              </div>
            </div>

            {/* Target Achievements Card */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-gray-900">Target Achievements</p>
                  <p className="text-sm text-gray-500 mt-0.5">Update the achievement values</p>
                </div>
                <div className="flex gap-2 text-xs font-semibold">
                  <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600">1 total</span>
                  <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-600">1 pending</span>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-gray-100">
                <table className="min-w-full divide-y divide-gray-100 text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-gray-500">
                      <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide">Target</th>
                      <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide">Target Value</th>
                      <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide">Achievement</th>
                      <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    <tr>
                      <td className="px-4 py-4 font-semibold text-gray-900">21</td>
                      <td className="px-4 py-4 text-gray-600">23</td>
                      <td className="px-4 py-4">
                        <input
                          type="text"
                          placeholder="Enter achiev"
                          value={achievementValue}
                          onChange={(e) => setAchievementValue(e.target.value)}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600">
                          Pending
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Optional Recording Card */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-lg font-semibold text-gray-900">Optional: Record Excuse/Problem</p>
                  <p className="text-sm text-gray-500 mt-1">Record any issues, obstacles, or excuses...</p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-500">Optional Step</span>
              </div>

              {/* Inner Recording Box */}
              <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 min-h-[320px] flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-base font-semibold text-gray-900">Optional Problem/Excuse Recording</p>
                    <p className="text-sm text-gray-500 mt-1">Challenges or problems (context)</p>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white text-gray-500 border border-gray-200">Optional</span>
                </div>

                <div className="flex-grow flex flex-col justify-between">
                  {/* Timer */}
                  <div className="text-right">
                    <span className="text-3xl font-mono font-bold text-orange-500">{recordingTime}</span>
                  </div>

                  {/* Start Button */}
                  <button 
                    onClick={() => setIsRecording(!isRecording)}
                    className={`w-full inline-flex items-center justify-center gap-2 rounded-2xl font-semibold py-4 text-lg shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
                      isRecording ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-orange-500 hover:bg-orange-600 text-white'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    {isRecording ? 'Stop Recording' : 'Start'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2">
            Submit Recording
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default RecordAudio;