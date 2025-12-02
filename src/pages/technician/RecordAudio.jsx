import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext.jsx";

function RecordAudio() {
  const [selectedShift, setSelectedShift] = useState('First');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10)); // YYYY-MM-DD
  const { token } = useAuth();
  const [achievementValue, setAchievementValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState('0:00');
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const secondsRef = useRef(0);

  useEffect(() => {
    return () => {
      // cleanup media stream if unmounted
      try {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      } catch (e) {}
      clearInterval(timerRef.current);
    };
  }, []);

  const [stepIndex, setStepIndex] = useState(0); // 0: Date, 1: Shift, 2: Targets, 3: Record
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState(null); // null, 'success', 'error'
  const [submissionMessage, setSubmissionMessage] = useState('');

  const stepper = [
    { label: "Date" },
    { label: "Shift" },
    { label: "Targets" },
    { label: "Record" },
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
                const isDone = index < stepIndex;
                const isActive = index === stepIndex;
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
              <span className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded-full border border-gray-200">Date: {date}</span>
              <span className={`px-4 py-2 ${selectedShift ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-50 text-gray-500'} text-sm rounded-full border border-indigo-100`}>Shift: {selectedShift}</span>
              <span className="px-4 py-2 bg-green-50 text-green-600 text-sm rounded-full border border-green-100">Targets: {achievementValue ? 'saved' : 'pending'}</span>
              <span className="px-4 py-2 bg-amber-50 text-amber-600 text-sm rounded-full border border-amber-100">Record: {isRecording ? 'Recording...' : (stepIndex >= 3 ? 'Done' : 'Awaiting recording')}</span>
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
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    if (stepIndex === 0) setStepIndex(1);
                  }}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pr-12 text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
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
                  onClick={() => {
                    setSelectedShift('First');
                    if (stepIndex <= 1) setStepIndex(2);
                  }}
                  className={`px-6 py-3 rounded-full font-semibold shadow transition-colors ${
                    selectedShift === 'First' ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  First Shift
                </button>
                <button
                  onClick={() => {
                    setSelectedShift('Second');
                    if (stepIndex <= 1) setStepIndex(2);
                  }}
                  className={`px-6 py-3 rounded-full font-semibold shadow transition-colors ${
                    selectedShift === 'Second' ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  Second Shift
                </button>
                <button
                  onClick={() => {
                    setSelectedShift('Third');
                    if (stepIndex <= 1) setStepIndex(2);
                  }}
                  className={`px-6 py-3 rounded-full font-semibold shadow transition-colors ${
                    selectedShift === 'Third' ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  Third Shift
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
                      <td className="px-4 py-4 font-semibold text-gray-900">Target Text</td>
                      <td className="px-4 py-4 text-gray-600">23</td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Enter achiev"
                            value={achievementValue}
                            onChange={(e) => setAchievementValue(e.target.value)}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                          />
                          <button
                            onClick={async () => {
                              try {
                                const res = await fetch('http://localhost:3000/api/technician/targets/1/achievement', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json', 'Authorization': token || '' },
                                  body: JSON.stringify({ achievement: achievementValue })
                                });
                                if (!res.ok) throw new Error('Failed to save achievement');
                                // mark step 3 complete and move to record step
                                setStepIndex(3);
                                alert('Achievement saved');
                              } catch (err) {
                                console.error(err);
                                alert(err.message || 'Save failed');
                              }
                            }}
                            className="px-4 py-2 rounded-md bg-green-600 text-white"
                          >Save</button>
                        </div>
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
                    onClick={async () => {
                      if (!isRecording) {
                        // start recording
                        try {
                          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                          mediaRecorderRef.current = new MediaRecorder(stream);
                          chunksRef.current = [];
                          mediaRecorderRef.current.ondataavailable = (e) => {
                            if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
                          };
                          mediaRecorderRef.current.onstop = async () => {
                            // assemble blob and upload
                            const blob = new Blob(chunksRef.current, { type: chunksRef.current[0]?.type || 'audio/webm' });
                            const filename = `recording_${Date.now()}.webm`;
                            const file = new File([blob], filename, { type: blob.type });
                            const fd = new FormData();
                            fd.append('audio', file);
                            fd.append('shift', selectedShift);
                            fd.append('type', 'excuse');
                            fd.append('date', date);

                            try {
                              const resp = await fetch('http://localhost:3000/api/recordings', {
                                method: 'POST',
                                headers: { 'Authorization': token || '' },
                                body: fd
                              });
                              if (!resp.ok) {
                                let errorMsg = 'Upload failed';
                                try {
                                  const errData = await resp.json();
                                  errorMsg = errData.error || errData.details || errorMsg;
                                } catch (e) {
                                  const errText = await resp.text();
                                  errorMsg = errText || errorMsg;
                                }
                                alert('Upload failed: ' + errorMsg);
                              } else {
                                const j = await resp.json().catch(() => ({}));
                                alert(j.message || 'Uploaded successfully');
                                // mark final step complete
                                setStepIndex(3);
                              }
                            } catch (uploadErr) {
                              console.error('Upload error', uploadErr);
                              alert('Upload error: ' + (uploadErr.message || uploadErr));
                            }
                          };
                          mediaRecorderRef.current.start();
                          secondsRef.current = 0;
                          setRecordingTime('0:00');
                          timerRef.current = setInterval(() => {
                            secondsRef.current += 1;
                            const s = secondsRef.current % 60;
                            const m = Math.floor(secondsRef.current / 60);
                            setRecordingTime(`${m}:${s.toString().padStart(2, '0')}`);
                          }, 1000);
                          setIsRecording(true);
                        } catch (err) {
                          console.error('Could not start recording', err);
                          alert('Could not start recording: ' + (err.message || err));
                        }
                      } else {
                        // stop recording
                        try {
                          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                            mediaRecorderRef.current.stop();
                          }
                        } catch (e) { console.warn(e); }
                        clearInterval(timerRef.current);
                        setIsRecording(false);
                      }
                    }}
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

        {/* Submit Button & Status */}
        <div className="space-y-4">
          {/* Status Message */}
          {submissionStatus && (
            <div className={`p-4 rounded-xl text-sm font-semibold ${
              submissionStatus === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {submissionMessage}
            </div>
          )}
          
          <div className="flex justify-end">
            <button 
              onClick={async () => {
                setIsSubmitting(true);
                setSubmissionStatus(null);
                try {
                  // Save achievement for a single target (assume TargetID=1 for demo)
                  const achRes = await fetch('http://localhost:3000/api/technician/targets/1/achievement', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': token || ''
                    },
                    body: JSON.stringify({ achievement: achievementValue })
                  });
                  if (!achRes.ok) throw new Error('Failed to save achievement');

                  // Create recording metadata (date & shift)
                  const metaRes = await fetch('http://localhost:3000/api/recordings/metadata', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': token || ''
                    },
                    body: JSON.stringify({ shift: selectedShift, type: 'excuse', date })
                  });
                  if (!metaRes.ok) {
                    const err = await metaRes.json().catch(() => ({}));
                    throw new Error(err.error || 'Failed to create recording');
                  }
                  const data = await metaRes.json();
                  setSubmissionStatus('success');
                  setSubmissionMessage(`✓ Saved successfully! Recording ID: ${data.recordingId}`);
                } catch (err) {
                  console.error('Submission error:', err);
                  setSubmissionStatus('error');
                  setSubmissionMessage(err.message || 'Submission failed');
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={isSubmitting}
              className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Recording'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RecordAudio;
