import { useNavigate } from "react-router-dom";

function TechnicianDashboard() {
  const navigate = useNavigate();
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 px-4 py-6 sm:px-6 lg:px-8 overflow-hidden overflow-x-hidden">
      <div className="hidden md:block absolute -top-40 -right-40 w-[400px] h-[400px] bg-purple-300/10 blur-[100px] rounded-full" />
      <div className="hidden md:block absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-purple-400/10 blur-[100px] rounded-full" />

      <div className="relative z-10 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-gradient-to-r from-purple-700 to-purple-500 bg-clip-text">
            Technician Dashboard
          </h1>
          <p className="text-gray-500 mt-1 sm:mt-2 text-sm sm:text-base">
            Track your assignments and work progress
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* My Assignments */}
          <div className="stats bg-gradient-to-r from-purple-50 to-purple-100/50 border border-purple-200 shadow-md hover:shadow-lg transition-all rounded-xl">
            <div className="stat flex items-center justify-between gap-4">
              <div>
                <div className="stat-title text-sm sm:text-base font-medium text-gray-600">
                  My Assignments
                </div>
                <div className="stat-value text-3xl sm:text-5xl font-bold text-purple-700">
                  5
                </div>
              </div>
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-purple-200 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-6 h-6 sm:w-8 sm:h-8 text-purple-700"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Completed Today */}
          <div className="stats bg-gradient-to-r from-gray-50 to-gray-200/60 border border-gray-300 shadow-md hover:shadow-lg transition-all rounded-xl">
            <div className="stat flex items-center justify-between gap-4">
              <div>
                <div className="stat-title text-sm sm:text-base font-medium text-gray-600">
                  Completed Today
                </div>
                <div className="stat-value text-3xl sm:text-5xl font-bold text-gray-800">
                  3
                </div>
              </div>
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-300 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-6 h-6 sm:w-8 sm:h-8 text-gray-800"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card bg-white shadow-xl border border-gray-200 rounded-2xl">
          <div className="card-body">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-purple-700"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="card-title text-xl sm:text-2xl font-bold text-gray-800">
                  Quick Actions
                </h2>
                <p className="text-gray-500 text-xs sm:text-sm">
                  Frequently used actions
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <button
                onClick={() => navigate("/technician/assignments")}
                className="btn bg-gradient-to-r from-purple-700 to-purple-500 border-none text-white btn-md sm:btn-lg gap-3 hover:scale-[1.02] transition-transform shadow-lg hover:shadow-purple-400/40 rounded-lg w-full"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="text-left">
                  <div className="font-bold">View Assignments</div>
                  <div className="text-xs opacity-80">See my tasks</div>
                </div>
              </button>

              <button
                onClick={() => navigate("/technician/reports")}
                className="btn bg-gradient-to-r from-gray-900 to-gray-700 border-none text-white btn-md sm:btn-lg gap-3 hover:scale-[1.02] transition-transform shadow-lg hover:shadow-gray-500/40 rounded-lg w-full"
              ><svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                
                <div className="text-left">
                  <div className="font-bold">Submit Report</div>
                  <div className="text-xs opacity-80">Report progress</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TechnicianDashboard;

