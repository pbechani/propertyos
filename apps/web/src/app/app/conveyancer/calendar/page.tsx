'use client';

import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, AlertCircle } from "lucide-react";
import { tasksList } from "../_data/mockData";

export default function Page() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 11)); // March 2026

  const deadlines = [
    { id: "d1", title: "Submit Transfer Documents", date: new Date(2026, 2, 12), caseId: "CASE-1045", type: "document" },
    { id: "d2", title: "Rate Clearance Certificate Expires", date: new Date(2026, 2, 13), caseId: "CASE-1046", type: "compliance" },
    { id: "d3", title: "Occupancy Certificate Due", date: new Date(2026, 2, 15), caseId: "CASE-1052", type: "compliance" },
    { id: "d4", title: "Mortgage Registration Deadline", date: new Date(2026, 2, 17), caseId: "CASE-1038", type: "financial" },
    { id: "d5", title: "FICA Expiry - James Blackwood", date: new Date(2026, 2, 20), caseId: "CASE-1045", type: "compliance" },
    { id: "d6", title: "Final Transfer Date", date: new Date(2026, 2, 25), caseId: "CASE-1034", type: "transfer" },
    { id: "d7", title: "Bond Cancellation Documents", date: new Date(2026, 2, 28), caseId: "CASE-1056", type: "document" },
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const getDeadlinesForDay = (day: number) =>
    deadlines.filter(
      (d) => d.date.getFullYear() === year && d.date.getMonth() === month && d.date.getDate() === day
    );

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const deadlineTypeColor = (type: string) => {
    switch (type) {
      case "document": return "bg-blue-100 text-blue-700";
      case "compliance": return "bg-red-100 text-red-700";
      case "financial": return "bg-green-100 text-green-700";
      case "transfer": return "bg-purple-100 text-purple-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const upcomingDeadlines = [...deadlines].sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendar &amp; Deadlines</h1>
          <p className="text-gray-600 mt-1">Track all upcoming deadlines and important dates</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <CalendarIcon className="w-4 h-4" />
          Add Deadline
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h2 className="text-xl font-semibold text-gray-900">
              {monthNames[month]} {year}
            </h2>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells before first day */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="h-24" />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayDeadlines = getDeadlinesForDay(day);
              const isToday =
                new Date().getFullYear() === year &&
                new Date().getMonth() === month &&
                new Date().getDate() === day;
              const isSelected =
                currentDate.getDate() === day;

              return (
                <div
                  key={day}
                  className={`h-24 border rounded-lg p-1 cursor-pointer hover:bg-gray-50 transition-colors ${
                    isToday ? "border-blue-400 bg-blue-50" : "border-gray-200"
                  } ${isSelected && !isToday ? "border-blue-300 bg-blue-50/50" : ""}`}
                  onClick={() => setCurrentDate(new Date(year, month, day))}
                >
                  <div className={`text-sm font-medium mb-1 ${isToday ? "text-blue-600" : "text-gray-700"}`}>
                    {day}
                  </div>
                  <div className="space-y-0.5 overflow-hidden">
                    {dayDeadlines.slice(0, 2).map((dl) => (
                      <div
                        key={dl.id}
                        className={`text-xs px-1 py-0.5 rounded truncate ${deadlineTypeColor(dl.type)}`}
                        title={dl.title}
                      >
                        {dl.title}
                      </div>
                    ))}
                    {dayDeadlines.length > 2 && (
                      <div className="text-xs text-gray-500 pl-1">+{dayDeadlines.length - 2} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tasks List */}
          <div className="mt-6 border-t border-gray-200 pt-4">
            <h3 className="font-medium text-gray-900 mb-3">Tasks Due This Month</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {tasksList.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="w-4 h-4 text-blue-600" defaultChecked={task.status === "completed"} readOnly />
                    <span className={`text-sm ${task.status === "completed" ? "line-through text-gray-400" : "text-gray-700"}`}>
                      {task.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{task.dueDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Deadlines */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Deadlines</h2>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {upcomingDeadlines.map((deadline) => (
                <div key={deadline.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900 flex-1">{deadline.title}</p>
                  </div>
                  <p className="text-xs text-blue-600 mb-2">{deadline.caseId}</p>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${deadlineTypeColor(deadline.type)}`}>
                      {deadline.type}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <CalendarIcon className="w-3 h-3" />
                      <span>
                        {deadline.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Overdue */}
          <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <h2 className="text-lg font-semibold text-gray-900">Overdue Items</h2>
            </div>
            <div className="space-y-3">
              <div className="border border-red-200 bg-red-50 rounded-lg p-3">
                <p className="text-sm font-medium text-red-900">FICA Verification Pending</p>
                <p className="text-xs text-red-600 mt-1">CASE-1041 — Was due Mar 5</p>
              </div>
              <div className="border border-red-200 bg-red-50 rounded-lg p-3">
                <p className="text-sm font-medium text-red-900">Bond Cancellation Outstanding</p>
                <p className="text-xs text-red-600 mt-1">CASE-1038 — Was due Mar 8</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
